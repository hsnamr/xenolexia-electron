/**
 * File System - Electron version
 * Replaces react-native-fs
 */

/**
 * Read file as base64 string
 */
export async function readFileAsBase64(filePath: string): Promise<string> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      const arrayBuffer = await (window as any).electronAPI.readFile(filePath);
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Fallback to react-native-fs if available (for mobile - should not happen in Electron)
  try {
    const RNFS = require('react-native-fs');
    return await RNFS.readFile(filePath, 'base64');
  } catch (error) {
    // If neither is available, try fetch (for web/development)
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      throw new Error(`Cannot read file: ${filePath}. No file system access available.`);
    }
  }
}

/**
 * Read file as ArrayBuffer
 */
export async function readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      return await (window as any).electronAPI.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Fallback to react-native-fs if available
  try {
    const RNFS = require('react-native-fs');
    const base64 = await RNFS.readFile(filePath, 'base64');
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    // Try fetch as fallback
    try {
      const response = await fetch(filePath);
      return await response.arrayBuffer();
    } catch (fetchError) {
      throw new Error(`Cannot read file: ${filePath}. No file system access available.`);
    }
  }
}

/**
 * Read file as text
 */
export async function readFileAsText(filePath: string): Promise<string> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      return await (window as any).electronAPI.readFileText(filePath);
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Fallback to react-native-fs if available
  try {
    const RNFS = require('react-native-fs');
    return await RNFS.readFile(filePath, 'utf8');
  } catch (error) {
    // Try fetch as fallback
    try {
      const response = await fetch(filePath);
      return await response.text();
    } catch (fetchError) {
      throw new Error(`Cannot read file: ${filePath}. No file system access available.`);
    }
  }
}

/**
 * Write file
 */
export async function writeFile(filePath: string, content: string | ArrayBuffer, encoding: 'utf8' | 'base64' = 'utf8'): Promise<void> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      await (window as any).electronAPI.writeFile(filePath, content);
      return;
    } catch (error) {
      throw new Error(`Failed to write file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Fallback to react-native-fs if available
  try {
    const RNFS = require('react-native-fs');
    if (encoding === 'base64') {
      await RNFS.writeFile(filePath, content as string, 'base64');
    } else {
      await RNFS.writeFile(filePath, content as string, 'utf8');
    }
  } catch (error) {
    throw new Error(`Cannot write file: ${filePath}. No file system access available.`);
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      return await (window as any).electronAPI.fileExists(filePath);
    } catch (error) {
      return false;
    }
  }
  
  // Fallback to react-native-fs if available
  try {
    const RNFS = require('react-native-fs');
    return await RNFS.exists(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Create directory
 */
export async function mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    // Electron API doesn't have mkdir, but writeFile will create directories
    // For now, we'll use a workaround by trying to write a temp file
    try {
      const tempPath = `${dirPath}/.xenolexia-temp`;
      await (window as any).electronAPI.writeFile(tempPath, '');
      // Delete the temp file immediately
      // Note: Electron API might need a deleteFile method
      return;
    } catch (error) {
      // Directory might already exist, which is fine
      if (options?.recursive) {
        return;
      }
      throw new Error(`Failed to create directory: ${dirPath}`);
    }
  }
  
  // Fallback to react-native-fs if available
  try {
    const RNFS = require('react-native-fs');
    await RNFS.mkdir(dirPath);
  } catch (error) {
    // Directory might already exist
    if (options?.recursive) {
      return;
    }
    throw error;
  }
}

/**
 * Get app data directory
 */
export async function getAppDataPath(): Promise<string> {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      return await (window as any).electronAPI.getAppDataPath();
    } catch (error) {
      return '/tmp/xenolexia';
    }
  }
  
  // Fallback
  try {
    const RNFS = require('react-native-fs');
    return RNFS.DocumentDirectoryPath;
  } catch (error) {
    return '/tmp/xenolexia';
  }
}

/**
 * Read directory contents
 */
export async function readDir(dirPath: string): Promise<Array<{name: string; path: string; isFile: () => boolean; isDirectory: () => boolean; size: number; mtime: Date}>> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    // Electron doesn't have a direct readDir API, we'll need to add it to preload.js
    // For now, use a workaround with Node.js fs if available
    try {
      // Try to use Node.js fs via a custom IPC call
      // This would need to be added to electron main process
      throw new Error('readDir not yet implemented in Electron API');
    } catch (error) {
      // Fallback: return empty array
      return [];
    }
  }
  
  // Fallback to react-native-fs if available
  try {
    const RNFS = require('react-native-fs');
    const files = await RNFS.readDir(dirPath);
    return files.map((file: any) => ({
      name: file.name,
      path: file.path,
      isFile: () => file.isFile(),
      isDirectory: () => file.isDirectory(),
      size: file.size || 0,
      mtime: new Date(file.mtime || Date.now()),
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Delete a file or directory
 */
export async function unlink(filePath: string): Promise<void> {
  // Check if we're in Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      await (window as any).electronAPI.unlink(filePath);
      return;
    } catch (error) {
      throw new Error(`Failed to delete file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Fallback to react-native-fs if available
  try {
    const RNFS = require('react-native-fs');
    await RNFS.unlink(filePath);
  } catch (error) {
    throw new Error(`Cannot delete file: ${filePath}. No file system access available.`);
  }
}
