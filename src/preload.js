const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onShowMessage: (callback) => {
    // Remove any previous listener before registering a new one to prevent leaks
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
});
