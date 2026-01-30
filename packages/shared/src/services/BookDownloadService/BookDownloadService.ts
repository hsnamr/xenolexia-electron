/**
 * Book Download Service
 *
 * Handles downloading ebooks from various sources and managing local files.
 * Supports: Project Gutenberg, Standard Ebooks, Open Library, and direct URLs.
 */

import type {Book, BookFormat} from '../types/index';
import {FileSystemService} from '../FileSystemService';
import { Platform } from '../../utils/platform.electron';
import { getAppDataPath, writeFile, mkdir, fileExists, readDir, unlink } from '../../utils/FileSystem.electron';

import type {
  DownloadProgress,
  DownloadResult,
  EbookSource,
  EbookSearchResult,
  LocalEbookFile,
} from './types';

// Directory for storing downloaded books (Electron)
let BOOKS_DIRECTORY: string | null = null;

async function getBooksDirectory(): Promise<string> {
  if (!BOOKS_DIRECTORY) {
    const appDataPath = await getAppDataPath();
    BOOKS_DIRECTORY = `${appDataPath}/books`;
    await mkdir(BOOKS_DIRECTORY, { recursive: true });
  }
  return BOOKS_DIRECTORY;
}

// Whether to use File System Access API on web
const USE_FILE_SYSTEM_API = Platform.OS === 'web' && FileSystemService.isSupported();

// CORS proxy for web (helps with cross-origin requests)
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

/**
 * Fetch with CORS proxy fallback for web
 */
async function fetchWithCorsProxy(url: string, options?: RequestInit): Promise<Response> {
  // On native platforms, just use regular fetch
  if (Platform.OS !== 'web') {
    return fetch(url, options);
  }

  // Try direct fetch first
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
    });
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.log('Direct fetch failed, trying CORS proxy:', error);
  }

  // Try CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, options);
      if (response.ok) {
        console.log('CORS proxy succeeded:', proxy);
        return response;
      }
    } catch (error) {
      console.log('CORS proxy failed:', proxy, error);
    }
  }

  // If all proxies fail, throw error
  throw new Error('Failed to download: CORS blocked and all proxies failed. Try a different source.');
}

// ============================================================================
// Search Result Type with Error Handling
// ============================================================================

export interface SearchResponse {
  results: EbookSearchResult[];
  error?: string;
  source: EbookSource['type'];
}

// ============================================================================
// API Response Types
// ============================================================================

interface GutenbergAuthor {
  name: string;
  birth_year?: number;
  death_year?: number;
}

interface GutenbergBook {
  id: number;
  title: string;
  authors: GutenbergAuthor[];
  subjects?: string[];
  languages?: string[];
  formats: Record<string, string>;
}

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  language?: string[];
  has_fulltext?: boolean;
  ia?: string[]; // Internet Archive identifiers
  first_sentence?: string[];
}

/**
 * Supported ebook sources
 */
export const EBOOK_SOURCES: EbookSource[] = [
  {
    type: 'local',
    name: 'Device Storage',
    searchEnabled: false,
    downloadEnabled: false,
  },
  {
    type: 'gutenberg',
    name: 'Project Gutenberg',
    baseUrl: 'https://www.gutenberg.org',
    searchEnabled: true,
    downloadEnabled: true,
  },
  {
    type: 'standardebooks',
    name: 'Standard Ebooks',
    baseUrl: 'https://standardebooks.org',
    searchEnabled: true,
    downloadEnabled: true,
  },
  {
    type: 'openlibrary',
    name: 'Open Library',
    baseUrl: 'https://openlibrary.org',
    searchEnabled: true,
    downloadEnabled: true,
  },
  {
    type: 'url',
    name: 'Direct URL',
    searchEnabled: false,
    downloadEnabled: true,
  },
];

export class BookDownloadService {
  private static downloadProgress: Map<string, DownloadProgress> = new Map();
  private static progressListeners: Map<string, (progress: DownloadProgress) => void> = new Map();
  private static isInitialized = false;

