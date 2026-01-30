/**
 * Database Service - Electron version using LowDB (JSON file)
 *
 * Uses LowDB for persistence (no native modules). Same public API as before
 * so repositories and IPC remain unchanged.
 */

import { getAppDataPath } from '../../utils/FileSystem.electron';

// ============================================================================
// Types
// ============================================================================

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowsAffected: number;
  insertId?: number;
}

export interface MigrationDefinition {
  version: number;
  description: string;
  up: string;
  down?: string;
}

interface Transaction {
  executeSql: (
    sql: string,
    params: any[],
    success?: (tx: Transaction, result: any) => void,
    error?: (tx: Transaction, err: any) => boolean,
  ) => any;
}

interface LowDBData {
  books: Record<string, unknown>[];
  vocabulary: Record<string, unknown>[];
  reading_sessions: Record<string, unknown>[];
  preferences: Record<string, string>;
  word_list: Record<string, unknown>[];
  _migrations: { version: number; description?: string; applied_at?: number }[];
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

export class DatabaseService {
  private db: LowDBInstance | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private dbPath: string | null = null;

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
        const { app } = require('electron');
        appDataPath = app.getPath('userData');
      } catch {
        appDataPath = await getAppDataPath();
      }
      this.dbPath = `${appDataPath}/${DATABASE_FILE}`;

      const { JSONFilePreset } = await import('lowdb/node');
      this.db = (await JSONFilePreset(this.dbPath, DEFAULT_DATA)) as unknown as LowDBInstance;
      await this.db.read();
      if (!this.db.data._migrations || this.db.data._migrations.length === 0) {
        this.db.data._migrations = [{ version: 1, applied_at: Date.now() }];
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

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  async close(): Promise<void> {
    this.db = null;
    this.isInitialized = false;
    console.log('[Database] Connection closed');
  }

  // ============================================================================
  // SQL execution (minimal interpreter for repository queries)
  // ============================================================================

  private normalize(sql: string): string {
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      .trim()
      .toLowerCase();
  }

  async execute<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<QueryResult<T>> {
    const db = this.getDb();
    const norm = this.normalize(sql);

    if (norm.startsWith('insert into books')) {
      const cols = this.parseInsertColumns(sql);
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => { row[c] = params[i] ?? null; });
      await db.update((data) => data.books.push(row));
      return { rows: [], rowsAffected: 1, insertId: undefined };
    }
    if (norm.startsWith('update books set') && norm.includes('where id = ?')) {
      const id = String(params[params.length - 1]);
      const setPart = sql.match(/SET\s+(.+?)\s+WHERE/is)?.[1] ?? '';
      const updates = this.parseSetClause(setPart, params.slice(0, -1));
      let affected = 0;
      await db.update((data) => {
        const book = data.books.find((b: Record<string, unknown>) => b.id === id);
        if (book) {
          Object.assign(book, updates);
          affected = 1;
        }
      });
      return { rows: [], rowsAffected: affected };
    }
    if (norm === 'delete from books where id = ?') {
      const id = String(params[0]);
      await db.update((data) => {
        const i = data.books.findIndex((b: Record<string, unknown>) => b.id === id);
        if (i >= 0) data.books.splice(i, 1);
      });
      return { rows: [], rowsAffected: 1 };
    }
    if (norm === 'delete from books') {
      await db.update((data) => { data.books = []; });
      return { rows: [], rowsAffected: 0 };
    }

    if (norm.startsWith('insert into vocabulary')) {
      const cols = this.parseInsertColumns(sql);
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => { row[c] = params[i] ?? null; });
      await db.update((data) => data.vocabulary.push(row));
      return { rows: [], rowsAffected: 1 };
    }
    if (norm.startsWith('update vocabulary set') && norm.includes('where id = ?')) {
      const id = String(params[params.length - 1]);
      const setPart = sql.match(/SET\s+(.+?)\s+WHERE/is)?.[1] ?? '';
      const updates = this.parseSetClause(setPart, params.slice(0, -1));
      let affected = 0;
      await db.update((data) => {
        const v = data.vocabulary.find((x: Record<string, unknown>) => x.id === id);
        if (v) { Object.assign(v, updates); affected = 1; }
      });
      return { rows: [], rowsAffected: affected };
    }
    if (norm === 'delete from vocabulary where id = ?') {
      const id = String(params[0]);
      await db.update((data) => {
        const i = data.vocabulary.findIndex((x: Record<string, unknown>) => x.id === id);
        if (i >= 0) data.vocabulary.splice(i, 1);
      });
      return { rows: [], rowsAffected: 1 };
    }
    if (norm === 'delete from vocabulary') {
      await db.update((data) => { data.vocabulary = []; });
      return { rows: [], rowsAffected: 0 };
    }

