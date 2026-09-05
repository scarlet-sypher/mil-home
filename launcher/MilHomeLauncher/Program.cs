using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

namespace MilHomeLauncher;

// The daily launcher behind the desktop/Start Menu shortcut: ensures the dedicated
// Postgres service is up, starts the app server, waits for it to answer, opens the
// browser, then watches a heartbeat file the page keeps fresh while its tab is open --
// there's no OS-level "browser closed" signal, so this is the only way to know when to
// stop the server. Postgres itself is never stopped here; it's a steady-state service.
internal static class Program
{
    private const string ServiceName = "mil-home-postgresql";
    private const string AppUrl = "http://127.0.0.1:8000/";
    private const int ReadyTimeoutMs = 15000;
    private const int ReadyPollMs = 300;
    private const int HeartbeatStaleSec = 13;
    private const int WatchPollMs = 1000;

    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(2) };

    // Set by the CI smoke test so a failure path logs instead of blocking forever on a
    // MessageBox nobody's there to dismiss.
    private static readonly bool TestMode =
        Environment.GetEnvironmentVariable("MIL_HOME_LAUNCHER_TEST_MODE") == "1";

    // A WinExe app has no console -- Console.Error/Out writes silently go nowhere, so
    // this is the only way to see what actually happened. Written to %TEMP%, not under
    // AppDir, so logging keeps working even if AppDir's own resolution is what's wrong.
    private static readonly string LogPath =
        Path.Combine(Path.GetTempPath(), "mil-home-launcher.log");

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
        MessageBox(IntPtr.Zero, message, "MIL-HOME", MB_ICONERROR);
    }

    // {app}\launcher\MIL-HOME-Launcher.exe -> {app}\launcher -> {app}. Environment.
    // ProcessPath (not AppContext.BaseDirectory) is used because it's documented to
    // resolve to the actual launched exe's path even under PublishSingleFile, which
    // extracts native dependencies to a temp dir at runtime.
    private static string AppDir =>
        Path.GetDirectoryName(Path.GetDirectoryName(Environment.ProcessPath!))!;

    private static string HeartbeatPath => Path.Combine(AppDir, ".runtime", "heartbeat.txt");

    private static async Task<int> Main()
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
            ShowError($"MIL-HOME could not start its database service ({ServiceName}).\n" +
                      "Try restarting your computer. If this keeps happening, reinstall MIL-HOME.");
            return 1;
        }

        // Reset any stale heartbeat left over from a prior run before it could be
        // misread as already-fresh.
        if (File.Exists(HeartbeatPath)) File.Delete(HeartbeatPath);

        var node = StartNode();
        Log($"Started node process, PID={node.Id}");

        if (!await WaitForReady())
        {
            Log("App did not become ready within the timeout.");
            KillTree(node);
            ShowError("MIL-HOME did not start within 15 seconds.\n" +
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
        var process = Process.Start(new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = "/c npm run start:desktop",
            WorkingDirectory = AppDir,
            UseShellExecute = false,
            CreateNoWindow = true,
        })!;
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

    private static async Task<bool> WaitForReady()
    {
        for (var elapsed = 0; elapsed < ReadyTimeoutMs; elapsed += ReadyPollMs)
        {
            if (await UrlResponds()) return true;
            await Task.Delay(ReadyPollMs);
        }
        return false;
    }

    private static void OpenBrowser() =>
        Process.Start(new ProcessStartInfo { FileName = AppUrl, UseShellExecute = true });

    private static void WatchHeartbeatAndKill(Process node)
    {
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
        try
        {
            process.Kill(entireProcessTree: true);
        }
        catch
        {
            // Already exited -- nothing to do.
        }
    }

    // "cmd /c npm run start:desktop" is really cmd.exe -> npm.cmd -> node.exe -> next's
    // own worker; Process.Kill(entireProcessTree: true) collapses that whole chain in
    // one call regardless of how many shells are nested in between.
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