  /**
   * Initialize the books directory
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize FileSystemService on web
      if (USE_FILE_SYSTEM_API) {
        await FileSystemService.initialize();
      }

      // Create books directory if it doesn't exist (Electron)
      const booksDir = await getBooksDirectory();
      const exists = await fileExists(booksDir);
      if (!exists) {
        await mkdir(booksDir, { recursive: true });
      }
      this.isInitialized = true;
      console.log('BookDownloadService initialized');
    } catch (error) {
      console.error('Failed to initialize BookDownloadService:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Check if file system access has been granted (web only)
   */
  static async hasFileSystemAccess(): Promise<boolean> {
    if (!USE_FILE_SYSTEM_API) {
      return true;
    }
    return await FileSystemService.hasDirectoryAccess();
  }

  /**
   * Request file system access from user (web only)
   */
  static async requestFileSystemAccess(): Promise<boolean> {
    if (!USE_FILE_SYSTEM_API) {
      return true;
    }
    return await FileSystemService.requestDirectoryAccess();
  }

  /**
   * Download an ebook from a URL
   */
  static async downloadFromUrl(
    url: string,
    bookId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    await this.initialize();

    try {
      // Initialize progress
      const progress: DownloadProgress = {
        bookId,
        bytesDownloaded: 0,
        totalBytes: 0,
        percentage: 0,
        status: 'pending',
      };

      this.downloadProgress.set(bookId, progress);
      if (onProgress) {
        this.progressListeners.set(bookId, onProgress);
      }

      // Determine format from URL
      const format = this.detectFormat(url);
      if (!format) {
        return {
          success: false,
          error: 'Unsupported file format. Only EPUB, MOBI, and TXT are supported.',
        };
      }

      // Generate filename
      const safeId = bookId.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `book.${format}`;

      // Update progress to downloading
      progress.status = 'downloading';
      onProgress?.(progress);

      // Use FileSystemService on web, RNFS otherwise
      if (USE_FILE_SYSTEM_API) {
        return await this.downloadWithFileSystemAPI(url, safeId, filename, format, progress, onProgress);
      } else {
        return await this.downloadWithRNFS(url, safeId, filename, format, progress, onProgress);
      }
    } catch (error) {
      const progress = this.downloadProgress.get(bookId);
      if (progress) {
        progress.status = 'failed';
        progress.error = error instanceof Error ? error.message : 'Download failed';
        this.progressListeners.get(bookId)?.(progress);
      }

      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    } finally {
      this.downloadProgress.delete(bookId);
      this.progressListeners.delete(bookId);
    }
  }

  /**
   * Download using File System Access API (web)
   */
  private static async downloadWithFileSystemAPI(
    url: string,
    bookId: string,
    filename: string,
    format: BookFormat,
    progress: DownloadProgress,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    // Fetch with CORS proxy fallback
    const response = await fetchWithCorsProxy(url);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('Unable to read response');
    }

    // Read with progress
    const chunks: Uint8Array[] = [];
    let bytesReceived = 0;

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      chunks.push(value);
      bytesReceived += value.length;

      progress.bytesDownloaded = bytesReceived;
      progress.totalBytes = contentLength;
      progress.percentage = contentLength > 0
        ? Math.round((bytesReceived / contentLength) * 100)
        : 0;
      onProgress?.(progress);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Save to user's file system (for persistence)
    if (USE_FILE_SYSTEM_API) {
      await FileSystemService.saveBook(bookId, filename, combined);
    }

