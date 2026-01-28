/**
 * Session Repository - Database operations for reading sessions
 */

import type {ReadingSession, ReadingStats} from '@/types';
import {databaseService} from '../DatabaseService';
import {v4 as uuidv4} from 'uuid';

// ============================================================================
// Types
// ============================================================================

/** Raw session row from database */
interface SessionRow {
  id: string;
  book_id: string;
  started_at: number;
  ended_at: number | null;
  pages_read: number;
  words_revealed: number;
  words_saved: number;
  duration: number;
}

// ============================================================================
// Session Repository Class
// ============================================================================

class SessionRepository {
  // ============================================================================
  // Session Operations
  // ============================================================================

  /**
   * Start a new reading session
   */
  async startSession(bookId: string): Promise<string> {
    const sessionId = uuidv4();
    const now = Date.now();

    await databaseService.execute(
      `INSERT INTO reading_sessions (id, book_id, started_at)
       VALUES (?, ?, ?)`,
      [sessionId, bookId, now],
    );

    return sessionId;
  }

  /**
   * End a reading session
   */
  async endSession(
    sessionId: string,
    stats: {
      pagesRead: number;
      wordsRevealed: number;
      wordsSaved: number;
    },
  ): Promise<void> {
    const now = Date.now();

    // Get session to calculate duration
    const session = await databaseService.getOne<SessionRow>(
      'SELECT * FROM reading_sessions WHERE id = ?',
      [sessionId],
    );

    const duration = session ? Math.floor((now - session.started_at) / 1000) : 0;

    await databaseService.execute(
      `UPDATE reading_sessions 
       SET ended_at = ?, pages_read = ?, words_revealed = ?, words_saved = ?, duration = ?
       WHERE id = ?`,
      [now, stats.pagesRead, stats.wordsRevealed, stats.wordsSaved, duration, sessionId],
    );
  }

  /**
   * Get a session by ID
   */
  async getById(sessionId: string): Promise<ReadingSession | null> {
    const row = await databaseService.getOne<SessionRow>(
      'SELECT * FROM reading_sessions WHERE id = ?',
      [sessionId],
    );

    return row ? this.rowToSession(row) : null;
  }

  /**
   * Get sessions for a book
   */
  async getByBookId(bookId: string): Promise<ReadingSession[]> {
    const rows = await databaseService.getAll<SessionRow>(
      `SELECT * FROM reading_sessions 
       WHERE book_id = ? 
       ORDER BY started_at DESC`,
      [bookId],
    );

    return rows.map((row) => this.rowToSession(row));
  }

  /**
   * Get recent sessions
   */
  async getRecent(limit: number = 10): Promise<ReadingSession[]> {
    const rows = await databaseService.getAll<SessionRow>(
      `SELECT * FROM reading_sessions 
       WHERE ended_at IS NOT NULL
       ORDER BY started_at DESC 
       LIMIT ?`,
      [limit],
    );

    return rows.map((row) => this.rowToSession(row));
  }

  /**
   * Get sessions from today
   */
  async getToday(): Promise<ReadingSession[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rows = await databaseService.getAll<SessionRow>(
      `SELECT * FROM reading_sessions 
       WHERE started_at >= ?
       ORDER BY started_at DESC`,
      [startOfDay.getTime()],
    );

    return rows.map((row) => this.rowToSession(row));
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string): Promise<void> {
    await databaseService.execute(
      'DELETE FROM reading_sessions WHERE id = ?',
      [sessionId],
    );
  }

