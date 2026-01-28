/**
 * Electron mock for react-native-fs
 * Uses Electron's file system APIs via IPC
 */

// Virtual paths - these map to Electron's file system
export const DocumentDirectoryPath = '/home/user';
export const CachesDirectoryPath = '/home/user/.cache/xenolexia';
export const ExternalDirectoryPath = '/home/user/Downloads';
export const TemporaryDirectoryPath = '/tmp/xenolexia';

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Read file from Electron file system
 */
async function readFile(filePath: string, encoding?: 'utf8' | 'base64' | 'ascii'): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  try {
    if (encoding === 'base64') {
      // Read as ArrayBuffer and convert to base64
      const arrayBuffer = await window.electronAPI.readFile(filePath);
      return arrayBufferToBase64(arrayBuffer);
    } else {
      // Read as text (default is utf8)
      return await window.electronAPI.readFileText(filePath);
    }
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Write file to Electron file system
 */
async function writeFile(
  filePath: string,
  contents: string,
  encoding?: 'utf8' | 'base64' | 'ascii'
): Promise<void> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  try {
    if (encoding === 'base64') {
      // Convert base64 to ArrayBuffer
      const arrayBuffer = base64ToArrayBuffer(contents);
      await window.electronAPI.writeFile(filePath, arrayBuffer);
    } else {
      // Write as text (default is utf8)
      await window.electronAPI.writeFile(filePath, contents);
    }
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

/**
 * Check if file exists
 */
async function exists(filePath: string): Promise<boolean> {
  if (!window.electronAPI) {
    return false;
  }

  try {
    return await window.electronAPI.fileExists(filePath);
  } catch {
    return false;
  }
}

/**
 * Get file stats
 */
async function stat(filePath: string): Promise<{
  path: string;
  size: number;
  mtime: number;
  ctime: number;
  isFile: () => boolean;
  isDirectory: () => boolean;
}> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // For now, we'll need to read the file to get its size
  // In a full implementation, we'd add a stat IPC handler
  const exists = await window.electronAPI.fileExists(filePath);
  if (!exists) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read file to get size
  const arrayBuffer = await window.electronAPI.readFile(filePath);
  const size = arrayBuffer.byteLength;

  return {
    path: filePath,
    size,
    mtime: Date.now(),
    ctime: Date.now(),
    isFile: () => true,
    isDirectory: () => false,
  };
}

/**
 * Create directory
 */
async function mkdir(filePath: string, options?: {recursive?: boolean}): Promise<void> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // Create a .keep file to ensure directory exists
  // The writeFile handler in main.js already creates directories
  try {
    await window.electronAPI.writeFile(`${filePath}/.keep`, '');
  } catch (error) {
    // Directory might already exist
    if (!(await exists(filePath))) {
      throw error;
    }
  }
}

/**
 * Read directory contents
 */
async function readdir(filePath: string): Promise<string[]> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // For now, return empty array
  // In a full implementation, we'd add a readdir IPC handler
  return [];
}

/**
 * Unlink (delete) file
 */
async function unlink(filePath: string): Promise<void> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // For now, just check if file exists
  // In a full implementation, we'd add an unlink IPC handler
  const fileExists = await window.electronAPI.fileExists(filePath);
  if (!fileExists) {
    throw new Error(`File not found: ${filePath}`);
  }
}

/**
 * Copy file
 */
async function copyFile(sourcePath: string, destPath: string): Promise<void> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }

  // Read source file and write to destination
  const arrayBuffer = await window.electronAPI.readFile(sourcePath);
  await window.electronAPI.writeFile(destPath, arrayBuffer);
}

/**
 * Move file
 */
async function moveFile(sourcePath: string, destPath: string): Promise<void> {
  await copyFile(sourcePath, destPath);
  await unlink(sourcePath);
}

const RNFS = {
  DocumentDirectoryPath,
  CachesDirectoryPath,
  ExternalDirectoryPath,
  TemporaryDirectoryPath,
  readFile,
  writeFile,
  exists,
  stat,
  mkdir,
  readdir,
  unlink,
  copyFile,
  moveFile,
};

export default RNFS;
