# =============================================================================
# AI-Contabil — start.ps1
# Un singur script. Detecteaza IP-ul WiFi, actualizeaza configul, porneste tot.
#
# Rulare: .\start.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  AI-Contabil — pornire automata" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Detectare IP WiFi (adaptor real, nu Hyper-V / vEthernet / VirtualBox)
# -----------------------------------------------------------------------------
Write-Host "[1/4] Detectare IP WiFi..." -ForegroundColor Yellow

$ip = $null

# Cauta adaptorul cu IPv4 prin DHCP care NU e virtual
$candidate = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
    $_.PrefixOrigin -eq 'Dhcp' -and
    $_.IPAddress -notlike '169.254.*' -and
    $_.InterfaceAlias -notmatch 'vEthernet|WSL|VirtualBox|Loopback|Hyper-V'
} | Select-Object -First 1

if ($candidate) {
    $ip = $candidate.IPAddress
    Write-Host "    Detectat: $ip ($($candidate.InterfaceAlias))" -ForegroundColor Green
}

if (-not $ip) {
    Write-Host "    Nu am putut detecta IP-ul automat." -ForegroundColor Red
    $ip = Read-Host "    Introdu manual IP-ul WiFi al laptopului"
    if (-not $ip) {
        Write-Host "    Anulat." -ForegroundColor Red
        exit 1
    }
}

# -----------------------------------------------------------------------------
# 2. Actualizare fisiere .env
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/4] Actualizez configul..." -ForegroundColor Yellow

# Root .env — LAN_IP
$rootEnv = ".\.env"
if (Test-Path $rootEnv) {
    $content = Get-Content $rootEnv -Raw -Encoding UTF8
    $new = $content -replace '(?m)^LAN_IP=.*$', "LAN_IP=$ip"
    if ($new -eq $content -and $content -notmatch '(?m)^LAN_IP=') {
        $new = "$content`nLAN_IP=$ip"
    }
    Set-Content $rootEnv -Value $new -Encoding UTF8 -NoNewline
    Write-Host "    .env -> LAN_IP=$ip" -ForegroundColor Green
}

# Mobile .env — EXPO_PUBLIC_API_URL si EXPO_PUBLIC_WEB_URL
$mobileEnv = ".\frontend-mobile-aplication\.env"
if (Test-Path $mobileEnv) {
    $content = Get-Content $mobileEnv -Raw -Encoding UTF8
    $new = $content -replace 'http://[\d\.]+:(3777|5173|3778)', "http://${ip}:`$1"
    Set-Content $mobileEnv -Value $new -Encoding UTF8 -NoNewline
    Write-Host "    frontend-mobile-aplication\.env -> URL-uri actualizate" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 3. Firewall — permite porturi de dev pe Windows
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/4] Configurez Windows Firewall..." -ForegroundColor Yellow

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    $ruleName = "AI-Contabil dev (3777, 3778, 5173, 8081)"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort 3777, 3778, 5173, 8081 -Protocol TCP -Action Allow -Profile Any | Out-Null
        Write-Host "    Regula firewall creata." -ForegroundColor Green
    } else {
        Write-Host "    Regula firewall deja exista." -ForegroundColor Green
    }
} else {
    Write-Host "    SKIP (ai nevoie de PowerShell ca Admin pentru firewall)." -ForegroundColor DarkYellow
    Write-Host "    Daca telefonul nu se conecteaza: ruleaza scriptul ca Admin." -ForegroundColor DarkYellow
}

# -----------------------------------------------------------------------------
# 4. Pornire docker
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/4] Pornesc serviciile Docker..." -ForegroundColor Yellow

docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "EROARE: docker compose up a esuat." -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# Asteapta ca backend sa fie ready
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "Astept ca backend-ul sa fie ready..." -ForegroundColor Yellow

$maxWait = 60
$elapsed = 0
while ($elapsed -lt $maxWait) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3777/docs" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { break }
    } catch {
        # nu e ready inca
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "    ... ($elapsed s)" -ForegroundColor DarkGray
}

# -----------------------------------------------------------------------------
# Summary final
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  GATA! Aplicatia ruleaza." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Web:        http://localhost:5173" -ForegroundColor White
Write-Host "  API docs:   http://localhost:3777/docs" -ForegroundColor White
Write-Host "  AI docs:    http://localhost:3778/docs" -ForegroundColor White
Write-Host "  Mobile web: http://localhost:8081  (Expo Web)" -ForegroundColor White
Write-Host ""
Write-Host "  Pe telefon (Expo Go cu QR ngrok):" -ForegroundColor White
Write-Host "    docker logs -f ai_contabil_mobile" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Conturi de test:" -ForegroundColor White
Write-Host "    ADMIN        test@aicontabil.md         / Test1234!" -ForegroundColor DarkGray
Write-Host "    CONTABIL     contabil@aicontabil.md     / Contabil1234!" -ForegroundColor DarkGray
Write-Host "    RECEPTIONIST receptionist@aicontabil.md / Receptionist1234!" -ForegroundColor DarkGray
Write-Host "    CLIENT       client@aicontabil.md       / Client1234!" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Oprire: docker compose down" -ForegroundColor DarkGray
Write-Host ""
