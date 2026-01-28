const {app, BrowserWindow, Menu} = require('electron');
const path = require('path');
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
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDev) {
    // In development, load from webpack dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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

// App event handlers
app.whenReady().then(() => {
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
          label: 'Import Book',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-import-book');
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
