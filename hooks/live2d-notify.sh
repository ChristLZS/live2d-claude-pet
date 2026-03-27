#!/bin/bash
# Claude Code Notification Hook - sends message to Live2D desktop pet
# This script is triggered by Claude Code's Notification event.
# It reads JSON from stdin, extracts the message, and sends it to the Live2D pet.

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Task completed!"')

PORT_FILE="$HOME/.live2d-pet/port"
PORT=$(cat "$PORT_FILE" 2>/dev/null || echo "21398")

# Build JSON payload safely using jq
PAYLOAD=$(jq -n --arg text "$MESSAGE" --argjson duration 8000 '{text: $text, duration: $duration}')

# Send message to Live2D pet (non-blocking)
printf '%s' "$PAYLOAD" | curl -s -X POST "http://127.0.0.1:${PORT}/show-message" \
  -H "Content-Type: application/json" \
  -d @- \
  --connect-timeout 2 \
  --max-time 3 > /dev/null 2>&1 &

exit 0
