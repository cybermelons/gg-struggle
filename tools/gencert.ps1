# NOTE: This must be run as admin!

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


#function Gen-Cert {
#  param (
#    [string] $Key,
#    [string] $Cert
#  )
#
#  $cert2=Get-ChildItem Cert:\LocalMachine\my |
#  Where-Object { $_.FriendlyName -match $friendlyName }
#
# # $path = ‘cert:\localMachine\my\’ + $cert2.thumbprint
#  Export-Certificate -cert $genCert -FilePath $tmpDir\cert.der -type CERT –noclobber | Out-Null
#  certutil -encode $tmpDir\cert.der $Cert | Out-Null
#}
#
#$Env:OPENSSL_CONF="$Env:ProgramFiles\OpenSSL-Win64\bin\openssl.cfg"
$Env:PATH="$Env:PATH;$Env:ProgramFiles\OpenSSL-Win64\bin"

if (-Not (Get-Command openssl -errorAction SilentlyContinue)) {
  Write-Error "openssl is not found on PATH environment variable: $Env:Path"
  Write-Error "Can't generate key without openssl. Please install openssl-64 from https://slproweb.com/products/Win32OpenSSL.html . Aborting."
  Exit 1
}

openssl req `
  -x509 `
  -sha256 `
  -nodes `
  -days 365 `
  -newkey rsa:2048 `
  -keyout $keyDst `
  -out $certDst `
  -config localhost.cnf

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


# https://stackoverflow.com/questions/65083411/creating-pem-file-through-powershell


# Generate self-signed cert, and key
# Move key to output directory as "gg-struggle.key"

# Install cert from the My store into Root store
#$certId = $cert.Thumbprint
#Move-Item -path $storeMy\$certId -Destination $storeRoot
#Write-Host "Installed $storeRoot\$certId to $storeRoot "

$CertStore = New-Object System.Security.Cryptography.X509Certificates.X509Store  -ArgumentList  "Cert:", "LocalMachine"

$CertStore.Open('ReadWrite')
Import-Certificate -FilePath "$certDst" -CertStoreLocation "$storeRoot"

Enable-Read $certDst
Enable-Read $keyDst
