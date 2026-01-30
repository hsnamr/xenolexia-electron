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

  // Menu actions (callback receives event, action)
  onMenuAction: callback => {
    ipcRenderer.on('menu-import-book', (e) => callback(e, 'menu-import-book'));
    ipcRenderer.on('menu-about', (e) => callback(e, 'menu-about'));
    ipcRenderer.on('menu-search-books', (e) => callback(e, 'menu-search-books'));
    ipcRenderer.on('menu-statistics', (e) => callback(e, 'menu-statistics'));
    ipcRenderer.on('menu-settings', (e) => callback(e, 'menu-settings'));
  },

  // File dialog
  showOpenDialog: options => {
    return ipcRenderer.invoke('dialog:showOpenDialog', options);
  },

  showSaveDialog: options => {
    return ipcRenderer.invoke('dialog:showSaveDialog', options);
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

  dbInvoke: (method, ...args) => {
    return ipcRenderer.invoke('db:invoke', method, ...args);
  },

  // Directory operations
  readDir: (dirPath) => {
    return ipcRenderer.invoke('file:readDir', dirPath);
  },

  unlink: (filePath) => {
    return ipcRenderer.invoke('file:unlink', filePath);
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
