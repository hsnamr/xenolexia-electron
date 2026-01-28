/**
 * Vocabulary Repository - Database operations for vocabulary items
 */

import type {VocabularyItem, VocabularyStatus, Language} from '../types';
import {databaseService} from '../DatabaseService';

// ============================================================================
// Types
// ============================================================================

/** Raw vocabulary row from database */
interface VocabularyRow {
  id: string;
  source_word: string;
  target_word: string;
  source_lang: string;
  target_lang: string;
  context_sentence: string | null;
  book_id: string | null;
  book_title: string | null;
  added_at: number;
  last_reviewed_at: number | null;
  review_count: number;
  ease_factor: number;
  interval: number;
  status: string;
}

export interface VocabularyFilter {
  status?: VocabularyStatus;
  bookId?: string;
  sourceLanguage?: Language;
  targetLanguage?: Language;
}

export interface VocabularySort {
  by: 'addedAt' | 'lastReviewedAt' | 'sourceWord' | 'status';
  order: 'asc' | 'desc';
}

// ============================================================================
// Vocabulary Repository Class
// ============================================================================

class VocabularyRepository {
  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Add a new vocabulary item
   */
  async add(item: VocabularyItem): Promise<void> {
    await databaseService.execute(
      `INSERT INTO vocabulary (
        id, source_word, target_word, source_lang, target_lang,
        context_sentence, book_id, book_title, added_at,
        last_reviewed_at, review_count, ease_factor, interval, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.sourceWord,
        item.targetWord,
        item.sourceLanguage,
        item.targetLanguage,
        item.contextSentence,
        item.bookId,
        item.bookTitle,
        item.addedAt.getTime(),
        item.lastReviewedAt?.getTime() ?? null,
        item.reviewCount,
        item.easeFactor,
        item.interval,
        item.status,
      ],
    );
  }

  /**
   * Update a vocabulary item
   */
  async update(itemId: string, updates: Partial<VocabularyItem>): Promise<void> {
    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    if (updates.sourceWord !== undefined) {
      setClauses.push('source_word = ?');
      params.push(updates.sourceWord);
    }
    if (updates.targetWord !== undefined) {
      setClauses.push('target_word = ?');
      params.push(updates.targetWord);
    }
    if (updates.contextSentence !== undefined) {
      setClauses.push('context_sentence = ?');
      params.push(updates.contextSentence);
    }
    if (updates.lastReviewedAt !== undefined) {
      setClauses.push('last_reviewed_at = ?');
      params.push(updates.lastReviewedAt?.getTime() ?? null);
    }
    if (updates.reviewCount !== undefined) {
      setClauses.push('review_count = ?');
      params.push(updates.reviewCount);
    }
    if (updates.easeFactor !== undefined) {
      setClauses.push('ease_factor = ?');
      params.push(updates.easeFactor);
    }
    if (updates.interval !== undefined) {
      setClauses.push('interval = ?');
      params.push(updates.interval);
    }
    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      params.push(updates.status);
    }

    if (setClauses.length === 0) {
      return;
    }

    params.push(itemId);

    await databaseService.execute(
      `UPDATE vocabulary SET ${setClauses.join(', ')} WHERE id = ?`,
      params,
    );
  }

  /**
   * Delete a vocabulary item
   */
  async delete(itemId: string): Promise<void> {
    await databaseService.execute('DELETE FROM vocabulary WHERE id = ?', [itemId]);
  }

  /**
   * Delete all vocabulary items
   */
  async deleteAll(): Promise<void> {
    await databaseService.execute('DELETE FROM vocabulary');
  }

  /**
   * Get a vocabulary item by ID
   */
  async getById(itemId: string): Promise<VocabularyItem | null> {
    const row = await databaseService.getOne<VocabularyRow>(
      'SELECT * FROM vocabulary WHERE id = ?',
      [itemId],
    );

    return row ? this.rowToVocabulary(row) : null;
  }

  /**
   * Get all vocabulary items
   */
  async getAll(sort?: VocabularySort): Promise<VocabularyItem[]> {
    const orderBy = this.buildOrderBy(sort);
    const rows = await databaseService.getAll<VocabularyRow>(
      `SELECT * FROM vocabulary ${orderBy}`,
    );

    return rows.map((row) => this.rowToVocabulary(row));
  }

  /**
   * Get filtered vocabulary items
   */
  async getFiltered(
    filter: VocabularyFilter,
    sort?: VocabularySort,
  ): Promise<VocabularyItem[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    if (filter.bookId) {
      conditions.push('book_id = ?');
      params.push(filter.bookId);
    }
    if (filter.sourceLanguage) {
      conditions.push('source_lang = ?');
      params.push(filter.sourceLanguage);
    }
    if (filter.targetLanguage) {
      conditions.push('target_lang = ?');
      params.push(filter.targetLanguage);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = this.buildOrderBy(sort);

    const rows = await databaseService.getAll<VocabularyRow>(
      `SELECT * FROM vocabulary ${whereClause} ${orderBy}`,
      params,
    );

    return rows.map((row) => this.rowToVocabulary(row));
  }

  /**
   * Search vocabulary items
   */
  async search(query: string): Promise<VocabularyItem[]> {
    const searchTerm = `%${query}%`;
    const rows = await databaseService.getAll<VocabularyRow>(
      `SELECT * FROM vocabulary 
       WHERE source_word LIKE ? OR target_word LIKE ?
       ORDER BY added_at DESC`,
      [searchTerm, searchTerm],
    );

    return rows.map((row) => this.rowToVocabulary(row));
  }

  // ============================================================================
  // Review Operations
  // ============================================================================

  /**
   * Get items due for review (SRS)
   */
  async getDueForReview(limit: number = 20): Promise<VocabularyItem[]> {
    const now = Date.now();
    const rows = await databaseService.getAll<VocabularyRow>(
      `SELECT * FROM vocabulary
       WHERE status != 'learned'
       AND (
         last_reviewed_at IS NULL 
         OR (last_reviewed_at + (interval * 86400000)) <= ?
       )
       ORDER BY 
         CASE status 
           WHEN 'new' THEN 0 
           WHEN 'learning' THEN 1 
           WHEN 'review' THEN 2 
         END,
         last_reviewed_at ASC NULLS FIRST
       LIMIT ?`,
      [now, limit],
    );

    return rows.map((row) => this.rowToVocabulary(row));
  }

  /**
   * Update review results (SM-2 algorithm)
   */
  async recordReview(
    itemId: string,
    quality: number, // 0-5, where 0-2 = fail, 3-5 = pass
  ): Promise<void> {
    const item = await this.getById(itemId);
    if (!item) return;

    // SM-2 Algorithm implementation
    let {easeFactor, interval, reviewCount} = item;
    let newStatus: VocabularyStatus = item.status;

    reviewCount += 1;

    if (quality >= 3) {
      // Correct response
      if (interval === 0) {
        interval = 1;
      } else if (interval === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      // Update ease factor
      easeFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
      );

      // Update status
      if (reviewCount >= 5 && quality >= 4) {
        newStatus = 'learned';
      } else if (reviewCount >= 2) {
        newStatus = 'review';
      } else {
        newStatus = 'learning';
      }
    } else {
      // Incorrect response
      interval = 0;
      newStatus = 'learning';
    }

    await this.update(itemId, {
      easeFactor,
      interval,
      reviewCount,
      status: newStatus,
      lastReviewedAt: new Date(),
    });
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get vocabulary statistics
   */
  async getStatistics(): Promise<{
    total: number;
    new: number;
    learning: number;
    review: number;
    learned: number;
    dueToday: number;
  }> {
    const now = Date.now();

    const result = await databaseService.getOne<{
      total: number;
      new_count: number;
      learning_count: number;
      review_count: number;
      learned_count: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning_count,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review_count,
        SUM(CASE WHEN status = 'learned' THEN 1 ELSE 0 END) as learned_count
      FROM vocabulary
    `);

    const dueResult = await databaseService.getOne<{due: number}>(`
      SELECT COUNT(*) as due FROM vocabulary
      WHERE status != 'learned'
      AND (
        last_reviewed_at IS NULL 
        OR (last_reviewed_at + (interval * 86400000)) <= ?
      )
    `, [now]);

    return {
      total: result?.total ?? 0,
      new: result?.new_count ?? 0,
      learning: result?.learning_count ?? 0,
      review: result?.review_count ?? 0,
      learned: result?.learned_count ?? 0,
      dueToday: dueResult?.due ?? 0,
    };
  }

