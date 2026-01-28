/**
 * Database Service - SQLite database connection and management
 *
 * Uses react-native-sqlite-storage for SQLite operations.
 * Provides connection management, migrations, and query helpers.
 */

import SQLite, {
  SQLiteDatabase,
  ResultSet,
  Transaction,
} from 'react-native-sqlite-storage';

// Enable debug mode in development
if (__DEV__) {
  SQLite.DEBUG(true);
}

// Use promise-based API
SQLite.enablePromise(true);

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
const DATABASE_VERSION = 1;
const DATABASE_LOCATION = 'default';

// ============================================================================
// Database Service Class
// ============================================================================

class DatabaseService {
  private db: SQLiteDatabase | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

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
      // Open database
      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: DATABASE_LOCATION,
      });

      console.log('[Database] Connected to SQLite database');

      // Run migrations
      await this.runMigrations();

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
  async getDatabase(): Promise<SQLiteDatabase> {
    await this.initialize();
    if (!this.db) {
      throw new Error('Database not initialized');
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
      await this.db.close();
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
    const db = await this.getDatabase();

    try {
      const [result] = await db.executeSql(sql, params);
      return this.parseResult<T>(result);
    } catch (error) {
      console.error('[Database] Query failed:', sql, error);
      throw error;
    }
  }

  /**
   * Execute multiple SQL statements in a transaction
   */
  async transaction<T>(
    callback: (tx: Transaction) => Promise<T>,
  ): Promise<T> {
    const db = await this.getDatabase();

    return new Promise((resolve, reject) => {
      db.transaction(
        async (tx) => {
          try {
            const result = await callback(tx);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          console.error('[Database] Transaction failed:', error);
          reject(error);
        },
      );
    });
  }

  /**
   * Execute a batch of SQL statements
   */
  async executeBatch(
    statements: Array<{sql: string; params?: (string | number | null)[]}>,
  ): Promise<void> {
    await this.transaction(async (tx) => {
      for (const statement of statements) {
        await new Promise<void>((resolve, reject) => {
          tx.executeSql(
            statement.sql,
            statement.params || [],
            () => resolve(),
            (_, error) => {
              reject(error);
              return false;
            },
          );
        });
      }
    });
  }

  /**
   * Get a single row
   */
  async getOne<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T | null> {
    const result = await this.execute<T>(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get all rows
   */
  async getAll<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T[]> {
    const result = await this.execute<T>(sql, params);
    return result.rows;
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
  private async runMigrations(): Promise<void> {
    // Create migrations table if it doesn't exist
    await this.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        applied_at INTEGER NOT NULL
      )
    `);

    // Get current version
    const current = await this.getOne<{version: number}>(
      'SELECT MAX(version) as version FROM _migrations',
    );
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

    // Run pending migrations
    for (const migration of pendingMigrations) {
      console.log(
        `[Database] Running migration ${migration.version}: ${migration.description}`,
      );

      try {
        // Split and execute statements
        const statements = migration.up
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          await this.execute(statement);
        }

        // Record migration
        await this.execute(
          'INSERT INTO _migrations (version, description, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.description, Date.now()],
        );

        console.log(`[Database] Migration ${migration.version} complete`);
      } catch (error) {
        console.error(`[Database] Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

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
   * Parse SQLite result set
   */
  private parseResult<T>(result: ResultSet): QueryResult<T> {
    const rows: T[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i) as T);
    }

    return {
      rows,
      rowsAffected: result.rowsAffected,
      insertId: result.insertId,
    };
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
    await this.execute('VACUUM');
    console.log('[Database] Vacuum complete');
  }
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
