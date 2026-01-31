import React from 'react';
import {createRoot} from 'react-dom/client';
import {
  setElectronAdapters,
  electronFileSystem,
  createElectronKeyValueStore,
} from '@xenolexia/shared';
import {databaseService} from './services/DatabaseService.renderer';
import App from './App';

// Wire shared core to Electron adapters (must run before any store uses getCore())
if (typeof window !== 'undefined' && (window as any).electronAPI) {
  setElectronAdapters({
    fileSystem: electronFileSystem,
    dataStore: databaseService,
    keyValueStore: createElectronKeyValueStore(),
  });
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
