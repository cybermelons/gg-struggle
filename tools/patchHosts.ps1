# Note: this must be run as admin!
# This script patches the hosts file so that guilty gear connects to our proxy
# instead of the real servers

# Install PsHosts for usability
if (Get-Module -ListAvailable -Name PsHosts) {
  Write-Host "PsHosts already installed. Continuing..."
}
else {
  Write-Host "PsHosts does not exist. Installing..."
  Install-Module PsHosts  # makes it easy to edit hosts file
}

$ggHostName = "ggst-game.guiltygear.com"

# add routes for gg-struggle
Add-HostEntry -Force "$ggHostName" 127.0.0.1
