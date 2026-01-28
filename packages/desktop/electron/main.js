const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      sandbox: false, // Disable sandbox for Linux compatibility
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
  });

  // Load the app from built files (both dev and production use built files)
  // When packaged, dist is in resources/dist relative to the app
  const htmlPath = app.isPackaged
    ? path.join(process.resourcesPath, 'dist', 'index.html')
    : path.join(__dirname, '../../dist/index.html');
  
  // Verify preload script exists
  const preloadPath = path.join(__dirname, 'preload.js');
  fs.access(preloadPath)
    .then(() => {
      console.log('Preload script found at:', preloadPath);
    })
    .catch((err) => {
      console.error('Preload script not found at:', preloadPath);
      console.error('Error:', err);
    });
  
  mainWindow.loadFile(htmlPath).catch((err) => {
    console.error('Failed to load file:', err);
    // Show error in window
    mainWindow.loadURL(`data:text/html,<html><body style="font-family: sans-serif; padding: 20px;"><h1>Build Not Found</h1><p>Failed to load ${htmlPath}</p><p>Please run: <code>npm run build:assets</code> first</p></body></html>`);
  });

  // Verify electronAPI is available after page loads
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      if (window.electronAPI) {
        console.log('Electron API is available');
      } else {
        console.error('Electron API is NOT available - preload script may have failed to load');
      }
    `).catch(err => console.error('Failed to check electronAPI:', err));
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Focus on window creation
    if (isDev) {
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function setupIpcHandlers() {
  // File dialog
  ipcMain.handle('dialog:showOpenDialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      ...options,
      title: 'Select Ebook File',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const stats = await fs.stat(filePath);

    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
    };
  });

  // File operations
  ipcMain.handle('file:readFile', async (event, filePath) => {
    const buffer = await fs.readFile(filePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  });

  ipcMain.handle('file:readFileText', async (event, filePath) => {
    return await fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('file:writeFile', async (event, filePath, content) => {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, {recursive: true});

    if (content instanceof ArrayBuffer) {
      await fs.writeFile(filePath, Buffer.from(content));
    } else {
      await fs.writeFile(filePath, content, 'utf-8');
    }

    return filePath;
  });

  ipcMain.handle('file:exists', async (event, filePath) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  // App paths
  ipcMain.handle('app:getPath', async (event, name) => {
    return app.getPath(name);
  });

  ipcMain.handle('app:getBooksDirectory', async () => {
    const userDataPath = app.getPath('userData');
    const booksDir = path.join(userDataPath, 'books');
    
    // Ensure directory exists
    try {
      await fs.mkdir(booksDir, {recursive: true});
    } catch (error) {
      console.error('Failed to create books directory:', error);
    }

    return booksDir;
  });

  // Directory operations
  ipcMain.handle('file:readDir', async (event, dirPath) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isFile: () => entry.isFile(),
        isDirectory: () => entry.isDirectory(),
        size: entry.isFile() ? (await fs.stat(path.join(dirPath, entry.name))).size : 0,
        mtime: entry.isFile() ? (await fs.stat(path.join(dirPath, entry.name))).mtime : new Date(),
      }));
    } catch (error) {
      console.error('Failed to read directory:', error);
      throw error;
    }
  });

  ipcMain.handle('file:unlink', async (event, filePath) => {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        // For directories, we'd need recursive delete
        // For now, just remove if empty
        await fs.rmdir(filePath);
      } else {
        await fs.unlink(filePath);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  });
}

// App event handlers
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Create application menu
  createMenu();
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Book from File',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-import-book');
            }
          },
        },
        {
          label: 'Search Online Libraries',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-search-books');
            }
          },
        },
        {type: 'separator'},
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'undo', label: 'Undo'},
        {role: 'redo', label: 'Redo'},
        {type: 'separator'},
        {role: 'cut', label: 'Cut'},
        {role: 'copy', label: 'Copy'},
        {role: 'paste', label: 'Paste'},
      ],
    },
    {
      label: 'View',
      submenu: [
        {role: 'reload', label: 'Reload'},
        {role: 'forceReload', label: 'Force Reload'},
        {role: 'toggleDevTools', label: 'Toggle Developer Tools'},
        {type: 'separator'},
        {role: 'resetZoom', label: 'Actual Size'},
        {role: 'zoomIn', label: 'Zoom In'},
        {role: 'zoomOut', label: 'Zoom Out'},
        {type: 'separator'},
        {role: 'togglefullscreen', label: 'Toggle Full Screen'},
      ],
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Statistics',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-statistics');
            }
          },
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-settings');
            }
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Xenolexia',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-about');
            }
          },
        },
      ],
    },
  ];

  // macOS: Add app menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {role: 'about', label: 'About Xenolexia'},
        {type: 'separator'},
        {role: 'services', label: 'Services'},
        {type: 'separator'},
        {role: 'hide', label: 'Hide Xenolexia'},
        {role: 'hideOthers', label: 'Hide Others'},
        {role: 'unhide', label: 'Show All'},
        {type: 'separator'},
        {role: 'quit', label: 'Quit Xenolexia'},
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
