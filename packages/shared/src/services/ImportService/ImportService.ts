/**
 * Import Service
 *
 * Handles importing book files from device storage into the app.
 * Supports EPUB, MOBI, FB2, and TXT formats.
 */

import {Platform} from 'react-native';
import DocumentPicker, {types} from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import {v4 as uuidv4} from 'uuid';

import type {BookFormat} from '../types';
import {MetadataExtractor} from '../BookParser';
import {FileSystemService} from '../FileSystemService';
import type {
  ImportProgress,
  ImportResult,
  ImportOptions,
  SelectedFile,
  CopiedFileInfo,
  ImportedBookMetadata,
} from './types';
import {SUPPORTED_EXTENSIONS} from './types';

// ============================================================================
// Constants
// ============================================================================

/** Base directory for storing books (used on native platforms) */
const BOOKS_BASE_DIR = `${RNFS.DocumentDirectoryPath}/.xenolexia/books`;

/** Whether to use File System Access API on web */
const USE_FILE_SYSTEM_API = Platform.OS === 'web' && FileSystemService.isSupported();

/** Supported document picker types */
const PICKER_TYPES = [
  types.epub,
  types.plainText,
  types.allFiles, // Fallback for formats not explicitly supported
];

// ============================================================================
// Import Service Class
// ============================================================================

export class ImportService {
  private static isInitialized = false;

  /**
   * Initialize the import service
   * Creates necessary directories if they don't exist
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // On web with File System Access API, initialize the service
      if (USE_FILE_SYSTEM_API) {
        await FileSystemService.initialize();
      }

      // Also ensure RNFS directory exists (for fallback/native)
      const exists = await RNFS.exists(BOOKS_BASE_DIR);
      if (!exists) {
        await RNFS.mkdir(BOOKS_BASE_DIR);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ImportService:', error);
      // Don't throw - allow service to work without pre-initialization
      this.isInitialized = true;
    }
  }

  /**
   * Check if file system access has been granted (web only)
   */
  static async hasFileSystemAccess(): Promise<boolean> {
    if (!USE_FILE_SYSTEM_API) {
      return true; // Native always has access
    }
    return await FileSystemService.hasDirectoryAccess();
  }

  /**
   * Request file system access from user (web only)
   * Returns true if access was granted
   */
  static async requestFileSystemAccess(): Promise<boolean> {
    if (!USE_FILE_SYSTEM_API) {
      return true; // Native always has access
    }
    return await FileSystemService.requestDirectoryAccess();
  }

  /**
   * Get the name of the current storage directory (for display)
   */
  static getStorageDirectoryName(): string | null {
    if (!USE_FILE_SYSTEM_API) {
      return BOOKS_BASE_DIR;
    }
    return FileSystemService.getDirectoryName();
  }

