; -- gg-struggle installer --

[Setup]
AppName=gg-struggle
AppVersion=1.0
WizardStyle=modern
DefaultDirName={autopf}\gg-struggle
DefaultGroupName=gg-struggle
UninstallDisplayIcon={app}\UninstallGGstruggle.exe
PrivilegesRequired=admin

[Files]
Source: "gg-struggle.exe"; DestDir: "{app}";
Source: "gg-struggle-cert.pem"; DestDir: "{app}";
Source: "gg-struggle-key.pem"; DestDir: "{app}";
Source: "node_modules\sqlite3\lib\binding\napi-v3-win32-x64\node_sqlite3.node"; DestDir: "{app}\node_modules\sqlite3\lib\binding\napi-v3-win32-x64"
Source: "README.md"; DestDir: "{app}";

[Icons]
Name: "{group}\Launch gg-struggle"; Filename: "{app}\gg-struggle.exe"
Name: "{group}\Uninstall gg-struggle"; Filename: "{uninstallexe}"

[UninstallRun]
Filename: "certutil.exe"; Parameters: "-delstore ""Root"" 162aceef5b0e20a7a80fd53ebce97d5599409823"; \
    Flags: runascurrentuser; \
    StatusMsg: "Removing the gg-struggle certificate..."; \
    AfterInstall: UnPatchBothHosts


[Run]
Filename: "certutil.exe"; Parameters: "-addstore ""Root"" ""{app}\gg-struggle-cert.pem"" "; \
    Flags: runascurrentuser; \
    StatusMsg: "Installing gg-struggle certificate to Windows Root Certificate Store..."; \
    AfterInstall: PatchBothHosts

Filename: {app}\gg-struggle.exe; Description: {cm:LaunchProgram,{cm:AppName}}; Flags: nowait postinstall skipifsilent

[CustomMessages]
AppName=gg-struggle
LaunchProgram=Start gg-struggle after finishing installation

[Code]

// Thanks to
// https://github.com/cryptomator/cryptomator-win/blob/0d4eb079b988da00b1b36873c8b11da8fe842d4e/resources/innosetup/setup.iss#L178
procedure PatchHostsFile(statement: String);
var
  contents: TStringList;
  filename: String;
begin
  filename := ExpandConstant('{sys}\drivers\etc\hosts');
  Log('Reading ' + filename);
  contents := TStringList.Create();
  if(FileExists(filename)) then begin
    contents.LoadFromFile(filename);
  end;
  if(contents.IndexOf(statement) < 0) then begin
    Log('Adding line to hosts file: ' + statement);
    contents.Append(statement);
    try
      contents.SaveToFile(filename);
    except
      MsgBox('Unable to write to ' + filename + '.  To improve compatibility with Windows, we''d advise you to add this line manually:' + #13#10#13#10 + statement + #13#10#13#10 + 'Installation will continue after pressing OK.', mbInformation, MB_OK);
    end;
  end;
end;   


procedure UnPatchHostsFile(statement: String);
var
  contents: TStringList;
  filename: String;
begin
  filename := ExpandConstant('{sys}\drivers\etc\hosts');
  Log('Reading ' + filename);
  contents := TStringList.Create();
  if(FileExists(filename)) then begin
    contents.LoadFromFile(filename);
  end;
  if(contents.IndexOf(statement) >= 0) then begin
    Log('Removing line from hosts file: ' + statement);
    contents.Delete(contents.IndexOf(statement));
    try
      contents.SaveToFile(filename);
    except
      MsgBox('Unable to write to ' + filename + '.  To improve compatibility with Windows, we''d advise you to add this line manually:' + #13#10#13#10 + statement + #13#10#13#10 + 'Installation will continue after pressing OK.', mbInformation, MB_OK);
    end;
  end;
end;

procedure UnPatchBothHosts();
begin
  UnPatchHostsFile('127.0.0.1 ggst-game.guiltygear.com');
  UnPatchHostsFile('3.112.119.46 ggst-game-real.guiltygear.com');
end;

procedure PatchBothHosts();
begin
  PatchHostsFile('127.0.0.1 ggst-game.guiltygear.com');
  PatchHostsFile('3.112.119.46 ggst-game-real.guiltygear.com');
end;



procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  case CurUninstallStep of
    usUninstall:
      begin
        UnPatchHostsFile('127.0.0.1 ggst-game.guiltygear.com')
        UnPatchHostsFile('3.112.119.46 ggst-game-real.guiltygear.com')
      end;
    usPostUninstall:
      begin
        // thanks https://github.com/HeliumProject/InnoSetup/blob/master/Examples/UninstallCodeExample1.iss
      end;
  end;
end;
