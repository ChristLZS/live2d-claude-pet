# Live2D Claude Pet

A Live2D desktop pet that integrates with [Claude Code](https://claude.ai/code) — receive task notifications and chat with Claude directly through your desktop companion.

Built with Electron + [PixiJS](https://pixijs.com/) + [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display).

## Features

- 17 built-in Live2D characters (scroll to switch)
- **Chat with Claude** — type a question, get a streaming response in the speech bubble
- **Task notifications** — bubble pops up when Claude Code finishes a task
- Pixel-precise click-through (transparent areas don't block your desktop)
- Drag to move anywhere on screen
- Zoom in/out with Cmd/Ctrl + scroll
- Eyes follow your mouse cursor
- Click character to trigger random animations
- HTTP API for custom integrations
- System tray icon with quick actions

## Quick Start

### Requirements

- macOS
- Node.js >= 18
- [Claude Code](https://claude.ai/code) (for chat and hook integration)
- `jq` (for the hook script): `brew install jq`

### Install & Run

```bash
git clone https://github.com/ChristLZS/live2d-claude-pet.git
cd live2d-claude-pet
npm install
npm start
```

### Connect to Claude Code

Run the install script to register the notification hook:

```bash
./scripts/install-hook.sh
```

This will:
1. Copy the hook script to `~/.claude/hooks/`
2. Register a `Notification` hook in `~/.claude/settings.json`

After this, whenever Claude Code sends a notification (e.g. task completed), your desktop pet will show a message bubble!

### Manual Hook Setup

Add this to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/live2d-notify.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Then copy the hook script:

```bash
cp hooks/live2d-notify.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/live2d-notify.sh
```

## Usage

### Controls

| Action | Effect |
|--------|--------|
| **Type + Enter** | Send a question to Claude |
| **Escape** | Hide the response bubble |
| **Scroll wheel** | Switch character |
| **Cmd/Ctrl + Scroll** | Zoom in/out |
| **Left-click drag** | Move pet on screen |
| **Click character** | Trigger random animation |

### Chat with Claude

The input box at the bottom lets you chat with Claude directly:

1. Click the input box and type your question
2. Press **Enter** to send
3. A "Thinking..." animation appears while Claude is processing
4. The response streams in real-time in the speech bubble above the character
5. Long responses are scrollable; press **Escape** to dismiss

Under the hood, this runs `claude -p` (Claude Code's pipe mode) with your prompt.

### Task Notifications

When Claude Code finishes a task, a notification bubble automatically appears above the character's head. The bubble:
- Positions itself above the character regardless of model size or zoom level
- Auto-hides after 8 seconds
- Works with all 17 built-in characters

## Built-in Characters

### Official Live2D Samples
Senko (fox girl), Hiyori, Haru, Natori, Mao, Rice, Ren, Mark, Wanko

### Fox Hime Zero
Mori Miko (shrine maiden), Ruri Miko, Mori Suit

### Girls' Frontline
HK416, UMP45, WA2000, G11, AN94

## Adding Custom Models

Place your Cubism 3/4 model folder in `assets/models/`, then add an entry to the `MODELS` array in `src/renderer/app.js`:

```javascript
{ name: 'My Model', path: '/models/my_model/my_model.model3.json', scale: 0.3 },
```

Models must be Cubism 3/4 format (`.model3.json` + `.moc3`). Cubism 2 models are not supported.

## HTTP API

The pet runs a local HTTP server on port `21398`.

### Health Check

```bash
curl http://127.0.0.1:21398/health
```

### Show Message

```bash
curl -X POST http://127.0.0.1:21398/show-message \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "duration": 5000}'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Message to display (max 500 chars) |
| `duration` | number | No | Duration in ms (default: 8000, max: 30000) |

## Architecture

```
Claude Code (task done)
  -> Notification hook fires
    -> live2d-notify.sh reads stdin JSON
      -> curl POST to localhost:21398/show-message
        -> Electron main process receives request
          -> IPC to renderer
            -> Bubble appears above character's head

User types in input box
  -> IPC to main process
    -> spawn('claude', ['-p', prompt])
      -> stdout streams back via IPC
        -> Bubble updates in real-time
```

Key technical details:
- **Transparent click-through**: `gl.readPixels()` checks pixel alpha each frame — transparent areas pass clicks to desktop
- **Model rendering**: PixiJS WebGL + Live2D Cubism SDK Core + pixi-live2d-display
- **Bubble positioning**: reads `model.getBounds()` every frame to follow the character's head
- **Local models**: all model files served via Express (avoids CDN/SSL issues)

## Build

Package as a macOS `.dmg`:

```bash
npm run build
```

## Acknowledgements

- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) - Live2D rendering for PixiJS
- [PixiJS](https://pixijs.com/) - 2D WebGL renderer
- [Live2D Inc.](https://www.live2d.com/) - Live2D Cubism SDK
- [Eikanya/Live2d-model](https://github.com/Eikanya/Live2d-model) - Community model collection
- [Claude Code](https://claude.ai/code) - AI coding assistant

## License

MIT
