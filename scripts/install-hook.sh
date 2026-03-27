#!/bin/bash
# Install Claude Code hook for Live2D desktop pet notifications
set -e

# Clean up temp files on exit
_TEMP_FILE=""
trap '[[ -n "$_TEMP_FILE" && -f "$_TEMP_FILE" ]] && rm -f "$_TEMP_FILE"' EXIT

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
HOOK_SRC="$PROJECT_DIR/hooks/live2d-notify.sh"
HOOK_DST="$HOME/.claude/hooks/live2d-notify.sh"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "=== Live2D Claude Pet - Hook Installer ==="
echo ""

# Check dependencies
for cmd in jq curl; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: '$cmd' is required but not found. Install it first."
    echo "  brew install $cmd"
    exit 1
  fi
done

# Create hooks directory
mkdir -p "$HOME/.claude/hooks"

# Copy hook script
cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST"
echo "[OK] Hook script installed to $HOOK_DST"

# Update Claude Code settings
if [ ! -f "$SETTINGS_FILE" ]; then
  echo '{}' > "$SETTINGS_FILE"
fi

# Check if Notification hook already exists
if jq -e '.hooks.Notification' "$SETTINGS_FILE" > /dev/null 2>&1; then
  echo "[SKIP] Notification hook already configured in settings.json"
  echo "       If you want to re-install, remove the Notification hook entry first."
else
  # Add the hook configuration
  _TEMP_FILE=$(mktemp)
  jq '.hooks = (.hooks // {}) | .hooks.Notification = [{
    "hooks": [{
      "type": "command",
      "command": "bash ~/.claude/hooks/live2d-notify.sh",
      "timeout": 5
    }]
  }]' "$SETTINGS_FILE" > "$_TEMP_FILE" && mv "$_TEMP_FILE" "$SETTINGS_FILE"
  _TEMP_FILE=""
  echo "[OK] Claude Code Notification hook registered in settings.json"
fi

echo ""
echo "Done! Make sure the Live2D pet app is running, then Claude Code"
echo "will send notifications to your desktop pet."
echo ""
echo "To start the pet:  cd $PROJECT_DIR && npm start"
