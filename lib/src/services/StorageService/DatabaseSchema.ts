/**
 * Database Schema - SQL definitions for SQLite database
 */

export const DatabaseSchema = {
  /**
   * Create all tables
   */
  createTables: `
    -- Books table
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      cover_path TEXT,
      file_path TEXT NOT NULL,
      format TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      last_read_at INTEGER,
      progress REAL DEFAULT 0,
      current_location TEXT,
      source_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      proficiency TEXT NOT NULL,
      density REAL DEFAULT 0.3
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
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    -- User preferences table
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
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
    CREATE INDEX IF NOT EXISTS idx_vocabulary_book ON vocabulary(book_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_status ON vocabulary(status);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_source ON vocabulary(source_word);
    CREATE INDEX IF NOT EXISTS idx_word_list_source ON word_list(source_word);
    CREATE INDEX IF NOT EXISTS idx_word_list_langs ON word_list(source_lang, target_lang);
    CREATE INDEX IF NOT EXISTS idx_word_list_proficiency ON word_list(proficiency);
    CREATE INDEX IF NOT EXISTS idx_reading_sessions_book ON reading_sessions(book_id);
  `,

  /**
   * Queries for books
   */
  books: {
    insert: `
      INSERT INTO books (id, title, author, cover_path, file_path, format, added_at, source_lang, target_lang, proficiency, density)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    update: `
      UPDATE books SET
        title = COALESCE(?, title),
        author = COALESCE(?, author),
        cover_path = COALESCE(?, cover_path),
        last_read_at = COALESCE(?, last_read_at),
        progress = COALESCE(?, progress),
        current_location = COALESCE(?, current_location),
        proficiency = COALESCE(?, proficiency),
        density = COALESCE(?, density)
      WHERE id = ?
    `,
    delete: 'DELETE FROM books WHERE id = ?',
    getById: 'SELECT * FROM books WHERE id = ?',
    getAll: 'SELECT * FROM books ORDER BY last_read_at DESC, added_at DESC',
    search: `
      SELECT * FROM books
      WHERE title LIKE ? OR author LIKE ?
      ORDER BY last_read_at DESC
    `,
  },

  /**
   * Queries for vocabulary
   */
  vocabulary: {
    insert: `
      INSERT INTO vocabulary (id, source_word, target_word, source_lang, target_lang, context_sentence, book_id, added_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `,
    update: `
      UPDATE vocabulary SET
        last_reviewed_at = COALESCE(?, last_reviewed_at),
        review_count = COALESCE(?, review_count),
        ease_factor = COALESCE(?, ease_factor),
        interval = COALESCE(?, interval),
        status = COALESCE(?, status)
      WHERE id = ?
    `,
    delete: 'DELETE FROM vocabulary WHERE id = ?',
    getById: 'SELECT * FROM vocabulary WHERE id = ?',
    getAll: 'SELECT * FROM vocabulary ORDER BY added_at DESC',
    getByStatus: 'SELECT * FROM vocabulary WHERE status = ? ORDER BY added_at DESC',
    getByBook: 'SELECT * FROM vocabulary WHERE book_id = ? ORDER BY added_at DESC',
    getDueForReview: `
      SELECT * FROM vocabulary
      WHERE status != 'learned'
      AND (last_reviewed_at IS NULL OR (last_reviewed_at + interval * 86400000) <= ?)
      ORDER BY last_reviewed_at ASC
    `,
    search: `
      SELECT * FROM vocabulary
      WHERE source_word LIKE ? OR target_word LIKE ?
      ORDER BY added_at DESC
    `,
  },

  /**
   * Queries for reading sessions
   */
  sessions: {
    insert: `
      INSERT INTO reading_sessions (id, book_id, started_at)
      VALUES (?, ?, ?)
    `,
    end: `
      UPDATE reading_sessions SET
        ended_at = ?,
        pages_read = ?,
        words_revealed = ?,
        words_saved = ?
      WHERE id = ?
    `,
    getByBook: 'SELECT * FROM reading_sessions WHERE book_id = ? ORDER BY started_at DESC',
    getRecent: 'SELECT * FROM reading_sessions ORDER BY started_at DESC LIMIT ?',
    getStats: `
      SELECT
        COUNT(DISTINCT book_id) as books_read,
        SUM(ended_at - started_at) as total_time,
        SUM(words_saved) as words_saved,
        AVG(ended_at - started_at) as avg_session
      FROM reading_sessions
      WHERE ended_at IS NOT NULL
    `,
  },

  /**
   * Queries for preferences
   */
  preferences: {
    set: 'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
    get: 'SELECT value FROM preferences WHERE key = ?',
    getAll: 'SELECT * FROM preferences',
    delete: 'DELETE FROM preferences WHERE key = ?',
  },

  /**
   * Queries for word list
   */
  wordList: {
    insert: `
      INSERT INTO word_list (id, source_word, target_word, source_lang, target_lang, proficiency, frequency_rank, part_of_speech, variants, pronunciation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    getByWord: `
      SELECT * FROM word_list
      WHERE source_word = ? AND source_lang = ? AND target_lang = ?
    `,
    getByLevel: `
      SELECT * FROM word_list
      WHERE source_lang = ? AND target_lang = ? AND proficiency = ?
      ORDER BY frequency_rank
    `,
    count: `
      SELECT COUNT(*) as count FROM word_list
      WHERE source_lang = ? AND target_lang = ?
    `,
  },
};
