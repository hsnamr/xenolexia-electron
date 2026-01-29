/**
 * Word Database Service - Manages word list storage and lookups
 *
 * Handles loading, querying, and caching of frequency-ranked word translations
 * stored in SQLite database.
 */

import {DatabaseSchema} from '../StorageService/DatabaseSchema';
import {DatabaseService} from '../StorageService/DatabaseService';

import type {Language, ProficiencyLevel, WordEntry, PartOfSpeech} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface WordDatabaseEntry {
  id: string;
  source_word: string;
  target_word: string;
  source_lang: string;
  target_lang: string;
  proficiency: string;
  frequency_rank: number | null;
  part_of_speech: string | null;
  variants: string | null; // JSON array string
  pronunciation: string | null;
}

export interface WordLookupOptions {
  caseSensitive?: boolean;
  includeVariants?: boolean;
  maxResults?: number;
}

export interface WordDatabaseStats {
  totalWords: number;
  byProficiency: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  byPartOfSpeech: Record<string, number>;
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ============================================================================
// Proficiency Level Configuration
// ============================================================================

/**
 * Frequency rank ranges for each proficiency level
 * Based on word frequency in typical English text
 */
export const PROFICIENCY_RANKS = {
  beginner: {min: 1, max: 500}, // A1-A2: Most common 500 words
  intermediate: {min: 501, max: 2000}, // B1-B2: Words 501-2000
  advanced: {min: 2001, max: 5000}, // C1-C2: Words 2001-5000+
} as const;

/**
 * Get proficiency level based on frequency rank
 */
export function getProficiencyFromRank(rank: number): ProficiencyLevel {
  if (rank <= PROFICIENCY_RANKS.beginner.max) return 'beginner';
  if (rank <= PROFICIENCY_RANKS.intermediate.max) return 'intermediate';
  return 'advanced';
}

// ============================================================================
// Word Database Service
// ============================================================================

export class WordDatabaseService {
  private db: DatabaseService;
  private cache: Map<string, WordEntry> = new Map();
  private variantsCache: Map<string, string> = new Map();
  private cacheLoaded: Map<string, boolean> = new Map();
  private readonly MAX_CACHE_SIZE = 5000;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Initialize the word database
   */
  async initialize(): Promise<void> {
    await this.db.initialize();
  }

  /**
   * Load words for a language pair into memory cache
   */
  async loadLanguagePair(sourceLanguage: Language, targetLanguage: Language): Promise<void> {
    const cacheKey = `${sourceLanguage}_${targetLanguage}`;
    if (this.cacheLoaded.get(cacheKey)) return;

    try {
      const rows = await this.db.getAll<WordDatabaseEntry>(
        `SELECT * FROM word_list 
         WHERE source_lang = ? AND target_lang = ? 
         ORDER BY frequency_rank`,
        [sourceLanguage, targetLanguage]
      );

      for (const row of rows) {
        const entry = this.rowToWordEntry(row);
        this.cache.set(this.getCacheKey(entry.sourceWord, sourceLanguage, targetLanguage), entry);

        // Cache variants
        if (row.variants) {
          try {
            const variants: string[] = JSON.parse(row.variants);
            for (const variant of variants) {
              this.variantsCache.set(
                this.getCacheKey(variant.toLowerCase(), sourceLanguage, targetLanguage),
                entry.sourceWord
              );
            }
          } catch (e) {
            // Invalid JSON, skip variants
          }
        }
      }

      this.cacheLoaded.set(cacheKey, true);
      console.log(`Loaded ${rows.length} words for ${sourceLanguage} -> ${targetLanguage}`);
    } catch (error) {
      console.error('Failed to load language pair:', error);
      throw error;
    }
  }

  /**
   * Look up a word translation
   */
  async lookupWord(
    word: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    options: WordLookupOptions = {}
  ): Promise<WordEntry | null> {
    const {caseSensitive = false, includeVariants = true} = options;
    const normalizedWord = caseSensitive ? word : word.toLowerCase();
    const cacheKey = this.getCacheKey(normalizedWord, sourceLanguage, targetLanguage);

    // Check direct cache
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Check variants cache
    if (includeVariants) {
      const canonical = this.variantsCache.get(cacheKey);
      if (canonical) {
        const canonicalKey = this.getCacheKey(canonical, sourceLanguage, targetLanguage);
        const entry = this.cache.get(canonicalKey);
        if (entry) return entry;
      }
    }

    // If cache wasn't loaded, try database directly
    const pairKey = `${sourceLanguage}_${targetLanguage}`;
    if (!this.cacheLoaded.get(pairKey)) {
      return this.lookupWordFromDb(normalizedWord, sourceLanguage, targetLanguage, includeVariants);
    }

    return null;
  }

