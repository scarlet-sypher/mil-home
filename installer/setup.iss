; MIL-HOME Windows installer.
;
; Two hard rules drive every decision below:
;   1. Never disturb what's already on the machine (Node: only install if missing/
;      inadequate; Postgres: never touch any pre-existing instance).
;   2. This app's Postgres instance is always its own dedicated, isolated install --
;      own binaries (--prefix), own data dir, own service name, own port resolution --
;      so it can coexist with anything else already on the machine.
;
; The Node MSI and the PostgreSQL EDB installer are expected at installer\redist\ and
; the pre-built app at installer\staging\app\ -- both are populated by the
; .github/workflows/build-installer.yml CI job before ISCC compiles this script; neither
; is committed to the repo.

#define AppName "MIL-HOME"
#define AppVersion "1.0.0"
#define PgServiceName "mil-home-postgresql"
#define PgSuperUser "postgres"
#define PgSuperPassword "mil_home_dev"
#define PgPreferredPort "5433"
#define MinNodeVersion "18.18.0"

[Setup]
AppName={#AppName}
AppVersion={#AppVersion}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputBaseFilename=mil-home-setup
Compression=lzma2
SolidCompression=yes
DisableProgramGroupPage=yes
; Every real install now writes a diagnostic log to %TEMP%\Setup Log*.txt
; automatically, with no /LOG= flag needed -- the only way this bug (a critical step
; failing silently, leaving a completely empty database, while still reporting
; "installed successfully") was ever actually found was a user's own manual log
; capture after the fact.
SetupLogging=yes

[Files]
; Auxiliary installer-time files. dontcopy: never left behind in {app}; Inno extracts
; each to {tmp} automatically the moment a [Run]/[UninstallRun] entry below references
; it via "{tmp}\...". Code-section functions that need one *outside* those two sections
; (the NeedsNode/GetChosenPort checks) call ExtractTemporaryFile explicitly first.
; dontcopy files always land flat in {tmp} regardless of DestDir -- DestDir is kept as
; "{tmp}" everywhere below (not a subfolder) to match that actual behavior, since
; ExtractTemporaryFile and any "{tmp}\..." reference must use the plain filename only.
; Each script is also listed individually rather than via a "*.ps1" wildcard: the
; singular ExtractTemporaryFile cannot resolve a specific match out of a wildcard-sourced
; dontcopy entry (that's what ExtractTemporaryFiles, plural, is for) -- named entries
; sidestep that entirely.
Source: "redist\node-installer.msi"; DestDir: "{tmp}"; Flags: dontcopy
Source: "redist\postgresql-installer.exe"; DestDir: "{tmp}"; Flags: dontcopy
Source: "scripts\Check-Node.ps1"; DestDir: "{tmp}"; Flags: dontcopy
Source: "scripts\Find-FreePort.ps1"; DestDir: "{tmp}"; Flags: dontcopy
Source: "scripts\Wait-PostgresReady.ps1"; DestDir: "{tmp}"; Flags: dontcopy
Source: "scripts\Secure-PostgresNetwork.ps1"; DestDir: "{tmp}"; Flags: dontcopy
Source: "scripts\Provision-Database.ps1"; DestDir: "{tmp}"; Flags: dontcopy
Source: "scripts\Write-Env.ps1"; DestDir: "{tmp}"; Flags: dontcopy
Source: "templates\env.template"; DestDir: "{tmp}"; Flags: dontcopy

; The pre-built app itself -- this is what actually stays in {app}.
Source: "staging\app\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\launcher\MIL-HOME-Launcher.exe"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\launcher\MIL-HOME-Launcher.exe"

[Run]
Filename: "msiexec.exe"; \
    Parameters: "/i ""{tmp}\node-installer.msi"" /quiet /norestart"; \
    StatusMsg: "Installing Node.js..."; Check: NeedsNode; Flags: waituntilterminated

Filename: "{tmp}\postgresql-installer.exe"; \
    Parameters: "--mode unattended --unattendedmodeui minimal --prefix ""{app}\pgsql"" --datadir ""C:\ProgramData\MIL-HOME\pgdata"" --servicename {#PgServiceName} --serverport {code:GetChosenPort} --superpassword {#PgSuperPassword} --disable-components pgAdmin,stackbuilder"; \
    StatusMsg: "Installing dedicated PostgreSQL instance..."; Check: NeedsPostgresProvisioning; Flags: waituntilterminated

; Everything from here on (Postgres readiness through the final migration) is run from
; Pascal instead of declared here -- see PerformCriticalPostInstallSteps, invoked from
; CurStepChanged(ssPostInstall). A plain [Run] entry has no way to abort the install or
; even surface an error if the program it runs exits nonzero; Inno just silently moves
; on to the next line. That's exactly how this app ended up "installed successfully"
; with a completely empty database once before -- db:deploy (or an earlier step)
; failed and nothing noticed. RunCriticalStep below checks every exit code and aborts
; the whole install with a visible error the moment one of these fails.

[UninstallRun]
; Only ever acts on the literal service name this installer created -- there is no code
; path anywhere in this script that enumerates or touches any other Postgres service.
Filename: "{sys}\sc.exe"; Parameters: "stop {#PgServiceName}"; Flags: runhidden waituntilterminated skipifdoesntexist
Filename: "{sys}\sc.exe"; Parameters: "delete {#PgServiceName}"; Flags: runhidden waituntilterminated skipifdoesntexist

[UninstallDelete]
; {app} as a whole (not just {app}\pgsql) -- Inno's uninstaller only auto-removes files
; it directly tracked via [Files]; .env is created by a [Run]-executed script, never
; tracked, and would otherwise survive uninstall sitting in an oddly-non-empty Program
; Files folder ({app}\pgsql is nested under here too, so covered either way).
Type: filesandordirs; Name: "{app}"
Type: filesandordirs; Name: "C:\ProgramData\MIL-HOME"

[Code]
var
  NodeChecked, NodeAdequate: Boolean;
  NodeDir: String;
  PostgresChecked, PostgresAlreadyProvisioned: Boolean;
  PortResolved: Boolean;
  ChosenPortStr: String;

// Inno's documented "auto-extract a dontcopy file the moment a [Run]/[UninstallRun]
// entry references it via {tmp}\..." did not reliably happen in practice (proven by a
// real CI run: postgresql-installer.exe's own [Run] entry failed with "CreateProcess
// failed; code 2, the system cannot find the file specified" even though its Filename
// was the plain literal "{tmp}\postgresql-installer.exe"). Rather than keep trusting
// that implicit behavior, every dontcopy file is explicitly extracted exactly once,
// upfront, via this universally-called entry point -- removing the dependency on
// exactly when/whether Inno's automatic extraction fires.
function InitializeSetup(): Boolean;
begin
  ExtractTemporaryFile('node-installer.msi');
  ExtractTemporaryFile('postgresql-installer.exe');
  ExtractTemporaryFile('Check-Node.ps1');
  ExtractTemporaryFile('Find-FreePort.ps1');
  ExtractTemporaryFile('Wait-PostgresReady.ps1');
  ExtractTemporaryFile('Secure-PostgresNetwork.ps1');
  ExtractTemporaryFile('Provision-Database.ps1');
  ExtractTemporaryFile('Write-Env.ps1');
  ExtractTemporaryFile('env.template');
  Result := True;
end;

// Runs a bundled PowerShell script (extracted from the installer's own payload) and
// captures both its exit code and stdout. Only needed for functions called from
// outside [Run]/[UninstallRun] (Check: and {code:} substitutions) -- entries declared
// directly in those two sections extract their "{tmp}\..." files automatically.
function RunPowerShell(const ScriptRelPath, Arguments: String; var ResultCode: Integer): String;
var
  ScriptPath, OutFile, CmdLine: String;
  FileContent: AnsiString; // LoadStringFromFile's var-parameter requires AnsiString exactly
begin
  ExtractTemporaryFile(ScriptRelPath);
  ScriptPath := ExpandConstant('{tmp}\' + ScriptRelPath);
  OutFile := ExpandConstant('{tmp}') + '\ps_out_' + IntToStr(Random(1000000)) + '.txt';

  CmdLine := '/C powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + ScriptPath +
    '" ' + Arguments + ' > "' + OutFile + '" 2>&1';

  Exec(ExpandConstant('{cmd}'), CmdLine, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  FileContent := '';
  if FileExists(OutFile) then
  begin
    LoadStringFromFile(OutFile, FileContent);
    DeleteFile(OutFile);
  end;
  Result := String(FileContent);
end;

// Pascal Script has no built-in BoolToStr -- unlike Delphi's SysUtils, it isn't part
// of Inno Setup's support function set.
function BoolStr(Value: Boolean): String;
begin
  if Value then
    Result := 'True'
  else
    Result := 'False';
end;

// Returns the last non-blank line of a script's captured output -- the convention our
// PS1 helpers use to hand back a single value (a port number, a directory path) amid
// their Write-Host progress lines.
function LastLine(const Text: String): String;
var
  Lines: TArrayOfString;
  I: Integer;
begin
  Result := '';
  Lines := StringSplit(Text, [#13#10], stExcludeEmpty);
  for I := GetArrayLength(Lines) - 1 downto 0 do
  begin
    if Trim(Lines[I]) <> '' then
    begin
      Result := Trim(Lines[I]);
      break;
    end;
  end;
end;

function NeedsNode: Boolean;
var
  ResultCode: Integer;
  Output: String;
begin
  if not NodeChecked then
  begin
    Output := RunPowerShell('Check-Node.ps1', '-MinVersion ' + '{#MinNodeVersion}', ResultCode);
    NodeAdequate := (ResultCode = 0);
    if NodeAdequate then
      NodeDir := LastLine(Output);
    NodeChecked := True;
    Log('Check-Node.ps1: ResultCode=' + IntToStr(ResultCode) + ' Output=' + Output);
  end;
  Result := not NodeAdequate;
end;

// Node's own official Windows MSI installs to this path by default when run silently
// without an INSTALLDIR override -- used only in the case where NeedsNode() is True and
// we just silently installed it ourselves, since this same long-lived installer process
// never sees its own PATH refresh after that MSI finishes.
function GetNodeExe(Param: String): String;
begin
  NeedsNode(); // ensures NodeChecked/NodeDir are populated regardless of call order
  if NodeAdequate then
    Result := NodeDir + '\node.exe'
  else
    Result := ExpandConstant('{pf}\nodejs\node.exe');
end;

function GetNodeDirForCli(Param: String): String;
begin
  NeedsNode();
  if NodeAdequate then
    Result := NodeDir
  else
    Result := ExpandConstant('{pf}\nodejs');
end;

function GetNpxCli(Param: String): String;
begin
  Result := GetNodeDirForCli('') + '\node_modules\npm\bin\npx-cli.js';
end;

function GetNpmCli(Param: String): String;
begin
  Result := GetNodeDirForCli('') + '\node_modules\npm\bin\npm-cli.js';
end;

function NeedsPostgresProvisioning: Boolean;
var
  ResultCode: Integer;
begin
  if not PostgresChecked then
  begin
    // A pre-existing mil-home-postgresql service means this is a re-run (update, or a
    // retry after a failed first attempt) -- skip straight to the migration step
    // instead of trying to provision the instance a second time.
    Exec(ExpandConstant('{cmd}'), '/C sc.exe query {#PgServiceName} >nul 2>&1', '', SW_HIDE,
      ewWaitUntilTerminated, ResultCode);
    PostgresAlreadyProvisioned := (ResultCode = 0);
    PostgresChecked := True;
    Log('mil-home-postgresql service exists: ' + BoolStr(PostgresAlreadyProvisioned));
  end;
  Result := not PostgresAlreadyProvisioned;
end;

function GetChosenPort(Param: String): String;
var
  ResultCode: Integer;
  Output: String;
  EnvContentRaw: AnsiString; // LoadStringFromFile's var-parameter requires AnsiString exactly
  EnvContent: String;
  P1, P2: Integer;
begin
  if not PortResolved then
  begin
    // A partial/failed prior attempt may have already written .env with a chosen port --
    // reuse it so a retried install doesn't silently pick a different free port.
    if FileExists(ExpandConstant('{app}\.env')) then
    begin
      LoadStringFromFile(ExpandConstant('{app}\.env'), EnvContentRaw);
      EnvContent := String(EnvContentRaw);
      P1 := Pos('127.0.0.1:', EnvContent);
      if P1 > 0 then
      begin
        P1 := P1 + Length('127.0.0.1:');
        P2 := P1;
        while (P2 <= Length(EnvContent)) and (EnvContent[P2] >= '0') and (EnvContent[P2] <= '9') do
          P2 := P2 + 1;
        ChosenPortStr := Copy(EnvContent, P1, P2 - P1);
      end;
    end;

    if ChosenPortStr = '' then
    begin
      Output := RunPowerShell('Find-FreePort.ps1', '-PreferredPort {#PgPreferredPort}', ResultCode);
      if ResultCode <> 0 then
        RaiseException('Could not find a free port for the dedicated PostgreSQL instance: ' + Output);
      ChosenPortStr := LastLine(Output);
    end;

    PortResolved := True;
    Log('Dedicated PostgreSQL instance will use port ' + ChosenPortStr);
  end;
  Result := ChosenPortStr;
end;

// The EDB Postgres installer registers its own separate "PostgreSQL 16" entry in
// Windows' Programs and Features / Add-Remove-Programs list -- entirely independent of
// the mil-home-postgresql Windows service ([UninstallRun] above) and the files under
// {app}\pgsql ([UninstallDelete] above). Neither of those touches this registration, so
// left alone it survives uninstall as an orphaned entry pointing at an uninstaller
// whose files we just deleted. Only ever removes an entry whose own InstallLocation is
// under this app's dedicated {app}\pgsql -- never touches any other Postgres
// installation's Add/Remove Programs entry.
procedure RemoveOrphanedPostgresUninstallEntry();
var
  UninstallKeyRoot, KeyPath, InstallLocation, OwnPgsqlDir: String;
  SubkeyNames: TArrayOfString;
  I: Integer;
begin
  OwnPgsqlDir := Lowercase(ExpandConstant('{app}\pgsql'));
  UninstallKeyRoot := 'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall';

  if not RegGetSubkeyNames(HKLM, UninstallKeyRoot, SubkeyNames) then
  begin
    Log('RemoveOrphanedPostgresUninstallEntry: could not enumerate ' + UninstallKeyRoot);
    exit;
  end;

  for I := 0 to GetArrayLength(SubkeyNames) - 1 do
  begin
    KeyPath := UninstallKeyRoot + '\' + SubkeyNames[I];
    if RegQueryStringValue(HKLM, KeyPath, 'InstallLocation', InstallLocation) then
    begin
      if Pos(OwnPgsqlDir, Lowercase(InstallLocation)) = 1 then
      begin
        Log('Removing orphaned Add/Remove Programs entry: ' + KeyPath + ' (InstallLocation=' + InstallLocation + ')');
        if not RegDeleteKeyIncludingSubkeys(HKLM, KeyPath) then
          Log('RemoveOrphanedPostgresUninstallEntry: failed to delete ' + KeyPath);
      end;
    end;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
    RemoveOrphanedPostgresUninstallEntry();
end;

// Runs a program and aborts the whole install with a visible error if it can't be
// started or exits nonzero -- unlike a plain [Run] entry, which just moves on to the
// next line either way. StepDescription appears both in the wizard's status text and
// in the error message if this step is what fails.
procedure RunCriticalStep(const FileName, Parameters, WorkingDir, StepDescription: String);
var
  ResultCode: Integer;
  OutFile, BatFile, CmdLine: String;
  OutputRaw: AnsiString; // LoadStringFromFile's var-parameter requires AnsiString exactly
  Output: String;
begin
  WizardForm.StatusLabel.Caption := StepDescription;
  WizardForm.Update;
  Log('RunCriticalStep: starting "' + StepDescription + '"');

  // Route through a temporary .bat file rather than a single giant cmd.exe /C string --
  // this call was actually failing for real ('"node"' is not recognized) because npx's
  // own internal mechanism for running the "prisma" command spawns a NESTED shim
  // (prisma.cmd) that itself calls a bare, unqualified "node", relying on PATH. Passing
  // GetNodeExe()'s resolved absolute path only fixes the outer call -- it does nothing
  // for that nested lookup, since the installer's own long-lived process never sees a
  // PATH refresh after Node was (maybe) just silently installed in this same run. A
  // temp .bat that explicitly sets PATH first fixes it for the whole child process
  // tree, however many shells/shims are nested underneath, and is far more debuggable
  // than yet another giant escaped one-liner.
  OutFile := ExpandConstant('{tmp}') + '\critical_step_' + IntToStr(Random(1000000)) + '.txt';
  BatFile := ExpandConstant('{tmp}') + '\critical_step_' + IntToStr(Random(1000000)) + '.bat';
  SaveStringToFile(BatFile,
    '@echo off' + #13#10 +
    'SET "PATH=' + GetNodeDirForCli('') + ';%PATH%"' + #13#10 +
    '"' + FileName + '" ' + Parameters + #13#10,
    False);
  CmdLine := '/C ""' + BatFile + '" > "' + OutFile + '" 2>&1"';

  if not Exec(ExpandConstant('{cmd}'), CmdLine, WorkingDir, SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    RaiseException('MIL-HOME setup failed at "' + StepDescription + '": cmd.exe itself could not be started (' +
      SysErrorMessage(ResultCode) + ').');
  end;

  OutputRaw := '';
  if FileExists(OutFile) then
  begin
    LoadStringFromFile(OutFile, OutputRaw);
    DeleteFile(OutFile);
  end;
  DeleteFile(BatFile);
  Output := String(OutputRaw);
  if Length(Output) > 4000 then
    Output := '...(truncated)...' + Copy(Output, Length(Output) - 4000, 4000);

  Log('RunCriticalStep: "' + StepDescription + '" exit code=' + IntToStr(ResultCode) + #13#10 + 'Output: ' + Output);

  if ResultCode <> 0 then
    RaiseException('MIL-HOME setup failed at "' + StepDescription + '" (exit code ' + IntToStr(ResultCode) + ').' + #13#10#13#10 +
      'Output:' + #13#10 + Output + #13#10#13#10 +
      'A diagnostic log was saved under %TEMP%\Setup Log*.txt -- please include it if you report this.');
end;

procedure PerformCriticalPostInstallSteps();
var
  PowerShellExe, PgPsqlExe, TmpDir, AppDir, Port: String;
begin
  PowerShellExe := ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe');
  PgPsqlExe := ExpandConstant('{app}\pgsql\bin\psql.exe');
  TmpDir := ExpandConstant('{tmp}');
  AppDir := ExpandConstant('{app}');
  Port := GetChosenPort('');

  if NeedsPostgresProvisioning then
  begin
    RunCriticalStep(PowerShellExe,
      '-NoProfile -ExecutionPolicy Bypass -File "' + TmpDir + '\Wait-PostgresReady.ps1" -PsqlPath "' +
        PgPsqlExe + '" -Port ' + Port + ' -SuperUser {#PgSuperUser} -SuperPassword {#PgSuperPassword}',
      TmpDir, 'Waiting for PostgreSQL to start...');

    RunCriticalStep(PowerShellExe,
      '-NoProfile -ExecutionPolicy Bypass -File "' + TmpDir + '\Secure-PostgresNetwork.ps1" -DataDir ' +
        '"C:\ProgramData\MIL-HOME\pgdata" -PsqlPath "' + PgPsqlExe + '" -ServiceName {#PgServiceName} -Port ' +
        Port + ' -SuperUser {#PgSuperUser} -SuperPassword {#PgSuperPassword}',
      TmpDir, 'Restricting PostgreSQL to local connections only...');

    RunCriticalStep(PowerShellExe,
      '-NoProfile -ExecutionPolicy Bypass -File "' + TmpDir + '\Provision-Database.ps1" -PsqlPath "' +
        PgPsqlExe + '" -Port ' + Port + ' -SuperUser {#PgSuperUser} -SuperPassword {#PgSuperPassword}',
      TmpDir, 'Creating the application database...');
  end;

  RunCriticalStep(PowerShellExe,
    '-NoProfile -ExecutionPolicy Bypass -File "' + TmpDir + '\Write-Env.ps1" -TemplatePath "' +
      TmpDir + '\env.template" -OutputPath "' + AppDir + '\.env" -DbPort ' + Port,
    TmpDir, 'Writing configuration...');

  RunCriticalStep(GetNodeExe(''),
    '"' + GetNpxCli('') + '" prisma generate --schema=server\db\prisma\schema.prisma',
    AppDir, 'Generating Prisma client...');

  RunCriticalStep(GetNodeExe(''),
    '"' + GetNpmCli('') + '" run db:deploy',
    AppDir, 'Applying database migrations...');
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
    PerformCriticalPostInstallSteps();
end;
