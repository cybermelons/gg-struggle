# Note: this must be run as admin!
#
# This script removes any references to "...guiltygear.com"

if (Get-Module -ListAvailable -Name PsHosts) {
  Write-Host "PsHosts already installed. Continuing..."
}
else {
  Write-Host "PsHosts does not exist. Installing..."
  Install-Module PsHosts  # makes it easy to edit hosts file
}

Remove-HostEntry *.guiltygear.com
