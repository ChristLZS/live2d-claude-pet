const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onShowMessage: (callback) => {
    ipcRenderer.removeAllListeners('show-message');
    ipcRenderer.on('show-message', (_event, data) => callback(data));
  },
  setIgnoreMouse: (ignore) => {
    ipcRenderer.send('set-ignore-mouse', ignore);
  },
  startDrag: () => {
    ipcRenderer.send('start-drag');
  },
  stopDrag: () => {
    ipcRenderer.send('stop-drag');
  },
  // Claude chat
  sendPrompt: (prompt) => {
    ipcRenderer.send('claude-prompt', prompt);
  },
  onClaudeChunk: (callback) => {
    ipcRenderer.removeAllListeners('claude-chunk');
    ipcRenderer.on('claude-chunk', (_event, data) => callback(data));
  },
  onClaudeDone: (callback) => {
    ipcRenderer.removeAllListeners('claude-done');
    ipcRenderer.on('claude-done', (_event, data) => callback(data));
  },
  onClaudeError: (callback) => {
    ipcRenderer.removeAllListeners('claude-error');
    ipcRenderer.on('claude-error', (_event, data) => callback(data));
  },
});
