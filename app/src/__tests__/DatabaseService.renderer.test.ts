/**
 * Unit tests for DatabaseService.renderer - IPC stub for LowDB in main process
 */

const mockDbInvoke = jest.fn();

beforeEach(() => {
  mockDbInvoke.mockReset();
  (global as unknown as { window?: { electronAPI?: { dbInvoke: typeof mockDbInvoke } } }).window = {
    electronAPI: { dbInvoke: mockDbInvoke },
  };
});

afterAll(() => {
  delete (global as unknown as { window?: unknown }).window;
});

describe('DatabaseService.renderer', () => {
  it('should forward initialize to dbInvoke', async () => {
    mockDbInvoke.mockResolvedValue(undefined);
    const { databaseService } = require('../services/DatabaseService.renderer');
    await databaseService.initialize();
    expect(mockDbInvoke).toHaveBeenCalledWith('initialize');
  });

  it('should forward getBookById and return result', async () => {
    const mockBook = { id: 'b1', title: 'Test', author: 'Author' };
    mockDbInvoke.mockResolvedValue(mockBook);
    const { databaseService } = require('../services/DatabaseService.renderer');
    const result = await databaseService.getBookById('b1');
    expect(mockDbInvoke).toHaveBeenCalledWith('getBookById', 'b1');
    expect(result).toEqual(mockBook);
  });

  it('should forward getBooks with options', async () => {
    mockDbInvoke.mockResolvedValue([]);
    const { databaseService } = require('../services/DatabaseService.renderer');
    await databaseService.getBooks({ sort: { by: 'title', order: 'asc' }, limit: 10 });
    expect(mockDbInvoke).toHaveBeenCalledWith('getBooks', {
      sort: { by: 'title', order: 'asc' },
      limit: 10,
    });
  });

  it('should forward addBook and not return value', async () => {
    mockDbInvoke.mockResolvedValue(undefined);
    const { databaseService } = require('../services/DatabaseService.renderer');
    const row = { id: 'b1', title: 'T', author: null, file_path: '/x', format: 'epub', added_at: 0, last_read_at: null, progress: 0, current_location: null, source_lang: 'en', target_lang: 'es', proficiency: 'intermediate', word_density: 0.3, cover_path: null, is_downloaded: 0 };
    await databaseService.addBook(row);
    expect(mockDbInvoke).toHaveBeenCalledWith('addBook', row);
  });

  it('should forward setPreference and getPreference', async () => {
    mockDbInvoke.mockResolvedValue(undefined);
    const { databaseService } = require('../services/DatabaseService.renderer');
    await databaseService.setPreference('key', 'value');
    expect(mockDbInvoke).toHaveBeenCalledWith('setPreference', 'key', 'value');

    mockDbInvoke.mockResolvedValue('stored-value');
    const value = await databaseService.getPreference('key');
    expect(mockDbInvoke).toHaveBeenCalledWith('getPreference', 'key');
    expect(value).toBe('stored-value');
  });

  it('should forward runTransaction with operations array', async () => {
    mockDbInvoke.mockResolvedValue(undefined);
    const { databaseService } = require('../services/DatabaseService.renderer');
    const ops = [
      { method: 'deleteAllVocabulary', args: [] },
      { method: 'deleteAllBooks', args: [] },
    ];
    await databaseService.runTransaction(ops);
    expect(mockDbInvoke).toHaveBeenCalledWith('runTransaction', ops);
  });

  it('should forward getSessionStatistics and return ReadingStats shape', async () => {
    const mockStats = {
      totalBooksRead: 1,
      totalReadingTime: 3600,
      totalWordsLearned: 5,
      currentStreak: 2,
      longestStreak: 3,
      averageSessionDuration: 1200,
      wordsRevealedToday: 10,
      wordsSavedToday: 2,
    };
    mockDbInvoke.mockResolvedValue(mockStats);
    const { databaseService } = require('../services/DatabaseService.renderer');
    const result = await databaseService.getSessionStatistics();
    expect(mockDbInvoke).toHaveBeenCalledWith('getSessionStatistics');
    expect(result).toEqual(mockStats);
  });

  it('should forward word list methods', async () => {
    mockDbInvoke.mockResolvedValue(null);
    const { databaseService } = require('../services/DatabaseService.renderer');
    await databaseService.getWordListEntry('hello', 'en', 'es');
    expect(mockDbInvoke).toHaveBeenCalledWith('getWordListEntry', 'hello', 'en', 'es');

    mockDbInvoke.mockResolvedValue(42);
    const count = await databaseService.getWordListCount('en', 'es');
    expect(mockDbInvoke).toHaveBeenCalledWith('getWordListCount', 'en', 'es');
    expect(count).toBe(42);
  });

  it('isReady should return true', () => {
    const { databaseService } = require('../services/DatabaseService.renderer');
    expect(databaseService.isReady()).toBe(true);
  });

  it('getInstance should return same singleton', () => {
    const { databaseService, DatabaseService } = require('../services/DatabaseService.renderer');
    const instance = DatabaseService.getInstance();
    expect(instance).toBe(databaseService);
  });
});
