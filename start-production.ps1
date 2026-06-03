# Crossyarn Production Start Script
# Starts Next.js standalone server and Caddy reverse proxy

$ErrorActionPreference = "Stop"

Write-Host "Starting Crossyarn production servers..." -ForegroundColor Cyan
Write-Host ""

# Start Next.js standalone production server on port 3000
$nextJob = Start-Job -ScriptBlock {
    Set-Location "C:\ProG\MAMA\Crossyarn"
    $env:PORT = "3000"
    $env:HOSTNAME = "0.0.0.0"
    node .next/standalone/server.js
}

# Start Caddy (auto-provisions SSL via Let's Encrypt)
$caddyJob = Start-Job -ScriptBlock {
    Set-Location "C:\ProG\MAMA\Crossyarn"
    .\caddy\caddy.exe run --config Caddyfile
}

Write-Host "  Next.js:  http://localhost:3000" -ForegroundColor Green
Write-Host "  Caddy:    https://crossyarn.online" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers." -ForegroundColor Yellow
Write-Host ""

# Wait and relay output
try {
    while ($true) {
        Receive-Job $nextJob -ErrorAction SilentlyContinue
        Receive-Job $caddyJob -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "`nShutting down..." -ForegroundColor Red
    Stop-Job $nextJob, $caddyJob -ErrorAction SilentlyContinue
    Remove-Job $nextJob, $caddyJob -Force -ErrorAction SilentlyContinue
}
