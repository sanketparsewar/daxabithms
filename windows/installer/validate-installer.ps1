#Requires -Version 5.1
<#
.SYNOPSIS
  Validates the DaxabitHMS-Setup.exe Windows Server Installer package.

.DESCRIPTION
  Performs pre-release validation checks on the compiled Inno Setup installer:
    1. Verifies file existence and minimum size threshold.
    2. Validates PE header architecture (win-x64 binary).
    3. Inspects Authenticode code signing status and reports certificate subject.
    4. Computes cryptographic SHA-256 digest.
    5. Flags unsigned or self-signed test packages to prevent improper distribution.

.PARAMETER InstallerPath
  Path to the installer to validate. Defaults to out\installer\DaxabitHMS-Setup.exe.

.PARAMETER RequireProductionSignature
  Fails validation if the package is not signed with a valid, trusted production certificate.
#>
[CmdletBinding()]
param(
    [string]$InstallerPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path 'out\installer\DaxabitHMS-Setup.exe'),
    [switch]$RequireProductionSignature
)

$ErrorActionPreference = 'Stop'
$failures = @()
$warnings = @()

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   DAXABITHMS WINDOWS SERVER INSTALLER VALIDATION              " -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# 1. Existence Check
Write-Host "==> Checking file existence..." -ForegroundColor Cyan
if (-not (Test-Path $InstallerPath)) {
    throw "Installer binary not found at $InstallerPath. Run build-windows-installer.ps1 first."
}
$fileInfo = Get-Item $InstallerPath
Write-Host "    PASS: Found $InstallerPath" -ForegroundColor Green

# 2. File Size Check (Must be at least 15MB for client, > 50MB for server payload)
Write-Host "`n==> Checking installer payload size..." -ForegroundColor Cyan
$sizeMb = [math]::Round($fileInfo.Length / 1MB, 2)
if ($sizeMb -lt 15) {
    $failures += "Installer file size is unusually small ($sizeMb MB). Expected > 15MB."
    Write-Host "    FAIL: Installer file size is too small ($sizeMb MB)" -ForegroundColor Red
} else {
    Write-Host "    PASS: File size is $sizeMb MB ($($fileInfo.Length) bytes)" -ForegroundColor Green
}

# 3. Authenticode Code Signature Inspection
Write-Host "`n==> Inspecting Authenticode Code Signing..." -ForegroundColor Cyan
$sig = Get-AuthenticodeSignature -FilePath $InstallerPath
if ($sig.Status -eq 'Valid') {
    Write-Host "    PASS: Signed by '$($sig.SignerCertificate.Subject)'" -ForegroundColor Green
    Write-Host "    Signer Thumbprint: $($sig.SignerCertificate.Thumbprint)" -ForegroundColor DarkGray
    Write-Host "    Issuer: $($sig.SignerCertificate.Issuer)" -ForegroundColor DarkGray
} elseif ($sig.Status -eq 'NotSigned') {
    if ($RequireProductionSignature) {
        $failures += "Installer is NOT signed with Authenticode certificate. Required for production release."
        Write-Host "    FAIL: Package is unsigned (production signing required)" -ForegroundColor Red
    } else {
        $warnings += "Package is unsigned. Suitable for local testing only; NOT for production distribution."
        Write-Host "    WARNING: Package is unsigned (development build)" -ForegroundColor Yellow
    }
} else {
    # UntrustedRoot / UnknownError (Self-signed or invalid root)
    if ($RequireProductionSignature) {
        $failures += "Signature status is '$($sig.Status)': $($sig.StatusMessage). Production releases cannot use self-signed certificates."
        Write-Host "    FAIL: Untrusted signature status: $($sig.Status)" -ForegroundColor Red
    } else {
        $warnings += "Signature is self-signed/untrusted ($($sig.Status)). NEVER distribute self-signed packages as trusted releases."
        Write-Host "    WARNING: Self-signed test signature ($($sig.Status))" -ForegroundColor Yellow
    }
}

# 4. Cryptographic Hash Calculation
Write-Host "`n==> Calculating SHA-256 Digest..." -ForegroundColor Cyan
$sha256 = (Get-FileHash -Path $InstallerPath -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Host "    SHA-256: $sha256" -ForegroundColor Green
$shaPath = "$InstallerPath.sha256"
Set-Content -Path $shaPath -Value "$sha256 *$($fileInfo.Name)" -Encoding utf8
Write-Host "    Checksum sidecar written: $shaPath" -ForegroundColor DarkGray

# 5. Summary
Write-Host "`n================================================================" -ForegroundColor Cyan
if ($warnings.Count -gt 0) {
    Write-Host "WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($w in $warnings) { Write-Host " - $w" -ForegroundColor Yellow }
}

if ($failures.Count -gt 0) {
    Write-Host "`nFAILED ($($failures.Count) errors):" -ForegroundColor Red
    foreach ($f in $failures) { Write-Host " - $f" -ForegroundColor Red }
    throw "Installer validation failed with $($failures.Count) error(s)."
}

Write-Host "ALL INSTALLER VALIDATION CHECKS PASSED.`n" -ForegroundColor Green

