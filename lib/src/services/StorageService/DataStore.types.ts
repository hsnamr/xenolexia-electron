/**
 * Data store types - row shapes and options for the direct LowDB API.
 * Used by DatabaseService (electron + renderer) and repositories.
 */

import type {ReadingStats} from '../../types';

/** @deprecated Legacy; data API does not use SQL */
export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowsAffected: number;
  insertId?: number;
}

/** @deprecated Legacy; migrations are implicit with LowDB */
export interface MigrationDefinition {
  version: number;
  description: string;
  up: string;
  down?: string;
}

// ============================================================================
// Row types (snake_case, match LowDB JSON)
// ============================================================================

export interface BookRow {
  id: string;
  title: string;
  author: string | null;
  description?: string | null;
  cover_path: string | null;
  file_path: string;
  format: string;
  file_size?: number;
  added_at: number;
  last_read_at: number | null;
  progress: number;
  current_location: string | null;
  current_chapter?: number;
  total_chapters?: number;
  current_page?: number;
  total_pages?: number;
  reading_time_minutes?: number;
  source_lang: string;
  target_lang: string;
  proficiency: string;
  word_density?: number;
  source_url?: string | null;
  is_downloaded?: number;
}

export interface VocabularyRow {
  id: string;
  source_word: string;
  target_word: string;
  source_lang: string;
  target_lang: string;
  context_sentence: string | null;
  book_id: string | null;
  book_title?: string | null;
  added_at: number;
  last_reviewed_at: number | null;
  review_count: number;
  ease_factor: number;
  interval: number;
  status: string;
}

export interface SessionRow {
  id: string;
  book_id: string;
  started_at: number;
  ended_at: number | null;
  pages_read: number;
  words_revealed: number;
  words_saved: number;
  duration?: number;
}

export interface WordListRow {
  id: string;
  source_word: string;
  target_word: string;
  source_lang: string;
  target_lang: string;
  proficiency: string;
  frequency_rank: number | null;
  part_of_speech: string | null;
  variants: string | null;
  pronunciation: string | null;
}

// ============================================================================
// Filter / sort options (used by repositories)
// ============================================================================

export interface BookSort {
  by: 'title' | 'author' | 'addedAt' | 'lastReadAt' | 'progress';
  order: 'asc' | 'desc';
}

export interface BookFilter {
  format?: string;
  target_lang?: string;
  proficiency?: string;
  hasProgress?: boolean;
  is_downloaded?: number;
  /** If true, only books with last_read_at set */
  recentlyRead?: boolean;
  /** If true, only books with progress in (0, 100) */
  inProgress?: boolean;
  /** Search query (title/author contains, case-insensitive) */
  searchQuery?: string;
}

export interface VocabularySort {
  by: 'addedAt' | 'lastReviewedAt' | 'sourceWord' | 'status';
  order: 'asc' | 'desc';
}

export interface VocabularyFilter {
  status?: string;
  book_id?: string;
  source_lang?: string;
  target_lang?: string;
}

// ============================================================================
// Data store interface (direct API, no SQL)
// ============================================================================

export interface IDataStore {
  initialize(): Promise<void>;
  close(): Promise<void>;
  isReady(): boolean;
  getSchemaVersion(): Promise<number>;

  // Books
  getBookById(id: string): Promise<BookRow | null>;
  getBooks(options?: {sort?: BookSort; filter?: BookFilter; limit?: number}): Promise<BookRow[]>;
  addBook(row: BookRow): Promise<void>;
  updateBook(id: string, updates: Partial<BookRow>): Promise<void>;
  deleteBook(id: string): Promise<void>;
  deleteAllBooks(): Promise<void>;
  getBookCount(): Promise<number>;
  getBookStatistics(): Promise<{
    total: number;
    in_progress: number;
    completed: number;
    total_time: number;
  }>;

  // Vocabulary
  getVocabularyById(id: string): Promise<VocabularyRow | null>;
  getVocabulary(options?: {
    filter?: VocabularyFilter;
    sort?: VocabularySort;
    limit?: number;
    addedAtGte?: number;
    dueForReview?: {now: number; limit: number};
  }): Promise<VocabularyRow[]>;
  addVocabulary(row: VocabularyRow): Promise<void>;
  updateVocabulary(id: string, updates: Partial<VocabularyRow>): Promise<void>;
  deleteVocabulary(id: string): Promise<void>;
  deleteAllVocabulary(): Promise<void>;
  getVocabularyDueCount(now: number): Promise<number>;
  getVocabularyStatistics(): Promise<{
    total: number;
    new_count: number;
    learning_count: number;
    review_count: number;
    learned_count: number;
    due: number;
  }>;
  getVocabularyCountByStatus(status: string): Promise<number>;

  // Sessions
  getSessionById(id: string): Promise<SessionRow | null>;
  getSessionsByBookId(bookId: string): Promise<SessionRow[]>;
  getRecentSessions(limit: number): Promise<SessionRow[]>;
  getTodaySessions(): Promise<SessionRow[]>;
  addSession(row: SessionRow): Promise<void>;
  updateSession(id: string, updates: Partial<SessionRow>): Promise<void>;
  deleteSession(id: string): Promise<void>;
  deleteSessionsByBookId(bookId: string): Promise<void>;
  deleteAllSessions(): Promise<void>;
  getSessionStatistics(): Promise<ReadingStats>;
  getReadingTimeForPeriod(startMs: number, endMs: number): Promise<number>;
  getDailyReadingTime(days: number): Promise<Array<{date: string; minutes: number}>>;
  getDistinctSessionDays(): Promise<string[]>;

  // Preferences
  getPreference(key: string): Promise<string | null>;
  setPreference(key: string, value: string): Promise<void>;

  // Word list
  getWordListEntry(word: string, sourceLang: string, targetLang: string): Promise<WordListRow | null>;
  getWordListEntryByVariant(word: string, sourceLang: string, targetLang: string): Promise<WordListRow | null>;
  getWordListByLevel(
    sourceLang: string,
    targetLang: string,
    proficiency: string,
    options?: {limit?: number; random?: boolean}
  ): Promise<WordListRow[]>;
  getWordListByLangs(sourceLang: string, targetLang: string): Promise<WordListRow[]>;
  getWordListCount(sourceLang: string, targetLang: string): Promise<number>;
  addWordListEntry(row: WordListRow): Promise<void>;
  deleteWordListByPair(sourceLang?: string, targetLang?: string): Promise<void>;
  getWordListProficiencyCounts(sourceLang: string, targetLang: string): Promise<Record<string, number>>;
  getWordListPosCounts(sourceLang: string, targetLang: string): Promise<Record<string, number>>;
  getWordListStats(): Promise<{
    total: number;
    pairs: Array<{source_lang: string; target_lang: string; count: number}>;
  }>;
  getWordListSearch(
    sourceLang: string,
    targetLang: string,
    query: string,
    limit: number
  ): Promise<WordListRow[]>;

  // Transaction (batch operations; main process applies all then writes once)
  runTransaction(operations: Array<{method: string; args: unknown[]}>): Promise<void>;
}
