/**
 * Electron File Service - File system operations for Electron
 */

export interface ElectronFile {
  path: string;
  name: string;
  size: number;
}

/**
 * Open file dialog using Electron's native dialog
 */
export async function openFileDialog(): Promise<ElectronFile | null> {
  if (!window.electronAPI) {
    // Fallback for web/development
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.epub,.mobi,.fb2,.txt';
    
    return new Promise((resolve) => {
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          resolve({
            path: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
          });
        } else {
          resolve(null);
        }
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  return window.electronAPI.showOpenDialog({
    filters: [
      {name: 'Ebooks', extensions: ['epub', 'mobi', 'fb2', 'txt']},
      {name: 'EPUB', extensions: ['epub']},
      {name: 'MOBI', extensions: ['mobi']},
      {name: 'FB2', extensions: ['fb2']},
      {name: 'Text', extensions: ['txt']},
      {name: 'All Files', extensions: ['*']},
    ],
    properties: ['openFile'],
  });
}

/**
 * Read file content as ArrayBuffer
 */
export async function readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  if (!window.electronAPI) {
    // Fallback for web/development
    const response = await fetch(filePath);
    return await response.arrayBuffer();
  }

  return window.electronAPI.readFile(filePath);
}

/**
 * Read file content as text
 */
export async function readFileAsText(filePath: string): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  return window.electronAPI.readFileText(filePath);
}

/**
 * Write file to app data directory
 */
export async function writeFileToAppData(
  filePath: string,
  content: ArrayBuffer | string
): Promise<string> {
  if (!window.electronAPI) {
    // Fallback for web/development - use IndexedDB or localStorage
    throw new Error('Electron API not available - cannot write files in web mode');
  }

  return window.electronAPI.writeFile(filePath, content);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  return window.electronAPI.fileExists(filePath);
}

/**
 * Get app data directory path
 */
export async function getAppDataPath(): Promise<string> {
  if (!window.electronAPI) {
    // Fallback for web/development
    return '/tmp/xenolexia';
  }

  return window.electronAPI.getAppDataPath();
}

/**
 * Get books directory path (userData/books)
 */
export async function getBooksDirectory(): Promise<string> {
  if (!window.electronAPI) {
    // Fallback for web/development
    return '/tmp/xenolexia/books';
  }

  return window.electronAPI.getBooksDirectory();
}
