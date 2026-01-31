/**
 * Export all services
 */

export {BookParserService, EPUBParser, TXTParser, MOBIParser} from './BookParser';
export type {IBookParser} from './BookParser';

// Translation Engine (core)
export {TranslationEngine, WordMatcher} from './TranslationEngine';
export type {TranslationOptions, ProcessedText} from './TranslationEngine';

// Translation API Service (multi-provider)
export {
  TranslationAPIService,
  translationAPI,
} from './TranslationEngine';
export type {
  TranslationProvider,
  TranslationResult,
  BulkTranslationResult,
} from './TranslationEngine';

// Frequency List Service
export {
  FrequencyListService,
  frequencyListService,
  PROFICIENCY_THRESHOLDS,
} from './TranslationEngine';
export type {
  FrequencyWord,
  FrequencyList,
} from './TranslationEngine';

// Dynamic Word Database (any language pair)
export {
  DynamicWordDatabase,
  dynamicWordDatabase,
} from './TranslationEngine';

// Word Database Service (installDictionary, bulkImport for word lists)
export { WordDatabaseService, wordDatabase } from './TranslationEngine';
export type { BulkImportResult } from './TranslationEngine';
export type {
  DynamicWordEntry,
  WordLookupResult,
} from './TranslationEngine';

export {StorageService, DatabaseSchema} from './StorageService';

export {BookDownloadService, EBOOK_SOURCES} from './BookDownloadService';
export type {
  DownloadProgress,
  DownloadResult,
  EbookSource,
  EbookSearchResult,
  LocalEbookFile,
} from './BookDownloadService';

export {ImportService, SUPPORTED_EXTENSIONS, SUPPORTED_MIME_TYPES} from './ImportService';
export type {
  ImportProgress,
  ImportResult,
  ImportOptions,
  SelectedFile,
  CopiedFileInfo,
  ImportedBookMetadata,
  ImportStatus,
} from './ImportService';

export {ImageService, ImageCache, ThumbnailGenerator, THUMBNAIL_SIZES} from './ImageService';
export type {
  ImageDimensions,
  ResizeOptions,
  ThumbnailOptions,
  ThumbnailSize,
  CacheEntry,
  CacheStats,
  CacheOptions,
  ImageLoadStatus,
  ImageLoadResult,
  ImageSource,
  PlaceholderType,
  PlaceholderOptions,
} from './ImageService';

export {
  ReaderStyleService,
  READER_FONTS,
  READER_THEMES,
  generateStylesheet,
  saveSettings,
  loadSettings,
  saveBookSettings,
  loadBookSettings,
} from './ReaderStyleService';
export type {
  ReaderStyleConfig,
  ThemeColors,
} from './ReaderStyleService';

export { exportService } from './ExportService';
export type { ExportFormat, ExportOptions, ExportResult } from './ExportService';
