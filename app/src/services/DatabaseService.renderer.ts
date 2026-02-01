/**
 * Database Service - Renderer stub using IPC
 * Implements IDataStore; all operations forwarded to main process (LowDB).
 */

import type {
  IDataStore,
  BookRow,
  VocabularyRow,
  SessionRow,
  WordListRow,
  BookSort,
  BookFilter,
  VocabularySort,
  VocabularyFilter,
  QueryResult,
  MigrationDefinition,
  ReadingStats,
} from '@xenolexia/shared';

export type {QueryResult, MigrationDefinition};

function getAPI(): (method: string, ...args: unknown[]) => Promise<unknown> {
  if (typeof window === 'undefined' || !window.electronAPI?.dbInvoke) {
    throw new Error('electronAPI.dbInvoke not available (preload not loaded?)');
  }
  return window.electronAPI.dbInvoke;
}

export class DatabaseService implements IDataStore {
  static getInstance(): DatabaseService {
    return databaseService;
  }

  async initialize(): Promise<void> {
    await getAPI()('initialize');
  }

  async close(): Promise<void> {
    await getAPI()('close');
  }

  isReady(): boolean {
    return true;
  }

  async getSchemaVersion(): Promise<number> {
    return getAPI()('getSchemaVersion') as Promise<number>;
  }

  // Books
  async getBookById(id: string): Promise<BookRow | null> {
    return getAPI()('getBookById', id) as Promise<BookRow | null>;
  }

  async getBooks(options?: {
    sort?: BookSort;
    filter?: BookFilter;
    limit?: number;
  }): Promise<BookRow[]> {
    return getAPI()('getBooks', options) as Promise<BookRow[]>;
  }

  async addBook(row: BookRow): Promise<void> {
    await getAPI()('addBook', row);
  }

  async updateBook(id: string, updates: Partial<BookRow>): Promise<void> {
    await getAPI()('updateBook', id, updates);
  }

  async deleteBook(id: string): Promise<void> {
    await getAPI()('deleteBook', id);
  }

  async deleteAllBooks(): Promise<void> {
    await getAPI()('deleteAllBooks');
  }

  async getBookCount(): Promise<number> {
    return getAPI()('getBookCount') as Promise<number>;
  }

  async getBookStatistics(): Promise<{
    total: number;
    in_progress: number;
    completed: number;
    total_time: number;
  }> {
    return getAPI()('getBookStatistics') as Promise<{
      total: number;
      in_progress: number;
      completed: number;
      total_time: number;
    }>;
  }

  // Vocabulary
  async getVocabularyById(id: string): Promise<VocabularyRow | null> {
    return getAPI()('getVocabularyById', id) as Promise<VocabularyRow | null>;
  }

  async getVocabulary(options?: {
    filter?: VocabularyFilter;
    sort?: VocabularySort;
    limit?: number;
    addedAtGte?: number;
    dueForReview?: {now: number; limit: number};
  }): Promise<VocabularyRow[]> {
    return getAPI()('getVocabulary', options) as Promise<VocabularyRow[]>;
  }

  async addVocabulary(row: VocabularyRow): Promise<void> {
    await getAPI()('addVocabulary', row);
  }

  async updateVocabulary(id: string, updates: Partial<VocabularyRow>): Promise<void> {
    await getAPI()('updateVocabulary', id, updates);
  }

  async deleteVocabulary(id: string): Promise<void> {
    await getAPI()('deleteVocabulary', id);
  }

  async deleteAllVocabulary(): Promise<void> {
    await getAPI()('deleteAllVocabulary');
  }

  async getVocabularyDueCount(now: number): Promise<number> {
    return getAPI()('getVocabularyDueCount', now) as Promise<number>;
  }

  async getVocabularyStatistics(): Promise<{
    total: number;
    new_count: number;
    learning_count: number;
    review_count: number;
    learned_count: number;
    due: number;
  }> {
    return getAPI()('getVocabularyStatistics') as Promise<{
      total: number;
      new_count: number;
      learning_count: number;
      review_count: number;
      learned_count: number;
      due: number;
    }>;
  }

  async getVocabularyCountByStatus(status: string): Promise<number> {
    return getAPI()('getVocabularyCountByStatus', status) as Promise<number>;
  }

  // Sessions
  async getSessionById(id: string): Promise<SessionRow | null> {
    return getAPI()('getSessionById', id) as Promise<SessionRow | null>;
  }

  async getSessionsByBookId(bookId: string): Promise<SessionRow[]> {
    return getAPI()('getSessionsByBookId', bookId) as Promise<SessionRow[]>;
  }

  async getRecentSessions(limit: number): Promise<SessionRow[]> {
    return getAPI()('getRecentSessions', limit) as Promise<SessionRow[]>;
  }

