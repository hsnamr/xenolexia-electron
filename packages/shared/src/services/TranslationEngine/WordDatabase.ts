/**
 * Word Database Service - Manages word list storage and lookups
 * Uses direct LowDB data API (word_list).
 */

import {databaseService} from '../StorageService/DatabaseService';
import type {WordListRow} from '../StorageService/DataStore.types';
import type {Language, ProficiencyLevel, WordEntry, PartOfSpeech} from '../../types';

// ============================================================================
// Types
// ============================================================================

export type WordDatabaseEntry = WordListRow;

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
  private db = databaseService;
  private cache: Map<string, WordEntry> = new Map();
  private variantsCache: Map<string, string> = new Map();
  private cacheLoaded: Map<string, boolean> = new Map();
  private readonly MAX_CACHE_SIZE = 5000;

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
      const rows = await this.db.getWordListByLangs(sourceLanguage, targetLanguage);

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
    let row = await this.db.getWordListEntry(word, sourceLanguage, targetLanguage);
    if (row) return this.rowToWordEntry(row);
    if (includeVariants) {
      row = await this.db.getWordListEntryByVariant(word, sourceLanguage, targetLanguage);
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
    const rows = await this.db.getWordListByLevel(sourceLanguage, targetLanguage, level);
    return rows.map((row) => this.rowToWordEntry(row));
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
    const rows = await this.db.getWordListByLevel(sourceLanguage, targetLanguage, level, {
      limit: count,
      random: true,
    });
    return rows.map((row) => this.rowToWordEntry(row));
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
    const rows = await this.db.getWordListSearch(sourceLanguage, targetLanguage, query, limit);
    return rows.map((row) => this.rowToWordEntry(row));
  }

  /**
   * Get word count for a language pair
   */
  async getWordCount(sourceLanguage: Language, targetLanguage: Language): Promise<number> {
    return this.db.getWordListCount(sourceLanguage, targetLanguage);
  }

  /**
   * Get database statistics
   */
  async getStats(sourceLanguage: Language, targetLanguage: Language): Promise<WordDatabaseStats> {
    const total = await this.getWordCount(sourceLanguage, targetLanguage);
    const byProficiencyRaw = await this.db.getWordListProficiencyCounts(sourceLanguage, targetLanguage);
    const byPartOfSpeech = await this.db.getWordListPosCounts(sourceLanguage, targetLanguage);
    const byProficiency = {
      beginner: byProficiencyRaw.beginner ?? 0,
      intermediate: byProficiencyRaw.intermediate ?? 0,
      advanced: byProficiencyRaw.advanced ?? 0,
    };
    return {totalWords: total, byProficiency, byPartOfSpeech};
  }

  /**
   * Add a single word to the database
   */
  async addWord(entry: WordEntry): Promise<void> {
    const row: WordListRow = {
      id: entry.id ?? `${entry.sourceLanguage}_${entry.targetLanguage}_${entry.sourceWord}`,
      source_word: entry.sourceWord,
      target_word: entry.targetWord,
      source_lang: entry.sourceLanguage,
      target_lang: entry.targetLanguage,
      proficiency: entry.proficiencyLevel,
      frequency_rank: entry.frequencyRank ?? null,
      part_of_speech: entry.partOfSpeech ?? null,
      variants: entry.variants?.length ? JSON.stringify(entry.variants) : null,
      pronunciation: entry.pronunciation ?? null,
    };
    await this.db.addWordListEntry(row);
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
    const result: BulkImportResult = {imported: 0, skipped: 0, errors: []};
    const operations: Array<{method: string; args: unknown[]}> = [];
    const seen = new Set<string>();
    for (const entry of entries) {
      const id = entry.id ?? `${entry.sourceLanguage}_${entry.targetLanguage}_${entry.sourceWord}`;
      if (seen.has(id)) {
        result.skipped++;
        continue;
      }
      seen.add(id);
      const row: WordListRow = {
        id,
        source_word: entry.sourceWord,
        target_word: entry.targetWord,
        source_lang: entry.sourceLanguage,
        target_lang: entry.targetLanguage,
        proficiency: entry.proficiencyLevel,
        frequency_rank: entry.frequencyRank ?? null,
        part_of_speech: entry.partOfSpeech ?? null,
        variants: entry.variants?.length ? JSON.stringify(entry.variants) : null,
        pronunciation: entry.pronunciation ?? null,
      };
      operations.push({method: 'addWordListEntry', args: [row]});
      result.imported++;
    }
    try {
      await this.db.runTransaction(operations);
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
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
    const result: BulkImportResult = {imported: 0, skipped: 0, errors: []};
    const operations: Array<{method: string; args: unknown[]}> = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const id = `${sourceLanguage}_${targetLanguage}_${i + 1}`;
      const rank = word.rank ?? i + 1;
      const level = getProficiencyFromRank(rank);
      const row: WordListRow = {
        id,
        source_word: word.source.toLowerCase(),
        target_word: word.target,
        source_lang: sourceLanguage,
        target_lang: targetLanguage,
        proficiency: level,
        frequency_rank: rank,
        part_of_speech: word.pos ?? null,
        variants: word.variants ? JSON.stringify(word.variants) : null,
        pronunciation: word.pronunciation ?? null,
      };
      operations.push({method: 'addWordListEntry', args: [row]});
      result.imported++;
    }
    try {
      await this.db.runTransaction(operations);
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
    this.cacheLoaded.set(`${sourceLanguage}_${targetLanguage}`, false);
    return result;
  }

  /**
   * Clear all words for a language pair
   */
  async clearLanguagePair(sourceLanguage: Language, targetLanguage: Language): Promise<number> {
    const count = await this.db.getWordListCount(sourceLanguage, targetLanguage);
    await this.db.deleteWordListByPair(sourceLanguage, targetLanguage);
    this.cacheLoaded.set(`${sourceLanguage}_${targetLanguage}`, false);
    const prefix = `${sourceLanguage}_${targetLanguage}_`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
    return count;
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