    if (norm.startsWith('insert into reading_sessions')) {
      const cols = this.parseInsertColumns(sql);
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => { row[c] = params[i] ?? null; });
      await db.update((data) => data.reading_sessions.push(row));
      return { rows: [], rowsAffected: 1 };
    }
    if (norm.startsWith('update reading_sessions set') && norm.includes('where id = ?')) {
      const id = String(params[params.length - 1]);
      const setPart = sql.match(/SET\s+(.+?)\s+WHERE/is)?.[1] ?? '';
      const updates = this.parseSetClause(setPart, params.slice(0, -1));
      let affected = 0;
      await db.update((data) => {
        const s = data.reading_sessions.find((x: Record<string, unknown>) => x.id === id);
        if (s) { Object.assign(s, updates); affected = 1; }
      });
      return { rows: [], rowsAffected: affected };
    }
    if (norm === 'delete from reading_sessions where id = ?') {
      const id = String(params[0]);
      await db.update((data) => {
        const i = data.reading_sessions.findIndex((x: Record<string, unknown>) => x.id === id);
        if (i >= 0) data.reading_sessions.splice(i, 1);
      });
      return { rows: [], rowsAffected: 1 };
    }
    if (norm === 'delete from reading_sessions where book_id = ?') {
      const bookId = String(params[0]);
      await db.update((data) => {
        data.reading_sessions = data.reading_sessions.filter(
          (x: Record<string, unknown>) => x.book_id !== bookId,
        );
      });
      return { rows: [], rowsAffected: 0 };
    }

    if (norm.includes('insert or replace into preferences') || norm.includes('insert into preferences')) {
      const key = String(params[0]);
      const value = String(params[1]);
      await db.update((data) => { data.preferences[key] = value; });
      return { rows: [], rowsAffected: 1 };
    }

    // Fallback: treat as no-op for unknown writes
    if (norm.startsWith('select')) {
      return { rows: [], rowsAffected: 0 };
    }
    return { rows: [], rowsAffected: 0 };
  }

  private parseInsertColumns(sql: string): string[] {
    const m = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
    if (!m) return [];
    return m[1].split(',').map((s) => s.trim().toLowerCase());
  }

  private parseSetClause(setClause: string, params: (string | number | null)[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const parts = setClause.split(',');
    let pi = 0;
    for (const p of parts) {
      const match = p.trim().match(/^(\w+)\s*=\s*\?$/i) || p.trim().match(/^(\w+)\s*=\s*coalesce\(\?/i);
      if (match) {
        const col = match[1].toLowerCase();
        out[col] = params[pi] ?? null;
        pi++;
      }
    }
    return out;
  }

  async getOne<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T | null> {
    const rows = await this.getAll<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async getAll<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T[]> {
    const db = this.getDb();
    const norm = this.normalize(sql);

    if (norm.includes('select * from books where id = ?')) {
      const id = String(params[0]);
      const book = db.data.books.find((b: Record<string, unknown>) => b.id === id);
      return book ? [book as T] : [];
    }
    if (norm.includes('select * from books')) {
      let list = [...db.data.books];
      if (norm.includes('order by')) {
        const orderMatch = sql.match(/ORDER\s+BY\s+([^\s]+)\s+(ASC|DESC)/i);
        if (orderMatch) {
          const col = orderMatch[1].toLowerCase().replace(/nulls\s+last/i, '').trim();
          const desc = orderMatch[2].toLowerCase() === 'desc';
          list.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const av = a[col] ?? 0;
            const bv = b[col] ?? 0;
            if (av === bv) return 0;
            const cmp = av < bv ? -1 : 1;
            return desc ? -cmp : cmp;
          });
        }
      }
      if (norm.includes('where format = ?') || norm.includes('where target_lang = ?') || norm.includes('where proficiency = ?')) {
        const col = norm.includes('format = ?') ? 'format' : norm.includes('target_lang = ?') ? 'target_lang' : 'proficiency';
        const val = params[0];
        list = list.filter((r: Record<string, unknown>) => r[col] === val);
      }
      if (norm.includes('where title like ?') && norm.includes('or author like ?')) {
        const q = String(params[0]).replace(/%/g, '');
        list = list.filter(
          (r: Record<string, unknown>) =>
            String(r.title || '').toLowerCase().includes(q.toLowerCase()) ||
            String(r.author || '').toLowerCase().includes(q.toLowerCase()),
        );
      }
      if (norm.includes('where last_read_at is not null') && norm.includes('limit ?')) {
        list = list.filter((r: Record<string, unknown>) => r.last_read_at != null);
        const limit = Number(params[params.length - 1]) || 10;
        list = list.slice(0, limit);
      }
      if (norm.includes('where progress > 0 and progress < 100')) {
        list = list.filter(
          (r: Record<string, unknown>) =>
            Number(r.progress) > 0 && Number(r.progress) < 100,
        );
      }
      if (norm.includes('limit ?') && !norm.includes('last_read_at is not null')) {
        const limit = Number(params[params.length - 1]) || 999;
        list = list.slice(0, limit);
      }
      return list as T[];
    }
    if (norm.includes('select count(*) as count from books')) {
      const count = db.data.books.length;
      return [{ count } as T];
    }
    if (norm.includes('select count(*), sum(case') && norm.includes('from books')) {
      const total = db.data.books.length;
      const inProgress = db.data.books.filter(
        (b: Record<string, unknown>) => Number(b.progress) > 0 && Number(b.progress) < 100,
      ).length;
      const completed = db.data.books.filter((b: Record<string, unknown>) => Number(b.progress) >= 100).length;
      const totalTime = db.data.books.reduce((s, b) => s + (Number((b as any).reading_time_minutes) || 0), 0);
      return [{ total, in_progress: inProgress, completed, total_time: totalTime } as T];
    }

    if (norm.includes('select * from vocabulary where id = ?')) {
      const id = String(params[0]);
      const v = db.data.vocabulary.find((x: Record<string, unknown>) => x.id === id);
      return v ? [v as T] : [];
    }
    if (norm.includes('select * from vocabulary')) {
      let list = [...db.data.vocabulary];
      if (norm.includes('order by')) {
        const orderMatch = sql.match(/ORDER\s+BY\s+([^\s]+)\s+(ASC|DESC)/i);
        if (orderMatch) {
          const col = orderMatch[1].toLowerCase().replace(/nulls\s+first/i, '').trim();
          const desc = orderMatch[2].toLowerCase() === 'desc';
          list.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const av = a[col] ?? 0;
            const bv = b[col] ?? 0;
            if (av === bv) return 0;
            return (av < bv ? -1 : 1) * (desc ? -1 : 1);
          });
        }
      }
      if (norm.includes('where status = ?')) {
        const val = params[0];
        list = list.filter((r: Record<string, unknown>) => r.status === val);
      }
      if (norm.includes('where book_id = ?')) {
        const val = params[0];
        list = list.filter((r: Record<string, unknown>) => r.book_id === val);
      }
      if (norm.includes('where source_word like ?') && norm.includes('or target_word like ?')) {
        const q = String(params[0]).replace(/%/g, '');
        list = list.filter(
          (r: Record<string, unknown>) =>
            String(r.source_word || '').toLowerCase().includes(q.toLowerCase()) ||
            String(r.target_word || '').toLowerCase().includes(q.toLowerCase()),
        );
      }
      if (norm.includes("status != 'learned'") && norm.includes('last_reviewed_at') && norm.includes('limit ?')) {
        const now = Number(params[0]);
        const limit = Number(params[params.length - 1]) || 20;
        list = list.filter((r: Record<string, unknown>) => {
          if (r.status === 'learned') return false;
          const last = Number(r.last_reviewed_at) || 0;
          const interval = Number(r.interval) || 0;
          return last + interval * 86400000 <= now;
        });
        list.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const o = (x: Record<string, unknown>) => (x.status === 'new' ? 0 : x.status === 'learning' ? 1 : 2);
          const ad = o(a);
          const bd = o(b);
          if (ad !== bd) return ad - bd;
          return (Number(a.last_reviewed_at) || 0) - (Number(b.last_reviewed_at) || 0);
        });
        list = list.slice(0, limit);
      }
      if (norm.includes('where added_at >= ?')) {
        const t = Number(params[0]);
        list = list.filter((r: Record<string, unknown>) => Number(r.added_at) >= t);
      }
      if (norm.includes('limit ?') && !norm.includes('last_reviewed_at')) {
        const limit = Number(params[params.length - 1]) || 999;
        list = list.slice(0, limit);
      }
      return list as T[];
    }
    if (norm.includes('select count(*), sum(case') && norm.includes('from vocabulary')) {
      const total = db.data.vocabulary.length;
      const new_count = db.data.vocabulary.filter((r: Record<string, unknown>) => r.status === 'new').length;
      const learning_count = db.data.vocabulary.filter((r: Record<string, unknown>) => r.status === 'learning').length;
      const review_count = db.data.vocabulary.filter((r: Record<string, unknown>) => r.status === 'review').length;
      const learned_count = db.data.vocabulary.filter((r: Record<string, unknown>) => r.status === 'learned').length;
      return [{ total, new_count, learning_count, review_count, learned_count } as T];
    }
    if (norm.includes('select count(*) as due from vocabulary') && norm.includes('status != \'learned\'')) {
      const now = Number(params[0]);
      const due = db.data.vocabulary.filter((r: Record<string, unknown>) => {
        if (r.status === 'learned') return false;
        const last = Number(r.last_reviewed_at) || 0;
        const interval = Number(r.interval) || 0;
        return last + interval * 86400000 <= now;
      }).length;
      return [{ due } as T];
    }
    if (norm.includes('select count(*) as count from vocabulary where status = ?')) {
      const st = String(params[0]);
      const count = db.data.vocabulary.filter((r: Record<string, unknown>) => r.status === st).length;
      return [{ count } as T];
    }
    if (norm.includes("select count(*) as count from vocabulary where status = 'learned'")) {
      const count = db.data.vocabulary.filter((r: Record<string, unknown>) => r.status === 'learned').length;
      return [{ count } as T];
    }

    if (norm.includes('select * from reading_sessions where id = ?')) {
      const id = String(params[0]);
      const s = db.data.reading_sessions.find((x: Record<string, unknown>) => x.id === id);
      return s ? [s as T] : [];
    }
    if (norm.includes('select * from reading_sessions where book_id = ?')) {
      const bookId = String(params[0]);
      const list = db.data.reading_sessions
        .filter((x: Record<string, unknown>) => x.book_id === bookId)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.started_at) - Number(a.started_at));
      return list as T[];
    }
    if (norm.includes('select * from reading_sessions where ended_at is not null') && norm.includes('limit ?')) {
      const list = db.data.reading_sessions
        .filter((x: Record<string, unknown>) => x.ended_at != null)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.started_at) - Number(a.started_at));
      const limit = Number(params[0]) || 10;
      return list.slice(0, limit) as T[];
    }
    if (norm.includes('select * from reading_sessions where started_at >= ?')) {
      const t = Number(params[0]);
      const list = db.data.reading_sessions
        .filter((x: Record<string, unknown>) => Number(x.started_at) >= t)
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.started_at) - Number(a.started_at));
      return list as T[];
    }
    if (norm.includes('select count(distinct book_id)') && norm.includes('from reading_sessions')) {
      const ended = db.data.reading_sessions.filter((x: Record<string, unknown>) => x.ended_at != null);
      const books_read = new Set(ended.map((x: Record<string, unknown>) => x.book_id)).size;
      const total_time = ended.reduce((s, x) => s + (Number(x.duration) || 0), 0);
      const avg_session = ended.length ? total_time / ended.length : 0;
      return [{ books_read, total_time, avg_session } as T];
    }
    if (norm.includes('select coalesce(sum(words_revealed)') && norm.includes('from reading_sessions where started_at >= ?')) {
      const t = Number(params[0]);
      const list = db.data.reading_sessions.filter((x: Record<string, unknown>) => Number(x.started_at) >= t);
      const words_revealed = list.reduce((s, x) => s + (Number(x.words_revealed) || 0), 0);
      const words_saved = list.reduce((s, x) => s + (Number(x.words_saved) || 0), 0);
      return [{ words_revealed, words_saved } as T];
    }
    if (norm.includes('select distinct date(started_at')) {
      const ended = db.data.reading_sessions.filter((x: Record<string, unknown>) => x.ended_at != null);
      const days = [...new Set(ended.map((x: Record<string, unknown>) => {
        const ms = Number(x.started_at) || 0;
        const d = new Date(ms);
        return d.toISOString().slice(0, 10);
      }))].sort().reverse();
      return days.map((day) => ({ day })) as T[];
    }
    if (norm.includes('select coalesce(sum(duration)') && norm.includes('from reading_sessions where started_at >= ? and started_at < ?')) {
      const t1 = Number(params[0]);
      const t2 = Number(params[1]);
      const list = db.data.reading_sessions.filter(
        (x: Record<string, unknown>) => Number(x.started_at) >= t1 && Number(x.started_at) < t2 && x.ended_at != null,
      );
      const total = list.reduce((s, x) => s + (Number(x.duration) || 0), 0);
      return [{ total } as T];
    }
    if (norm.includes('select date(') && norm.includes('sum(duration)') && norm.includes('group by day')) {
      const t0 = Number(params[0]);
      const byDay: Record<string, number> = {};
      db.data.reading_sessions
        .filter((x: Record<string, unknown>) => Number(x.started_at) >= t0 && x.ended_at != null)
        .forEach((x: Record<string, unknown>) => {
          const d = new Date(Number(x.started_at)).toISOString().slice(0, 10);
          byDay[d] = (byDay[d] || 0) + (Number(x.duration) || 0);
        });
      const rows = Object.entries(byDay).map(([day, total]) => ({ day, total })).sort((a, b) => a.day.localeCompare(b.day));
      return rows as T[];
    }

    if (norm.includes('select value from preferences where key = ?')) {
      const key = String(params[0]);
      const value = db.data.preferences[key] ?? null;
      return value != null ? [{ value } as T] : [];
    }
    if (norm.includes('select * from preferences')) {
      return Object.entries(db.data.preferences).map(([key, value]) => ({ key, value })) as T[];
    }

    if (norm.includes('select max(version) as version from _migrations')) {
      const versions = db.data._migrations.map((m) => m.version);
      const version = versions.length ? Math.max(...versions) : 0;
      return [{ version } as T];
    }

    return [];
  }

  async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    const operations: Array<{ sql: string; params: (string | number | null)[] }> = [];
    const tx: Transaction = {
      executeSql: (sql: string, params: any[]) => {
        const result = this.executeSync(sql, params);
        operations.push({ sql, params: params ?? [] });
        return result;
      },
    };
    const result = await callback(tx);
    if (operations.length > 0) {
      await this.executeBatch(operations.map((o) => ({ sql: o.sql, params: o.params })));
    }
    return result;
  }

  private executeSync<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[],
  ): QueryResult<T> {
    const db = this.getDb();
    const norm = this.normalize(sql);
    if (norm.startsWith('select')) {
      const rows = this.runGetAllSync(db, sql, params) as T[];
      return { rows, rowsAffected: 0 };
    }
    this.runExecuteSync(db, sql, params);
    return { rows: [], rowsAffected: 1 };
  }

  private runGetAllSync(db: LowDBInstance, sql: string, params: (string | number | null)[]): Record<string, unknown>[] {
    const norm = this.normalize(sql);
    if (norm.includes('select * from books where id = ?')) {
      const id = String(params[0]);
      const book = db.data.books.find((b: Record<string, unknown>) => b.id === id);
      return book ? [book] : [];
    }
    if (norm.includes('select * from vocabulary where id = ?')) {
      const id = String(params[0]);
      const v = db.data.vocabulary.find((x: Record<string, unknown>) => x.id === id);
      return v ? [v] : [];
    }
    if (norm.includes('select * from reading_sessions where id = ?')) {
      const id = String(params[0]);
      const s = db.data.reading_sessions.find((x: Record<string, unknown>) => x.id === id);
      return s ? [s] : [];
    }
    return [];
  }

  private runExecuteSync(db: LowDBInstance, sql: string, params: (string | number | null)[]): void {
    const norm = this.normalize(sql);
    if (norm.startsWith('insert into books')) {
      const cols = this.parseInsertColumns(sql);
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => { row[c] = params[i] ?? null; });
      db.data.books.push(row);
    } else if (norm.startsWith('update books set') && norm.includes('where id = ?')) {
      const id = String(params[params.length - 1]);
      const book = db.data.books.find((b: Record<string, unknown>) => b.id === id);
      if (book) {
        if (norm.includes('reading_time_minutes = reading_time_minutes + ?')) {
          const addMinutes = Number(params[0]) || 0;
          (book as any).reading_time_minutes = (Number((book as any).reading_time_minutes) || 0) + addMinutes;
          (book as any).last_read_at = params[1] ?? Date.now();
        } else {
          const setPart = sql.match(/SET\s+(.+?)\s+WHERE/is)?.[1] ?? '';
          const updates = this.parseSetClause(setPart, params.slice(0, -1));
          Object.assign(book, updates);
        }
      }
    } else if (norm === 'delete from books where id = ?') {
      const id = String(params[0]);
      const i = db.data.books.findIndex((b: Record<string, unknown>) => b.id === id);
      if (i >= 0) db.data.books.splice(i, 1);
    } else if (norm === 'delete from books') {
      db.data.books = [];
    } else if (norm.startsWith('insert into vocabulary')) {
      const cols = this.parseInsertColumns(sql);
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => { row[c] = params[i] ?? null; });
      db.data.vocabulary.push(row);
    } else if (norm.startsWith('update vocabulary set') && norm.includes('where id = ?')) {
      const id = String(params[params.length - 1]);
      const setPart = sql.match(/SET\s+(.+?)\s+WHERE/is)?.[1] ?? '';
      const updates = this.parseSetClause(setPart, params.slice(0, -1));
      const v = db.data.vocabulary.find((x: Record<string, unknown>) => x.id === id);
      if (v) Object.assign(v, updates);
    } else if (norm === 'delete from vocabulary where id = ?') {
      const id = String(params[0]);
      const i = db.data.vocabulary.findIndex((x: Record<string, unknown>) => x.id === id);
      if (i >= 0) db.data.vocabulary.splice(i, 1);
    } else if (norm === 'delete from vocabulary') {
      db.data.vocabulary = [];
    } else if (norm.startsWith('insert into reading_sessions')) {
      const cols = this.parseInsertColumns(sql);
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => { row[c] = params[i] ?? null; });
      db.data.reading_sessions.push(row);
    } else if (norm.startsWith('update reading_sessions set') && norm.includes('where id = ?')) {
      const id = String(params[params.length - 1]);
      const setPart = sql.match(/SET\s+(.+?)\s+WHERE/is)?.[1] ?? '';
      const updates = this.parseSetClause(setPart, params.slice(0, -1));
      const s = db.data.reading_sessions.find((x: Record<string, unknown>) => x.id === id);
      if (s) Object.assign(s, updates);
    } else if (norm === 'delete from reading_sessions where id = ?') {
      const id = String(params[0]);
      const i = db.data.reading_sessions.findIndex((x: Record<string, unknown>) => x.id === id);
      if (i >= 0) db.data.reading_sessions.splice(i, 1);
    } else if (norm === 'delete from reading_sessions where book_id = ?') {
      const bookId = String(params[0]);
      db.data.reading_sessions = db.data.reading_sessions.filter(
        (x: Record<string, unknown>) => x.book_id !== bookId,
      );
    } else if (norm === 'delete from reading_sessions') {
      db.data.reading_sessions = [];
    }
  }

  async executeBatch(
    statements: Array<{ sql: string; params?: (string | number | null)[] }>,
  ): Promise<void> {
    const db = this.getDb();
    for (const st of statements) {
      this.runExecuteSync(db, st.sql, st.params ?? []);
    }
    await db.write();
  }

  async getSchemaVersion(): Promise<number> {
    try {
      const r = await this.getOne<{ version: number }>('SELECT MAX(version) as version FROM _migrations');
      return r?.version ?? 0;
    } catch {
      return 0;
    }
  }

  async tableExists(tableName: string): Promise<boolean> {
    const tables = ['books', 'vocabulary', 'reading_sessions', 'preferences', 'word_list', '_migrations'];
    return tables.includes(tableName.toLowerCase());
  }

  async getTableInfo(_tableName: string): Promise<Array<{ name: string; type: string }>> {
    return [];
  }

  async vacuum(): Promise<void> {
    // No-op for JSON
  }
}

export const databaseService = new DatabaseService();
(DatabaseService as unknown as { getInstance: () => DatabaseService }).getInstance = () => databaseService;
