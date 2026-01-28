/**
 * Reader Store - Manages reading state, content loading, and progress tracking
 */

import { create } from 'zustand';
import type {
  Book,
  Chapter,
  ForeignWordData,
  ReaderSettings,
  ProcessedChapter,
  TableOfContentsItem,
} from '../types/index';
import { BookParserService } from '../services/BookParser/BookParserService';
import type { IBookParser } from '../services/BookParser/types';
import {
  ChapterContentService,
  chapterContentService,
} from '../services/BookParser/ChapterContentService';

// ============================================================================
// Types
// ============================================================================

interface ReaderState {
  // Current book state
  currentBook: Book | null;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  currentChapterIndex: number;
  currentChapter: Chapter | null;

  // Processed content
  processedHtml: string;
  foreignWords: ForeignWordData[];

  // Progress tracking
  scrollPosition: number;
  chapterProgress: number;
  overallProgress: number;

  // Reader settings (session copy)
  settings: ReaderSettings & {
    targetLanguage?: string;
    proficiencyLevel?: string;
    wordDensity?: number;
  };

  // UI state
  isLoading: boolean;
  isLoadingChapter: boolean;
  error: string | null;

  // Internal references
  parser: EPUBParser | null;
  contentService: ChapterContentService;

  // Actions
  loadBook: (book: Book) => Promise<void>;
  goToChapter: (index: number) => Promise<void>;
  goToNextChapter: () => Promise<void>;
  goToPreviousChapter: () => Promise<void>;
  updateSettings: (settings: Partial<ReaderState['settings']>) => void;
  updateProgress: (chapterProgress: number) => void;
  updateScrollPosition: (scrollY: number) => void;
  closeBook: () => void;
}

// ============================================================================
// Default Settings
// ============================================================================

const defaultSettings: ReaderState['settings'] = {
  theme: 'light',
  fontFamily: 'Georgia',
  fontSize: 18,
  lineHeight: 1.6,
  marginHorizontal: 24,
  marginVertical: 24,
  textAlign: 'left',
  brightness: 1.0,
  targetLanguage: 'el',
  proficiencyLevel: 'beginner',
  wordDensity: 0.3,
};

// ============================================================================
// Reader Store
// ============================================================================

