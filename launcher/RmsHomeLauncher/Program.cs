using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace RmsHomeLauncher;

// The daily launcher behind the desktop/Start Menu shortcut: ensures the dedicated
// Postgres service is up, starts the app server, waits for it to answer, opens the
// browser, then watches a heartbeat file the page keeps fresh while its tab is open --
// there's no OS-level "browser closed" signal, so this is the only way to know when to
// stop the server. Postgres itself is never stopped here; it's a steady-state service.
internal static class Program
{
    private const string ServiceName = "rms-home-postgresql";
    private const int AppPort = 8000;
    // Not a const interpolated string -- kept as a plain concatenation to avoid relying
    // on a C# feature that's untested in this project's actual build (net8.0-windows).
    private static readonly string AppUrl = "http://127.0.0.1:" + AppPort + "/";
    private const int ReadyTimeoutMs = 15000;
    private const int ReadyPollMs = 300;
    private const int HeartbeatStaleSec = 13;
    private const int WatchPollMs = 1000;

    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(2) };

    // Set by the CI smoke test so a failure path logs instead of blocking forever on a
    // MessageBox nobody's there to dismiss.
    private static readonly bool TestMode =
        Environment.GetEnvironmentVariable("RMS_HOME_LAUNCHER_TEST_MODE") == "1";

    // A WinExe app has no console -- Console.Error/Out writes silently go nowhere, so
    // this is the only way to see what actually happened. Written to %TEMP%, not under
    // AppDir, so logging keeps working even if AppDir's own resolution is what's wrong.
    private static readonly string LogPath =
        Path.Combine(Path.GetTempPath(), "rms-home-launcher.log");

    private static void Log(string message)
    {
        try
        {
            File.AppendAllText(LogPath, $"{DateTime.UtcNow:O} {message}\n");
        }
        catch
        {
            // Logging itself must never be what crashes the launcher.
        }
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int MessageBox(IntPtr hWnd, string text, string caption, uint type);

    private const uint MB_ICONERROR = 0x10;

    private static void ShowError(string message)
    {
        Log("ERROR: " + message);
        if (TestMode) return;
        MessageBox(IntPtr.Zero, message, "RMS-HOME", MB_ICONERROR);
    }

    // {app}\launcher\RMS-HOME-Launcher.exe -> {app}\launcher -> {app}. Environment.
    // ProcessPath (not AppContext.BaseDirectory) is used because it's documented to
    // resolve to the actual launched exe's path even under PublishSingleFile, which
    // extracts native dependencies to a temp dir at runtime.
    private static string AppDir =>
        Path.GetDirectoryName(Path.GetDirectoryName(Environment.ProcessPath!))!;

    // Must match server/lib/heartbeat.ts's getHeartbeatPath() exactly -- both sides
    // agree on this fixed name in the OS temp dir specifically because {app} (C:\Program
    // Files\rms-home) isn't writable by the normal, non-elevated user account this
    // launcher and the app server both actually run as (only the installer itself runs
    // elevated). Same reasoning as this launcher's own LogPath, above.
    private static string HeartbeatPath =>
        Path.Combine(Path.GetTempPath(), "rms-home-heartbeat.txt");

    private static async Task<int> Main()
    {
        // A crash here would otherwise leave zero trace -- a WinExe app has no console
        // to print an unhandled-exception dump to, so it would just silently vanish.
        AppDomain.CurrentDomain.UnhandledException += (_, e) =>
            Log("UNHANDLED EXCEPTION: " + e.ExceptionObject);

        try
        {
            return await RunAsync();
        }
        catch (Exception ex)
        {
            Log("UNHANDLED EXCEPTION in RunAsync: " + ex);
            return 1;
        }
    }

    private static async Task<int> RunAsync()
    {
        Log($"Launcher starting. AppDir={AppDir} ProcessPath={Environment.ProcessPath} TestMode={TestMode}");

        // Already running (e.g. a second double-click)? Open another tab, don't start
        // a second Node process on the same port, don't start a second watcher.
        if (await UrlResponds())
        {
            Log("App already responding -- opening another tab and exiting.");
            OpenBrowser();
            return 0;
        }

        if (!EnsureServiceRunning())
        {
            ShowError($"RMS-HOME could not start its database service ({ServiceName}).\n" +
                      "Try restarting your computer. If this keeps happening, reinstall RMS-HOME.");
            return 1;
        }

        // Reset any stale heartbeat left over from a prior run before it could be
        // misread as already-fresh.
        if (File.Exists(HeartbeatPath)) File.Delete(HeartbeatPath);

        var node = StartNode();
        Log($"Started node process, PID={node.Id}");

        if (!await WaitForReady(node))
        {
            Log("App did not become ready within the timeout.");
            KillTree(node);
            ShowError("RMS-HOME did not start within 15 seconds.\n" +
                      "Please try again. If this keeps happening, restart your computer.");
            return 1;
        }

        Log("App is ready. Opening browser and starting heartbeat watch.");
        OpenBrowser();
        WatchHeartbeatAndKill(node);
        Log("Heartbeat went stale -- killed node process tree. Exiting.");
        return 0;
    }

    private static bool EnsureServiceRunning()
    {
        if (IsServiceRunning())
        {
            Log($"Service {ServiceName} already running.");
            return true;
        }
        Log($"Service {ServiceName} not running -- starting it.");
        var startOutput = RunHidden("net.exe", $"start {ServiceName}");
        Log("net start output: " + startOutput);
        var running = IsServiceRunning();
        Log($"Service {ServiceName} running after start attempt: {running}");
        return running;
    }

    private static bool IsServiceRunning() =>
        RunHidden("sc.exe", $"query {ServiceName}").Contains("RUNNING");

    private static Process StartNode()
    {
        Log($"Starting node via cmd /c npm run start:desktop, WorkingDirectory={AppDir}");
        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm run start:desktop",
                WorkingDirectory = AppDir,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            },
            EnableRaisingEvents = true,
        };
        // The app's own output is the single most useful thing to see if it never
        // becomes ready -- log every line as it arrives rather than only at the end,
        // in case the process is killed before exiting on its own.
        process.OutputDataReceived += (_, e) => { if (e.Data != null) Log("[node stdout] " + e.Data); };
        process.ErrorDataReceived += (_, e) => { if (e.Data != null) Log("[node stderr] " + e.Data); };
        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        return process;
    }

    // Any HTTP response counts as ready, not just 200 -- hitting "/" with no session
    // cookie redirects to /login, which is itself proof the server answered.
    private static async Task<bool> UrlResponds()
    {
        try
        {
            using var response = await Http.GetAsync(AppUrl);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static async Task<bool> WaitForReady(Process node)
    {
        for (var elapsed = 0; elapsed < ReadyTimeoutMs; elapsed += ReadyPollMs)
        {
            if (node.HasExited)
            {
                Log($"node process exited early (before becoming ready), ExitCode={node.ExitCode}");
                return false;
            }
            if (await UrlResponds()) return true;
            await Task.Delay(ReadyPollMs);
        }
        Log("WaitForReady loop finished without the app ever responding (timed out).");
        return false;
    }

    // Best-effort only -- opening the browser must never be able to block the rest of
    // the launcher (in particular, the heartbeat watch that actually has to run
    // reliably). ShellExecute against a bare URL can hang on a machine with no default
    // browser/interactive session to resolve it against (e.g. a headless CI runner), so
    // this fires on its own thread rather than being awaited inline.
    private static void OpenBrowser()
    {
        // windows-latest CI runners actually ship Edge by default -- if it really opens
        // and loads the page, the HeartbeatBeacon component starts firing genuine
        // heartbeats, and the "simulated closed tab" smoke test would never see the
        // staleness timeout fire (correctly, since a real open tab should keep the app
        // alive). The smoke test only ever checks HTTP readiness directly, never
        // actually needs a browser, so skip opening one in TestMode entirely.
        if (TestMode)
        {
            Log("TestMode: skipping OpenBrowser.");
            return;
        }

        new Thread(() =>
        {
            try
            {
                Process.Start(new ProcessStartInfo { FileName = AppUrl, UseShellExecute = true });
                Log("OpenBrowser: Process.Start returned normally.");
            }
            catch (Exception ex)
            {
                Log("OpenBrowser failed (non-fatal): " + ex.Message);
            }
        })
        { IsBackground = true }.Start();
    }

    private static void WatchHeartbeatAndKill(Process node)
    {
        Log("Starting heartbeat watch loop.");
        // Track "last time the value changed" on our own clock rather than parsing the
        // timestamp the page wrote -- only whether a new heartbeat landed matters, not
        // what time it claims. Starting lastChange at "now" (before any heartbeat could
        // possibly exist yet) gives page-load a grace period for free.
        var lastValue = "";
        var lastChange = DateTime.UtcNow;
        while ((DateTime.UtcNow - lastChange).TotalSeconds < HeartbeatStaleSec)
        {
            Thread.Sleep(WatchPollMs);
            var current = ReadHeartbeat();
            if (current != lastValue)
            {
                lastValue = current;
                lastChange = DateTime.UtcNow;
            }
        }
        Log("Heartbeat stale threshold reached -- killing node process tree.");
        KillTree(node);
    }

    private static string ReadHeartbeat()
    {
        try
        {
            return File.Exists(HeartbeatPath) ? File.ReadAllText(HeartbeatPath) : "";
        }
        catch
        {
            return "";
        }
    }

    private static void KillTree(Process process)
    {
        Log($"KillTree: PID={process.Id} HasExited={SafeHasExited(process)}");
        try
        {
            process.Kill(entireProcessTree: true);
            Log("KillTree: entireProcessTree kill call completed without throwing.");
        }
        catch (Exception ex)
        {
            // Logged, not swallowed -- "already exited" is a real possible cause here,
            // but so is anything else, and silently assuming the former hides real bugs.
            Log("KillTree: entireProcessTree kill threw: " + ex);
        }

        // Belt-and-suspenders: npm on Windows can re-spawn through another shell layer
        // to run a package.json script, so the actual long-lived node.exe serving the
        // app may no longer be a live descendant of the cmd.exe PID captured in
        // StartNode() by the time we get here -- entireProcessTree can only kill what
        // Windows still reports as part of that tree. node.exe also never actually
        // lives under AppDir on any machine (real or CI) -- it's wherever Node itself
        // was installed, which varies -- so path-matching by install location doesn't
        // work either. The one thing that's true regardless of ancestry or install
        // location: whatever is actually serving the app is listening on its port.
        KillWhateverIsListeningOnAppPort();
    }

    private static void KillWhateverIsListeningOnAppPort()
    {
        try
        {
            var netstatOutput = RunHidden("netstat.exe", "-ano");
            var portMarker = $":{AppPort} ";
            foreach (var line in netstatOutput.Split('\n'))
            {
                if (!line.Contains("LISTENING") || !line.Contains(portMarker)) continue;

                var columns = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (columns.Length == 0 || !int.TryParse(columns[^1], out var pid)) continue;

                try
                {
                    using var listener = Process.GetProcessById(pid);
                    Log($"KillWhateverIsListeningOnAppPort: killing PID={pid} ({listener.ProcessName}), listening on port {AppPort}.");
                    listener.Kill(entireProcessTree: true);
                }
                catch (Exception ex)
                {
                    Log($"KillWhateverIsListeningOnAppPort: failed to kill PID={pid}: {ex}");
                }
            }
        }
        catch (Exception ex)
        {
            Log("KillWhateverIsListeningOnAppPort: netstat scan failed: " + ex);
        }
    }

    private static bool SafeHasExited(Process process)
    {
        try
        {
            return process.HasExited;
        }
        catch
        {
            return true;
        }
    }

    // "cmd /c npm run start:desktop" is really cmd.exe -> npm.cmd -> node.exe -> next's
    // own worker, and on Windows that chain doesn't reliably stay one connected process
    // tree all the way through (see KillTree's fallback above) -- this helper is only
    // used for short-lived one-shot commands (net.exe/sc.exe), where that's not a
    // concern.
    private static string RunHidden(string fileName, string arguments)
    {
        using var process = Process.Start(new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        })!;
        var output = process.StandardOutput.ReadToEnd() + process.StandardError.ReadToEnd();
        process.WaitForExit();
        return output;
    }
}
