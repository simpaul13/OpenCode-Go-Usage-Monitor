#!/usr/bin/env bash
# ============================================================
# Packages the extension into a clean .zip file for import into
# Brave / Chrome / Edge via "Load unpacked".
#
# Usage:
#   ./scripts/package.sh                  # uses manifest version
#   ./scripts/package.sh -v 3.9           # explicit version
#   ./scripts/package.sh -o ./dist        # custom output dir
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/manifest.json"
OUTPUT_DIR="${ROOT}/releases"
VERSION=""

while getopts "v:o:" opt; do
  case "$opt" in
    v) VERSION="$OPTARG" ;;
    o) OUTPUT_DIR="$OPTARG" ;;
    *) echo "Usage: $0 [-v version] [-o output_dir]" >&2; exit 1 ;;
  esac
done

# Read version from manifest if not provided
if [ -z "$VERSION" ]; then
  if command -v python3 &>/dev/null; then
    VERSION=$(python3 -c "import json; print(json.load(open('$MANIFEST'))['version'])")
  elif command -v node &>/dev/null; then
    VERSION=$(node -e "console.log(require('$MANIFEST').version)")
  else
    echo "ERROR: need -v flag or python3/node to extract version from manifest" >&2
    exit 1
  fi
fi

ZIP_NAME="opencode-go-usage-monitor-v${VERSION}.zip"
ZIP_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

mkdir -p "$OUTPUT_DIR"

# Clean any previous build
rm -f "$ZIP_PATH"

echo "Packaging ${ZIP_NAME} ..."

# Create zip with only the required files
cd "$ROOT"
zip -r "$ZIP_PATH" \
  manifest.json \
  icons/icon-48.png \
  icons/icon-128.png \
  content_scripts/calculation.js \
  content_scripts/analyzer.js \
  content_scripts/ui.js \
  content_scripts/main.js

echo "✔ Created: ${ZIP_PATH}"
echo "  Size: $(du -h "$ZIP_PATH" | cut -f1)"
