# NOTE: This must be run as admin!


# Install cert from the My store into Root store
function Remove-Gg-Certs {
  param (
    [string[]]$StorePath
  )

  Foreach ($cert in Get-ChildItem $StorePath ` | where{$_.Subject -eq "CN=ggst-game.guiltygear.com"}) {
    $certId = $cert.Thumbprint
    Remove-Item -path $StorePath\$certId
    Write-Host "Removed $StorePath\$certId "
  }
}

Remove-Gg-Certs -StorePath "Cert:\LocalMachine\My"
Remove-Gg-Certs -StorePath "Cert:\LocalMachine\Root"
