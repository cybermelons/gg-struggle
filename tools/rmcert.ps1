# NOTE: This must be run as admin!

$storeMy = "Cert:\LocalMachine\My"
$storeRoot = "Cert:\LocalMachine\Root"

$certs = Get-ChildItem $storeRoot `
 | where{$_.Subject -eq "CN=ggst-game.guiltygear.com"}

# Install cert from the My store into Root store
Foreach ($cert in $certs) {
  $certId = $cert.Thumbprint
  Remove-Item -path $storeRoot\$certId
  Write-Host "Removed $storeRoot\$certId from the root certs"
}
