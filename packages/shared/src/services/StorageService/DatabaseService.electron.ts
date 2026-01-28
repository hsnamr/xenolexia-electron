/**
 * Database Service - Electron version using better-sqlite3
 *
 * Uses better-sqlite3 for SQLite operations (synchronous API).
 * Provides connection management, migrations, and query helpers.
 */

import Database from 'better-sqlite3';
import type { RunResult } from 'better-sqlite3';
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

// ============================================================================
// Database Configuration
// ============================================================================

const DATABASE_NAME = 'xenolexia.db';

// ============================================================================
// Database Service Class
// ============================================================================

class DatabaseService {
  private db: Database.Database | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private dbPath: string | null = null;

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.isInitialized && this.db) {
      return;
    }

    this.initPromise = this.doInitialize();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Perform actual initialization
   */
  private async doInitialize(): Promise<void> {
    try {
      // Get app data path for Electron
      const appDataPath = await getAppDataPath();
      this.dbPath = `${appDataPath}/${DATABASE_NAME}`;

      // Open database (better-sqlite3 is synchronous)
      this.db = new Database(this.dbPath);

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      console.log('[Database] Connected to SQLite database:', this.dbPath);

      // Run migrations
      this.runMigrations();

      this.isInitialized = true;
      console.log('[Database] Initialization complete');
    } catch (error) {
      console.error('[Database] Initialization failed:', error);
      this.db = null;
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Get database instance (initializes if needed)
   */
  async getDatabase(): Promise<Database.Database> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Get database instance synchronously (for better-sqlite3)
   */
  private getDatabaseSync(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if database is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[Database] Connection closed');
    }
  }

  // ============================================================================
  // Query Helpers
  // ============================================================================

  /**
   * Execute a SQL query
   */
  async execute<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<QueryResult<T>> {
    const db = this.getDatabaseSync();

    try {
      // Check if it's a SELECT query
      const trimmedSql = sql.trim().toUpperCase();
      if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('PRAGMA')) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params) as T[];

        return {
          rows,
          rowsAffected: 0,
        };
      } else {
        // INSERT, UPDATE, DELETE, etc.
        const stmt = db.prepare(sql);
        const result = stmt.run(...params) as RunResult;

        return {
          rows: [],
          rowsAffected: result.changes,
          insertId: result.lastInsertRowid ? Number(result.lastInsertRowid) : undefined,
        };
      }
    } catch (error) {
      console.error('[Database] Query failed:', sql, error);
      throw error;
    }
  }

  /**
   * Execute multiple SQL statements in a transaction
   * Note: better-sqlite3 transactions are synchronous, so we execute all statements synchronously
   */
  async transaction<T>(
    callback: (tx: Transaction) => Promise<T>,
  ): Promise<T> {
    const db = this.getDatabaseSync();

    // For better-sqlite3, we need to collect all operations first
    // Since transactions are synchronous, we'll execute them all at once
    const operations: Array<{sql: string; params: any[]}> = [];
    let result: T | null = null;
    let error: Error | null = null;

    // Create a transaction wrapper that collects operations
    const tx: Transaction = {
      executeSql: (sql: string, params: any[], success?: (tx: any, result: any) => void, err?: (tx: any, e: any) => boolean) => {
        try {
          const queryResult = this.executeSync(sql, params);
          operations.push({ sql, params });
          if (success) {
            success(tx, queryResult);
          }
          return queryResult;
        } catch (e) {
          if (err) {
            const handled = err(tx, e);
            if (!handled) {
              error = e instanceof Error ? e : new Error(String(e));
            }
          } else {
            error = e instanceof Error ? e : new Error(String(e));
          }
          throw e;
        }
      },
    };

    // Execute callback to collect operations
    try {
      result = await callback(tx);
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
    }

    // If there was an error, reject
    if (error) {
      throw error;
    }

    // Execute all operations in a single transaction
    if (operations.length > 0) {
      const transaction = db.transaction(() => {
        for (const op of operations) {
          const stmt = db.prepare(op.sql);
          stmt.run(...op.params);
        }
      });
      transaction();
    }

    return result as T;
  }

  /**
   * Execute a batch of SQL statements
   */
  async executeBatch(
    statements: Array<{sql: string; params?: (string | number | null)[]}>,
  ): Promise<void> {
    const db = this.getDatabaseSync();

    const transaction = db.transaction(() => {
      for (const statement of statements) {
        const stmt = db.prepare(statement.sql);
        stmt.run(...(statement.params || []));
      }
    });

    transaction();
  }

  /**
   * Get a single row
   */
  async getOne<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T | null> {
    const db = this.getDatabaseSync();
    const stmt = db.prepare(sql);
    const row = stmt.get(...params) as T | undefined;
    return row || null;
  }

  /**
   * Get all rows
   */
  async getAll<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T[]> {
    const db = this.getDatabaseSync();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  /**
   * Insert a row and return the insert ID
   */
  async insert(
    table: string,
    data: Record<string, string | number | null>,
  ): Promise<number | undefined> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = await this.execute(sql, values);

    return result.insertId;
  }

  /**
   * Update rows
   */
  async update(
    table: string,
    data: Record<string, string | number | null>,
    where: string,
    whereParams: (string | number | null)[] = [],
  ): Promise<number> {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(data);

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await this.execute(sql, [...values, ...whereParams]);

    return result.rowsAffected;
  }

  /**
   * Delete rows
   */
  async delete(
    table: string,
    where: string,
    whereParams: (string | number | null)[] = [],
  ): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.execute(sql, whereParams);

    return result.rowsAffected;
  }

  // ============================================================================
  // Migrations
  // ============================================================================

  /**
   * Run database migrations
   */
  private runMigrations(): void {
    const db = this.getDatabaseSync();

    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        applied_at INTEGER NOT NULL
      )
    `);

    // Get current version
    const stmt = db.prepare('SELECT MAX(version) as version FROM _migrations');
    const current = stmt.get() as {version: number} | undefined;
    const currentVersion = current?.version ?? 0;

    console.log(`[Database] Current version: ${currentVersion}`);

    // Get pending migrations
    const pendingMigrations = MIGRATIONS.filter(
      (m) => m.version > currentVersion,
    ).sort((a, b) => a.version - b.version);

    if (pendingMigrations.length === 0) {
      console.log('[Database] No pending migrations');
      return;
    }

    // Run pending migrations in a transaction
    const transaction = db.transaction(() => {
      for (const migration of pendingMigrations) {
        console.log(
          `[Database] Running migration ${migration.version}: ${migration.description}`,
        );

        try {
          // Execute migration SQL
          db.exec(migration.up);

          // Record migration
          const insertStmt = db.prepare(
            'INSERT INTO _migrations (version, description, applied_at) VALUES (?, ?, ?)',
          );
          insertStmt.run(migration.version, migration.description, Date.now());

          console.log(`[Database] Migration ${migration.version} complete`);
        } catch (error) {
          console.error(`[Database] Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
    });

    transaction();

    console.log('[Database] All migrations complete');
  }

  /**
   * Get current schema version
   */
  async getSchemaVersion(): Promise<number> {
    try {
      const result = await this.getOne<{version: number}>(
        'SELECT MAX(version) as version FROM _migrations',
      );
      return result?.version ?? 0;
    } catch {
      return 0;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Execute query synchronously (internal use)
   */
  private executeSync<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): QueryResult<T> {
    const db = this.getDatabaseSync();

    const trimmedSql = sql.trim().toUpperCase();
    if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('PRAGMA')) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as T[];

      return {
        rows,
        rowsAffected: 0,
      };
    } else {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params) as RunResult;

      return {
        rows: [],
        rowsAffected: result.changes,
        insertId: result.lastInsertRowid ? Number(result.lastInsertRowid) : undefined,
      };
    }
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.getOne<{name: string}>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName],
    );
    return result !== null;
  }

  /**
   * Get table info (columns)
   */
  async getTableInfo(tableName: string): Promise<Array<{name: string; type: string}>> {
    return this.getAll(`PRAGMA table_info(${tableName})`);
  }

  /**
   * Vacuum database (optimize storage)
   */
  async vacuum(): Promise<void> {
    const db = this.getDatabaseSync();
    db.exec('VACUUM');
    console.log('[Database] Vacuum complete');
  }
}