  /**
   * Delete all sessions for a book
   */
  async deleteByBookId(bookId: string): Promise<void> {
    await databaseService.execute(
      'DELETE FROM reading_sessions WHERE book_id = ?',
      [bookId],
    );
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get comprehensive reading statistics
   */
  async getStatistics(): Promise<ReadingStats> {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Overall stats
    const overall = await databaseService.getOne<{
      books_read: number;
      total_time: number;
      avg_session: number;
    }>(`
      SELECT 
        COUNT(DISTINCT book_id) as books_read,
        COALESCE(SUM(duration), 0) as total_time,
        COALESCE(AVG(duration), 0) as avg_session
      FROM reading_sessions
      WHERE ended_at IS NOT NULL
    `);

    // Today's stats
    const today = await databaseService.getOne<{
      words_revealed: number;
      words_saved: number;
    }>(`
      SELECT 
        COALESCE(SUM(words_revealed), 0) as words_revealed,
        COALESCE(SUM(words_saved), 0) as words_saved
      FROM reading_sessions
      WHERE started_at >= ?
    `, [startOfToday.getTime()]);

    // Streak calculation
    const streakData = await this.calculateStreak();

    // Words learned (from vocabulary table)
    const wordsLearned = await databaseService.getOne<{count: number}>(`
      SELECT COUNT(*) as count FROM vocabulary WHERE status = 'learned'
    `);

    return {
      totalBooksRead: overall?.books_read ?? 0,
      totalReadingTime: overall?.total_time ?? 0,
      totalWordsLearned: wordsLearned?.count ?? 0,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      averageSessionDuration: overall?.avg_session ?? 0,
      wordsRevealedToday: today?.words_revealed ?? 0,
      wordsSavedToday: today?.words_saved ?? 0,
    };
  }

  /**
   * Calculate reading streak
   */
  private async calculateStreak(): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    // Get unique reading days (ordered by most recent)
    const rows = await databaseService.getAll<{day: string}>(`
      SELECT DISTINCT date(started_at / 1000, 'unixepoch', 'localtime') as day
      FROM reading_sessions
      WHERE ended_at IS NOT NULL
      ORDER BY day DESC
    `);

    if (rows.length === 0) {
      return {currentStreak: 0, longestStreak: 0};
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if there's activity today or yesterday
    const mostRecentDay = rows[0].day;
    let currentStreak = 0;

    if (mostRecentDay === todayStr || mostRecentDay === yesterdayStr) {
      // Start counting streak
      currentStreak = 1;
      let expectedDate = new Date(mostRecentDay);

      for (let i = 1; i < rows.length; i++) {
        const prevDay = new Date(expectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().split('T')[0];

        if (rows[i].day === prevDayStr) {
          currentStreak++;
          expectedDate = prevDay;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < rows.length - 1; i++) {
      const currentDay = new Date(rows[i].day);
      const nextDay = new Date(rows[i + 1].day);
      const diffDays = Math.floor(
        (currentDay.getTime() - nextDay.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {currentStreak, longestStreak};
  }

  /**
   * Get reading time for a specific period
   */
  async getReadingTimeForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await databaseService.getOne<{total: number}>(`
      SELECT COALESCE(SUM(duration), 0) as total
      FROM reading_sessions
      WHERE started_at >= ? AND started_at < ?
      AND ended_at IS NOT NULL
    `, [startDate.getTime(), endDate.getTime()]);

    return result?.total ?? 0;
  }

  /**
   * Get daily reading time for the last N days
   */
  async getDailyReadingTime(days: number = 7): Promise<Array<{date: string; minutes: number}>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const rows = await databaseService.getAll<{day: string; total: number}>(`
      SELECT 
        date(started_at / 1000, 'unixepoch', 'localtime') as day,
        COALESCE(SUM(duration), 0) as total
      FROM reading_sessions
      WHERE started_at >= ? AND ended_at IS NOT NULL
      GROUP BY day
      ORDER BY day ASC
    `, [startDate.getTime()]);

    // Fill in missing days with 0
    const result: Array<{date: string; minutes: number}> = [];
    const dateMap = new Map(rows.map((r) => [r.day, r.total]));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const seconds = dateMap.get(dateStr) ?? 0;
      result.push({
        date: dateStr,
        minutes: Math.round(seconds / 60),
      });
    }

    return result;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert database row to ReadingSession
   */
  private rowToSession(row: SessionRow): ReadingSession {
    return {
      id: row.id,
      bookId: row.book_id,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : null,
      pagesRead: row.pages_read,
      wordsRevealed: row.words_revealed,
      wordsSaved: row.words_saved,
      duration: row.duration,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const sessionRepository = new SessionRepository();
