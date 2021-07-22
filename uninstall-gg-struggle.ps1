# uninstalls gg-struggle. run this as admin please
#
Unblock-File tools/rmcert.ps1
Unblock-File tools/rmHosts.ps1

.\tools\rmcert.ps1
.\tools\rmHosts.ps1

Write-Host "Uninstalled gg-struggle. Press enter to continue"
Read-Host -Prompt ">"