    // Save to Electron file system
    const booksDir = await getBooksDirectory();
    const bookDir = `${booksDir}/${bookId}`;
    const destPath = `${bookDir}/${filename}`;
    await mkdir(bookDir, { recursive: true });
    // Convert Uint8Array to ArrayBuffer properly (slice to avoid shared buffer issues)
    const arrayBuffer = combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength);
    await writeFile(destPath, arrayBuffer);

    progress.status = 'completed';
    progress.percentage = 100;
    onProgress?.(progress);

    return {
      success: true,
      filePath: destPath, // Use RNFS path for reading
      format,
      metadata: {
        title: 'Downloaded Book',
        author: 'Unknown',
        fileSize: totalLength,
      },
    };
  }

  /**
   * Download using Electron file system (fetch + writeFile)
   */
  private static async downloadWithRNFS(
    url: string,
    bookId: string,
    filename: string,
    format: BookFormat,
    progress: DownloadProgress,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    const booksDir = await getBooksDirectory();
    const bookDir = `${booksDir}/${bookId}`;
    const destPath = `${bookDir}/${filename}`;

    // Ensure directory exists
    await mkdir(bookDir, { recursive: true });

    // Fetch with progress tracking
    const response = await fetchWithCorsProxy(url);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('Unable to read response');
    }

    // Read with progress
    const chunks: Uint8Array[] = [];
    let bytesReceived = 0;

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      chunks.push(value);
      bytesReceived += value.length;

      progress.bytesDownloaded = bytesReceived;
      progress.totalBytes = contentLength || bytesReceived;
      progress.percentage = contentLength > 0
        ? Math.round((bytesReceived / contentLength) * 100)
        : 0;
      onProgress?.(progress);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Write file
    const arrayBuffer = combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength);
    await writeFile(destPath, arrayBuffer);

    progress.status = 'completed';
    progress.percentage = 100;
    progress.bytesDownloaded = totalLength;
    progress.totalBytes = totalLength;
    onProgress?.(progress);

    return {
      success: true,
      filePath: destPath,
      format,
      metadata: {
        title: 'Downloaded Book',
        author: 'Unknown',
        fileSize: totalLength,
      },
    };
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: unknown): string {
    const errorMessage = error instanceof Error ? error.message : 'Download failed';

    if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    } else if (errorMessage.includes('status 404')) {
      return 'Book file not found. This book may no longer be available.';
    } else if (errorMessage.includes('status 403')) {
      return 'Access denied. This book may require special permissions to download.';
    } else if (errorMessage.includes('CORS')) {
      return 'Download blocked by security policy. Try downloading from a different source.';
    } else if (errorMessage.includes('Directory access')) {
      return 'Storage access required. Please select a folder to save books.';
    }

    return errorMessage;
  }

  /**
   * Download an ebook from search result and create a Book object
   */
  static async downloadBook(
    searchResult: EbookSearchResult,
    onProgress?: (progress: DownloadProgress) => void,
    promptForLocation: boolean = false
  ): Promise<{success: boolean; book?: Book; error?: string}> {
    await this.initialize();

    try {
      // For web with File System Access API support, optionally prompt for save location
      if (promptForLocation && Platform.OS === 'web' && 'showSaveFilePicker' in window) {
        return await this.downloadWithPicker(searchResult, onProgress);
      }

      // Standard download to ebooks directory
      const result = await this.downloadFromUrl(
        searchResult.downloadUrl,
        searchResult.id,
        onProgress
      );

      if (!result.success || !result.filePath) {
        return {
          success: false,
          error: result.error || 'Download failed',
        };
      }

      // Create Book object
      const book = this.createBookFromSearchResult(searchResult, result.filePath, result.metadata?.fileSize || 0);

      return {
        success: true,
        book,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  /**
   * Download with file picker (Web only with File System Access API)
   */
  private static async downloadWithPicker(
    searchResult: EbookSearchResult,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{success: boolean; book?: Book; error?: string}> {
    const progress: DownloadProgress = {
      bookId: searchResult.id,
      bytesDownloaded: 0,
      totalBytes: 0,
      percentage: 0,
      status: 'downloading',
    };
    onProgress?.(progress);

    try {
      // Fetch the file with CORS proxy fallback
      const response = await fetchWithCorsProxy(searchResult.downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Unable to read response');
      }

      // Read with progress
      const chunks: Uint8Array[] = [];
      let bytesReceived = 0;

      while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        chunks.push(value);
        bytesReceived += value.length;

        progress.bytesDownloaded = bytesReceived;
        progress.totalBytes = contentLength;
        progress.percentage = contentLength > 0
          ? Math.round((bytesReceived / contentLength) * 100)
          : 0;
        onProgress?.(progress);
      }

      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // For Electron, we'll save to internal storage
      // User can export later if needed
      const booksDir = await getBooksDirectory();
      const internalPath = `${booksDir}/${searchResult.id}.${searchResult.format}`;
      await writeFile(internalPath, combined.buffer);

      progress.status = 'completed';
      progress.percentage = 100;
      onProgress?.(progress);

      const book = this.createBookFromSearchResult(searchResult, internalPath, totalLength);

      return {
        success: true,
        book,
      };
    } catch (error: any) {
      progress.status = 'failed';
      progress.error = error.message;
      onProgress?.(progress);

      if (error.name === 'AbortError') {
        return {success: false, error: 'Download cancelled'};
      }

      return {
        success: false,
        error: error.message || 'Download failed',
      };
    }
  }

  /**
   * Create a Book object from search result
   */
  private static createBookFromSearchResult(
    searchResult: EbookSearchResult,
    filePath: string,
    fileSize: number
  ): Book {
    const now = new Date();

    return {
      id: searchResult.id,
      title: searchResult.title,
      author: searchResult.author,
      coverPath: searchResult.coverUrl || null,
      filePath,
      format: searchResult.format,
      fileSize,
      addedAt: now,
      lastReadAt: null,
      languagePair: {
        sourceLanguage: (searchResult.language as any) || 'en',
        targetLanguage: 'en', // Default target language
      },
      proficiencyLevel: 'intermediate',
      wordDensity: 0.3, // Default word density

      // Reading Progress - starts at 0
      progress: 0,
      currentLocation: null,
      currentChapter: 0,
      totalChapters: 0,
      currentPage: 0,
      totalPages: 0,
      readingTimeMinutes: 0,

      // Download info
      sourceUrl: searchResult.downloadUrl,
      isDownloaded: true,
    };
  }

  /**
   * Get file type options for save picker
   */
  private static getFileTypeOptions(format: BookFormat): Array<{description: string; accept: Record<string, string[]>}> {
    switch (format) {
      case 'epub':
        return [{description: 'EPUB files', accept: {'application/epub+zip': ['.epub']}}];
      case 'mobi':
        return [{description: 'MOBI files', accept: {'application/x-mobipocket-ebook': ['.mobi']}}];
      case 'txt':
        return [{description: 'Text files', accept: {'text/plain': ['.txt']}}];
      default:
        return [{description: 'Ebook files', accept: {'application/octet-stream': ['.*']}}];
    }
  }

  /**
   * Search for ebooks from online sources
   * Returns results with optional error message for user feedback
   */
  static async searchBooks(
    query: string,
    source: EbookSource['type'] = 'gutenberg'
  ): Promise<SearchResponse> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {
        results: [],
        error: 'Please enter a search term',
        source,
      };
    }

    try {
      let results: EbookSearchResult[];

      switch (source) {
        case 'gutenberg':
          results = await this.searchGutenberg(trimmedQuery);
          break;
        case 'standardebooks':
          results = await this.searchStandardEbooks(trimmedQuery);
          break;
        case 'openlibrary':
          results = await this.searchOpenLibrary(trimmedQuery);
          break;
        default:
          return {
            results: [],
            error: 'This source does not support searching',
            source,
          };
      }

      if (results.length === 0) {
        return {
          results: [],
          error: `No books found for "${trimmedQuery}". Try different keywords or check another source.`,
          source,
        };
      }

      return {results, source};
    } catch (error) {
      console.error(`Search failed for ${source}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        results: [],
        error: errorMessage,
        source,
      };
    }
  }

  /**
   * Search Project Gutenberg using the Gutendex API
   * API Documentation: https://gutendex.com/
   */
  private static async searchGutenberg(query: string): Promise<EbookSearchResult[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://gutendex.com/books/?search=${encodedQuery}`;

    const response = await fetchWithCorsProxy(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw new Error(
        `Project Gutenberg search failed (${response.status}). Please try again later.`
      );
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Transform Gutenberg results to our format
    return data.results
      .filter((book: GutenbergBook) => {
        // Only include books with EPUB format available
        return book.formats && (book.formats['application/epub+zip'] || book.formats['text/plain']);
      })
      .slice(0, 20) // Limit to 20 results
      .map((book: GutenbergBook): EbookSearchResult => {
        // Prefer EPUB, fallback to TXT
        const epubUrl = book.formats['application/epub+zip'];
        const txtUrl = book.formats['text/plain; charset=utf-8'] || book.formats['text/plain'];
        const downloadUrl = epubUrl || txtUrl || '';
        const format: BookFormat = epubUrl ? 'epub' : 'txt';

        // Get author name
        const author =
          book.authors && book.authors.length > 0
            ? book.authors.map((a: GutenbergAuthor) => a.name).join(', ')
            : 'Unknown Author';

        // Get cover image
        const coverUrl =
          book.formats['image/jpeg'] ||
          `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg`;

        return {
          id: `gutenberg-${book.id}`,
          title: book.title || 'Untitled',
          author,
          coverUrl,
          downloadUrl,
          format,
          source: 'gutenberg',
          language: book.languages?.[0] || 'en',
          description: book.subjects?.slice(0, 3).join(', '),
        };
      });
  }

  /**
   * Search Standard Ebooks
   * Note: Standard Ebooks doesn't have a search API. We fetch their catalog
   * and filter locally. Results are limited.
   */
  private static async searchStandardEbooks(query: string): Promise<EbookSearchResult[]> {
    // Standard Ebooks has an OPDS feed but no search API
    // We'll fetch their main feed and filter client-side
    const url = 'https://standardebooks.org/opds/all';

    const response = await fetchWithCorsProxy(url, {
      method: 'GET',
      headers: {
        Accept: 'application/atom+xml',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw new Error(
        `Standard Ebooks search failed (${response.status}). Please try again later.`
      );
    }

    const xmlText = await response.text();

    // Parse the OPDS XML feed
    const results: EbookSearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Simple XML parsing using regex (since we're in RN environment)
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let entryMatch;

    while ((entryMatch = entryRegex.exec(xmlText)) !== null && results.length < 20) {
      const entry = entryMatch[1];

      // Extract title
      const titleMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
      const title = titleMatch ? this.decodeXmlEntities(titleMatch[1]) : '';

      // Extract author
      const authorMatch = entry.match(/<author>\s*<name>([^<]+)<\/name>/);
      const author = authorMatch ? this.decodeXmlEntities(authorMatch[1]) : 'Unknown Author';

      // Check if query matches title or author
      if (
        !title.toLowerCase().includes(queryLower) &&
        !author.toLowerCase().includes(queryLower)
      ) {
        continue;
      }

      // Extract ID from the entry
      const idMatch = entry.match(/<id>([^<]+)<\/id>/);
      const entryId = idMatch ? idMatch[1] : `se-${Date.now()}-${results.length}`;

      // Extract EPUB link
      const epubMatch = entry.match(
        /<link[^>]*type="application\/epub\+zip"[^>]*href="([^"]+)"/
      );
      if (!epubMatch) continue;

      const downloadUrl = epubMatch[1].startsWith('http')
        ? epubMatch[1]
        : `https://standardebooks.org${epubMatch[1]}`;

      // Extract cover image
      const coverMatch = entry.match(/<link[^>]*rel="http:\/\/opds-spec\.org\/image"[^>]*href="([^"]+)"/);
      const coverUrl = coverMatch
        ? coverMatch[1].startsWith('http')
          ? coverMatch[1]
          : `https://standardebooks.org${coverMatch[1]}`
        : undefined;

      // Extract summary/description
      const summaryMatch = entry.match(/<summary[^>]*>([^<]+)<\/summary>/);
      const description = summaryMatch ? this.decodeXmlEntities(summaryMatch[1]) : undefined;

      results.push({
        id: `standardebooks-${entryId.replace(/[^a-zA-Z0-9]/g, '-')}`,
        title,
        author,
        coverUrl,
        downloadUrl,
        format: 'epub',
        source: 'standardebooks',
        language: 'en', // Standard Ebooks are primarily English
        description,
      });
    }

    return results;
  }

  /**
   * Search Open Library using their API
   * API Documentation: https://openlibrary.org/developers/api
   */
  private static async searchOpenLibrary(query: string): Promise<EbookSearchResult[]> {
    const encodedQuery = encodeURIComponent(query);
    // has_fulltext=true ensures we only get books with available downloads
    const url = `https://openlibrary.org/search.json?q=${encodedQuery}&has_fulltext=true&limit=20`;

    const response = await fetchWithCorsProxy(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      throw new Error(`Open Library search failed (${response.status}). Please try again later.`);
    }

    const data = await response.json();

    if (!data.docs || !Array.isArray(data.docs)) {
      return [];
    }

    // Transform Open Library results to our format
    return data.docs
      .filter((book: OpenLibraryBook) => {
        // Only include books that have a readable version
        return book.has_fulltext && book.ia && book.ia.length > 0;
      })
      .slice(0, 20)
      .map((book: OpenLibraryBook): EbookSearchResult => {
        // Get the Internet Archive identifier for download
        const iaId = book.ia?.[0] || '';

        // Build download URL for EPUB from Internet Archive
        const downloadUrl = iaId
          ? `https://archive.org/download/${iaId}/${iaId}.epub`
          : '';

        // Get author name
        const author =
          book.author_name && book.author_name.length > 0
            ? book.author_name.join(', ')
            : 'Unknown Author';

        // Get cover image from Open Library covers API
        const coverUrl = book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : undefined;

        return {
          id: `openlibrary-${book.key?.replace('/works/', '') || iaId}`,
          title: book.title || 'Untitled',
          author,
          coverUrl,
          downloadUrl,
          format: 'epub',
          source: 'openlibrary',
          language: book.language?.[0] || 'en',
          description: book.first_sentence?.[0],
          publishYear: book.first_publish_year,
        };
      })
      .filter((book: EbookSearchResult) => book.downloadUrl); // Only include books with valid download URLs
  }

  /**
   * Decode XML entities in strings
   */
  private static decodeXmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  }

  /**
   * Get list of locally stored ebooks
   */
  static async getLocalBooks(): Promise<LocalEbookFile[]> {
    await this.initialize();

    try {
      const files = await RNFS.readDir(BOOKS_DIRECTORY);
      return files
        .filter(file => file.isFile() && this.isSupportedFormat(file.name))
        .map(file => ({
          path: file.path,
          name: file.name,
          size: file.size,
          format: this.detectFormat(file.name)!,
          lastModified: file.mtime,
        }));
    } catch (error) {
      console.error('Failed to get local books:', error);
      return [];
    }
  }

  /**
   * Delete a locally stored ebook
   */
  static async deleteLocalBook(filePath: string): Promise<boolean> {
    try {
      await unlink(filePath);
      console.log('Deleted book:', filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete book:', error);
      return false;
    }
  }

  /**
   * Get total storage used by books
   */
  static async getStorageUsed(): Promise<number> {
    try {
      const books = await this.getLocalBooks();
      return books.reduce((total, book) => total + book.size, 0);
    } catch (error) {
      console.error('Failed to calculate storage:', error);
      return 0;
    }
  }

  /**
   * Cancel an ongoing download
   */
  static cancelDownload(bookId: string): void {
    const progress = this.downloadProgress.get(bookId);
    if (progress) {
      progress.status = 'cancelled';
      this.progressListeners.get(bookId)?.(progress);
      this.downloadProgress.delete(bookId);
      this.progressListeners.delete(bookId);
    }
  }

  /**
   * Detect book format from filename or URL
   */
  static detectFormat(pathOrUrl: string): BookFormat | null {
    const lower = pathOrUrl.toLowerCase();
    if (lower.endsWith('.epub')) return 'epub';
    if (lower.endsWith('.mobi') || lower.endsWith('.azw') || lower.endsWith('.azw3')) return 'mobi';
    if (lower.endsWith('.txt')) return 'txt';
    return null;
  }

  /**
   * Check if a file format is supported
   */
  static isSupportedFormat(filename: string): boolean {
    return this.detectFormat(filename) !== null;
  }
}
