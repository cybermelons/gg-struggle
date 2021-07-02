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
Source: "gg-struggle.exe"; DestDir: "{app}"
Source: "gg-struggle-cert.pem"; DestDir: "{app}";
Source: "gg-struggle-key.pem"; DestDir: "{app}";
Source: "README.md"; DestDir: "{app}"; Flags: isreadme

[Icons]
Name: "{group}\Launch gg-struggle"; Filename: "{app}\gg-struggle.exe"
Name: "{group}\Uninstall gg-struggle"; Filename: "{uninstallexe}"

[UninstallRun]
Filename: "certutil.exe"; Parameters: "-delstore ""Root"" 162aceef5b0e20a7a80fd53ebce97d5599409823"; \
    Flags: runascurrentuser; \
    StatusMsg: "Removing the gg-struggle certificate..." \


[Run]
Filename: "certutil.exe"; Parameters: "-addstore ""Root"" {app}\gg-struggle-cert.pem"; \
    Flags: runascurrentuser; \
    StatusMsg: "Installing gg-struggle certificate to Windows Root Certificate Store..." \


[Code]

// Thanks to
// https://github.com/cryptomator/cryptomator-win/blob/0d4eb079b988da00b1b36873c8b11da8fe842d4e/resources/innosetup/setup.iss#L178

procedure PatchHostsFile();
var
  contents: TStringList;
  filename, statement: String;
begin
  filename := ExpandConstant('{sys}\drivers\etc\hosts');
  Log('Reading ' + filename);
  contents := TStringList.Create();
  if(FileExists(filename)) then begin
    contents.LoadFromFile(filename);
  end;
  statement := '127.0.0.1 ggst-game.guiltygear.com';
  if(contents.IndexOf(statement) < 0) then begin
    Log('Adding' + statement);
    contents.Append(statement);
    try
      contents.SaveToFile(filename);
    except
      MsgBox('Unable to write to ' + filename + '.  To improve compatibility with Windows, we''d advise you to add this line manually:' + #13#10#13#10 + statement + #13#10#13#10 + 'Installation will continue after pressing OK.', mbInformation, MB_OK);
    end;
  end;
end;