  async getTodaySessions(): Promise<SessionRow[]> {
    return getAPI()('getTodaySessions') as Promise<SessionRow[]>;
  }

  async addSession(row: SessionRow): Promise<void> {
    await getAPI()('addSession', row);
  }

  async updateSession(id: string, updates: Partial<SessionRow>): Promise<void> {
    await getAPI()('updateSession', id, updates);
  }

  async deleteSession(id: string): Promise<void> {
    await getAPI()('deleteSession', id);
  }

  async deleteSessionsByBookId(bookId: string): Promise<void> {
    await getAPI()('deleteSessionsByBookId', bookId);
  }

  async deleteAllSessions(): Promise<void> {
    await getAPI()('deleteAllSessions');
  }

  async getSessionStatistics(): Promise<ReadingStats> {
    return getAPI()('getSessionStatistics') as Promise<ReadingStats>;
  }

  async getReadingTimeForPeriod(startMs: number, endMs: number): Promise<number> {
    return getAPI()('getReadingTimeForPeriod', startMs, endMs) as Promise<number>;
  }

  async getDailyReadingTime(days: number): Promise<Array<{date: string; minutes: number}>> {
    return getAPI()('getDailyReadingTime', days) as Promise<Array<{date: string; minutes: number}>>;
  }

  async getDistinctSessionDays(): Promise<string[]> {
    return getAPI()('getDistinctSessionDays') as Promise<string[]>;
  }

  // Preferences
  async getPreference(key: string): Promise<string | null> {
    return getAPI()('getPreference', key) as Promise<string | null>;
  }

  async setPreference(key: string, value: string): Promise<void> {
    await getAPI()('setPreference', key, value);
  }

  // Word list
  async getWordListEntry(
    word: string,
    sourceLang: string,
    targetLang: string
  ): Promise<WordListRow | null> {
    return getAPI()('getWordListEntry', word, sourceLang, targetLang) as Promise<WordListRow | null>;
  }

  async getWordListEntryByVariant(
    word: string,
    sourceLang: string,
    targetLang: string
  ): Promise<WordListRow | null> {
    return getAPI()('getWordListEntryByVariant', word, sourceLang, targetLang) as Promise<
      WordListRow | null
    >;
  }

  async getWordListByLevel(
    sourceLang: string,
    targetLang: string,
    proficiency: string,
    options?: {limit?: number; random?: boolean}
  ): Promise<WordListRow[]> {
    return getAPI()(
      'getWordListByLevel',
      sourceLang,
      targetLang,
      proficiency,
      options
    ) as Promise<WordListRow[]>;
  }

  async getWordListByLangs(sourceLang: string, targetLang: string): Promise<WordListRow[]> {
    return getAPI()('getWordListByLangs', sourceLang, targetLang) as Promise<WordListRow[]>;
  }

  async getWordListCount(sourceLang: string, targetLang: string): Promise<number> {
    return getAPI()('getWordListCount', sourceLang, targetLang) as Promise<number>;
  }

  async addWordListEntry(row: WordListRow): Promise<void> {
    await getAPI()('addWordListEntry', row);
  }

  async deleteWordListByPair(sourceLang?: string, targetLang?: string): Promise<void> {
    await getAPI()('deleteWordListByPair', sourceLang, targetLang);
  }

  async getWordListProficiencyCounts(
    sourceLang: string,
    targetLang: string
  ): Promise<Record<string, number>> {
    return getAPI()(
      'getWordListProficiencyCounts',
      sourceLang,
      targetLang
    ) as Promise<Record<string, number>>;
  }

  async getWordListPosCounts(
    sourceLang: string,
    targetLang: string
  ): Promise<Record<string, number>> {
    return getAPI()('getWordListPosCounts', sourceLang, targetLang) as Promise<
      Record<string, number>
    >;
  }

  async getWordListStats(): Promise<{
    total: number;
    pairs: Array<{source_lang: string; target_lang: string; count: number}>;
  }> {
    return getAPI()('getWordListStats') as Promise<{
      total: number;
      pairs: Array<{source_lang: string; target_lang: string; count: number}>;
    }>;
  }

  async getWordListSearch(
    sourceLang: string,
    targetLang: string,
    query: string,
    limit: number
  ): Promise<WordListRow[]> {
    return getAPI()(
      'getWordListSearch',
      sourceLang,
      targetLang,
      query,
      limit
    ) as Promise<WordListRow[]>;
  }

  async runTransaction(operations: Array<{method: string; args: unknown[]}>): Promise<void> {
    await getAPI()('runTransaction', operations);
  }
}

export const databaseService = new DatabaseService();
