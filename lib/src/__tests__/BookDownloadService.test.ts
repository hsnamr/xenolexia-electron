/**
 * Tests for BookDownloadService - Online library search and import
 */

// Mock Electron FileSystem and Platform before any imports that use them
jest.mock('../utils/FileSystem.electron', () => ({
  getAppDataPath: jest.fn(() => Promise.resolve('/mock/app/data')),
  writeFile: jest.fn(() => Promise.resolve()),
  mkdir: jest.fn(() => Promise.resolve()),
  fileExists: jest.fn(() => Promise.resolve(true)),
  readDir: jest.fn(() => Promise.resolve([])),
  unlink: jest.fn(() => Promise.resolve()),
}));
jest.mock('../utils/platform.electron', () => ({
  Platform: {OS: 'linux'},
}));

jest.mock('../services/FileSystemService', () => ({
  FileSystemService: {
    isSupported: jest.fn(() => false),
    initialize: jest.fn(),
  },
}));

import {BookDownloadService} from '../services/BookDownloadService';

// Mock fetch globally
global.fetch = jest.fn();

describe('BookDownloadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const {fileExists, mkdir} = require('../utils/FileSystem.electron');
    (fileExists as jest.Mock).mockResolvedValue(true);
    (mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  describe('searchBooks - Online Library Search', () => {
    it('should search Project Gutenberg for books', async () => {
      const mockResponse = {
        results: [
          {
            id: 123,
            title: 'Test Book',
            authors: [{name: 'Test Author'}],
            formats: {
              'application/epub+zip': 'https://example.com/book.epub',
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await BookDownloadService.searchBooks('test', 'gutenberg');

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Test Book');
      expect(result.source).toBe('gutenberg');
      expect(result.error).toBeUndefined();
    });

    it('should handle empty search results', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({results: []}),
      });

      const result = await BookDownloadService.searchBooks('nonexistent', 'gutenberg');

      expect(result.results).toHaveLength(0);
      expect(result.error).toBeDefined();
    });

    it('should handle search errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await BookDownloadService.searchBooks('test', 'gutenberg');

      expect(result.results).toHaveLength(0);
      expect(result.error).toBeDefined();
    });

    it('should validate search query', async () => {
      const result = await BookDownloadService.searchBooks('', 'gutenberg');

      expect(result.results).toHaveLength(0);
      expect(result.error).toBe('Please enter a search term');
    });

    it('should search multiple sources', async () => {
      const sources = ['gutenberg', 'standardebooks', 'openlibrary'] as const;

      for (const source of sources) {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({
            results: [{id: 1, title: `Book from ${source}`}],
          }),
        });

        const result = await BookDownloadService.searchBooks('test', source);

        expect(result.source).toBe(source);
        expect(result.results.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('downloadBook - Import from Online Library', () => {
    it('should download a book from search result', async () => {
      const mockSearchResult = {
        id: '123',
        title: 'Test Book',
        author: 'Test Author',
        downloadUrl: 'https://example.com/book.epub',
        format: 'epub' as const,
        source: 'gutenberg' as const,
      };

      // Mock fetch: downloadWithRNFS uses response.body.getReader()
      const chunk = new Uint8Array(1024);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({'content-length': '1024'}),
        body: {
          getReader: () => ({
            read: jest
              .fn()
              .mockResolvedValueOnce({done: false, value: chunk})
              .mockResolvedValueOnce({done: true, value: undefined}),
          }),
        },
      });

      const {writeFile} = require('../utils/FileSystem.electron');
      (writeFile as jest.Mock).mockResolvedValue(undefined);

      const progressCallback = jest.fn();

      const result = await BookDownloadService.downloadBook(mockSearchResult, progressCallback);

      expect(result.success).toBe(true);
      expect(result.book).toBeDefined();
      expect(result.book?.filePath).toBeDefined();
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle download errors', async () => {
      const mockSearchResult = {
        id: '123',
        title: 'Test Book',
        author: 'Test Author',
        downloadUrl: 'https://example.com/book.epub',
        format: 'epub' as const,
        source: 'gutenberg' as const,
      };

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Download failed'));

      const result = await BookDownloadService.downloadBook(mockSearchResult);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should report download progress', async () => {
      const mockSearchResult = {
        id: '123',
        title: 'Test Book',
        author: 'Test Author',
        downloadUrl: 'https://example.com/book.epub',
        format: 'epub' as const,
        source: 'gutenberg' as const,
      };

      const chunk = new Uint8Array(1024);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Headers({'content-length': '1024'}),
        body: {
          getReader: () => ({
            read: jest
              .fn()
              .mockResolvedValueOnce({done: false, value: chunk})
              .mockResolvedValueOnce({done: true, value: undefined}),
          }),
        },
      });

      const {writeFile} = require('../utils/FileSystem.electron');
      (writeFile as jest.Mock).mockResolvedValue(undefined);

      const progressCallback = jest.fn();

      await BookDownloadService.downloadBook(mockSearchResult, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
    });
  });
});