  /**
   * Get count by status
   */
  async countByStatus(status: VocabularyStatus): Promise<number> {
    const result = await databaseService.getOne<{count: number}>(
      'SELECT COUNT(*) as count FROM vocabulary WHERE status = ?',
      [status],
    );
    return result?.count ?? 0;
  }

  /**
   * Get items added today
   */
  async getAddedToday(): Promise<VocabularyItem[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rows = await databaseService.getAll<VocabularyRow>(
      `SELECT * FROM vocabulary WHERE added_at >= ? ORDER BY added_at DESC`,
      [startOfDay.getTime()],
    );

    return rows.map((row) => this.rowToVocabulary(row));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert database row to VocabularyItem
   */
  private rowToVocabulary(row: VocabularyRow): VocabularyItem {
    return {
      id: row.id,
      sourceWord: row.source_word,
      targetWord: row.target_word,
      sourceLanguage: row.source_lang as Language,
      targetLanguage: row.target_lang as Language,
      contextSentence: row.context_sentence,
      bookId: row.book_id,
      bookTitle: row.book_title,
      addedAt: new Date(row.added_at),
      lastReviewedAt: row.last_reviewed_at
        ? new Date(row.last_reviewed_at)
        : null,
      reviewCount: row.review_count,
      easeFactor: row.ease_factor,
      interval: row.interval,
      status: row.status as VocabularyStatus,
    };
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderBy(sort?: VocabularySort): string {
    if (!sort) {
      return 'ORDER BY added_at DESC';
    }

    const columnMap: Record<string, string> = {
      addedAt: 'added_at',
      lastReviewedAt: 'last_reviewed_at',
      sourceWord: 'source_word',
      status: 'status',
    };

    const column = columnMap[sort.by] || 'added_at';
    const direction = sort.order === 'asc' ? 'ASC' : 'DESC';

    return `ORDER BY ${column} ${direction}`;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const vocabularyRepository = new VocabularyRepository();