// ============================================================================
// Transaction Interface (for compatibility)
// ============================================================================

interface Transaction {
  executeSql: (
    sql: string,
    params: any[],
    success?: (tx: Transaction, result: any) => void,
    error?: (tx: Transaction, err: any) => boolean,
  ) => any;
}

// ============================================================================
// Migrations Definition
// ============================================================================

const MIGRATIONS: MigrationDefinition[] = [
  {
    version: 1,
    description: 'Initial schema',
    up: `
      -- Books table
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        description TEXT,
        cover_path TEXT,
        file_path TEXT NOT NULL,
        format TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        added_at INTEGER NOT NULL,
        last_read_at INTEGER,
        progress REAL DEFAULT 0,
        current_location TEXT,
        current_chapter INTEGER DEFAULT 0,
        total_chapters INTEGER DEFAULT 0,
        current_page INTEGER DEFAULT 0,
        total_pages INTEGER DEFAULT 0,
        reading_time_minutes INTEGER DEFAULT 0,
        source_lang TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        proficiency TEXT NOT NULL,
        word_density REAL DEFAULT 0.3,
        source_url TEXT,
        is_downloaded INTEGER DEFAULT 1
      );

      -- Vocabulary table
      CREATE TABLE IF NOT EXISTS vocabulary (
        id TEXT PRIMARY KEY,
        source_word TEXT NOT NULL,
        target_word TEXT NOT NULL,
        source_lang TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        context_sentence TEXT,
        book_id TEXT,
        book_title TEXT,
        added_at INTEGER NOT NULL,
        last_reviewed_at INTEGER,
        review_count INTEGER DEFAULT 0,
        ease_factor REAL DEFAULT 2.5,
        interval INTEGER DEFAULT 0,
        status TEXT DEFAULT 'new',
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
      );

      -- Reading sessions table
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        pages_read INTEGER DEFAULT 0,
        words_revealed INTEGER DEFAULT 0,
        words_saved INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      -- User preferences table
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Word list table (populated from bundled assets)
      CREATE TABLE IF NOT EXISTS word_list (
        id TEXT PRIMARY KEY,
        source_word TEXT NOT NULL,
        target_word TEXT NOT NULL,
        source_lang TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        proficiency TEXT NOT NULL,
        frequency_rank INTEGER,
        part_of_speech TEXT,
        variants TEXT,
        pronunciation TEXT
      );

      -- Create indexes for faster queries
      CREATE INDEX IF NOT EXISTS idx_books_added ON books(added_at);
      CREATE INDEX IF NOT EXISTS idx_books_last_read ON books(last_read_at);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_book ON vocabulary(book_id);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_status ON vocabulary(status);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_source ON vocabulary(source_word);
      CREATE INDEX IF NOT EXISTS idx_vocabulary_added ON vocabulary(added_at);
      CREATE INDEX IF NOT EXISTS idx_word_list_source ON word_list(source_word);
      CREATE INDEX IF NOT EXISTS idx_word_list_langs ON word_list(source_lang, target_lang);
      CREATE INDEX IF NOT EXISTS idx_word_list_proficiency ON word_list(proficiency);
      CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON reading_sessions(book_id);
      CREATE INDEX IF NOT EXISTS idx_reading_sessions_started ON reading_sessions(started_at);
    `,
    down: `
      DROP TABLE IF EXISTS reading_sessions;
      DROP TABLE IF EXISTS vocabulary;
      DROP TABLE IF EXISTS word_list;
      DROP TABLE IF EXISTS preferences;
      DROP TABLE IF EXISTS books;
    `,
  },
];

// ============================================================================
// Singleton Export
// ============================================================================

export const databaseService = new DatabaseService();
