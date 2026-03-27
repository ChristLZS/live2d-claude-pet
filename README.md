# Live2D Claude Pet

A Live2D desktop pet that shows notification bubbles when [Claude Code](https://claude.ai/code) completes tasks.

Built with Electron + [PixiJS](https://pixijs.com/) + [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display).

## Features

- 17 built-in Live2D characters (scroll to switch)
- Notification bubble when Claude Code finishes a task
- Pixel-precise click-through (transparent areas don't block your desktop)
- Drag to move anywhere on screen
- Zoom in/out with Cmd/Ctrl + scroll
- Eyes follow your mouse cursor
- Click character to trigger random animations
- Simple HTTP API for custom integrations
- System tray icon with quick actions

## Quick Start

### Requirements

- macOS
- Node.js >= 18
- `jq` (for the hook script): `brew install jq`

### Install & Run

```bash
git clone https://github.com/user/live2d-claude-pet.git
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

## Controls

| Action | Effect |
|--------|--------|
| **Scroll wheel** | Switch character |
| **Cmd/Ctrl + Scroll** | Zoom in/out |
| **Left-click drag** | Move pet |
| **Click character** | Trigger random animation |

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
| `text` | string | Yes | Message to display |
| `duration` | number | No | Duration in ms (default: 8000) |

## How It Works

```
Claude Code (task done)
  -> Notification hook fires
    -> live2d-notify.sh reads stdin JSON
      -> curl POST to localhost:21398/show-message
        -> Electron main process receives request
          -> IPC to renderer
            -> Message bubble appears above character's head
```

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