  /**
   * Open document picker and let user select a book file
   */
  static async selectFile(): Promise<SelectedFile | null> {
    try {
      const result = await DocumentPicker.pick({
        type: PICKER_TYPES,
        copyTo: 'cachesDirectory', // Copy to cache first for processing
        allowMultiSelection: false,
      });

      const file = result[0];

      // Validate file extension
      const extension = this.getFileExtension(file.name || '');
      if (!this.isSupportedFormat(extension)) {
        throw new Error(
          `Unsupported file format: ${extension}. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        );
      }

      return {
        uri: file.fileCopyUri || file.uri,
        name: file.name || 'Unknown',
        size: file.size || 0,
        type: file.type,
      };
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled - not an error
        return null;
      }
      throw error;
    }
  }

  /**
   * Import a book file into the app
   */
  static async importBook(
    file: SelectedFile,
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const {onProgress, extractCover = true, parseMetadata = true} = options;

    try {
      await this.initialize();

      // Generate unique book ID
      const bookId = uuidv4();

      // Step 1: Copy file to app storage
      onProgress?.({
        status: 'copying',
        fileName: file.name,
        progress: 10,
        currentStep: 'Copying file to library...',
      });

      const copiedFile = await this.copyFileToStorage(file, bookId);

      // Step 2: Parse metadata
      let metadata: ImportedBookMetadata = {
        title: this.extractTitleFromFilename(file.name),
        author: 'Unknown Author',
        format: copiedFile.format,
        fileSize: copiedFile.fileSize,
      };

      if (parseMetadata) {
        onProgress?.({
          status: 'parsing',
          fileName: file.name,
          progress: 40,
          currentStep: 'Extracting book information...',
        });

        try {
          const parsedMetadata = await this.parseBookMetadata(
            copiedFile.localPath,
            copiedFile.format,
          );
          metadata = {...metadata, ...parsedMetadata};
        } catch (parseError) {
          console.warn('Failed to parse metadata, using defaults:', parseError);
        }
      }

      // Step 3: Extract cover image
      if (extractCover && copiedFile.format === 'epub') {
        onProgress?.({
          status: 'extracting_cover',
          fileName: file.name,
          progress: 70,
          currentStep: 'Extracting cover image...',
        });

        try {
          const coverPath = await this.extractCoverImage(bookId, copiedFile.localPath);
          if (coverPath) {
            metadata.coverPath = coverPath;
          }
        } catch (coverError) {
          console.warn('Failed to extract cover:', coverError);
        }
      }

      // Step 4: Complete
      onProgress?.({
        status: 'complete',
        fileName: file.name,
        progress: 100,
        currentStep: 'Import complete!',
      });

      return {
        success: true,
        bookId,
        filePath: copiedFile.localPath,
        metadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Import failed';

      onProgress?.({
        status: 'error',
        fileName: file.name,
        progress: 0,
        currentStep: 'Import failed',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Copy selected file to app's book storage directory
   */
  private static async copyFileToStorage(
    file: SelectedFile,
    bookId: string,
  ): Promise<CopiedFileInfo> {
    const format = this.detectFormat(file.name);
    const filename = `book.${format}`;

    // On web with File System Access API, save to user's chosen directory
    if (USE_FILE_SYSTEM_API) {
      return await this.copyFileToFileSystem(file, bookId, filename, format);
    }

    // Fallback to RNFS (native or web IndexedDB)
    return await this.copyFileToRNFS(file, bookId, filename, format);
  }

  /**
   * Copy file using File System Access API (web)
   */
  private static async copyFileToFileSystem(
    file: SelectedFile,
    bookId: string,
    filename: string,
    format: BookFormat,
  ): Promise<CopiedFileInfo> {
    // Fetch the file content from blob URL
    const response = await fetch(file.uri);
    if (!response.ok) {
      throw new Error('Failed to read selected file');
    }
    const arrayBuffer = await response.arrayBuffer();

    // Save to user's file system (for persistence)
    await FileSystemService.saveBook(bookId, filename, arrayBuffer);

    // Also save to IndexedDB (RNFS) so the reader can access it
    const bookDir = `${BOOKS_BASE_DIR}/${bookId}`;
    const destPath = `${bookDir}/${filename}`;
    await RNFS.mkdir(bookDir);
    await RNFS.writeFile(destPath, arrayBuffer);

    return {
      bookId,
      originalName: file.name,
      localPath: destPath, // Use RNFS path for reading
      format,
      fileSize: arrayBuffer.byteLength,
    };
  }

  /**
   * Copy file using RNFS (native or IndexedDB fallback)
   */
  private static async copyFileToRNFS(
    file: SelectedFile,
    bookId: string,
    filename: string,
    format: BookFormat,
  ): Promise<CopiedFileInfo> {
    const bookDir = `${BOOKS_BASE_DIR}/${bookId}`;
    const destPath = `${bookDir}/${filename}`;

    // Create book directory
    await RNFS.mkdir(bookDir);

    // Copy file
    await RNFS.copyFile(file.uri, destPath);

    // Get actual file size
    const stat = await RNFS.stat(destPath);

    return {
      bookId,
      originalName: file.name,
      localPath: destPath,
      format,
      fileSize: parseInt(String(stat.size), 10),
    };
  }

  /**
   * Parse book metadata based on format
   */
  private static async parseBookMetadata(
    filePath: string,
    format: BookFormat,
  ): Promise<Partial<ImportedBookMetadata>> {
    switch (format) {
      case 'epub':
        return this.parseEPUBMetadata(filePath);
      case 'txt':
        return this.parseTXTMetadata(filePath);
      default:
        return {};
    }
  }

  /**
   * Parse EPUB metadata using MetadataExtractor
   */
  private static async parseEPUBMetadata(
    filePath: string,
  ): Promise<Partial<ImportedBookMetadata>> {
    const extractor = new MetadataExtractor();

    try {
      const extracted = await extractor.extractFromFile(filePath);

      return {
        title: extracted.metadata.title,
        author: extracted.metadata.author,
        description: extracted.metadata.description,
        publisher: extracted.metadata.publisher,
        publishDate: extracted.metadata.publishDate,
        isbn: extracted.metadata.isbn,
        language: extracted.language,
        totalChapters: extracted.chapterCount,
        subjects: extracted.metadata.subjects,
      };
    } finally {
      extractor.dispose();
    }
  }

  /**
   * Parse TXT metadata (limited - just file info)
   */
  private static async parseTXTMetadata(
    filePath: string,
  ): Promise<Partial<ImportedBookMetadata>> {
    try {
      const stat = await RNFS.stat(filePath);
      // Read first few lines to try to extract title
      const content = await RNFS.read(filePath, 500, 0, 'utf8');
      const firstLine = content.split('\n')[0]?.trim();

      return {
        title: firstLine?.length > 0 && firstLine.length < 100
          ? firstLine
          : undefined,
        estimatedPages: Math.ceil(parseInt(String(stat.size), 10) / 2000), // Rough estimate
      };
    } catch {
      return {};
    }
  }

  /**
   * Extract cover image from EPUB
   */
  private static async extractCoverImage(
    bookId: string,
    filePath: string,
  ): Promise<string | null> {
    const extractor = new MetadataExtractor();

    try {
      await extractor.extractFromFile(filePath);
      const bookDir = `${BOOKS_BASE_DIR}/${bookId}`;
      return await extractor.extractCover(bookDir);
    } catch (error) {
      console.warn('Failed to extract cover image:', error);
      return null;
    } finally {
      extractor.dispose();
    }
  }

  /**
   * Delete a book and its associated files
   */
  static async deleteBook(bookId: string): Promise<boolean> {
    try {
      // Try File System Access API first (web)
      if (USE_FILE_SYSTEM_API) {
        const deleted = await FileSystemService.deleteBook(bookId);
        if (deleted) return true;
      }

      // Fallback to RNFS
      const bookDir = `${BOOKS_BASE_DIR}/${bookId}`;
      const exists = await RNFS.exists(bookDir);

      if (exists) {
        await RNFS.unlink(bookDir);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete book:', error);
      return false;
    }
  }

  /**
   * Get the storage path for a book
   */
  static getBookPath(bookId: string): string {
    return `${BOOKS_BASE_DIR}/${bookId}`;
  }

  /**
   * Get total storage used by books
   */
  static async getStorageUsed(): Promise<number> {
    try {
      const exists = await RNFS.exists(BOOKS_BASE_DIR);
      if (!exists) return 0;

      const items = await RNFS.readDir(BOOKS_BASE_DIR);
      let totalSize = 0;

      for (const item of items) {
        if (item.isDirectory()) {
          const bookFiles = await RNFS.readDir(item.path);
          for (const file of bookFiles) {
            if (file.isFile()) {
              totalSize += parseInt(String(file.size), 10);
            }
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage:', error);
      return 0;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get file extension from filename
   */
  private static getFileExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? `.${match[1].toLowerCase()}` : '';
  }

  /**
   * Check if file format is supported
   */
  private static isSupportedFormat(extension: string): boolean {
    return SUPPORTED_EXTENSIONS.includes(extension as any);
  }

  /**
   * Detect book format from filename
   */
  private static detectFormat(filename: string): BookFormat {
    const ext = this.getFileExtension(filename).toLowerCase();
    switch (ext) {
      case '.epub':
        return 'epub';
      case '.mobi':
      case '.azw':
      case '.azw3':
        return 'mobi';
      case '.fb2':
        return 'fb2';
      case '.txt':
        return 'txt';
      default:
        return 'epub'; // Default fallback
    }
  }

  /**
   * Extract a clean title from filename
   */
  private static extractTitleFromFilename(filename: string): string {
    // Remove extension
    let title = filename.replace(/\.[^.]+$/, '');

    // Replace common separators with spaces
    title = title.replace(/[-_]/g, ' ');

    // Remove leading/trailing whitespace
    title = title.trim();

    // Capitalize first letter of each word
    title = title.replace(/\b\w/g, char => char.toUpperCase());

    return title || 'Untitled Book';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
