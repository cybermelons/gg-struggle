# Note: this must be run as admin!
# This script patches the hosts file so that
# 1. The game connects to gg-struggle via "ggst-game.guiltygear.com"
# 2. We can still connect to arcsys via "ggst-game-real.guiltygear.com"

# Install PsHosts for usability
if (Get-Module -ListAvailable -Name PsHosts) {
  Write-Host "PsHosts already installed. Continuing..."
}
else {
  Write-Host "PsHosts does not exist. Installing..."
  Install-Module PsHosts  # makes it easy to edit hosts file
}

$ggDummyName = "ggst-game-real.guiltygear.com"
$ggHostName = "ggst-game.guiltygear.com"

$dns = Resolve-DnsName -NoHostsFile "$ggHostName"

# add routes for arcsys
for ($i = 0; $i < $dns.length; $i++) {
  $address = $dns[$i].Address
  Write-Host "Adding $address $ggDummyName"
  Add-HostEntry "$ggDummyName" $address
}

# add routes for gg-struggle
Add-HostEntry "$ggHostName" 127.0.0.1