const {contextBridge, ipcRenderer} = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,

  // Menu actions
  onMenuAction: callback => {
    ipcRenderer.on('menu-import-book', callback);
    ipcRenderer.on('menu-about', callback);
  },
});
