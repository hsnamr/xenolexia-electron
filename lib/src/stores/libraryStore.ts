/**
 * Library Store - Manages book collection with database persistence
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';

import type {Book} from 'xenolexia-typescript';
import type {BookFilter, BookSort} from 'xenolexia-typescript';
import {getCore} from '../electronCore';
import { Platform } from '../utils/platform.electron';

// Check if we're on web (Electron is not web)
const IS_WEB = false; // Electron is desktop, not web

// Custom storage for web that handles Date serialization
const webStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

// ============================================================================
// Types
// ============================================================================

interface LibraryState {
  // State
  books: Book[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  currentFilter: BookFilter | null;
  currentSort: BookSort;

  // Basic Actions
  addBook: (book: Book) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  getBook: (bookId: string) => Book | undefined;

  // Data Loading
  initialize: () => Promise<void>;
  refreshBooks: () => Promise<void>;
  loadBooks: (filter?: BookFilter, sort?: BookSort) => Promise<void>;
  searchBooks: (query: string) => Promise<void>;

  // Progress tracking
  updateProgress: (
    bookId: string,
    progress: number,
    location: string | null,
    chapter?: number,
    page?: number,
  ) => Promise<void>;
  updateReadingTime: (bookId: string, minutes: number) => Promise<void>;

  // Filtering & Sorting
  setFilter: (filter: BookFilter | null) => void;
  setSort: (sort: BookSort) => void;

  // State setters
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Data management
  clearLibrary: () => Promise<void>;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SORT: BookSort = {
  by: 'lastReadAt',
  order: 'desc',
};

// ============================================================================
// Helper to convert dates in books
// ============================================================================

const serializeBook = (book: Book): any => ({
  ...book,
  addedAt: book.addedAt instanceof Date ? book.addedAt.toISOString() : book.addedAt,
  lastReadAt: book.lastReadAt instanceof Date ? book.lastReadAt.toISOString() : book.lastReadAt,
});

const deserializeBook = (book: any): Book => ({
  ...book,
  addedAt: new Date(book.addedAt),
  lastReadAt: book.lastReadAt ? new Date(book.lastReadAt) : null,
});

// ============================================================================
// Store Implementation
// ============================================================================

// Create store with persistence for web
const createLibraryStore = () => {
  const storeLogic = (set: any, get: any): LibraryState => ({
    // Initial state
    books: [],
    isLoading: false,
    error: null,
    isInitialized: false,
    currentFilter: null,
    currentSort: DEFAULT_SORT,

    // ============================================================================
    // Initialization
    // ============================================================================

    initialize: async () => {
      const state = get();
      if (state.isInitialized) return;

      set({isLoading: true, error: null});

      try {
        // On web, books are loaded from localStorage via persist middleware
        // On native, load from database
        if (!IS_WEB) {
          const books = await getCore().storageService.getBookRepository().getAll(state.currentSort);
          set({
            books,
            isLoading: false,
            isInitialized: true,
          });
        } else {
          // Web: books already loaded from localStorage, just mark as initialized
          console.log('[LibraryStore] Web initialized with', state.books.length, 'books');
          set({
            isLoading: false,
            isInitialized: true,
          });
        }
      } catch (error) {
        console.error('[LibraryStore] Failed to initialize:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load library',
          isLoading: false,
          isInitialized: true,
        });
      }
    },

    // ============================================================================
    // Basic CRUD Operations
    // ============================================================================

    addBook: async (book: Book) => {
      try {
        // On native, add to database first
        if (!IS_WEB) {
          await getCore().storageService.addBook(book);
        }

        // Update local state (persist middleware handles localStorage on web)
        set((state: LibraryState) => ({
          books: [book, ...state.books],
        }));

        console.log('[LibraryStore] Book added:', book.id, book.title);
      } catch (error) {
        console.error('[LibraryStore] Failed to add book:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to add book',
        });
        throw error;
      }
    },

    removeBook: async (bookId: string) => {
      try {
        if (!IS_WEB) {
          await getCore().storageService.deleteBook(bookId);
        }

        // Delete the book files
        try {
          const { ImportService } = await import('../services/ImportService');
          await ImportService.deleteBook(bookId);
        } catch (deleteError) {
          console.warn('[LibraryStore] Failed to delete book files:', deleteError);
          // Continue anyway - remove from library even if files fail to delete
        }

        set((state: LibraryState) => ({
          books: state.books.filter(b => b.id !== bookId),
        }));

        console.log('[LibraryStore] Book removed:', bookId);
      } catch (error) {
        console.error('[LibraryStore] Failed to remove book:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to remove book',
        });
        throw error;
      }
    },

    updateBook: async (bookId: string, updates: Partial<Book>) => {
      try {
        if (!IS_WEB) {
          await getCore().storageService.updateBook(bookId, updates);
        }

        set((state: LibraryState) => ({
          books: state.books.map(book =>
            book.id === bookId ? {...book, ...updates} : book,
          ),
        }));
      } catch (error) {
        console.error('[LibraryStore] Failed to update book:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to update book',
        });
        throw error;
      }
    },

    getBook: (bookId: string) => {
      return get().books.find((b: Book) => b.id === bookId);
    },

    // ============================================================================
    // Data Loading
    // ============================================================================

    refreshBooks: async () => {
      const state = get();
      
      // On web, books are already in state from localStorage
      if (IS_WEB) {
        return;
      }

      set({isLoading: true, error: null});

      try {
        let books: Book[];

        if (state.currentFilter) {
          books = await getCore().storageService.getBookRepository().getFiltered(
            state.currentFilter,
            state.currentSort,
          );
        } else {
          books = await getCore().storageService.getBookRepository().getAll(state.currentSort);
        }

        set({books, isLoading: false});
      } catch (error) {
        console.error('[LibraryStore] Failed to refresh books:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load books',
          isLoading: false,
        });
      }
    },

    loadBooks: async (filter?: BookFilter, sort?: BookSort) => {
      const currentSort = sort ?? get().currentSort;
      set({currentFilter: filter ?? null, currentSort});

      // On web, filter/sort in memory
      if (IS_WEB) {
        return;
      }

      set({isLoading: true, error: null});

      try {
        let books: Book[];

        if (filter) {
          books = await getCore().storageService.getBookRepository().getFiltered(filter, currentSort);
        } else {
          books = await getCore().storageService.getBookRepository().getAll(currentSort);
        }

        set({books, isLoading: false});
      } catch (error) {
        console.error('[LibraryStore] Failed to load books:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load books',
          isLoading: false,
        });
      }
    },

    searchBooks: async (query: string) => {
      if (!query.trim()) {
        return get().refreshBooks();
      }

      // On web, search in memory
      if (IS_WEB) {
        return;
      }

      set({isLoading: true, error: null});

      try {
        const books = await getCore().storageService.getBookRepository().search(query);
        set({books, isLoading: false});
      } catch (error) {
        console.error('[LibraryStore] Failed to search books:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to search books',
          isLoading: false,
        });
      }
    },

    // ============================================================================
    // Progress Tracking
    // ============================================================================

    updateProgress: async (
      bookId: string,
      progress: number,
      location: string | null,
      chapter?: number,
      page?: number,
    ) => {
      try {
        if (!IS_WEB) {
          await getCore().storageService.getBookRepository().updateProgress(bookId, progress, location, chapter, page);
        }

        set((state: LibraryState) => ({
          books: state.books.map(book =>
            book.id === bookId
              ? {
                  ...book,
                  progress: Math.min(100, Math.max(0, progress)),
                  currentLocation: location,
                  currentChapter: chapter ?? book.currentChapter,
                  currentPage: page ?? book.currentPage,
                  lastReadAt: new Date(),
                }
              : book,
          ),
        }));
      } catch (error) {
        console.error('[LibraryStore] Failed to update progress:', error);
      }
    },

    updateReadingTime: async (bookId: string, minutes: number) => {
      try {
        if (!IS_WEB) {
          await getCore().storageService.getBookRepository().addReadingTime(bookId, minutes);
        }

        set((state: LibraryState) => ({
          books: state.books.map(book =>
            book.id === bookId
              ? {
                  ...book,
                  readingTimeMinutes: book.readingTimeMinutes + minutes,
                  lastReadAt: new Date(),
                }
              : book,
          ),
        }));
      } catch (error) {
        console.error('[LibraryStore] Failed to update reading time:', error);
      }
    },

    // ============================================================================
    // Filtering & Sorting
    // ============================================================================

    setFilter: (filter: BookFilter | null) => {
      set({currentFilter: filter});
      if (!IS_WEB) {
        get().refreshBooks();
      }
    },

    setSort: (sort: BookSort) => {
      set({currentSort: sort});
      if (!IS_WEB) {
        get().refreshBooks();
      }
    },

    // ============================================================================
    // State Setters
    // ============================================================================

    setLoading: (loading: boolean) => {
      set({isLoading: loading});
    },

    setError: (error: string | null) => {
      set({error});
    },

    clearError: () => {
      set({error: null});
    },

    // ============================================================================
    // Data Management
    // ============================================================================

    clearLibrary: async () => {
      set({isLoading: true});
      try {
        if (!IS_WEB) {
          await getCore().storageService.getBookRepository().deleteAll();
        }
        set({
          books: [],
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to clear library:', error);
        set({isLoading: false});
        throw error;
      }
    },
  });

  // On web, use persist middleware
  if (IS_WEB) {
    return create<LibraryState>()(
      persist(storeLogic, {
        name: 'xenolexia-library',
        storage: createJSONStorage(() => webStorage),
        partialize: (state) => ({
          books: state.books.map(serializeBook),
          currentSort: state.currentSort,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Deserialize dates in books
            state.books = state.books.map(deserializeBook);
            console.log('[LibraryStore] Rehydrated', state.books.length, 'books from localStorage');
          }
        },
      })
    );
  }

  // On native, use regular store (database handles persistence)
  return create<LibraryState>(storeLogic);
};

export const useLibraryStore = createLibraryStore();

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get books currently in progress
 */
export const selectBooksInProgress = (state: LibraryState) =>
  state.books.filter(book => book.progress > 0 && book.progress < 100);

/**
 * Get completed books
 */
export const selectCompletedBooks = (state: LibraryState) =>
  state.books.filter(book => book.progress >= 100);

/**
 * Get recently added books
 */
export const selectRecentlyAdded = (state: LibraryState, limit: number = 5) =>
  [...state.books]
    .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
    .slice(0, limit);

/**
 * Get recently read books
 */
export const selectRecentlyRead = (state: LibraryState, limit: number = 5) =>
  [...state.books]
    .filter(book => book.lastReadAt !== null)
    .sort((a, b) => (b.lastReadAt?.getTime() ?? 0) - (a.lastReadAt?.getTime() ?? 0))
    .slice(0, limit);
