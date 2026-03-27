const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 21398;
const PORT_FILE = path.join(os.homedir(), '.live2d-pet', 'port');

let mainWindow = null;
let tray = null;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 850,
    x: screenWidth - 920,
    y: screenHeight - 870,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}/app/index.html`);

  // Default: ignore all mouse events, renderer will toggle per-pixel
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, '..', 'assets', 'tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Pet',
      click: () => {
        if (mainWindow) mainWindow.show();
      },
    },
    {
      label: 'Test Message',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('show-message', {
            text: 'This is a test message!',
            duration: 5000,
          });
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);
  tray.setToolTip('Live2D Claude Pet');
  tray.setContextMenu(contextMenu);
}

function startHttpServer(callback) {
  const server = express();
  server.use(express.json());

  server.use('/models', express.static(path.join(__dirname, '..', 'assets', 'models')));
  server.use('/app', express.static(path.join(__dirname, 'renderer')));

  server.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  server.post('/show-message', (req, res) => {
    const { text, duration } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string' });
    }
    if (text.length > 500) {
      return res.status(400).json({ error: 'text exceeds maximum length of 500 characters' });
    }
    const safeDuration = typeof duration === 'number' && duration > 0 && duration <= 30000
      ? duration
      : 8000;
    if (mainWindow) {
      mainWindow.webContents.send('show-message', { text, duration: safeDuration });
      res.json({ success: true });
    } else {
      res.status(503).json({ error: 'window not ready' });
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Live2D Pet HTTP server listening on http://127.0.0.1:${PORT}`);
    writePortFile();
    if (callback) callback();
  });
}

function writePortFile() {
  const dir = path.dirname(PORT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PORT_FILE, String(PORT));
}

function cleanupPortFile() {
  try {
    if (fs.existsSync(PORT_FILE)) fs.unlinkSync(PORT_FILE);
  } catch (_e) { /* ignore */ }
}

// Pixel-precise mouse hit testing from renderer
ipcMain.on('set-ignore-mouse', (_event, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// Drag window by mouse movement delta
let dragging = false;
let dragStartMouse = null;
let dragStartBounds = null;

ipcMain.on('start-drag', () => {
  if (!mainWindow) return;
  dragging = true;
  dragStartMouse = screen.getCursorScreenPoint();
  dragStartBounds = mainWindow.getBounds();
});

// Poll mouse position while dragging
function pollDrag() {
  if (!dragging || !mainWindow) return;
  const cursor = screen.getCursorScreenPoint();
  const dx = cursor.x - dragStartMouse.x;
  const dy = cursor.y - dragStartMouse.y;
  mainWindow.setBounds({
    x: dragStartBounds.x + dx,
    y: dragStartBounds.y + dy,
    width: dragStartBounds.width,
    height: dragStartBounds.height,
  });
}

const dragPollInterval = setInterval(pollDrag, 16); // ~60fps

ipcMain.on('stop-drag', () => {
  dragging = false;
});

app.whenReady().then(() => {
  startHttpServer(() => {
    createWindow();
    createTray();
  });
});

app.on('window-all-closed', () => {
  cleanupPortFile();
  app.quit();
});

app.on('before-quit', () => {
  clearInterval(dragPollInterval);
  cleanupPortFile();
});
