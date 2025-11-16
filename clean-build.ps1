# Force cleanup script for Windows
# Removes .next directory and build artifacts to fix file system issues

Write-Host "Starting cleanup..." -ForegroundColor Yellow

# Stop any Node processes that might be locking files
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping Node processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Remove .next directory with retry logic
if (Test-Path .next) {
    Write-Host "Removing .next directory..." -ForegroundColor Yellow
    $retries = 3
    while ($retries -gt 0) {
        try {
            Remove-Item -Recurse -Force .next -ErrorAction Stop
            Write-Host "Successfully removed .next" -ForegroundColor Green
            break
        } catch {
            $retries--
            if ($retries -gt 0) {
                Write-Host "Retry $retries remaining, waiting..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            } else {
                Write-Host "Failed to remove .next after retries. You may need to close other programs." -ForegroundColor Red
            }
        }
    }
}

# Remove build info files
if (Test-Path tsconfig.tsbuildinfo) {
    Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
    Write-Host "Removed tsconfig.tsbuildinfo" -ForegroundColor Green
}

# Clear Next.js cache
if (Test-Path node_modules/.cache) {
    Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
    Write-Host "Cleared Next.js cache" -ForegroundColor Green
}

Write-Host "Cleanup complete!" -ForegroundColor Green



