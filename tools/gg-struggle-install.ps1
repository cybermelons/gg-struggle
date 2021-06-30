#Unblock-File -Path .\ggstproxy-install.ps1

# TODO: Resolve IP via DNS
$proxyIp = "144.217.72.171"
$hostProxyString = "$hostProxyString ggst-game.guiltygear.com"
$certThumbprint

function Install-GgstProxy {
    if(Test-Connection $proxyIp -Quiet -Count 1)
    {
        Add-Content -Encoding UTF8  C:\Windows\system32\drivers\etc\hosts $hostProxyString
    }
    else
    {
        Write-Error "Failed to connect to host $proxyIp"
    }

    # Install Cert
    $p12 = new-object System.Security.Cryptography.X509Certificates.X509Certificate2
    $certPath = "./ggwin.p12" # TODO: this is if you're in the same directory, but we can resolve this later
    $pfxPass = ""
    $p12.Import($certPath,$pfxPass,"Exportable,PersistKeySet")

    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store([System.Security.Cryptography.X509Certificates.StoreName]::Root,"LocalMachine")
    $store.Open("MaxAllowed")
    $store.Add($pfx)
    $store.Close()
}

function Uninstall-GgstProxy
{
    $op = (Get-Content C:\Windows\system32\drivers\etc\hosts) | Where-Object { $_ -ne $hostProxyString}
    Write-Output $op | Out-File -Encoding UTF8 C:\Windows\system32\drivers\etc\hosts

    # Uninstall Cert
    $p12 = new-object System.Security.Cryptography.X509Certificates.X509Certificate2
    $certPath = "./ggwin.p12" # this is if you're in the same directory, but we can resolve this later #TODO
    $pfxPass = ""
    $p12.Import($certPath,$pfxPass,"Exportable,PersistKeySet")

    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store([System.Security.Cryptography.X509Certificates.StoreName]::Root,"LocalMachine")
    $store.Open("MaxAllowed")
    $store.Remove($p12)
    $store.Close()
}


while {
    Write-Host '1. Install GgstProxy';
    Write-Host '2. Uninstall GgstProxy';
    Write-Host '3. Exit';
    $input = Read-Host

    switch($input)
    {
        "1" {Install-GgstProxy}
        "2" {Uninstall-GgstProxy}
        "3" {break}
    }
}

Write-Host -NoNewLine "Press any key to continue...";
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown");