export const useReaderStore = create<ReaderState>((set, get) => ({
  // Initial state
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
  settings: defaultSettings,
  isLoading: false,
  isLoadingChapter: false,
  error: null,
  parser: null,
  contentService: chapterContentService,

  /**
   * Load a book and parse its content
   */
  loadBook: async (book: Book) => {
    set({ isLoading: true, error: null, currentBook: book });

    try {
      // Verify file exists and Electron API is available
      if (!book.filePath) {
        throw new Error('Book file path is not set');
      }

      // Check if Electron API is available (for desktop)
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const fileExists = await (window as any).electronAPI.fileExists(book.filePath);
        if (!fileExists) {
          throw new Error(`Book file not found: ${book.filePath}`);
        }
        console.log('Loading book from:', book.filePath);
      }

      // Detect format and create appropriate parser
      const format = BookParserService.detectFormat(book.filePath);
      console.log('Detected book format:', format);
      
      const parser = BookParserService.getParser(book.filePath, format);
      console.log('Parser created, parsing book...');
      
      // Parse the book
      const parsedBook = await parser.parse(book.filePath);
      console.log('Book parsed successfully:', {
        chapters: parsedBook.chapters.length,
        toc: parsedBook.tableOfContents.length,
      });

      // Load the book in content service for image extraction (only for EPUB)
      if (format === 'epub') {
        console.log('Loading EPUB in content service...');
        try {
          await get().contentService.loadEpub(book.filePath);
          console.log('Content service loaded');
        } catch (error) {
          console.warn('Failed to load EPUB in content service (images may not work):', error);
          // Continue anyway - chapters can still be displayed without image processing
        }
      }

      // Update state with parsed data
      set({
        parser,
        chapters: parsedBook.chapters,
        tableOfContents: parsedBook.tableOfContents,
        isLoading: false,
        settings: {
          ...get().settings,
          targetLanguage: book.languagePair.targetLanguage,
          proficiencyLevel: book.proficiencyLevel,
          wordDensity: book.wordDensity,
        },
      });

      // Load the first chapter or resume from saved position
      const startChapter = book.currentChapter || 0;
      console.log('Loading chapter:', startChapter);
      await get().goToChapter(startChapter);
      console.log('Chapter loaded successfully');
    } catch (error) {
      console.error('Failed to load book:', error);
      console.error('Book filePath:', book.filePath);
      set({
        error: error instanceof Error ? error.message : 'Failed to load book',
        isLoading: false,
      });
    }
  },

  /**
   * Navigate to a specific chapter
   */
  goToChapter: async (index: number) => {
    const { currentBook, chapters, settings, contentService } = get();

    console.log('goToChapter called:', { index, totalChapters: chapters.length });

    if (index < 0 || index >= chapters.length) {
      console.warn('Invalid chapter index:', index, 'Total chapters:', chapters.length);
      return;
    }

    set({ isLoadingChapter: true, scrollPosition: 0, chapterProgress: 0, error: null });

    try {
      const chapter = chapters[index];
      console.log('Loading chapter:', { index, title: chapter.title, wordCount: chapter.wordCount });

      if (!chapter || !chapter.content) {
        throw new Error(`Chapter ${index} has no content`);
      }

      // Translation options from current book (enables word replacement)
      const translationOptions = currentBook
        ? {
            sourceLanguage: currentBook.languagePair.sourceLanguage,
            targetLanguage: currentBook.languagePair.targetLanguage,
            proficiencyLevel: currentBook.proficiencyLevel,
            density: currentBook.wordDensity,
          }
        : undefined;

      // Generate HTML with styles and optional word replacement
      const processedContent = await contentService.getChapterHtml(
        chapter,
        {
          fontFamily: settings.fontFamily,
          fontSize: settings.fontSize,
          lineHeight: settings.lineHeight,
          textAlign: settings.textAlign,
          marginHorizontal: settings.marginHorizontal,
          theme: settings.theme,
          foreignWordColor: '#6366f1',
        },
        translationOptions
      );

      console.log('Chapter HTML generated, length:', processedContent.html.length, 'foreignWords:', processedContent.foreignWords?.length ?? 0);

      // Calculate overall progress
      const overallProgress = ((index + 1) / chapters.length) * 100;

      set({
        currentChapterIndex: index,
        currentChapter: chapter,
        processedHtml: processedContent.html,
        foreignWords: processedContent.foreignWords ?? [],
        isLoadingChapter: false,
        overallProgress,
        error: null,
      });

      console.log('Chapter loaded successfully');
    } catch (error) {
      console.error('Failed to load chapter:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load chapter',
        isLoadingChapter: false,
        processedHtml: `<div style="padding: 2em; text-align: center;">
          <h2>Error Loading Chapter</h2>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p>Chapter index: ${index} of ${chapters.length}</p>
        </div>`,
      });
    }
  },

  /**
   * Go to next chapter
   */
  goToNextChapter: async () => {
    const { currentChapterIndex, chapters } = get();
    if (currentChapterIndex < chapters.length - 1) {
      await get().goToChapter(currentChapterIndex + 1);
    }
  },

  /**
   * Go to previous chapter
   */
  goToPreviousChapter: async () => {
    const { currentChapterIndex } = get();
    if (currentChapterIndex > 0) {
      await get().goToChapter(currentChapterIndex - 1);
    }
  },

  /**
   * Update reader settings
   */
  updateSettings: (newSettings: Partial<ReaderState['settings']>) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  /**
   * Update reading progress within current chapter
   */
  updateProgress: (chapterProgress: number) => {
    const { currentChapterIndex, chapters } = get();

    // Calculate overall book progress
    const chapterWeight = 1 / chapters.length;
    const overallProgress =
      currentChapterIndex * chapterWeight * 100 +
      chapterProgress * chapterWeight;

    set({
      chapterProgress,
      overallProgress: Math.min(100, Math.max(0, overallProgress)),
    });
  },

  /**
   * Update scroll position for restoring later
   */
  updateScrollPosition: (scrollY: number) => {
    set({ scrollPosition: scrollY });
  },

  /**
   * Close the current book and clean up
   */
  closeBook: () => {
    const { parser, contentService } = get();

    // Clean up resources
    parser?.dispose();
    contentService.dispose();

    set({
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
      parser: null,
      error: null,
    });
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectCurrentChapterTitle = (state: ReaderState) =>
  state.currentChapter?.title || '';

export const selectHasNextChapter = (state: ReaderState) =>
  state.currentChapterIndex < state.chapters.length - 1;

export const selectHasPreviousChapter = (state: ReaderState) =>
  state.currentChapterIndex > 0;

export const selectChapterCount = (state: ReaderState) =>
  state.chapters.length;
