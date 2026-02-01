/**
 * Jest setup for @xenolexia/shared.
 * Initializes xenolexia-typescript core with mock adapters so getCore() works in tests.
 */

import { setElectronAdapters } from './src/electronCore';
import type { IFileSystem, IDataStore, IKeyValueStore } from 'xenolexia-typescript';

// ---------------------------------------------------------------------------
// Electron / Node environment (no React Native)
// ---------------------------------------------------------------------------
if (typeof process === 'undefined') (global as any).process = { platform: 'linux' };

if (typeof window === 'undefined') {
  (global as any).window = {};
  (global as any).window.electronAPI = undefined;
}

// ---------------------------------------------------------------------------
// Mock adapters for xenolexia-typescript core (so getCore() works in tests)
// ---------------------------------------------------------------------------
const mockFileSystem: IFileSystem = {
  readFile: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  readFileAsText: jest.fn().mockResolvedValue(''),
  writeFile: jest.fn().mockResolvedValue(undefined),
  fileExists: jest.fn().mockResolvedValue(false),
  mkdir: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
};

function createMockDataStore(): IDataStore {
  const noop = jest.fn().mockResolvedValue(undefined);
  const noopNull = jest.fn().mockResolvedValue(null);
  const noopArray = jest.fn().mockResolvedValue([]);
  const noopNumber = jest.fn().mockResolvedValue(0);
  return {
    initialize: noop,
    close: noop,
    isReady: jest.fn().mockReturnValue(true),
    getSchemaVersion: jest.fn().mockResolvedValue(1),
    getBookById: noopNull,
    getBooks: noopArray,
    addBook: noop,
    updateBook: noop,
    deleteBook: noop,
    deleteAllBooks: noop,
    getBookCount: noopNumber,
    getBookStatistics: jest.fn().mockResolvedValue({ total: 0, in_progress: 0, completed: 0, total_time: 0 }),
    getVocabularyById: noopNull,
    getVocabulary: noopArray,
    addVocabulary: noop,
    updateVocabulary: noop,
    deleteVocabulary: noop,
    deleteAllVocabulary: noop,
    getVocabularyDueCount: noopNumber,
    getVocabularyStatistics: jest.fn().mockResolvedValue({
      total: 0,
      new_count: 0,
      learning_count: 0,
      review_count: 0,
      learned_count: 0,
      due: 0,
    }),
    getVocabularyCountByStatus: noopNumber,
    getSessionById: noopNull,
    getSessionsByBookId: noopArray,
    getRecentSessions: noopArray,
    getTodaySessions: noopArray,
    addSession: noop,
    updateSession: noop,
    deleteSession: noop,
    deleteSessionsByBookId: noop,
    deleteAllSessions: noop,
    getSessionStatistics: jest.fn().mockResolvedValue({
      totalBooksRead: 0,
      totalReadingTime: 0,
      totalWordsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageSessionDuration: 0,
      wordsRevealedToday: 0,
      wordsSavedToday: 0,
    }),
    getReadingTimeForPeriod: noopNumber,
    getDailyReadingTime: noopArray,
    getDistinctSessionDays: noopArray,
    getPreference: noopNull,
    setPreference: noop,
    getWordListEntry: noopNull,
    getWordListEntryByVariant: noopNull,
    getWordListByLevel: noopArray,
    getWordListByLangs: noopArray,
    getWordListCount: noopNumber,
    addWordListEntry: noop,
    deleteWordListByPair: noop,
    getWordListProficiencyCounts: jest.fn().mockResolvedValue({}),
    getWordListPosCounts: jest.fn().mockResolvedValue({}),
    getWordListStats: jest.fn().mockResolvedValue({ total: 0, pairs: [] }),
    getWordListSearch: noopArray,
    runTransaction: noop,
  } as IDataStore;
}

const mockKeyValueStore: IKeyValueStore = {
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
};

setElectronAdapters({
  fileSystem: mockFileSystem,
  dataStore: createMockDataStore(),
  keyValueStore: mockKeyValueStore,
});

// ---------------------------------------------------------------------------
// Legacy mocks (uuid, jszip, electron-store, console)
// ---------------------------------------------------------------------------
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    store: {},
  }));
});

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    loadAsync: jest.fn(),
    file: jest.fn(),
  }));
});

(global as any).console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
