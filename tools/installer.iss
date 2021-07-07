; -- gg-struggle installer --
; run this from the tools/ directory

[Setup]
AppName=gg-struggle
AppVersion=1.3
WizardStyle=modern
DefaultDirName={autopf}\gg-struggle
DefaultGroupName=gg-struggle
UninstallDisplayIcon={app}\UninstallGGstruggle.exe
PrivilegesRequired=admin

[Files]
Source: "..\server\gg-struggle.exe"; DestDir: "{app}";
Source: "localhost.cnf"; DestDir: "{app}";
Source: "rmcert.ps1"; DestDir: "{app}";
Source: "gencert.ps1"; DestDir: "{app}";
Source: "..\server\node_modules\sqlite3\lib\binding\napi-v3-win32-x64\node_sqlite3.node"; DestDir: "{app}\node_modules\sqlite3\lib\binding\napi-v3-win32-x64"
Source: "..\README.md"; DestDir: "{app}";

[Icons]
Name: "{group}\Launch gg-struggle"; Filename: "{app}\gg-struggle.exe"
Name: "{group}\Uninstall gg-struggle"; Filename: "{uninstallexe}"

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File rmcert.ps1 ""{app}"" "; \
    WorkingDir: {app}; \
    Flags: runascurrentuser; \
    StatusMsg: "Removing the gg-struggle certificate..."; \

[Run]
; generate certificate and keys
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""gencert.ps1"" ""{app}"" "; \
    WorkingDir: {app}; \
    Flags: runascurrentuser; \
    StatusMsg: "Generating a self-signed gg-struggle certificate..."; \
    AfterInstall: PatchBothHosts;

; run gg-struggle.exe after installation
Filename: {app}\gg-struggle.exe; Description: {cm:LaunchProgram,{cm:AppName}}; Flags: nowait postinstall skipifsilent

[CustomMessages]
AppName=gg-struggle
LaunchProgram=Start gg-struggle after finishing installation

[Code]
// Thanks to
// https://github.com/cryptomator/cryptomator-win/blob/0d4eb079b988da00b1b36873c8b11da8fe842d4e/resources/innosetup/setup.iss#L178
procedure PatchHostsFile(statements: TStringList);
var
  contents: TStringList;
  filename, statement: String;
  i: Integer;
begin
  filename := ExpandConstant('{sys}\drivers\etc\hosts');
  Log('Reading ' + filename);
  contents := TStringList.Create();
  if(FileExists(filename)) then begin
    contents.LoadFromFile(filename);
  end;
  for i := 0 to statements.Count-1 do
  begin
    statement := statements[i];
    if(contents.IndexOf(statement) < 0) then begin
      Log('Adding line to hosts file: ' + statement);
      contents.Append(statement);
    end;
  end;
  try
      contents.SaveToFile(filename);
    except
      MsgBox('Unable to write to ' + filename + '.  To improve compatibility with Windows, we''d advise you to add this line manually:' + #13#10#13#10 + statement + #13#10#13#10 + 'Installation will continue after pressing OK.', mbInformation, MB_OK);
  end;
end;


procedure UnPatchHostsFile(statements: TStringList);
var
  contents: TStringList;
  filename, statement: String;
  i: Integer;
begin
  filename := ExpandConstant('{sys}\drivers\etc\hosts');
  Log('Reading ' + filename);
  contents := TStringList.Create();
  if(FileExists(filename)) then begin
    contents.LoadFromFile(filename);
  end;
  for i := 0 to statements.Count-1 do
  begin
    statement := statements[i]
    if(contents.IndexOf(statement) >= 0) then begin
      Log('Removing line from hosts file: ' + statement);
      contents.Delete(contents.IndexOf(statement));
    end;
  end;
  try
    contents.SaveToFile(filename);
  except
    // sleep(100);
    MsgBox('Unable to write to ' + filename + '.  To improve compatibility with Windows, we''d advise you to remove this line manually:' + #13#10#13#10 + statement + #13#10#13#10 + 'Installation will continue after pressing OK.', mbInformation, MB_OK);
  end;
end;

procedure UnPatchBothHosts();
var
  hosts: TStringList;
begin
  hosts := TStringList.Create();
  hosts.Add('127.0.0.1 ggst-game.guiltygear.com')
  hosts.Add('3.112.119.46 ggst-game-real.guiltygear.com')
  UnPatchHostsFile(hosts);
end;

procedure PatchBothHosts();
var
  hosts: TStringList;
begin
  hosts := TStringList.Create();
  hosts.Add('127.0.0.1 ggst-game.guiltygear.com')
  hosts.Add('3.112.119.46 ggst-game-real.guiltygear.com')
  PatchHostsFile( hosts );
end;



procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  hosts: TStringList;
begin
  case CurUninstallStep of
    usUninstall:
      begin
        hosts := TStringList.Create();
        hosts.Add('127.0.0.1 ggst-game.guiltygear.com')
        hosts.Add('3.112.119.46 ggst-game-real.guiltygear.com')
        UnPatchHostsFile(hosts);
      end;
    usPostUninstall:
      begin
        // thanks https://github.com/HeliumProject/InnoSetup/blob/master/Examples/UninstallCodeExample1.iss
      end;
  end;
end;
