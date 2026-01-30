/**
 * Electron Import Service - Wraps ImportService for Electron with file dialog
 */

import {ImportService} from '@xenolexia/shared/services/ImportService';
import type {ImportProgress, ImportResult, ImportOptions} from '@xenolexia/shared/services/ImportService';
import {openFileDialog, readFileAsArrayBuffer, getAppDataPath, writeFileToAppData} from './ElectronFileService';
import {useLibraryStore} from '@xenolexia/shared/stores/libraryStore';
import type {Book} from '@xenolexia/shared/types';
import {v4 as uuidv4} from 'uuid';

/**
 * Select and import a book file using Electron's native file dialog
 */
export async function importBookFromFile(
  onProgress?: (progress: ImportProgress) => void
): Promise<Book | null> {
  try {
    // Open file dialog
    const file = await openFileDialog();
    if (!file) {
      return null; // User cancelled
    }

    // Read file content
    onProgress?.({
      status: 'reading',
      fileName: file.name,
      progress: 5,
      currentStep: 'Reading file...',
    });

    const fileContent = await readFileAsArrayBuffer(file.path);

    // Get books directory
    const booksDir = await getAppDataPath();
    const booksPath = `${booksDir}/books`;
    
    // Ensure books directory exists (if Electron API available)
    if (window.electronAPI) {
      try {
        await window.electronAPI.writeFile(`${booksPath}/.keep`, '');
      } catch {
        // Directory might already exist, ignore
      }
    }

    // Generate book ID and file path
    const bookId = uuidv4();
    const lastDotIndex = file.name.lastIndexOf('.');
    const fileExtension = lastDotIndex > 0 ? file.name.substring(lastDotIndex) : '';
    const targetPath = `${booksPath}/${bookId}${fileExtension || '.txt'}`;

    // Write file to app data
    onProgress?.({
      status: 'copying',
      fileName: file.name,
      progress: 20,
      currentStep: 'Copying file...',
    });

    await writeFileToAppData(targetPath, fileContent);

    // Parse the book using BookParserService directly
    // ImportService file handling is delegated to Electron APIs
    // So we'll parse the file directly
    onProgress?.({
      status: 'parsing',
      fileName: file.name,
      progress: 40,
      currentStep: 'Parsing book...',
    });

    // Import BookParserService and MetadataExtractor
    const {BookParserService} = await import('@xenolexia/shared/services/BookParser');
    const {MetadataExtractor, extractEPUBMetadata} = await import('@xenolexia/shared/services/BookParser');
    
    // Parse metadata based on format
    let metadata: {title: string; author: string; language?: string};
    try {
      if (fileExtension === '.epub') {
        const extracted = await extractEPUBMetadata(targetPath);
        metadata = {
          title: extracted.title || file.name.replace(/\.[^.]+$/, ''),
          author: extracted.author || 'Unknown Author',
          language: extracted.language,
        };
      } else {
        // For other formats, use BookParserService
        const format = fileExtension.toLowerCase() === '.mobi' ? 'mobi' :
                       fileExtension.toLowerCase() === '.fb2' ? 'fb2' : 'txt';
        const parser = BookParserService.getParser(targetPath, format as any);
        const parsed = await parser.parse(targetPath);
        metadata = {
          title: parsed.metadata.title || file.name.replace(/\.[^.]+$/, ''),
          author: parsed.metadata.author || 'Unknown Author',
          language: parsed.metadata.language,
        };
      }
    } catch (error) {
      console.warn('Failed to extract metadata, using defaults:', error);
      metadata = {
        title: file.name.replace(/\.[^.]+$/, ''),
        author: 'Unknown Author',
        language: 'en',
      };
    }

    // Extract cover if EPUB
    let coverPath: string | undefined;
    if (fileExtension === '.epub') {
      try {
        const {MetadataExtractor} = await import('@xenolexia/shared/services/BookParser');
        const extractor = new MetadataExtractor();
        try {
          await extractor.extractFromFile(targetPath);
          const coverDir = `${booksPath}/${bookId}`;
          coverPath = await extractor.extractCover(coverDir);
        } finally {
          extractor.dispose();
        }
      } catch (error) {
        console.warn('Failed to extract cover:', error);
      }
    }

    // Determine format from extension (remove leading dot)
    const format = fileExtension.toLowerCase() === '.epub' ? 'epub' :
                   fileExtension.toLowerCase() === '.mobi' ? 'mobi' :
                   fileExtension.toLowerCase() === '.fb2' ? 'fb2' : 'txt';

    // Create Book object
    const book: Book = {
      id: bookId,
      title: metadata.title,
      author: metadata.author,
      filePath: targetPath,
      format: format as any,
      fileSize: file.size,
      coverPath: coverPath,
      languagePair: {
        sourceLanguage: metadata.language || 'en',
        targetLanguage: 'el', // Default, can be changed in settings
      },
      addedAt: new Date(),
      lastReadAt: null,
      progress: 0,
      totalChapters: 0,
      currentChapter: 0,
      proficiencyLevel: 'beginner',
      wordDensity: 0.3,
    };

    // Add book to library
    onProgress?.({
      status: 'saving',
      fileName: file.name,
      progress: 90,
      currentStep: 'Adding to library...',
    });

    await useLibraryStore.getState().addBook(book);

    onProgress?.({
      status: 'complete',
      fileName: file.name,
      progress: 100,
      currentStep: 'Import complete!',
    });

    return book;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Import failed';
    onProgress?.({
      status: 'error',
      fileName: '',
      progress: 0,
      currentStep: 'Import failed',
      error: errorMessage,
    });
    throw error;
  }
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.epub': 'application/epub+zip',
    '.mobi': 'application/x-mobipocket-ebook',
    '.fb2': 'application/x-fictionbook+xml',
    '.txt': 'text/plain',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}
