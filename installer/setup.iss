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

[Files]
; Auxiliary installer-time files. dontcopy: never left behind in {app}; Inno extracts
; each to {tmp} automatically the moment a [Run]/[UninstallRun] entry below references
; it via "{tmp}\...". Code-section functions that need one *outside* those two sections
; (the NeedsNode/GetChosenPort checks) call ExtractTemporaryFile explicitly first.
Source: "redist\node-installer.msi"; DestDir: "{tmp}"; Flags: dontcopy
Source: "redist\postgresql-installer.exe"; DestDir: "{tmp}"; Flags: dontcopy
Source: "scripts\*.ps1"; DestDir: "{tmp}\scripts"; Flags: dontcopy
Source: "templates\env.template"; DestDir: "{tmp}\templates"; Flags: dontcopy

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

Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
    Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{tmp}\scripts\Wait-PostgresReady.ps1"" -PsqlPath ""{app}\pgsql\bin\psql.exe"" -Port {code:GetChosenPort} -SuperUser {#PgSuperUser} -SuperPassword {#PgSuperPassword}"; \
    StatusMsg: "Waiting for PostgreSQL to start..."; Check: NeedsPostgresProvisioning; Flags: waituntilterminated

Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
    Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{tmp}\scripts\Secure-PostgresNetwork.ps1"" -DataDir ""C:\ProgramData\MIL-HOME\pgdata"" -PsqlPath ""{app}\pgsql\bin\psql.exe"" -ServiceName {#PgServiceName} -Port {code:GetChosenPort} -SuperUser {#PgSuperUser} -SuperPassword {#PgSuperPassword}"; \
    StatusMsg: "Restricting PostgreSQL to local connections only..."; Check: NeedsPostgresProvisioning; Flags: waituntilterminated

Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
    Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{tmp}\scripts\Provision-Database.ps1"" -PsqlPath ""{app}\pgsql\bin\psql.exe"" -Port {code:GetChosenPort} -SuperUser {#PgSuperUser} -SuperPassword {#PgSuperPassword}"; \
    StatusMsg: "Creating the application database..."; Check: NeedsPostgresProvisioning; Flags: waituntilterminated

Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
    Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{tmp}\scripts\Write-Env.ps1"" -TemplatePath ""{tmp}\templates\env.template"" -OutputPath ""{app}\.env"" -DbPort {code:GetChosenPort}"; \
    StatusMsg: "Writing configuration..."; Flags: waituntilterminated

Filename: "{code:GetNodeExe}"; \
    Parameters: """{code:GetNpxCli}"" prisma generate --schema=server\db\prisma\schema.prisma"; \
    WorkingDir: "{app}"; StatusMsg: "Generating Prisma client..."; Flags: waituntilterminated

Filename: "{code:GetNodeExe}"; \
    Parameters: """{code:GetNpmCli}"" run db:deploy"; \
    WorkingDir: "{app}"; StatusMsg: "Applying database migrations..."; Flags: waituntilterminated

[UninstallRun]
; Only ever acts on the literal service name this installer created -- there is no code
; path anywhere in this script that enumerates or touches any other Postgres service.
Filename: "{sys}\sc.exe"; Parameters: "stop {#PgServiceName}"; Flags: runhidden waituntilterminated skipifdoesntexist
Filename: "{sys}\sc.exe"; Parameters: "delete {#PgServiceName}"; Flags: runhidden waituntilterminated skipifdoesntexist

[UninstallDelete]
Type: filesandordirs; Name: "{app}\pgsql"
Type: filesandordirs; Name: "C:\ProgramData\MIL-HOME"

[Code]
var
  NodeChecked, NodeAdequate: Boolean;
  NodeDir: String;
  PostgresChecked, PostgresAlreadyProvisioned: Boolean;
  PortResolved: Boolean;
  ChosenPortStr: String;

// Runs a bundled PowerShell script (extracted from the installer's own payload) and
// captures both its exit code and stdout. Only needed for functions called from
// outside [Run]/[UninstallRun] (Check: and {code:} substitutions) -- entries declared
// directly in those two sections extract their "{tmp}\..." files automatically.
function RunPowerShell(const ScriptRelPath, Arguments: String; var ResultCode: Integer): String;
var
  ScriptPath, OutFile, CmdLine, Output: String;
begin
  ExtractTemporaryFile(ScriptRelPath);
  ScriptPath := ExpandConstant('{tmp}\' + ScriptRelPath);
  OutFile := ExpandConstant('{tmp}') + '\ps_out_' + IntToStr(Random(1000000)) + '.txt';

  CmdLine := '/C powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + ScriptPath +
    '" ' + Arguments + ' > "' + OutFile + '" 2>&1';

  Exec(ExpandConstant('{cmd}'), CmdLine, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  Output := '';
  if FileExists(OutFile) then
  begin
    LoadStringFromFile(OutFile, Output);
    DeleteFile(OutFile);
  end;
  Result := Output;
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
    Output := RunPowerShell('scripts\Check-Node.ps1', '-MinVersion ' + '{#MinNodeVersion}', ResultCode);
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
    Log('mil-home-postgresql service exists: ' + BoolToStr(PostgresAlreadyProvisioned));
  end;
  Result := not PostgresAlreadyProvisioned;
end;

function GetChosenPort(Param: String): String;
var
  ResultCode: Integer;
  Output, EnvContent: String;
  P1, P2: Integer;
begin
  if not PortResolved then
  begin
    // A partial/failed prior attempt may have already written .env with a chosen port --
    // reuse it so a retried install doesn't silently pick a different free port.
    if FileExists(ExpandConstant('{app}\.env')) then
    begin
      LoadStringFromFile(ExpandConstant('{app}\.env'), EnvContent);
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
      Output := RunPowerShell('scripts\Find-FreePort.ps1', '-PreferredPort {#PgPreferredPort}', ResultCode);
      if ResultCode <> 0 then
        RaiseException('Could not find a free port for the dedicated PostgreSQL instance: ' + Output);
      ChosenPortStr := LastLine(Output);
    end;

    PortResolved := True;
    Log('Dedicated PostgreSQL instance will use port ' + ChosenPortStr);
  end;
  Result := ChosenPortStr;
end;
