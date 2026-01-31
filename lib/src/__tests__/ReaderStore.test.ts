/**
 * Tests for ReaderStore - Opening ebooks and progress tracking.
 * Store uses getCore() and BookParserService from xenolexia-typescript; parser is mocked here.
 */

import { useReaderStore } from '../stores/readerStore';

import type { Book } from '../types';

// Injected into BookParserService mock (set per test)
let mockParserResult: { chapters: Array<{ index: number; title: string; content: string }>; tableOfContents: unknown[] } = {
  chapters: [],
  tableOfContents: [],
};
let mockParserParseError: Error | null = null;

jest.mock('xenolexia-typescript', () => {
  const actual = jest.requireActual('xenolexia-typescript');
  return {
    ...actual,
    BookParserService: {
      detectFormat: () => 'epub',
      getParser: () => ({
        parse: () =>
          mockParserParseError
            ? Promise.reject(mockParserParseError)
            : Promise.resolve(mockParserResult),
        dispose: () => {},
      }),
    },
  };
});

describe('ReaderStore', () => {
  beforeEach(() => {
    mockParserParseError = null;
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
        { index: 0, title: 'Chapter 1', content: '<p>Content 1</p>' },
        { index: 1, title: 'Chapter 2', content: '<p>Content 2</p>' },
        { index: 2, title: 'Chapter 3', content: '<p>Content 3</p>' },
      ];
      mockParserResult = { chapters: mockChapters, tableOfContents: [] };

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
        { index: 0, title: 'Chapter 1', content: '<p>Content 1</p>' },
        { index: 1, title: 'Chapter 2', content: '<p>Content 2</p>' },
        { index: 2, title: 'Chapter 3', content: '<p>Content 3</p>' },
      ];
      mockParserResult = { chapters: mockChapters, tableOfContents: [] };

      await useReaderStore.getState().loadBook(mockBook);

      const state = useReaderStore.getState();
      // loadBook resumes at book.currentChapter (2); goToChapter(2) should set currentChapterIndex and currentChapter
      expect(state.chapters).toHaveLength(3);
      expect(state.currentChapterIndex).toBe(2);
      expect(state.currentChapter?.title).toBe('Chapter 3');
    });

    it('should handle book loading errors', async () => {
      mockParserParseError = new Error('File not found');

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
    beforeEach(() => {
      const mockChapters = [
        { index: 0, title: 'Chapter 1', content: '<p>Content 1</p>' },
        { index: 1, title: 'Chapter 2', content: '<p>Content 2</p>' },
        { index: 2, title: 'Chapter 3', content: '<p>Content 3</p>' },
      ];
      useReaderStore.setState({
        currentBook: {
          id: 'book-1',
          title: 'Test',
          author: '',
          filePath: '/path.epub',
          format: 'epub',
          languagePair: { sourceLanguage: 'en', targetLanguage: 'el' },
          addedAt: new Date(),
          lastReadAt: null,
          progress: 0,
          totalChapters: 3,
          currentChapter: 0,
          proficiencyLevel: 'beginner',
          wordDensity: 0.3,
        } as Book,
        chapters: mockChapters,
        currentChapterIndex: 1,
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
