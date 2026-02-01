/**
 * Tests for ImportService - Book import from local storage
 */

// Mock DatabaseService.electron (used by dependency chain) to avoid singleton init
jest.mock('../services/StorageService/DatabaseService.electron', () => {
  const m = {
    initialize: jest.fn(),
    run: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    exec: jest.fn(),
  };
  return {
    databaseService: m,
    DatabaseService: jest.fn().mockImplementation(() => m),
  };
});

jest.mock('uuid');
jest.mock('../utils/platform.electron', () => ({Platform: {OS: 'linux'}}));

jest.mock('../utils/FileSystem.electron', () => ({
  getAppDataPath: jest.fn(() => Promise.resolve('/mock/app/data')),
  mkdir: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
  fileExists: jest.fn(() => Promise.resolve(true)),
  readFileAsArrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
  readFileAsText: jest.fn(() => Promise.resolve('')),
  readDir: jest.fn(() => Promise.resolve([])),
  unlink: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/FileSystemService/index', () => ({
  FileSystemService: {
    isSupported: jest.fn(() => false),
    initialize: jest.fn(),
  },
}));

jest.mock('../services/BookParser/MetadataExtractor', () => ({
  MetadataExtractor: {
    extract: jest.fn(),
  },
}));

import {v4 as uuidv4} from 'uuid';

import {ImportService} from '../services/ImportService';

describe('ImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('test-book-id-123');
    const fs = require('../utils/FileSystem.electron');
    (fs.getAppDataPath as jest.Mock).mockResolvedValue('/mock/app/data');
    (fs.fileExists as jest.Mock).mockResolvedValue(true);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.readFileAsArrayBuffer as jest.Mock).mockResolvedValue(new ArrayBuffer(1024));
  });

  describe('importBook - Local Storage', () => {
    it('should import a book file from local storage', async () => {
      const mockFile = {
        uri: 'file:///test/path/book.epub',
        name: 'Test Book.epub',
        type: 'application/epub+zip',
        size: 1024000,
      };

      // Mock file copy (ImportService uses FileSystem.electron writeFile, etc.)
      const fs = require('../utils/FileSystem.electron');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

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

    it('should handle different file formats (EPUB, TXT, MOBI)', async () => {
      const formats = [
        {name: 'book.epub', expectedFormat: 'epub'},
        {name: 'book.txt', expectedFormat: 'txt'},
        {name: 'book.mobi', expectedFormat: 'mobi'},
      ];

      for (const {name, expectedFormat} of formats) {
        const mockFile = {
          uri: `file:///test/path/${name}`,
          name,
          type: 'application/octet-stream',
          size: 1024,
        };

        const fs = require('../utils/FileSystem.electron');
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
        (fs.readFileAsArrayBuffer as jest.Mock).mockResolvedValue(new ArrayBuffer(1024));

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

      const fs = require('../utils/FileSystem.electron');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.readFileAsArrayBuffer as jest.Mock).mockResolvedValue(new ArrayBuffer(1024));

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

      const fs = require('../utils/FileSystem.electron');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.readFileAsArrayBuffer as jest.Mock).mockResolvedValue(new ArrayBuffer(1024));

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

      const fs = require('../utils/FileSystem.electron');
      (fs.readFileAsArrayBuffer as jest.Mock).mockRejectedValue(new Error('Copy failed'));

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
