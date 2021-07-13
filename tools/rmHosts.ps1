# Note: this must be run as admin!
#
# This script removes any references to "...guiltygear.com"

Install-Module PsHosts  # makes it easy to edit hosts file

Remove-HostEntry *.guiltygear.com
