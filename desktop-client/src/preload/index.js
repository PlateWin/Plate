const { contextBridge, ipcRenderer } = require('electron')

// Expose safe APIs to renderer via contextBridge
contextBridge.exposeInMainWorld('plateAPI', {
  // Window control (for custom titlebar)
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose:    () => ipcRenderer.send('window:close'),

  // Platform info
  platform: process.platform,
})
