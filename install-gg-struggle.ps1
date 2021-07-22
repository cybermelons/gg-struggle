# installs gg-struggle. run this as admin from gg-struggle root dir please.

Unblock-File tools\gencert.ps1
Unblock-File tools\patchHosts.ps1

.\tools\gencert.ps1 .
.\tools\patchHosts.ps1

npm install

Write-Host "Installed gg-struggle. Press enter to continue"
Read-Host -Prompt ">"
