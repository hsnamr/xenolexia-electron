/**
 * Electron Book Download Service - Wraps BookDownloadService for Electron
 * Uses Electron file system APIs
 */

import {BookDownloadService} from '@xenolexia/shared/services/BookDownloadService';
import type {
  DownloadProgress,
  DownloadResult,
  EbookSearchResult,
  SearchResponse,
} from '@xenolexia/shared/services/BookDownloadService';
import type {Book} from '@xenolexia/shared/types';
import {getBooksDirectory, writeFileToAppData} from './ElectronFileService';
import {v4 as uuidv4} from 'uuid';

/**
 * CORS proxy for Electron (helps with cross-origin requests)
 */
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

/**
 * Fetch with CORS proxy fallback
 */
async function fetchWithCorsProxy(url: string, options?: RequestInit): Promise<Response> {
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

/**
 * Search for ebooks from online sources
 */
export async function searchBooks(
  query: string,
  source: 'gutenberg' | 'standardebooks' | 'openlibrary' = 'gutenberg'
): Promise<SearchResponse> {
  return BookDownloadService.searchBooks(query, source);
}

/**
 * Download an ebook from a search result
 */
export async function downloadBook(
  searchResult: EbookSearchResult,
  onProgress?: (progress: DownloadProgress) => void
): Promise<{success: boolean; book?: Book; error?: string}> {
  try {
    // Initialize progress
    const progress: DownloadProgress = {
      bookId: searchResult.id,
      bytesDownloaded: 0,
      totalBytes: 0,
      percentage: 0,
      status: 'pending',
    };

    onProgress?.(progress);

    // Determine format from URL
    const format = detectFormat(searchResult.downloadUrl);
    if (!format) {
      return {
        success: false,
        error: 'Unsupported file format. Only EPUB, MOBI, and TXT are supported.',
      };
    }

    // Get books directory (already includes /books subdirectory)
    const booksPath = await getBooksDirectory();

    // Generate book ID and file path
    const bookId = searchResult.id || uuidv4();
    const bookDir = `${booksPath}/${bookId}`;
    const filename = `book.${format}`;
    const targetPath = `${bookDir}/${filename}`;

    // Ensure directory exists
    if (window.electronAPI) {
      try {
        await window.electronAPI.writeFile(`${bookDir}/.keep`, '');
      } catch {
        // Directory might already exist, ignore
      }
    }

    // Update progress to downloading
    progress.status = 'downloading';
    onProgress?.(progress);

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

    // Convert to ArrayBuffer
    const arrayBuffer = combined.buffer.slice(
      combined.byteOffset,
      combined.byteOffset + combined.byteLength
    );

    // Write file to app data
    await writeFileToAppData(targetPath, arrayBuffer);

    progress.status = 'completed';
    progress.percentage = 100;
    onProgress?.(progress);

    // Create Book object
    const book: Book = {
      id: bookId,
      title: searchResult.title,
      author: searchResult.author,
      coverPath: searchResult.coverUrl || undefined,
      filePath: targetPath,
      format: format as any,
      fileSize: totalLength,
      addedAt: new Date(),
      lastReadAt: null,
      languagePair: {
        sourceLanguage: (searchResult.language as any) || 'en',
        targetLanguage: 'el', // Default, can be changed in settings
      },
      progress: 0,
      totalChapters: 0,
      currentChapter: 0,
      proficiencyLevel: 'beginner',
      wordDensity: 0.3,
    };

    return {
      success: true,
      book,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Download failed';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Detect file format from URL
 */
function detectFormat(url: string): 'epub' | 'mobi' | 'txt' | null {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.epub') || urlLower.includes('epub')) {
    return 'epub';
  } else if (urlLower.includes('.mobi') || urlLower.includes('mobi')) {
    return 'mobi';
  } else if (urlLower.includes('.txt') || urlLower.includes('text')) {
    return 'txt';
  }
  return null;
}
