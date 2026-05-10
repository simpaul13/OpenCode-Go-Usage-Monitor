<#
.SYNOPSIS
    Packages the extension into a clean .zip file for browser import.
.DESCRIPTION
    Creates a release-ready .zip containing only the files needed to
    load the extension in Brave/Chrome/Edge via "Load unpacked".
.PARAMETER OutputDir
    Directory where the .zip will be written. Defaults to "releases".
.PARAMETER Version
    Version string for the filename. If omitted, reads from manifest.json.
.EXAMPLE
    .\scripts\package.ps1
    .\scripts\package.ps1 -OutputDir .\dist -Version "3.9"
#>

param(
    [string]$OutputDir = (Join-Path (Get-Location) "releases"),
    [string]$Version = ""
)

# Resolve root (the repo root, where manifest.json lives)
$Root = Split-Path -Parent $PSScriptRoot
$ManifestPath = Join-Path $Root "manifest.json"

if (-not (Test-Path $ManifestPath)) {
    Write-Error "manifest.json not found at $ManifestPath"
    exit 1
}

# Extract version from manifest if not provided
if (-not $Version) {
    $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
    $Version = $Manifest.version
}

$OutputDir = Resolve-Path $OutputDir -ErrorAction SilentlyContinue
if (-not $OutputDir) {
    $OutputDir = New-Item -ItemType Directory -Path $OutputDir -Force | Select-Object -ExpandProperty FullName
}

$ZipName = "opencode-go-usage-monitor-v${Version}.zip"
$ZipPath = Join-Path $OutputDir $ZipName

# Files to include
$Include = @(
    "manifest.json"
    "LICENSE"
    "README.md"
    "icons/icon-48.png"
    "icons/icon-128.png"
    "content_scripts/calculation.js"
    "content_scripts/analyzer.js"
    "content_scripts/ui.js"
    "content_scripts/main.js"
)

Write-Host "Packaging $ZipName ..." -ForegroundColor Cyan

# Remove existing zip if present
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# Create a temporary staging folder
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) "opencode-extension-$(Get-Random)"
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    # Copy files preserving directory structure
    foreach ($file in $Include) {
        $src = Join-Path $Root $file
        $dst = Join-Path $TempDir $file
        $parent = Split-Path -Parent $dst
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        Copy-Item $src $dst
    }

    # Create the zip
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($TempDir, $ZipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

    Write-Host "✔ Created: $ZipPath" -ForegroundColor Green
    Write-Host "  Size: $([math]::Round((Get-Item $ZipPath).Length / 1KB)) KB" -ForegroundColor Gray
}
finally {
    # Cleanup temp directory
    if (Test-Path $TempDir) {
        Remove-Item $TempDir -Recurse -Force
    }
}
