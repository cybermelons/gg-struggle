#Unblock-File -Path .\ggstproxy-install.ps1

# TODO: Resolve IP via DNS
$proxyIp = "144.217.72.171"
$mainHost = "ggst-game.guiltygear.com"
$hostProxyString = "$proxyIp $mainHost"
$certPath = "./certs/ggstruggle-cert.pem" # TODO: this is if you're in the same directory, but we can resolve this later
$certThumbprint

function Install-GgstProxy {
    Write-Host 'Testing connection to $proxyIp...';
    if(Test-Connection $proxyIp -Quiet -Count 1)
    {
        Write-Host "Successfully connected."
        Write-Host "Installing hostfile map for $mainHost"
        Add-Content -Encoding UTF8  C:\Windows\system32\drivers\etc\hosts $hostProxyString

        Write-Host "Opening certificate file $certPath";
        #$p12 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
        $p12 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2Collection
        $certPath = $certPath
        $pfxPass = ""
        $p12.Import($certPath,$pfxPass,"Exportable,PersistKeySet")

        Write-Host "Installing Cert $certPath certificate to trusted store.";
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store([System.Security.Cryptography.X509Certificates.StoreName]::Root,"LocalMachine")
        $store.Open("MaxAllowed")

        #$store.Add($p12)
        $store.AddRange($p12)
        $store.Close()

        Write-Host 'Cert installed.';
    }
    else
    {
        Write-Error "Failed to connect to host $proxyIp"
    }
}

function Uninstall-GgstProxy
{
    Write-Host "Removing hostfile map for $mainHost"
    $op = (Get-Content C:\Windows\system32\drivers\etc\hosts) | Where-Object { $_ -ne $hostProxyString}
    Write-Output $op | Out-File -Encoding UTF8 C:\Windows\system32\drivers\etc\hosts

    Write-Host "Removing certificate $certPath"
    #$p12 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
    $p12 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2Collection
    $certPath = $certPath
    $pfxPass = ""
    $p12.Import($certPath,$pfxPass,"Exportable,PersistKeySet")

    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store([System.Security.Cryptography.X509Certificates.StoreName]::Root,"LocalMachine")
    $store.Open("MaxAllowed")
    #$store.Remove($p12)
    $store.RemoveRange($p12)
    $store.Close()
}

$end = $false;
while (!($end)) {
    Write-Host '1. Install GgstProxy';
    Write-Host '2. Uninstall GgstProxy';
    Write-Host '3. Exit';
    $input = Read-Host

    switch($input)
    {
        "1" {Install-GgstProxy}
        "2" {Uninstall-GgstProxy}
        "3" {$end = $true}
    }
}

Write-Host -NoNewLine "Press any key to continue...";
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown");
