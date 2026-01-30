/**
 * Session Repository - Database operations for reading sessions
 * Uses direct LowDB data API (no SQL).
 */

import type {ReadingSession, ReadingStats} from '../../../types';
import type {SessionRow} from '../DataStore.types';
import {databaseService} from '../DatabaseService';
import {v4 as uuidv4} from 'uuid';

// ============================================================================
// Session Repository Class
// ============================================================================

class SessionRepository {
  async startSession(bookId: string): Promise<string> {
    const sessionId = uuidv4();
    const now = Date.now();
    await databaseService.addSession({
      id: sessionId,
      book_id: bookId,
      started_at: now,
      ended_at: null,
      pages_read: 0,
      words_revealed: 0,
      words_saved: 0,
    });
    return sessionId;
  }

  async endSession(
    sessionId: string,
    stats: {pagesRead: number; wordsRevealed: number; wordsSaved: number}
  ): Promise<void> {
    const now = Date.now();
    const session = await databaseService.getSessionById(sessionId);
    const duration = session ? Math.floor((now - session.started_at) / 1000) : 0;
    await databaseService.updateSession(sessionId, {
      ended_at: now,
      pages_read: stats.pagesRead,
      words_revealed: stats.wordsRevealed,
      words_saved: stats.wordsSaved,
      duration,
    });
  }

  async getById(sessionId: string): Promise<ReadingSession | null> {
    const row = await databaseService.getSessionById(sessionId);
    return row ? this.rowToSession(row) : null;
  }

  async getByBookId(bookId: string): Promise<ReadingSession[]> {
    const rows = await databaseService.getSessionsByBookId(bookId);
    return rows.map((row) => this.rowToSession(row));
  }

  async getRecent(limit: number = 10): Promise<ReadingSession[]> {
    const rows = await databaseService.getRecentSessions(limit);
    return rows.map((row) => this.rowToSession(row));
  }

  async getToday(): Promise<ReadingSession[]> {
    const rows = await databaseService.getTodaySessions();
    return rows.map((row) => this.rowToSession(row));
  }

  async delete(sessionId: string): Promise<void> {
    await databaseService.deleteSession(sessionId);
  }

  async deleteByBookId(bookId: string): Promise<void> {
    await databaseService.deleteSessionsByBookId(bookId);
  }

  async deleteAll(): Promise<void> {
    await databaseService.deleteAllSessions();
  }

  async getStatistics(): Promise<ReadingStats> {
    return databaseService.getSessionStatistics();
  }

  async getReadingTimeForPeriod(startDate: Date, endDate: Date): Promise<number> {
    return databaseService.getReadingTimeForPeriod(startDate.getTime(), endDate.getTime());
  }

  async getDailyReadingTime(days: number = 7): Promise<Array<{date: string; minutes: number}>> {
    return databaseService.getDailyReadingTime(days);
  }

  private rowToSession(row: SessionRow): ReadingSession {
    return {
      id: row.id,
      bookId: row.book_id,
      startedAt: new Date(row.started_at),
      endedAt: row.ended_at ? new Date(row.ended_at) : null,
      pagesRead: row.pages_read,
      wordsRevealed: row.words_revealed,
      wordsSaved: row.words_saved,
      duration: row.duration ?? 0,
    };
  }
}

export const sessionRepository = new SessionRepository();
