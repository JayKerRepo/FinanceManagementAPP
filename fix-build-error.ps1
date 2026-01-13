# Quick fix for Next.js build errors on Windows
# Use this when you get "UNKNOWN: unknown error, open 'pages-manifest.json'"

Write-Host "Quick Fix: Next.js Build Error" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Stop Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✓ Stopped Node processes" -ForegroundColor Green
} else {
    Write-Host "✓ No Node processes running" -ForegroundColor Green
}

# Quick cleanup
Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
if (Test-Path .next) {
    try {
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host "✓ Removed .next directory" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not remove .next (may be locked)" -ForegroundColor Yellow
        Write-Host "  Try running: npm run clean:windows" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ .next directory doesn't exist" -ForegroundColor Green
}

if (Test-Path tsconfig.tsbuildinfo) {
    Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
    Write-Host "✓ Removed tsconfig.tsbuildinfo" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! You can now run:" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""

