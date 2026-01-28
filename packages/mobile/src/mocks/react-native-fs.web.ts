/**
 * Web mock for react-native-fs
 * Uses IndexedDB for persistent file storage and browser APIs for downloads
 */

// Virtual paths - these map to IndexedDB storage on web
// Using home directory style paths for consistency with user expectations
export const DocumentDirectoryPath = '/home/user';
export const CachesDirectoryPath = '/home/user/.cache/xenolexia';
export const ExternalDirectoryPath = '/home/user/Downloads';
export const TemporaryDirectoryPath = '/tmp/xenolexia';

// IndexedDB configuration
const DB_NAME = 'xenolexia-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// In-memory fallback storage
const memoryStorage = new Map<string, ArrayBuffer | string>();

// ============================================================================
// IndexedDB Helpers
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB not available, using memory storage');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {keyPath: 'path'});
      }
    };
  });

  return dbPromise;
};

const getFromDB = async (path: string): Promise<{path: string; data: ArrayBuffer | string; size: number; mtime: number} | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(path);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fall back to memory storage
    const data = memoryStorage.get(path);
    if (data) {
      return {
        path,
        data,
        size: typeof data === 'string' ? data.length : data.byteLength,
        mtime: Date.now(),
      };
    }
    return null;
  }
};

const saveToDB = async (path: string, data: ArrayBuffer | string): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        path,
        data,
        size: typeof data === 'string' ? data.length : data.byteLength,
        mtime: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fall back to memory storage
    memoryStorage.set(path, data);
  }
};

const deleteFromDB = async (path: string): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(path);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    memoryStorage.delete(path);
  }
};

const getAllFromDB = async (): Promise<Array<{path: string; data: ArrayBuffer | string; size: number; mtime: number}>> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return Array.from(memoryStorage.entries()).map(([path, data]) => ({
      path,
      data,
      size: typeof data === 'string' ? data.length : data.byteLength,
      mtime: Date.now(),
    }));
  }
};

// ============================================================================
// File System API
// ============================================================================

