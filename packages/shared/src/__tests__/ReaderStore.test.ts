/**
 * Tests for ReaderStore - Opening ebooks and progress tracking
 */

import {EPUBParser} from '../services/BookParser/EPUBParser';
import {useReaderStore} from '../stores/readerStore';

import type {Book} from '../types';

// Mock DatabaseService so libraryStore (imported by readerStore) doesn't load real DB
jest.mock('../services/StorageService/DatabaseService', () => ({
  databaseService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    transaction: jest.fn((cb: (tx: unknown) => Promise<void>) => cb({})),
    getOne: jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue([]),
    run: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock StorageService so we don't pull in full StorageService implementation
jest.mock('../services/StorageService/StorageService', () => ({
  StorageService: {
    startSession: jest.fn().mockResolvedValue('session-1'),
    endSession: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock dependencies
jest.mock('../services/BookParser/EPUBParser');
jest.mock('../services/BookParser/ChapterContentService', () => ({
  chapterContentService: {
    loadEpub: jest.fn(),
    getChapterHtml: jest.fn(),
    dispose: jest.fn(),
  },
}));

describe('ReaderStore', () => {
  beforeEach(() => {
    // Mock Electron API so loadBook doesn't throw on file check (Node test env)
    if (typeof global !== 'undefined') {
      (global as any).window = (global as any).window || {};
      (global as any).window.electronAPI = {
        fileExists: jest.fn().mockResolvedValue(true),
      };
    }
    // Reset store state
    useReaderStore.setState({
      currentBook: null,
      chapters: [],
      tableOfContents: [],
      currentChapterIndex: 0,
      currentChapter: null,
      processedHtml: '',
      foreignWords: [],
      scrollPosition: 0,
      chapterProgress: 0,
      overallProgress: 0,
      isLoading: false,
      isLoadingChapter: false,
      error: null,
    });
  });

  describe('loadBook - Opening Ebooks', () => {
    it('should load a book and parse chapters', async () => {
      const mockBook: Book = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/to/book.epub',
        format: 'epub',
        languagePair: {
          sourceLanguage: 'en',
          targetLanguage: 'el',
        },
        addedAt: new Date(),
        lastReadAt: null,
        progress: 0,
        totalChapters: 3,
        currentChapter: 0,
        proficiencyLevel: 'beginner',
        wordDensity: 0.3,
      };

      const mockChapters = [
        {index: 0, title: 'Chapter 1', content: '<p>Content 1</p>'},
        {index: 1, title: 'Chapter 2', content: '<p>Content 2</p>'},
        {index: 2, title: 'Chapter 3', content: '<p>Content 3</p>'},
      ];

      const mockParser = {
        parse: jest.fn().mockResolvedValue({
          chapters: mockChapters,
          tableOfContents: [],
        }),
        dispose: jest.fn(),
      };

      (EPUBParser as jest.Mock).mockImplementation(() => mockParser);

      const {chapterContentService} = require('../services/BookParser/ChapterContentService');
      (chapterContentService.loadEpub as jest.Mock).mockResolvedValue(undefined);
      (chapterContentService.getChapterHtml as jest.Mock).mockResolvedValue({
        html: '<html><body><p>Content 1</p></body></html>',
        baseStyles: '',
        scripts: '',
      });

      await useReaderStore.getState().loadBook(mockBook);

      const state = useReaderStore.getState();
      expect(state.currentBook).toEqual(mockBook);
      expect(state.chapters).toHaveLength(3);
      expect(state.currentChapterIndex).toBe(0);
      expect(state.isLoading).toBe(false);
    });

    it.skip('should resume from saved chapter position', async () => {
      const mockBook: Book = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/path/to/book.epub',
        format: 'epub',
        languagePair: {
          sourceLanguage: 'en',
          targetLanguage: 'el',
        },
        addedAt: new Date(),
        lastReadAt: null,
        progress: 0,
        totalChapters: 3,
        currentChapter: 2, // Resume at chapter 2
        proficiencyLevel: 'beginner',
        wordDensity: 0.3,
      };

      const mockChapters = [
        {index: 0, title: 'Chapter 1', content: '<p>Content 1</p>'},
        {index: 1, title: 'Chapter 2', content: '<p>Content 2</p>'},
        {index: 2, title: 'Chapter 3', content: '<p>Content 3</p>'},
      ];

      const mockParser = {
        parse: jest.fn().mockResolvedValue({
          chapters: mockChapters,
          tableOfContents: [],
        }),
        dispose: jest.fn(),
      };

      (EPUBParser as jest.Mock).mockImplementation(() => mockParser);

      const {chapterContentService} = require('../services/BookParser/ChapterContentService');
      (chapterContentService.loadEpub as jest.Mock).mockResolvedValue(undefined);
      (chapterContentService.getChapterHtml as jest.Mock).mockResolvedValue({
        html: '<html><body><p>Content 3</p></body></html>',
        baseStyles: '',
        scripts: '',
      });

      await useReaderStore.getState().loadBook(mockBook);

      const state = useReaderStore.getState();
      // loadBook resumes at book.currentChapter (2); goToChapter(2) should set currentChapterIndex and currentChapter
      expect(state.chapters).toHaveLength(3);
      expect(state.currentChapterIndex).toBe(2);
      expect(state.currentChapter?.title).toBe('Chapter 3');
    });

    it('should handle book loading errors', async () => {
      const mockBook: Book = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        filePath: '/invalid/path.epub',
        format: 'epub',
        languagePair: {
          sourceLanguage: 'en',
          targetLanguage: 'el',
        },
        addedAt: new Date(),
        lastReadAt: null,
        progress: 0,
        totalChapters: 0,
        currentChapter: 0,
        proficiencyLevel: 'beginner',
        wordDensity: 0.3,
      };

      const mockParser = {
        parse: jest.fn().mockRejectedValue(new Error('File not found')),
        dispose: jest.fn(),
      };

      (EPUBParser as jest.Mock).mockImplementation(() => mockParser);

      await useReaderStore.getState().loadBook(mockBook);

      const state = useReaderStore.getState();
      expect(state.error).toBeDefined();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateProgress - Progress Tracking', () => {
    it('should update chapter progress', () => {
      useReaderStore.setState({
        chapters: [
          {index: 0, title: 'Chapter 1', content: ''},
          {index: 1, title: 'Chapter 2', content: ''},
          {index: 2, title: 'Chapter 3', content: ''},
        ],
        currentChapterIndex: 1,
      });

      useReaderStore.getState().updateProgress(50);

      const state = useReaderStore.getState();
      expect(state.chapterProgress).toBe(50);
      // Overall progress should be: (1/3 * 100) + (0.5/3 * 100) = 33.33 + 16.67 = 50
      expect(state.overallProgress).toBeGreaterThan(0);
      expect(state.overallProgress).toBeLessThanOrEqual(100);
    });

    it('should calculate overall progress correctly', () => {
      useReaderStore.setState({
        chapters: [
          {index: 0, title: 'Chapter 1', content: ''},
          {index: 1, title: 'Chapter 2', content: ''},
        ],
        currentChapterIndex: 0,
      });

      useReaderStore.getState().updateProgress(100);

      const state = useReaderStore.getState();
      // Chapter 1 complete: (1/2 * 100) = 50%
      expect(state.overallProgress).toBe(50);
    });

    it('should clamp progress to 0-100 range', () => {
      useReaderStore.setState({
        chapters: [{index: 0, title: 'Chapter 1', content: ''}],
        currentChapterIndex: 0,
      });

      useReaderStore.getState().updateProgress(150);
      expect(useReaderStore.getState().overallProgress).toBeLessThanOrEqual(100);

      useReaderStore.getState().updateProgress(-10);
      expect(useReaderStore.getState().overallProgress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('goToNextChapter / goToPreviousChapter', () => {
    beforeEach(async () => {
      const mockChapters = [
        {index: 0, title: 'Chapter 1', content: '<p>Content 1</p>'},
        {index: 1, title: 'Chapter 2', content: '<p>Content 2</p>'},
        {index: 2, title: 'Chapter 3', content: '<p>Content 3</p>'},
      ];

      useReaderStore.setState({
        chapters: mockChapters,
        currentChapterIndex: 1,
      });

      const {chapterContentService} = require('../services/BookParser/ChapterContentService');
      (chapterContentService.getChapterHtml as jest.Mock).mockResolvedValue({
        html: '<html><body><p>Content</p></body></html>',
        baseStyles: '',
        scripts: '',
      });
    });

    it('should navigate to next chapter', async () => {
      await useReaderStore.getState().goToNextChapter();

      const state = useReaderStore.getState();
      expect(state.currentChapterIndex).toBe(2);
    });

    it('should navigate to previous chapter', async () => {
      await useReaderStore.getState().goToPreviousChapter();

      const state = useReaderStore.getState();
      expect(state.currentChapterIndex).toBe(0);
    });

    it('should not go beyond chapter boundaries', async () => {
      useReaderStore.setState({currentChapterIndex: 2});
      await useReaderStore.getState().goToNextChapter();
      expect(useReaderStore.getState().currentChapterIndex).toBe(2); // Should not exceed

      useReaderStore.setState({currentChapterIndex: 0});
      await useReaderStore.getState().goToPreviousChapter();
      expect(useReaderStore.getState().currentChapterIndex).toBe(0); // Should not go below
    });
  });

  describe('closeBook', () => {
    it('should clean up resources when closing book', () => {
      const mockParser = {
        dispose: jest.fn(),
      };

      useReaderStore.setState({
        parser: mockParser as any,
      });

      useReaderStore.getState().closeBook();

      expect(mockParser.dispose).toHaveBeenCalled();

      const state = useReaderStore.getState();
      expect(state.currentBook).toBeNull();
      expect(state.chapters).toHaveLength(0);
      expect(state.processedHtml).toBe('');
    });
  });
});
