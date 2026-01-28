const {contextBridge, ipcRenderer, shell} = require('electron');
const fs = require('fs').promises;
const path = require('path');

// Log that preload script is loading
console.log('Preload script loading...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,

  // Menu actions
  onMenuAction: callback => {
    ipcRenderer.on('menu-import-book', callback);
    ipcRenderer.on('menu-about', callback);
    ipcRenderer.on('menu-search-books', callback);
    ipcRenderer.on('menu-statistics', callback);
    ipcRenderer.on('menu-settings', callback);
  },

  // File dialog
  showOpenDialog: options => {
    return ipcRenderer.invoke('dialog:showOpenDialog', options);
  },

  // File operations
  readFile: filePath => {
    return ipcRenderer.invoke('file:readFile', filePath);
  },

  readFileText: filePath => {
    return ipcRenderer.invoke('file:readFileText', filePath);
  },

  writeFile: (filePath, content) => {
    return ipcRenderer.invoke('file:writeFile', filePath, content);
  },

  fileExists: filePath => {
    return ipcRenderer.invoke('file:exists', filePath);
  },

  getAppDataPath: () => {
    return ipcRenderer.invoke('app:getPath', 'userData');
  },

  getBooksDirectory: () => {
    return ipcRenderer.invoke('app:getBooksDirectory');
  },

  // Open external URL
  openExternal: (url) => {
    shell.openExternal(url);
  },
});

  console.log('Electron API exposed successfully');
} catch (error) {
  console.error('Failed to expose Electron API:', error);
}
