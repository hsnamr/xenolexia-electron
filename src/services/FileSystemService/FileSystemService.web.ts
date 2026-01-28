/**
 * File System Service for Web
 * 
 * Uses the File System Access API to read/write files to the user's
 * actual file system with their permission.
 */

// ============================================================================
// Types
// ============================================================================

interface StoredHandle {
  name: string;
  kind: 'directory' | 'file';
}

// ============================================================================
// IndexedDB for storing directory handles
// ============================================================================

const DB_NAME = 'xenolexia-fs-handles';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const BOOKS_DIR_KEY = 'books-directory';

let dbPromise: Promise<IDBDatabase> | null = null;

const openHandleDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
};

const saveHandle = async (key: string, handle: FileSystemDirectoryHandle): Promise<void> => {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getHandle = async (key: string): Promise<FileSystemDirectoryHandle | null> => {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// ============================================================================
// File System Service
// ============================================================================

export class FileSystemService {
  private static booksDirectoryHandle: FileSystemDirectoryHandle | null = null;
  private static isInitialized = false;

  /**
   * Check if File System Access API is supported
   */
  static isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Initialize the service - try to restore previous directory access
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.booksDirectoryHandle !== null;
    }

    this.isInitialized = true;

    if (!this.isSupported()) {
      console.log('[FileSystemService] File System Access API not supported');
      return false;
    }

    try {
      // Try to restore saved directory handle
      const savedHandle = await getHandle(BOOKS_DIR_KEY);
      if (savedHandle) {
        // Verify we still have permission
        const permission = await savedHandle.requestPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          this.booksDirectoryHandle = savedHandle;
          console.log('[FileSystemService] Restored directory access:', savedHandle.name);
          return true;
        }
      }
    } catch (error) {
      console.log('[FileSystemService] Could not restore directory access:', error);
    }

    return false;
  }

  /**
   * Check if we have an active directory handle with permission
   */
  static async hasDirectoryAccess(): Promise<boolean> {
    if (!this.booksDirectoryHandle) {
      return false;
    }

    try {
      const permission = await this.booksDirectoryHandle.queryPermission({ mode: 'readwrite' });
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Prompt user to select a directory for storing books
   */
  static async requestDirectoryAccess(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('File System Access API is not supported in this browser');
    }

    try {
      // Show directory picker
      const handle = await (window as any).showDirectoryPicker({
        id: 'xenolexia-books',
        mode: 'readwrite',
        startIn: 'documents',
      });

      this.booksDirectoryHandle = handle;

      // Save handle for future sessions
      await saveHandle(BOOKS_DIR_KEY, handle);

      console.log('[FileSystemService] Directory access granted:', handle.name);
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[FileSystemService] User cancelled directory selection');
        return false;
      }
      throw error;
    }
  }

  /**
   * Ensure we have directory access, prompting if necessary
   */
  static async ensureDirectoryAccess(): Promise<FileSystemDirectoryHandle> {
    await this.initialize();

    if (await this.hasDirectoryAccess()) {
      return this.booksDirectoryHandle!;
    }

    // Need to request access
    const granted = await this.requestDirectoryAccess();
    if (!granted || !this.booksDirectoryHandle) {
      throw new Error('Directory access is required to save books');
    }

    return this.booksDirectoryHandle;
  }

  /**
   * Get or create a subdirectory
   */
  static async getOrCreateDirectory(
    parent: FileSystemDirectoryHandle,
    name: string
  ): Promise<FileSystemDirectoryHandle> {
    return await parent.getDirectoryHandle(name, { create: true });
  }

  /**
   * Save a file to the books directory
   */
  static async saveBook(
    bookId: string,
    filename: string,
    data: ArrayBuffer | Uint8Array | Blob
  ): Promise<string> {
    const rootDir = await this.ensureDirectoryAccess();

    // Create book subdirectory
    const bookDir = await this.getOrCreateDirectory(rootDir, bookId);

    // Create the file
    const fileHandle = await bookDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();

    try {
      await writable.write(data);
    } finally {
      await writable.close();
    }

    const path = `${rootDir.name}/${bookId}/${filename}`;
    console.log('[FileSystemService] Saved book:', path);
    return path;
  }

  /**
   * Read a book file
   */
  static async readBook(bookId: string, filename: string): Promise<ArrayBuffer> {
    const rootDir = await this.ensureDirectoryAccess();

    try {
      const bookDir = await rootDir.getDirectoryHandle(bookId);
      const fileHandle = await bookDir.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error(`Book file not found: ${bookId}/${filename}`);
      }
      throw error;
    }
  }

  /**
   * Check if a book exists
   */
  static async bookExists(bookId: string, filename: string): Promise<boolean> {
    if (!await this.hasDirectoryAccess()) {
      return false;
    }

    try {
      const rootDir = this.booksDirectoryHandle!;
      const bookDir = await rootDir.getDirectoryHandle(bookId);
      await bookDir.getFileHandle(filename);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a book directory
   */
  static async deleteBook(bookId: string): Promise<boolean> {
    if (!await this.hasDirectoryAccess()) {
      return false;
    }

    try {
      const rootDir = this.booksDirectoryHandle!;
      await rootDir.removeEntry(bookId, { recursive: true });
      console.log('[FileSystemService] Deleted book:', bookId);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        return true; // Already deleted
      }
      console.error('[FileSystemService] Failed to delete book:', error);
      return false;
    }
  }

  /**
   * List all books in the directory
   */
  static async listBooks(): Promise<string[]> {
    if (!await this.hasDirectoryAccess()) {
      return [];
    }

    const bookIds: string[] = [];
    const rootDir = this.booksDirectoryHandle!;

    for await (const entry of (rootDir as any).values()) {
      if (entry.kind === 'directory') {
        bookIds.push(entry.name);
      }
    }

    return bookIds;
  }

  /**
   * Get the current books directory path (for display)
   */
  static getDirectoryName(): string | null {
    return this.booksDirectoryHandle?.name || null;
  }

  /**
   * Save a file with a save dialog (for "Save As" functionality)
   */
  static async saveFileWithDialog(
    data: ArrayBuffer | Uint8Array | Blob,
    suggestedName: string,
    types?: Array<{ description: string; accept: Record<string, string[]> }>
  ): Promise<string | null> {
    if (!this.isSupported()) {
      // Fallback to download
      return this.downloadFile(data, suggestedName);
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: types || [
          {
            description: 'EPUB files',
            accept: { 'application/epub+zip': ['.epub'] },
          },
        ],
      });

      const writable = await handle.createWritable();
      try {
        await writable.write(data);
      } finally {
        await writable.close();
      }

      return handle.name;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return null; // User cancelled
      }
      throw error;
    }
  }

  /**
   * Fallback: trigger browser download
   */
  private static downloadFile(
    data: ArrayBuffer | Uint8Array | Blob,
    filename: string
  ): string {
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    return filename;
  }
}

export default FileSystemService;
