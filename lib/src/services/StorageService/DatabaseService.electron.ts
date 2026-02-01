/**
 * Database Service - Electron version using LowDB (JSON file)
 * Direct data API; no SQL. Implements IDataStore.
 */

import {getAppDataPath} from '../../utils/FileSystem.electron';
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
} from 'xenolexia-typescript';
import type {ReadingStats} from 'xenolexia-typescript';
export type {QueryResult, MigrationDefinition};

// ============================================================================
// LowDB data shape
// ============================================================================

interface LowDBData {
  books: BookRow[];
  vocabulary: VocabularyRow[];
  reading_sessions: SessionRow[];
  preferences: Record<string, string>;
  word_list: WordListRow[];
  _migrations: {version: number; description?: string; applied_at?: number}[];
}

type LowDBInstance = {
  data: LowDBData;
  read: () => Promise<void>;
  write: () => Promise<void>;
  update: (fn: (data: LowDBData) => void) => Promise<void>;
};

const DEFAULT_DATA: LowDBData = {
  books: [],
  vocabulary: [],
  reading_sessions: [],
  preferences: {},
  word_list: [],
  _migrations: [],
};

const DATABASE_FILE = 'xenolexia.json';

// ============================================================================
// Database Service Class
// ============================================================================

export class DatabaseService implements IDataStore {
  private db: LowDBInstance | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private dbPath: string | null = null;
  private _inTransaction = false;

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.isInitialized && this.db) return;
    this.initPromise = this.doInitialize();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async doInitialize(): Promise<void> {
    try {
      let appDataPath: string;
      try {
        const {app} = require('electron');
        appDataPath = app.getPath('userData');
      } catch {
        appDataPath = await getAppDataPath();
      }
      this.dbPath = `${appDataPath}/${DATABASE_FILE}`;
      const {JSONFilePreset} = await import('lowdb/node');
      this.db = (await JSONFilePreset(this.dbPath, DEFAULT_DATA)) as unknown as LowDBInstance;
      await this.db.read();
      if (!this.db.data._migrations || this.db.data._migrations.length === 0) {
        this.db.data._migrations = [{version: 1, applied_at: Date.now()}];
        await this.db.write();
      }
      this.isInitialized = true;
      console.log('[Database] LowDB initialized:', this.dbPath);
    } catch (error) {
      console.error('[Database] Initialization failed:', error);
      this.db = null;
      this.isInitialized = false;
      throw error;
    }
  }

  private getDb(): LowDBInstance {
    if (!this.db) throw new Error('Database not initialized. Call initialize() first.');
    return this.db;
  }

  private async persist(): Promise<void> {
    if (!this._inTransaction) await this.getDb().write();
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  async close(): Promise<void> {
    this.db = null;
    this.isInitialized = false;
    console.log('[Database] Connection closed');
  }

  async getSchemaVersion(): Promise<number> {
    try {
      const versions = this.getDb().data._migrations.map((m) => m.version);
      return versions.length ? Math.max(...versions) : 0;
    } catch {
      return 0;
    }
  }

  // ============================================================================
  // Books
  // ============================================================================

  async getBookById(id: string): Promise<BookRow | null> {
    const book = this.getDb().data.books.find((b) => b.id === id);
    return book ?? null;
  }

  async getBooks(options?: {
    sort?: BookSort;
    filter?: BookFilter;
    limit?: number;
  }): Promise<BookRow[]> {
    let list = [...this.getDb().data.books];
    if (options?.filter) {
      const f = options.filter;
      if (f.format != null) list = list.filter((b) => b.format === f.format);
      if (f.target_lang != null) list = list.filter((b) => b.target_lang === f.target_lang);
      if (f.proficiency != null) list = list.filter((b) => b.proficiency === f.proficiency);
      if (f.hasProgress === true) list = list.filter((b) => Number(b.progress) > 0 && Number(b.progress) < 100);
      if (f.hasProgress === false) list = list.filter((b) => Number(b.progress) === 0);
      if (f.is_downloaded != null) list = list.filter((b) => (b.is_downloaded ?? 0) === f.is_downloaded);
      if (f.recentlyRead === true) list = list.filter((b) => b.last_read_at != null);
      if (f.inProgress === true) list = list.filter((b) => Number(b.progress) > 0 && Number(b.progress) < 100);
      if (f.searchQuery != null && f.searchQuery !== '') {
        const q = String(f.searchQuery).toLowerCase();
        list = list.filter(
          (b) =>
            String(b.title || '').toLowerCase().includes(q) ||
            String(b.author || '').toLowerCase().includes(q)
        );
      }
    }
    const sort = options?.sort;
    if (sort) {
      const col = sort.by === 'addedAt' ? 'added_at' : sort.by === 'lastReadAt' ? 'last_read_at' : sort.by;
      const desc = sort.order === 'desc';
      list.sort((a, b) => {
        const av = a[col as keyof BookRow] ?? 0;
        const bv = b[col as keyof BookRow] ?? 0;
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (desc ? -1 : 1);
      });
    } else {
      list.sort((a, b) => (Number(b.last_read_at) || 0) - (Number(a.last_read_at) || 0));
      list.sort((a, b) => (Number(b.added_at) || 0) - (Number(a.added_at) || 0));
    }
    const limit = options?.limit ?? 999;
    return list.slice(0, limit);
  }

  async addBook(row: BookRow): Promise<void> {
    this.getDb().data.books.push(row);
    await this.persist();
  }

  async updateBook(id: string, updates: Partial<BookRow>): Promise<void> {
    const book = this.getDb().data.books.find((b) => b.id === id);
    if (book) Object.assign(book, updates);
    await this.persist();
  }

  async deleteBook(id: string): Promise<void> {
    const i = this.getDb().data.books.findIndex((b) => b.id === id);
    if (i >= 0) this.getDb().data.books.splice(i, 1);
    await this.persist();
  }

  async deleteAllBooks(): Promise<void> {
    this.getDb().data.books = [];
    await this.persist();
  }

  async getBookCount(): Promise<number> {
    return this.getDb().data.books.length;
  }

  async getBookStatistics(): Promise<{
    total: number;
    in_progress: number;
    completed: number;
    total_time: number;
  }> {
    const books = this.getDb().data.books;
    const total = books.length;
    const in_progress = books.filter((b) => Number(b.progress) > 0 && Number(b.progress) < 100).length;
    const completed = books.filter((b) => Number(b.progress) >= 100).length;
    const total_time = books.reduce((s, b) => s + (Number(b.reading_time_minutes) || 0), 0);
    return {total, in_progress, completed, total_time};
  }

  // ============================================================================
  // Vocabulary
  // ============================================================================

  async getVocabularyById(id: string): Promise<VocabularyRow | null> {
    const v = this.getDb().data.vocabulary.find((x) => x.id === id);
    return v ?? null;
  }

  async getVocabulary(options?: {
    filter?: VocabularyFilter;
    sort?: VocabularySort;
    limit?: number;
    addedAtGte?: number;
    dueForReview?: {now: number; limit: number};
  }): Promise<VocabularyRow[]> {
    let list = [...this.getDb().data.vocabulary];
    if (options?.filter) {
      const f = options.filter;
      if (f.status != null) list = list.filter((r) => r.status === f.status);
      if (f.book_id != null) list = list.filter((r) => r.book_id === f.book_id);
      if (f.source_lang != null) list = list.filter((r) => r.source_lang === f.source_lang);
      if (f.target_lang != null) list = list.filter((r) => r.target_lang === f.target_lang);
    }
    if (options?.addedAtGte != null) {
      list = list.filter((r) => Number(r.added_at) >= options!.addedAtGte!);
    }
    if (options?.dueForReview) {
      const {now, limit: lim} = options.dueForReview;
      list = list.filter((r) => {
        if (r.status === 'learned') return false;
        const last = Number(r.last_reviewed_at) || 0;
        const interval = Number(r.interval) || 0;
        return last + interval * 86400000 <= now;
      });
      list.sort((a, b) => {
        const o = (x: VocabularyRow) => (x.status === 'new' ? 0 : x.status === 'learning' ? 1 : 2);
        const ad = o(a);
        const bd = o(b);
        if (ad !== bd) return ad - bd;
        return (Number(a.last_reviewed_at) || 0) - (Number(b.last_reviewed_at) || 0);
      });
      list = list.slice(0, lim);
    }
    if (options?.sort) {
      const col =
        options.sort.by === 'addedAt'
          ? 'added_at'
          : options.sort.by === 'lastReviewedAt'
            ? 'last_reviewed_at'
            : options.sort.by === 'sourceWord'
              ? 'source_word'
              : 'status';
      const desc = options.sort.order === 'desc';
      list.sort((a, b) => {
        const av = a[col as keyof VocabularyRow] ?? '';
        const bv = b[col as keyof VocabularyRow] ?? '';
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (desc ? -1 : 1);
      });
    }
    if (!options?.dueForReview && (options?.limit != null)) {
      list = list.slice(0, options.limit);
    }
    if (!options?.dueForReview && options?.limit == null) {
      list = list.slice(0, 999);
    }
    return list;
  }

  async addVocabulary(row: VocabularyRow): Promise<void> {
    this.getDb().data.vocabulary.push(row);
    await this.persist();
  }

  async updateVocabulary(id: string, updates: Partial<VocabularyRow>): Promise<void> {
    const v = this.getDb().data.vocabulary.find((x) => x.id === id);
    if (v) Object.assign(v, updates);
    await this.persist();
  }

  async deleteVocabulary(id: string): Promise<void> {
    const i = this.getDb().data.vocabulary.findIndex((x) => x.id === id);
    if (i >= 0) this.getDb().data.vocabulary.splice(i, 1);
    await this.persist();
  }

  async deleteAllVocabulary(): Promise<void> {
    this.getDb().data.vocabulary = [];
    await this.persist();
  }

  async getVocabularyDueCount(now: number): Promise<number> {
    return this.getDb().data.vocabulary.filter((r) => {
      if (r.status === 'learned') return false;
      const last = Number(r.last_reviewed_at) || 0;
      const interval = Number(r.interval) || 0;
      return last + interval * 86400000 <= now;
    }).length;
  }

  async getVocabularyStatistics(): Promise<{
    total: number;
    new_count: number;
    learning_count: number;
    review_count: number;
    learned_count: number;
    due: number;
  }> {
    const list = this.getDb().data.vocabulary;
    const now = Date.now();
    const due = list.filter((r) => {
      if (r.status === 'learned') return false;
      const last = Number(r.last_reviewed_at) || 0;
      const interval = Number(r.interval) || 0;
      return last + interval * 86400000 <= now;
    }).length;
    return {
      total: list.length,
      new_count: list.filter((r) => r.status === 'new').length,
      learning_count: list.filter((r) => r.status === 'learning').length,
      review_count: list.filter((r) => r.status === 'review').length,
      learned_count: list.filter((r) => r.status === 'learned').length,
      due,
    };
  }

  async getVocabularyCountByStatus(status: string): Promise<number> {
    return this.getDb().data.vocabulary.filter((r) => r.status === status).length;
  }

  // ============================================================================
  // Sessions
  // ============================================================================

  async getSessionById(id: string): Promise<SessionRow | null> {
    const s = this.getDb().data.reading_sessions.find((x) => x.id === id);
    return s ?? null;
  }

  async getSessionsByBookId(bookId: string): Promise<SessionRow[]> {
    return this.getDb().data.reading_sessions
      .filter((x) => x.book_id === bookId)
      .sort((a, b) => Number(b.started_at) - Number(a.started_at));
  }

  async getRecentSessions(limit: number): Promise<SessionRow[]> {
    return this.getDb().data.reading_sessions
      .filter((x) => x.ended_at != null)
      .sort((a, b) => Number(b.started_at) - Number(a.started_at))
      .slice(0, limit);
  }

  async getTodaySessions(): Promise<SessionRow[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const t = startOfDay.getTime();
    return this.getDb().data.reading_sessions
      .filter((x) => Number(x.started_at) >= t)
      .sort((a, b) => Number(b.started_at) - Number(a.started_at));
  }

  async addSession(row: SessionRow): Promise<void> {
    this.getDb().data.reading_sessions.push(row);
    await this.persist();
  }

  async updateSession(id: string, updates: Partial<SessionRow>): Promise<void> {
    const s = this.getDb().data.reading_sessions.find((x) => x.id === id);
    if (s) Object.assign(s, updates);
    await this.persist();
  }

  async deleteSession(id: string): Promise<void> {
    const i = this.getDb().data.reading_sessions.findIndex((x) => x.id === id);
    if (i >= 0) this.getDb().data.reading_sessions.splice(i, 1);
    await this.persist();
  }

  async deleteSessionsByBookId(bookId: string): Promise<void> {
    this.getDb().data.reading_sessions = this.getDb().data.reading_sessions.filter((x) => x.book_id !== bookId);
    await this.persist();
  }

  async deleteAllSessions(): Promise<void> {
    this.getDb().data.reading_sessions = [];
    await this.persist();
  }

  async getDistinctSessionDays(): Promise<string[]> {
    const ended = this.getDb().data.reading_sessions.filter((x) => x.ended_at != null);
    const days = [...new Set(ended.map((x) => new Date(Number(x.started_at)).toISOString().slice(0, 10)))].sort().reverse();
    return days;
  }

  async getSessionStatistics(): Promise<ReadingStats> {
    const ended = this.getDb().data.reading_sessions.filter((x) => x.ended_at != null);
    const overall = {
      books_read: new Set(ended.map((x) => x.book_id)).size,
      total_time: ended.reduce((s, x) => s + (Number(x.duration) ?? 0), 0),
      avg_session: ended.length ? ended.reduce((s, x) => s + (Number(x.duration) ?? 0), 0) / ended.length : 0,
    };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRows = this.getDb().data.reading_sessions.filter((x) => Number(x.started_at) >= startOfToday.getTime());
    const today = {
      words_revealed: todayRows.reduce((s, x) => s + (Number(x.words_revealed) || 0), 0),
      words_saved: todayRows.reduce((s, x) => s + (Number(x.words_saved) || 0), 0),
    };
    const streakData = await this.calculateStreak();
    const wordsLearned = this.getDb().data.vocabulary.filter((r) => r.status === 'learned').length;
    return {
      totalBooksRead: overall.books_read,
      totalReadingTime: overall.total_time,
      totalWordsLearned: wordsLearned,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      averageSessionDuration: overall.avg_session,
      wordsRevealedToday: today.words_revealed,
      wordsSavedToday: today.words_saved,
    };
  }

  private async calculateStreak(): Promise<{currentStreak: number; longestStreak: number}> {
    const rows = await this.getDistinctSessionDays();
    if (rows.length === 0) return {currentStreak: 0, longestStreak: 0};
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let currentStreak = 0;
    const mostRecentDay = rows[0];
    if (mostRecentDay === todayStr || mostRecentDay === yesterdayStr) {
      currentStreak = 1;
      let expectedDate = new Date(mostRecentDay);
      for (let i = 1; i < rows.length; i++) {
        const prev = new Date(expectedDate);
        prev.setDate(prev.getDate() - 1);
        const prevStr = prev.toISOString().split('T')[0];
        if (rows[i] === prevStr) {
          currentStreak++;
          expectedDate = new Date(rows[i]);
        } else break;
      }
    }
    let longestStreak = 1;
    let temp = 1;
    for (let i = 0; i < rows.length - 1; i++) {
      const curr = new Date(rows[i]).getTime();
      const next = new Date(rows[i + 1]).getTime();
      const diffDays = Math.floor((curr - next) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) temp++;
      else {
        longestStreak = Math.max(longestStreak, temp);
        temp = 1;
      }
    }
    longestStreak = Math.max(longestStreak, temp, currentStreak);
    return {currentStreak, longestStreak};
  }

  async getReadingTimeForPeriod(startMs: number, endMs: number): Promise<number> {
    const list = this.getDb().data.reading_sessions.filter(
      (x) => Number(x.started_at) >= startMs && Number(x.started_at) < endMs && x.ended_at != null
    );
    return list.reduce((s, x) => s + (Number(x.duration) || 0), 0);
  }

  async getDailyReadingTime(days: number): Promise<Array<{date: string; minutes: number}>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const t0 = startDate.getTime();
    const byDay: Record<string, number> = {};
    this.getDb().data.reading_sessions
      .filter((x) => Number(x.started_at) >= t0 && x.ended_at != null)
      .forEach((x) => {
        const d = new Date(Number(x.started_at)).toISOString().slice(0, 10);
        byDay[d] = (byDay[d] || 0) + (Number(x.duration) || 0);
      });
    const result: Array<{date: string; minutes: number}> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({date: dateStr, minutes: Math.round((byDay[dateStr] ?? 0) / 60)});
    }
    return result;
  }

  // ============================================================================
  // Preferences
  // ============================================================================

  async getPreference(key: string): Promise<string | null> {
    const value = this.getDb().data.preferences[key];
    return value ?? null;
  }

  async setPreference(key: string, value: string): Promise<void> {
    this.getDb().data.preferences[key] = value;
    await this.persist();
  }

  // ============================================================================
  // Word list
  // ============================================================================

  async getWordListEntry(word: string, sourceLang: string, targetLang: string): Promise<WordListRow | null> {
    const row = this.getDb().data.word_list.find(
      (w) => w.source_word === word && w.source_lang === sourceLang && w.target_lang === targetLang
    );
    return row ?? null;
  }

  async getWordListEntryByVariant(word: string, sourceLang: string, targetLang: string): Promise<WordListRow | null> {
    const row = this.getDb().data.word_list.find((w) => {
      if (w.source_lang !== sourceLang || w.target_lang !== targetLang || !w.variants) return false;
      try {
        const arr: string[] = JSON.parse(w.variants);
        return arr.some((v) => v.toLowerCase() === word.toLowerCase());
      } catch {
        return false;
      }
    });
    return row ?? null;
  }

  async getWordListByLevel(
    sourceLang: string,
    targetLang: string,
    proficiency: string,
    options?: {limit?: number; random?: boolean}
  ): Promise<WordListRow[]> {
    let list = this.getDb().data.word_list.filter(
      (w) => w.source_lang === sourceLang && w.target_lang === targetLang && w.proficiency === proficiency
    );
    list = list.sort((a, b) => (Number(a.frequency_rank) ?? 9999) - (Number(b.frequency_rank) ?? 9999));
    if (options?.random) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    const limit = options?.limit ?? 999;
    return list.slice(0, limit);
  }

  async getWordListByLangs(sourceLang: string, targetLang: string): Promise<WordListRow[]> {
    return this.getDb().data.word_list
      .filter((w) => w.source_lang === sourceLang && w.target_lang === targetLang)
      .sort((a, b) => (Number(a.frequency_rank) ?? 9999) - (Number(b.frequency_rank) ?? 9999));
  }

  async getWordListCount(sourceLang: string, targetLang: string): Promise<number> {
    return this.getDb().data.word_list.filter(
      (w) => w.source_lang === sourceLang && w.target_lang === targetLang
    ).length;
  }

  async addWordListEntry(row: WordListRow): Promise<void> {
    this.getDb().data.word_list.push(row);
    await this.persist();
  }

  async deleteWordListByPair(sourceLang?: string, targetLang?: string): Promise<void> {
    if (sourceLang != null && targetLang != null) {
      this.getDb().data.word_list = this.getDb().data.word_list.filter(
        (w) => !(w.source_lang === sourceLang && w.target_lang === targetLang)
      );
    } else {
      this.getDb().data.word_list = [];
    }
    await this.persist();
  }

  async getWordListProficiencyCounts(sourceLang: string, targetLang: string): Promise<Record<string, number>> {
    const list = this.getDb().data.word_list.filter(
      (w) => w.source_lang === sourceLang && w.target_lang === targetLang
    );
    const out: Record<string, number> = {};
    for (const w of list) {
      const p = w.proficiency || 'other';
      out[p] = (out[p] || 0) + 1;
    }
    return out;
  }

  async getWordListPosCounts(sourceLang: string, targetLang: string): Promise<Record<string, number>> {
    const list = this.getDb().data.word_list.filter(
      (w) => w.source_lang === sourceLang && w.target_lang === targetLang && w.part_of_speech != null
    );
    const out: Record<string, number> = {};
    for (const w of list) {
      const p = w.part_of_speech!;
      out[p] = (out[p] || 0) + 1;
    }
    return out;
  }

  async getWordListStats(): Promise<{
    total: number;
    pairs: Array<{source_lang: string; target_lang: string; count: number}>;
  }> {
    const list = this.getDb().data.word_list;
    const map = new Map<string, number>();
    for (const w of list) {
      const key = `${w.source_lang}_${w.target_lang}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    const pairs = Array.from(map.entries()).map(([key, count]) => {
      const [source_lang, target_lang] = key.split('_');
      return {source_lang, target_lang, count};
    });
    return {total: list.length, pairs};
  }

  async getWordListSearch(
    sourceLang: string,
    targetLang: string,
    query: string,
    limit: number
  ): Promise<WordListRow[]> {
    const q = (query || '').toLowerCase();
    return this.getDb().data.word_list
      .filter(
        (w) =>
          w.source_lang === sourceLang &&
          w.target_lang === targetLang &&
          (String(w.source_word).toLowerCase().startsWith(q) || String(w.target_word).toLowerCase().startsWith(q))
      )
      .sort((a, b) => (Number(a.frequency_rank) ?? 9999) - (Number(b.frequency_rank) ?? 9999))
      .slice(0, limit);
  }

  // ============================================================================
  // Transaction
  // ============================================================================

  async runTransaction(operations: Array<{method: string; args: unknown[]}>): Promise<void> {
    if (operations.length === 0) return;
    this._inTransaction = true;
    try {
      for (const op of operations) {
        const fn = (this as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[
          op.method
        ];
        if (typeof fn !== 'function') throw new Error('Unknown db method: ' + op.method);
        await fn.apply(this, op.args);
      }
    } finally {
      this._inTransaction = false;
      await this.getDb().write();
    }
  }
}

export const databaseService = new DatabaseService();
(DatabaseService as unknown as {getInstance: () => DatabaseService}).getInstance = () => databaseService;
