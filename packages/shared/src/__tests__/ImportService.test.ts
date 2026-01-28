/**
 * Tests for ImportService - Book import from local storage
 */

import {ImportService} from '../services/ImportService';
import RNFS from 'react-native-fs';
import {v4 as uuidv4} from 'uuid';

// Mock dependencies
jest.mock('react-native-fs');
jest.mock('uuid');
jest.mock('react-native', () => ({
  Platform: {OS: 'test'},
}));

// Mock FileSystemService
jest.mock('../services/FileSystemService/index', () => ({
  FileSystemService: {
    isSupported: jest.fn(() => false),
    initialize: jest.fn(),
  },
}));

// Mock MetadataExtractor
jest.mock('../services/BookParser/MetadataExtractor', () => ({
  MetadataExtractor: {
    extract: jest.fn(),
  },
}));

describe('ImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('test-book-id-123');
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
    (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  describe('importBook - Local Storage', () => {
    it('should import a book file from local storage', async () => {
      const mockFile = {
        uri: 'file:///test/path/book.epub',
        name: 'Test Book.epub',
        type: 'application/epub+zip',
        size: 1024000,
      };

      // Mock file copy
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
      (RNFS.stat as jest.Mock).mockResolvedValue({size: 1024000});

      const progressCallback = jest.fn();

      const result = await ImportService.importBook(mockFile, {
        onProgress: progressCallback,
        extractCover: false,
        parseMetadata: false,
      });

      expect(result.success).toBe(true);
      expect(result.bookId).toBe('test-book-id-123');
      expect(result.metadata.title).toBe('Test Book');
      expect(result.metadata.format).toBe('epub');
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle different file formats (EPUB, TXT, FB2, MOBI)', async () => {
      const formats = [
        {name: 'book.epub', expectedFormat: 'epub'},
        {name: 'book.txt', expectedFormat: 'txt'},
        {name: 'book.fb2', expectedFormat: 'fb2'},
        {name: 'book.mobi', expectedFormat: 'mobi'},
      ];

      for (const {name, expectedFormat} of formats) {
        const mockFile = {
          uri: `file:///test/path/${name}`,
          name,
          type: 'application/octet-stream',
          size: 1024,
        };

        (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
        (RNFS.stat as jest.Mock).mockResolvedValue({size: 1024});

        const result = await ImportService.importBook(mockFile, {
          extractCover: false,
          parseMetadata: false,
        });

        expect(result.success).toBe(true);
        expect(result.metadata.format).toBe(expectedFormat);
      }
    });

    it('should extract title from filename when metadata parsing fails', async () => {
      const mockFile = {
        uri: 'file:///test/path/My Great Book.epub',
        name: 'My Great Book.epub',
        type: 'application/epub+zip',
        size: 1024,
      };

      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
      (RNFS.stat as jest.Mock).mockResolvedValue({size: 1024});

      const result = await ImportService.importBook(mockFile, {
        extractCover: false,
        parseMetadata: false,
      });

      expect(result.metadata.title).toBe('My Great Book');
      expect(result.metadata.author).toBe('Unknown Author');
    });

    it('should report progress during import', async () => {
      const mockFile = {
        uri: 'file:///test/path/book.epub',
        name: 'book.epub',
        type: 'application/epub+zip',
        size: 1024,
      };

      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
      (RNFS.stat as jest.Mock).mockResolvedValue({size: 1024});

      const progressCallback = jest.fn();

      await ImportService.importBook(mockFile, {
        onProgress: progressCallback,
        extractCover: false,
        parseMetadata: false,
      });

      // Should have progress updates
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'copying',
          progress: 10,
        })
      );
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'complete',
          progress: 100,
        })
      );
    });

    it('should handle import errors gracefully', async () => {
      const mockFile = {
        uri: 'file:///test/path/book.epub',
        name: 'book.epub',
        type: 'application/epub+zip',
        size: 1024,
      };

      (RNFS.copyFile as jest.Mock).mockRejectedValue(new Error('Copy failed'));

      const progressCallback = jest.fn();

      const result = await ImportService.importBook(mockFile, {
        onProgress: progressCallback,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
        })
      );
    });
  });
});
