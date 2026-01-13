# Enhanced Force cleanup script for Windows
# Removes .next directory and build artifacts to fix file system issues
# Handles file locks and retries with better error handling

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next.js Build Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any Node processes that might be locking files
Write-Host "Step 1: Stopping Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Found $($nodeProcesses.Count) Node process(es)" -ForegroundColor Gray
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-Host "  ✓ Node processes stopped" -ForegroundColor Green
} else {
    Write-Host "  ✓ No Node processes running" -ForegroundColor Green
}

# Stop Next.js specific processes
Write-Host "Step 2: Checking for Next.js processes..." -ForegroundColor Yellow
$nextProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like "*next*" -or 
    $_.CommandLine -like "*next*" -or
    $_.MainWindowTitle -like "*next*"
} -ErrorAction SilentlyContinue
if ($nextProcesses) {
    Write-Host "  Found Next.js related processes" -ForegroundColor Gray
    $nextProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  ✓ Next.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "  ✓ No Next.js processes found" -ForegroundColor Green
}

# Remove .next directory with enhanced retry logic
Write-Host "Step 3: Removing .next directory..." -ForegroundColor Yellow
if (Test-Path .next) {
    $maxRetries = 5
    $retryCount = 0
    $success = $false
    
    while ($retryCount -lt $maxRetries -and -not $success) {
        try {
            # First, try to remove files individually to avoid locks
            $items = Get-ChildItem -Path .next -Recurse -Force -ErrorAction SilentlyContinue
            if ($items) {
                foreach ($item in $items) {
                    try {
                        Remove-Item -Path $item.FullName -Force -Recurse -ErrorAction SilentlyContinue
                    } catch {
                        # Ignore individual file errors, continue
                    }
                }
            }
            
            # Then remove the directory itself
            Remove-Item -Path .next -Force -Recurse -ErrorAction Stop
            Write-Host "  ✓ Successfully removed .next directory" -ForegroundColor Green
            $success = $true
        } catch {
            $retryCount++
            $errorMsg = $_.Exception.Message
            if ($retryCount -lt $maxRetries) {
                Write-Host "  ⚠ Retry $retryCount/$maxRetries - Waiting 3 seconds..." -ForegroundColor Yellow
                Write-Host "    Error: $errorMsg" -ForegroundColor Gray
                Start-Sleep -Seconds 3
            } else {
                Write-Host "  ✗ Failed to remove .next after $maxRetries attempts" -ForegroundColor Red
                Write-Host "    Error: $errorMsg" -ForegroundColor Red
                Write-Host "    Try: Close VS Code/Cursor, then run this script again" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "  ✓ .next directory doesn't exist" -ForegroundColor Green
}

# Remove build info files
Write-Host "Step 4: Removing build artifacts..." -ForegroundColor Yellow
$artifacts = @('tsconfig.tsbuildinfo', 'node_modules\.cache', '.next\cache')
$removed = 0
foreach ($artifact in $artifacts) {
    if (Test-Path $artifact) {
        try {
            Remove-Item -Force -Recurse $artifact -ErrorAction SilentlyContinue
            Write-Host "  ✓ Removed $artifact" -ForegroundColor Green
            $removed++
        } catch {
            Write-Host "  ⚠ Could not remove $artifact" -ForegroundColor Yellow
        }
    }
}
if ($removed -eq 0) {
    Write-Host "  ✓ No build artifacts found" -ForegroundColor Green
}

# Clear npm cache (optional but helpful)
Write-Host "Step 5: Clearing npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force 2>&1 | Out-Null
    Write-Host "  ✓ npm cache cleared" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not clear npm cache (non-critical)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host "  or" -ForegroundColor Gray
Write-Host "  npm run build" -ForegroundColor Cyan
Write-Host ""