  /**
   * Look up word directly from database (for cold lookups)
   */
  private async lookupWordFromDb(
    word: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    includeVariants: boolean
  ): Promise<WordEntry | null> {
    // Try exact match
    let row = await this.db.getOne<WordDatabaseEntry>(DatabaseSchema.wordList.getByWord, [
      word,
      sourceLanguage,
      targetLanguage,
    ]);

    if (row) return this.rowToWordEntry(row);

    // Try variant match
    if (includeVariants) {
      row = await this.db.getOne<WordDatabaseEntry>(
        `SELECT * FROM word_list 
         WHERE source_lang = ? AND target_lang = ? 
         AND variants LIKE ?`,
        [sourceLanguage, targetLanguage, `%"${word}"%`]
      );
      if (row) return this.rowToWordEntry(row);
    }

    return null;
  }

  /**
   * Look up multiple words efficiently
   */
  async lookupWords(
    words: string[],
    sourceLanguage: Language,
    targetLanguage: Language,
    options: WordLookupOptions = {}
  ): Promise<Map<string, WordEntry | null>> {
    const results = new Map<string, WordEntry | null>();

    // Ensure cache is loaded
    await this.loadLanguagePair(sourceLanguage, targetLanguage);

    for (const word of words) {
      const entry = await this.lookupWord(word, sourceLanguage, targetLanguage, options);
      results.set(word, entry);
    }

    return results;
  }

  /**
   * Get words by proficiency level
   */
  async getWordsByProficiency(
    sourceLanguage: Language,
    targetLanguage: Language,
    level: ProficiencyLevel
  ): Promise<WordEntry[]> {
    const rows = await this.db.getAll<WordDatabaseEntry>(DatabaseSchema.wordList.getByLevel, [
      sourceLanguage,
      targetLanguage,
      level,
    ]);
    return rows.map(row => this.rowToWordEntry(row));
  }

  /**
   * Get random words for a proficiency level
   */
  async getRandomWords(
    sourceLanguage: Language,
    targetLanguage: Language,
    level: ProficiencyLevel,
    count: number
  ): Promise<WordEntry[]> {
    const rows = await this.db.getAll<WordDatabaseEntry>(
      `SELECT * FROM word_list 
       WHERE source_lang = ? AND target_lang = ? AND proficiency = ?
       ORDER BY RANDOM() LIMIT ?`,
      [sourceLanguage, targetLanguage, level, count]
    );
    return rows.map(row => this.rowToWordEntry(row));
  }

  /**
   * Search words by prefix
   */
  async searchWords(
    query: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    limit: number = 20
  ): Promise<WordEntry[]> {
    const rows = await this.db.getAll<WordDatabaseEntry>(
      `SELECT * FROM word_list 
       WHERE source_lang = ? AND target_lang = ? 
       AND (source_word LIKE ? OR target_word LIKE ?)
       ORDER BY frequency_rank LIMIT ?`,
      [sourceLanguage, targetLanguage, `${query}%`, `${query}%`, limit]
    );
    return rows.map(row => this.rowToWordEntry(row));
  }

  /**
   * Get word count for a language pair
   */
  async getWordCount(sourceLanguage: Language, targetLanguage: Language): Promise<number> {
    const result = await this.db.getOne<{count: number}>(DatabaseSchema.wordList.count, [
      sourceLanguage,
      targetLanguage,
    ]);
    return result?.count || 0;
  }

  /**
   * Get database statistics
   */
  async getStats(sourceLanguage: Language, targetLanguage: Language): Promise<WordDatabaseStats> {
    const total = await this.getWordCount(sourceLanguage, targetLanguage);

    const proficiencyCounts = await this.db.getAll<{proficiency: string; count: number}>(
      `SELECT proficiency, COUNT(*) as count FROM word_list 
       WHERE source_lang = ? AND target_lang = ?
       GROUP BY proficiency`,
      [sourceLanguage, targetLanguage]
    );

    const posCounts = await this.db.getAll<{part_of_speech: string; count: number}>(
      `SELECT part_of_speech, COUNT(*) as count FROM word_list 
       WHERE source_lang = ? AND target_lang = ? AND part_of_speech IS NOT NULL
       GROUP BY part_of_speech`,
      [sourceLanguage, targetLanguage]
    );

    const byProficiency = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };
    for (const row of proficiencyCounts) {
      if (row.proficiency in byProficiency) {
        byProficiency[row.proficiency as ProficiencyLevel] = row.count;
      }
    }

    const byPartOfSpeech: Record<string, number> = {};
    for (const row of posCounts) {
      if (row.part_of_speech) {
        byPartOfSpeech[row.part_of_speech] = row.count;
      }
    }

