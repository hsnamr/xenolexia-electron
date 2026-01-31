/**
 * Import Service Types
 */

import type {BookFormat} from '../types';

/**
 * Supported file types for import
 */
export const SUPPORTED_MIME_TYPES = [
  'application/epub+zip', // EPUB
  'application/x-mobipocket-ebook', // MOBI
  'text/plain', // TXT
] as const;

export const SUPPORTED_EXTENSIONS = ['.epub', '.mobi', '.txt'] as const;

/**
 * Import status states
 */
export type ImportStatus =
  | 'idle'
  | 'selecting'
  | 'copying'
  | 'parsing'
  | 'extracting_cover'
  | 'saving'
  | 'complete'
  | 'error';

/**
 * Import progress information
 */
export interface ImportProgress {
  status: ImportStatus;
  fileName: string;
  progress: number; // 0-100
  currentStep: string;
  error?: string;
}

/**
 * Result of file selection
 */
export interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  type: string | null;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  bookId?: string;
  error?: string;
  filePath?: string;
  metadata?: ImportedBookMetadata;
}

/**
 * Metadata extracted during import
 */
export interface ImportedBookMetadata {
  title: string;
  author?: string;
  description?: string;
  language?: string;
  publisher?: string;
  publishDate?: string;
  isbn?: string;
  coverPath?: string;
  format: BookFormat;
  fileSize: number;
  totalChapters?: number;
  estimatedPages?: number;
  subjects?: string[];
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Extract cover image */
  extractCover?: boolean;
  /** Parse full metadata */
  parseMetadata?: boolean;
  /** Progress callback */
  onProgress?: (progress: ImportProgress) => void;
}

/**
 * File info after copying to app storage
 */
export interface CopiedFileInfo {
  bookId: string;
  originalName: string;
  localPath: string;
  format: BookFormat;
  fileSize: number;
}
