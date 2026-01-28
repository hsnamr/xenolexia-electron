/**
 * Tests for BookDownloadService - Online library search and import
 */

import {BookDownloadService} from '../services/BookDownloadService';
import RNFS from 'react-native-fs';

// Mock dependencies
jest.mock('react-native-fs');
jest.mock('react-native', () => ({
  Platform: {OS: 'test'},
}));

// Mock FileSystemService - needs to be mocked before BookDownloadService imports it
jest.mock('../services/FileSystemService/FileSystemService.web', () => ({
  FileSystemService: {
    isSupported: jest.fn(() => false),
    initialize: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('BookDownloadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (RNFS.exists as jest.Mock).mockResolvedValue(true);
    (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);
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

      // Mock download
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      });

      (RNFS.writeFile as jest.Mock).mockResolvedValue(undefined);
      (RNFS.stat as jest.Mock).mockResolvedValue({size: 1024});

      const progressCallback = jest.fn();

      const result = await BookDownloadService.downloadBook(mockSearchResult, {
        onProgress: progressCallback,
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
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

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      });

      (RNFS.writeFile as jest.Mock).mockResolvedValue(undefined);
      (RNFS.stat as jest.Mock).mockResolvedValue({size: 1024});

      const progressCallback = jest.fn();

      await BookDownloadService.downloadBook(mockSearchResult, {
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();
    });
  });
});