    return {
      totalWords: total,
      byProficiency,
      byPartOfSpeech,
    };
  }

  /**
   * Add a single word to the database
   */
  async addWord(entry: WordEntry): Promise<void> {
    await this.db.execute(DatabaseSchema.wordList.insert, [
      entry.id,
      entry.sourceWord,
      entry.targetWord,
      entry.sourceLanguage,
      entry.targetLanguage,
      entry.proficiencyLevel,
      entry.frequencyRank,
      entry.partOfSpeech,
      entry.variants.length > 0 ? JSON.stringify(entry.variants) : null,
      entry.pronunciation || null,
    ]);

    // Update cache
    const cacheKey = this.getCacheKey(entry.sourceWord, entry.sourceLanguage, entry.targetLanguage);
    this.cache.set(cacheKey, entry);
  }

  /**
   * Install a dictionary for a language pair (bulk insert of WordEntry list).
   * Used to load frequency lists or pre-built word lists for a target language.
   * Duplicates (same id) are skipped; other errors are reported.
   */
  async installDictionary(
    sourceLanguage: Language,
    targetLanguage: Language,
    entries: WordEntry[]
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    await this.db.transaction(async () => {
      for (const entry of entries) {
        try {
          await this.db.execute(DatabaseSchema.wordList.insert, [
            entry.id,
            entry.sourceWord,
            entry.targetWord,
            entry.sourceLanguage,
            entry.targetLanguage,
            entry.proficiencyLevel,
            entry.frequencyRank,
            entry.partOfSpeech,
            entry.variants?.length ? JSON.stringify(entry.variants) : null,
            entry.pronunciation || null,
          ]);
          result.imported++;
        } catch (error) {
          if (
            error instanceof Error &&
            (error.message.includes('UNIQUE') || error.message.includes('unique constraint'))
          ) {
            result.skipped++;
          } else {
            result.errors.push(
              `Word "${entry.sourceWord}": ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }
    });

    this.cacheLoaded.set(`${sourceLanguage}_${targetLanguage}`, false);
    return result;
  }

  /**
   * Bulk import words from JSON data
   */
  async bulkImport(
    words: Array<{
      source: string;
      target: string;
      rank?: number;
      pos?: PartOfSpeech;
      variants?: string[];
      pronunciation?: string;
    }>,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    await this.db.transaction(async () => {
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        try {
          const id = `${sourceLanguage}_${targetLanguage}_${i + 1}`;
          const rank = word.rank || i + 1;
          const level = getProficiencyFromRank(rank);

          await this.db.execute(DatabaseSchema.wordList.insert, [
            id,
            word.source.toLowerCase(),
            word.target,
            sourceLanguage,
            targetLanguage,
            level,
            rank,
            word.pos || null,
            word.variants ? JSON.stringify(word.variants) : null,
            word.pronunciation || null,
          ]);
          result.imported++;
        } catch (error) {
          if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
            result.skipped++;
          } else {
            result.errors.push(`Word "${word.source}": ${error}`);
          }
        }
      }
    });

    // Invalidate cache for this language pair
    this.cacheLoaded.set(`${sourceLanguage}_${targetLanguage}`, false);

    return result;
  }

  /**
   * Clear all words for a language pair
   */
  async clearLanguagePair(sourceLanguage: Language, targetLanguage: Language): Promise<number> {
    const result = await this.db.execute(
      `DELETE FROM word_list WHERE source_lang = ? AND target_lang = ?`,
      [sourceLanguage, targetLanguage]
    );

    // Clear cache
    this.cacheLoaded.set(`${sourceLanguage}_${targetLanguage}`, false);

    // Remove from cache
    const prefix = `${sourceLanguage}_${targetLanguage}_`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }

    return result.rowsAffected;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.variantsCache.clear();
    this.cacheLoaded.clear();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getCacheKey(word: string, source: Language, target: Language): string {
    return `${source}_${target}_${word.toLowerCase()}`;
  }

  private rowToWordEntry(row: WordDatabaseEntry): WordEntry {
    let variants: string[] = [];
    if (row.variants) {
      try {
        variants = JSON.parse(row.variants);
      } catch (e) {
        variants = [];
      }
    }

    return {
      id: row.id,
      sourceWord: row.source_word,
      targetWord: row.target_word,
      sourceLanguage: row.source_lang as Language,
      targetLanguage: row.target_lang as Language,
      proficiencyLevel: row.proficiency as ProficiencyLevel,
      frequencyRank: row.frequency_rank || 0,
      partOfSpeech: (row.part_of_speech as PartOfSpeech) || 'other',
      variants,
      pronunciation: row.pronunciation || undefined,
    };
  }
}

// Export singleton instance
export const wordDatabase = new WordDatabaseService();
