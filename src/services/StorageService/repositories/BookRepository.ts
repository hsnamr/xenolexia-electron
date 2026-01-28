/**
 * Book Repository - Database operations for books
 */

import type {Book, BookFormat, ProficiencyLevel, Language} from '@/types';
import {databaseService} from '../DatabaseService';

// ============================================================================
// Types
// ============================================================================

/** Raw book row from database */
interface BookRow {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_path: string | null;
  file_path: string;
  format: string;
  file_size: number;
  added_at: number;
  last_read_at: number | null;
  progress: number;
  current_location: string | null;
  current_chapter: number;
  total_chapters: number;
  current_page: number;
  total_pages: number;
  reading_time_minutes: number;
  source_lang: string;
  target_lang: string;
  proficiency: string;
  word_density: number;
  source_url: string | null;
  is_downloaded: number;
}

export interface BookFilter {
  format?: BookFormat;
  targetLanguage?: Language;
  proficiency?: ProficiencyLevel;
  hasProgress?: boolean;
  isDownloaded?: boolean;
}

export interface BookSort {
  by: 'title' | 'author' | 'addedAt' | 'lastReadAt' | 'progress';
  order: 'asc' | 'desc';
}

// ============================================================================
// Book Repository Class
// ============================================================================

class BookRepository {
  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Add a new book to the database
   */
  async add(book: Book): Promise<void> {
    await databaseService.execute(
      `INSERT INTO books (
        id, title, author, description, cover_path, file_path, format, file_size,
        added_at, last_read_at, progress, current_location, current_chapter,
        total_chapters, current_page, total_pages, reading_time_minutes,
        source_lang, target_lang, proficiency, word_density, source_url, is_downloaded
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        book.id,
        book.title,
        book.author,
        null, // description
        book.coverPath,
        book.filePath,
        book.format,
        book.fileSize,
        book.addedAt.getTime(),
        book.lastReadAt?.getTime() ?? null,
        book.progress,
        book.currentLocation,
        book.currentChapter,
        book.totalChapters,
        book.currentPage,
        book.totalPages,
        book.readingTimeMinutes,
        book.languagePair.sourceLanguage,
        book.languagePair.targetLanguage,
        book.proficiencyLevel,
        book.wordDensity,
        book.sourceUrl ?? null,
        book.isDownloaded ? 1 : 0,
      ],
    );
  }

  /**
   * Update an existing book
   */
  async update(bookId: string, updates: Partial<Book>): Promise<void> {
    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    if (updates.title !== undefined) {
      setClauses.push('title = ?');
      params.push(updates.title);
    }
    if (updates.author !== undefined) {
      setClauses.push('author = ?');
      params.push(updates.author);
    }
    if (updates.coverPath !== undefined) {
      setClauses.push('cover_path = ?');
      params.push(updates.coverPath);
    }
    if (updates.lastReadAt !== undefined) {
      setClauses.push('last_read_at = ?');
      params.push(updates.lastReadAt?.getTime() ?? null);
    }
    if (updates.progress !== undefined) {
      setClauses.push('progress = ?');
      params.push(updates.progress);
    }
    if (updates.currentLocation !== undefined) {
      setClauses.push('current_location = ?');
      params.push(updates.currentLocation);
    }
    if (updates.currentChapter !== undefined) {
      setClauses.push('current_chapter = ?');
      params.push(updates.currentChapter);
    }
    if (updates.totalChapters !== undefined) {
      setClauses.push('total_chapters = ?');
      params.push(updates.totalChapters);
    }
    if (updates.currentPage !== undefined) {
      setClauses.push('current_page = ?');
      params.push(updates.currentPage);
    }
    if (updates.totalPages !== undefined) {
      setClauses.push('total_pages = ?');
      params.push(updates.totalPages);
    }
    if (updates.readingTimeMinutes !== undefined) {
      setClauses.push('reading_time_minutes = ?');
      params.push(updates.readingTimeMinutes);
    }
    if (updates.proficiencyLevel !== undefined) {
      setClauses.push('proficiency = ?');
      params.push(updates.proficiencyLevel);
    }
    if (updates.wordDensity !== undefined) {
      setClauses.push('word_density = ?');
      params.push(updates.wordDensity);
    }
    if (updates.isDownloaded !== undefined) {
      setClauses.push('is_downloaded = ?');
      params.push(updates.isDownloaded ? 1 : 0);
    }
    if (updates.languagePair !== undefined) {
      setClauses.push('source_lang = ?', 'target_lang = ?');
      params.push(
        updates.languagePair.sourceLanguage,
        updates.languagePair.targetLanguage,
      );
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    params.push(bookId);

    await databaseService.execute(
      `UPDATE books SET ${setClauses.join(', ')} WHERE id = ?`,
      params,
    );
  }

  /**
   * Delete a book
   */
  async delete(bookId: string): Promise<void> {
    await databaseService.execute('DELETE FROM books WHERE id = ?', [bookId]);
  }

  /**
   * Delete all books
   */
  async deleteAll(): Promise<void> {
    await databaseService.execute('DELETE FROM books');
  }

  /**
   * Get a book by ID
   */
  async getById(bookId: string): Promise<Book | null> {
    const row = await databaseService.getOne<BookRow>(
      'SELECT * FROM books WHERE id = ?',
      [bookId],
    );

    return row ? this.rowToBook(row) : null;
  }

  /**
   * Get all books
   */
  async getAll(sort?: BookSort): Promise<Book[]> {
    const orderBy = this.buildOrderBy(sort);
    const rows = await databaseService.getAll<BookRow>(
      `SELECT * FROM books ${orderBy}`,
    );

    return rows.map((row) => this.rowToBook(row));
  }

  /**
   * Get books with filters
   */
  async getFiltered(filter: BookFilter, sort?: BookSort): Promise<Book[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter.format) {
      conditions.push('format = ?');
      params.push(filter.format);
    }
    if (filter.targetLanguage) {
      conditions.push('target_lang = ?');
      params.push(filter.targetLanguage);
    }
    if (filter.proficiency) {
      conditions.push('proficiency = ?');
      params.push(filter.proficiency);
    }
    if (filter.hasProgress !== undefined) {
      conditions.push(filter.hasProgress ? 'progress > 0' : 'progress = 0');
    }
    if (filter.isDownloaded !== undefined) {
      conditions.push('is_downloaded = ?');
      params.push(filter.isDownloaded ? 1 : 0);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = this.buildOrderBy(sort);

    const rows = await databaseService.getAll<BookRow>(
      `SELECT * FROM books ${whereClause} ${orderBy}`,
      params,
    );

    return rows.map((row) => this.rowToBook(row));
  }

  /**
   * Search books by title or author
   */
  async search(query: string): Promise<Book[]> {
    const searchTerm = `%${query}%`;
    const rows = await databaseService.getAll<BookRow>(
      `SELECT * FROM books 
       WHERE title LIKE ? OR author LIKE ?
       ORDER BY last_read_at DESC NULLS LAST, added_at DESC`,
      [searchTerm, searchTerm],
    );

    return rows.map((row) => this.rowToBook(row));
  }

  /**
   * Get recently read books
   */
  async getRecentlyRead(limit: number = 5): Promise<Book[]> {
    const rows = await databaseService.getAll<BookRow>(
      `SELECT * FROM books 
       WHERE last_read_at IS NOT NULL 
       ORDER BY last_read_at DESC 
       LIMIT ?`,
      [limit],
    );

    return rows.map((row) => this.rowToBook(row));
  }

  /**
   * Get books currently in progress
   */
  async getInProgress(): Promise<Book[]> {
    const rows = await databaseService.getAll<BookRow>(
      `SELECT * FROM books 
       WHERE progress > 0 AND progress < 100 
       ORDER BY last_read_at DESC`,
    );

    return rows.map((row) => this.rowToBook(row));
  }

  /**
   * Get total count of books
   */
  async count(): Promise<number> {
    const result = await databaseService.getOne<{count: number}>(
      'SELECT COUNT(*) as count FROM books',
    );
    return result?.count ?? 0;
  }

  // ============================================================================
  // Progress Operations
  // ============================================================================

  /**
   * Update reading progress
   */
  async updateProgress(
    bookId: string,
    progress: number,
    location: string | null,
    chapter?: number,
    page?: number,
  ): Promise<void> {
    const setClauses = ['progress = ?', 'last_read_at = ?'];
    const params: (string | number | null)[] = [
      Math.min(100, Math.max(0, progress)),
      Date.now(),
    ];

    if (location !== undefined) {
      setClauses.push('current_location = ?');
      params.push(location);
    }
    if (chapter !== undefined) {
      setClauses.push('current_chapter = ?');
      params.push(chapter);
    }
    if (page !== undefined) {
      setClauses.push('current_page = ?');
      params.push(page);
    }

    params.push(bookId);

    await databaseService.execute(
      `UPDATE books SET ${setClauses.join(', ')} WHERE id = ?`,
      params,
    );
  }

  /**
   * Add reading time
   */
  async addReadingTime(bookId: string, minutes: number): Promise<void> {
    await databaseService.execute(
      `UPDATE books 
       SET reading_time_minutes = reading_time_minutes + ?, 
           last_read_at = ? 
       WHERE id = ?`,
      [minutes, Date.now(), bookId],
    );
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get reading statistics
   */
  async getStatistics(): Promise<{
    totalBooks: number;
    booksInProgress: number;
    booksCompleted: number;
    totalReadingTime: number;
  }> {
    const result = await databaseService.getOne<{
      total: number;
      in_progress: number;
      completed: number;
      total_time: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN progress > 0 AND progress < 100 THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END) as completed,
        SUM(reading_time_minutes) as total_time
      FROM books
    `);

    return {
      totalBooks: result?.total ?? 0,
      booksInProgress: result?.in_progress ?? 0,
      booksCompleted: result?.completed ?? 0,
      totalReadingTime: result?.total_time ?? 0,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert database row to Book object
   */
  private rowToBook(row: BookRow): Book {
    return {
      id: row.id,
      title: row.title,
      author: row.author ?? 'Unknown Author',
      coverPath: row.cover_path,
      filePath: row.file_path,
      format: row.format as BookFormat,
      fileSize: row.file_size,
      addedAt: new Date(row.added_at),
      lastReadAt: row.last_read_at ? new Date(row.last_read_at) : null,
      languagePair: {
        sourceLanguage: row.source_lang as Language,
        targetLanguage: row.target_lang as Language,
      },
      proficiencyLevel: row.proficiency as ProficiencyLevel,
      wordDensity: row.word_density,
      progress: row.progress,
      currentLocation: row.current_location,
      currentChapter: row.current_chapter,
      totalChapters: row.total_chapters,
      currentPage: row.current_page,
      totalPages: row.total_pages,
      readingTimeMinutes: row.reading_time_minutes,
      sourceUrl: row.source_url ?? undefined,
      isDownloaded: row.is_downloaded === 1,
    };
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderBy(sort?: BookSort): string {
    if (!sort) {
      return 'ORDER BY last_read_at DESC NULLS LAST, added_at DESC';
    }

    const columnMap: Record<string, string> = {
      title: 'title',
      author: 'author',
      addedAt: 'added_at',
      lastReadAt: 'last_read_at',
      progress: 'progress',
    };

    const column = columnMap[sort.by] || 'added_at';
    const direction = sort.order === 'asc' ? 'ASC' : 'DESC';

    return `ORDER BY ${column} ${direction}`;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const bookRepository = new BookRepository();
