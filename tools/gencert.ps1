# NOTE: This must be run as admin!

# function defs
function Enable-Read {
  param (
    [string[]]$FilePath
  )

  # https://stackoverflow.com/questions/25779423/powershell-to-set-folder-permissions
  $Acl = Get-Acl $FilePath
  #$everyone = new SecurityIdentifier(WellKnownSidType.WorldSid, null)
  $Ar = New-Object System.Security.AccessControl.FileSystemAccessRule( "Everyone", "Read", "Allow")

  $Acl.SetAccessRule($Ar)
  Set-Acl $FilePath $Acl
  Write-Host "Enabled read permissions on $FilePath"
}

# entry point
if (($args.Count -lt 1) -or !(Test-Path $args[0])) {
  Write-Host "Usage: gencert.ps1 <outputDir>"
  Exit 5
}

$storeMy = "Cert:\LocalMachine\My"
$storeRoot = "Cert:\LocalMachine\Root"
$outputDir = Resolve-Path $args[0]
$hash = Get-Random
$tmpDir = "$Env:TEMP\$hash"
$keyDst = "$outputDir\gg-struggle-key.pem"
$certDst = "$outputDir\gg-struggle-cert.pem"

function Enable-Read {
  param (
    [string[]]$FilePath
  )

  # https://stackoverflow.com/questions/25779423/powershell-to-set-folder-permissions
  $Acl = Get-Acl $FilePath
  #$everyone = new SecurityIdentifier(WellKnownSidType.WorldSid, null)
  $Ar = New-Object System.Security.AccessControl.FileSystemAccessRule( "Everyone", "Read", "Allow")

  $Acl.SetAccessRule($Ar)
  Set-Acl $FilePath $Acl
  Write-Host "Enabled read permissions on $FilePath"
}

#$Env:OPENSSL_CONF="$Env:programfiles\OpenSSL-Win64\bin\openssl.cfg"
$Env:PATH="$Env:PATH;$Env:programfiles\OpenSSL-Win64\bin"

# i'm tired. just do a brute-force for openssl binaries
$openssl32_1 = "$Env:programfiles\OpenSSL-Win32\bin"  # C:\Program Files (x86)
$openssl32_2 = "$Env:ProgramW6432\OpenSSL-Win32\bin"  # C:\Program Files
$openssl64_1 = "$Env:programfiles\OpenSSL-Win64\bin"  # C:\Program Files (x86)
$openssl64_2 = "$Env:ProgramW6432\OpenSSL-Win64\bin"  # C:\Program Files

$Env:PATH="$Env:PATH;" + `
            ";$openssl32_1" + `
            ";$openssl32_2" + `
            ";$openssl64_1" + `
            ";$openssl64_2"

if (-Not (Get-Command openssl -errorAction SilentlyContinue)) {
  Write-Error "openssl is not found on PATH environment variable: $Env:Path"
  Write-Error "Can't generate key without openssl. Please install openssl-64 from https://slproweb.com/products/Win32OpenSSL.html . Aborting."
  Read-Host -Prompt "Press Enter to exit"
  Exit 69
}

# openssl must be installed on user's computer
openssl req `
  -x509 `
  -sha256 `
  -nodes `
  -days 365 `
  -newkey rsa:2048 `
  -keyout "$keyDst" `
  -out "$certDst" `
  -config localhost.cnf

Import-Certificate -FilePath "$certDst" -CertStoreLocation "$storeRoot"

Enable-Read $certDst
Enable-Read $keyDst