export const readFile = async (
  filepath: string,
  encoding?: string,
): Promise<string> => {
  const file = await getFromDB(filepath);
  if (!file) {
    throw new Error(`File not found: ${filepath}`);
  }

  // Handle base64 encoding request - return data as base64 string
  if (encoding === 'base64') {
    if (typeof file.data === 'string') {
      // Already a string, assume it's base64 or convert
      return file.data;
    }
    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(file.data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  if (typeof file.data === 'string') {
    return file.data;
  }

  // Convert ArrayBuffer to string using TextDecoder
  const decoder = new TextDecoder(encoding || 'utf-8');
  return decoder.decode(file.data);
};

export const readFileAsArrayBuffer = async (filepath: string): Promise<ArrayBuffer> => {
  const file = await getFromDB(filepath);
  if (!file) {
    throw new Error(`File not found: ${filepath}`);
  }

  if (file.data instanceof ArrayBuffer) {
    return file.data;
  }

  // Convert string to ArrayBuffer
  const encoder = new TextEncoder();
  return encoder.encode(file.data).buffer;
};

/**
 * Read a portion of a file
 */
export const read = async (
  filepath: string,
  length: number = 0,
  position: number = 0,
  encoding: string = 'utf8',
): Promise<string> => {
  const file = await getFromDB(filepath);
  if (!file) {
    throw new Error(`File not found: ${filepath}`);
  }

  let data: Uint8Array;
  if (file.data instanceof ArrayBuffer) {
    data = new Uint8Array(file.data);
  } else {
    const encoder = new TextEncoder();
    data = encoder.encode(file.data);
  }

  // Extract the portion we need
  const end = length > 0 ? Math.min(position + length, data.length) : data.length;
  const slice = data.slice(position, end);

  // Decode to string
  const decoder = new TextDecoder(encoding);
  return decoder.decode(slice);
};

export const writeFile = async (
  filepath: string,
  contents: string | ArrayBuffer,
  _encoding?: string,
): Promise<void> => {
  await saveToDB(filepath, contents);
};

export const exists = async (filepath: string): Promise<boolean> => {
  const file = await getFromDB(filepath);
  return file !== null;
};

export const unlink = async (filepath: string): Promise<void> => {
  await deleteFromDB(filepath);
};

export const mkdir = async (_filepath: string): Promise<void> => {
  // No-op for web - we use flat key structure
};

export const readDir = async (
  dirpath: string,
): Promise<Array<{name: string; path: string; size: number; mtime: Date; isFile: () => boolean; isDirectory: () => boolean}>> => {
  const allFiles = await getAllFromDB();
  const normalizedDir = dirpath.endsWith('/') ? dirpath : `${dirpath}/`;

  return allFiles
    .filter(file => file.path.startsWith(normalizedDir))
    .map(file => ({
      name: file.path.slice(normalizedDir.length).split('/')[0],
      path: file.path,
      size: file.size,
      mtime: new Date(file.mtime),
      isFile: () => true,
      isDirectory: () => false,
    }));
};

export const copyFile = async (
  filepath: string,
  destPath: string,
): Promise<void> => {
  // Handle blob URLs (from document picker)
  if (filepath.startsWith('blob:')) {
    try {
      const response = await fetch(filepath);
      if (!response.ok) {
        throw new Error(`Failed to fetch blob: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      await saveToDB(destPath, arrayBuffer);
      return;
    } catch (error) {
      console.error('Failed to copy from blob URL:', error);
      throw new Error(`Failed to copy file from blob URL: ${filepath}`);
    }
  }

  // Handle data URLs
  if (filepath.startsWith('data:')) {
    try {
      const response = await fetch(filepath);
      const arrayBuffer = await response.arrayBuffer();
      await saveToDB(destPath, arrayBuffer);
      return;
    } catch (error) {
      console.error('Failed to copy from data URL:', error);
      throw new Error(`Failed to copy file from data URL`);
    }
  }

  // Handle file:// URLs (some browsers)
  if (filepath.startsWith('file://')) {
    throw new Error('Cannot read file:// URLs directly in browser. Use document picker.');
  }

  // Standard path-to-path copy from IndexedDB
  const file = await getFromDB(filepath);
  if (file) {
    await saveToDB(destPath, file.data);
  } else {
    throw new Error(`Source file not found: ${filepath}`);
  }
};

export const moveFile = async (
  filepath: string,
  destPath: string,
): Promise<void> => {
  const file = await getFromDB(filepath);
  if (file) {
    await saveToDB(destPath, file.data);
    await deleteFromDB(filepath);
  }
};

export const stat = async (
  filepath: string,
): Promise<{size: number; mtime: Date; isFile: () => boolean; isDirectory: () => boolean}> => {
  const file = await getFromDB(filepath);
  if (!file) {
    throw new Error(`File not found: ${filepath}`);
  }
  return {
    size: file.size,
    mtime: new Date(file.mtime),
    isFile: () => true,
    isDirectory: () => false,
  };
};

// ============================================================================
// Download File API (Web-specific)
// ============================================================================

export interface DownloadFileOptions {
  fromUrl: string;
  toFile: string;
  headers?: Record<string, string>;
  progress?: (res: {bytesWritten: number; contentLength: number}) => void;
}

export interface DownloadResult {
  jobId: number;
  statusCode: number;
  bytesWritten: number;
}

let downloadJobId = 0;

export const downloadFile = (options: DownloadFileOptions): {
  jobId: number;
  promise: Promise<DownloadResult>;
} => {
  const jobId = ++downloadJobId;

  const promise = new Promise<DownloadResult>(async (resolve, reject) => {
    try {
      const response = await fetch(options.fromUrl, {
        headers: options.headers,
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Unable to read response body');
      }

      const chunks: Uint8Array[] = [];
      let bytesWritten = 0;

      while (true) {
        const {done, value} = await reader.read();

        if (done) break;

        chunks.push(value);
        bytesWritten += value.length;

        if (options.progress) {
          options.progress({bytesWritten, contentLength});
        }
      }

      // Combine chunks into single ArrayBuffer
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Save to IndexedDB
      await saveToDB(options.toFile, combined.buffer);

      resolve({
        jobId,
        statusCode: response.status,
        bytesWritten,
      });
    } catch (error) {
      reject(error);
    }
  });

  return {jobId, promise};
};

// ============================================================================
// File System Access API (for save dialogs)
// ============================================================================

export const saveFileWithPicker = async (
  data: ArrayBuffer | string,
  suggestedName: string,
  types?: Array<{description: string; accept: Record<string, string[]>}>,
): Promise<string | null> => {
  // Check if File System Access API is available
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: types || [
          {
            description: 'EPUB files',
            accept: {'application/epub+zip': ['.epub']},
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();

      return handle.name;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return null;
      }
      throw error;
    }
  }

  // Fallback: trigger browser download
  const blob =
    data instanceof ArrayBuffer
      ? new Blob([data])
      : new Blob([data], {type: 'text/plain'});

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return suggestedName;
};

// ============================================================================
// Export Default
// ============================================================================

export default {
  DocumentDirectoryPath,
  CachesDirectoryPath,
  ExternalDirectoryPath,
  TemporaryDirectoryPath,
  readFile,
  readFileAsArrayBuffer,
  read,
  writeFile,
  exists,
  unlink,
  mkdir,
  readDir,
  copyFile,
  moveFile,
  stat,
  downloadFile,
  saveFileWithPicker,
};
