/**
 * Word Matcher - Matches source words to target language translations
 *
 * Uses WordDatabaseService for word lookups with support for:
 * - Direct word matching
 * - Variant matching (plurals, conjugations)
 * - Case-insensitive matching
 * - Proficiency level filtering
 */

import {ALL_WORDS_EN_EL} from '../../data/words_en_el';

import {WordDatabaseService, wordDatabase} from './WordDatabase';

import type {Language, ProficiencyLevel, WordEntry} from '../types';

// ============================================================================
// Word Matcher
// ============================================================================

export class WordMatcher {
  private sourceLanguage: Language;
  private targetLanguage: Language;
  private database: WordDatabaseService;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  // In-memory fallback for when database is not available
  private fallbackWordList: Map<string, WordEntry> = new Map();
  private fallbackVariants: Map<string, string> = new Map();

  constructor(sourceLanguage: Language, targetLanguage: Language) {
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this.database = wordDatabase;
  }

  /**
   * Initialize the word matcher (loads words into cache)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    await this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Try to initialize from database
      await this.database.initialize();
      const count = await this.database.getWordCount(this.sourceLanguage, this.targetLanguage);

      if (count === 0) {
        // Database is empty, seed it with bundled data
        console.log('Seeding word database with bundled data...');
        await this.seedDatabase();
      }

      // Load into cache for fast lookups
      await this.database.loadLanguagePair(this.sourceLanguage, this.targetLanguage);
      this.isInitialized = true;
    } catch (error) {
      console.warn('Database not available, using fallback word list:', error);
      this.initializeFallback();
      this.isInitialized = true;
    }
  }

  /**
   * Seed the database with bundled word data
   */
  private async seedDatabase(): Promise<void> {
    if (this.sourceLanguage === 'en' && this.targetLanguage === 'el') {
      const result = await this.database.bulkImport(
        ALL_WORDS_EN_EL,
        this.sourceLanguage,
        this.targetLanguage
      );
      console.log(`Imported ${result.imported} words, skipped ${result.skipped}`);
      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors.slice(0, 5));
      }
    }
  }

  /**
   * Initialize fallback in-memory word list
   */
  private initializeFallback(): void {
    if (this.sourceLanguage === 'en' && this.targetLanguage === 'el') {
      for (const word of ALL_WORDS_EN_EL) {
        const entry: WordEntry = {
          id: `${word.source}_${word.rank}`,
          sourceWord: word.source,
          targetWord: word.target,
          sourceLanguage: 'en',
          targetLanguage: 'el',
          proficiencyLevel: this.getRankLevel(word.rank),
          frequencyRank: word.rank,
          partOfSpeech: word.pos,
          variants: word.variants || [],
          pronunciation: word.pronunciation,
        };

        this.fallbackWordList.set(word.source.toLowerCase(), entry);

        // Add variants
        if (word.variants) {
          for (const variant of word.variants) {
            this.fallbackVariants.set(variant.toLowerCase(), word.source.toLowerCase());
          }
        }
      }
    }
  }

  private getRankLevel(rank: number): ProficiencyLevel {
    if (rank <= 500) return 'beginner';
    if (rank <= 2000) return 'intermediate';
    return 'advanced';
  }

  /**
   * Find a matching translation for a word
   */
  async findMatch(word: string, maxLevel: ProficiencyLevel): Promise<WordEntry | null> {
    await this.initialize();

    const normalized = word.toLowerCase();

    // Try database first
    try {
      const entry = await this.database.lookupWord(
        normalized,
        this.sourceLanguage,
        this.targetLanguage,
        {includeVariants: true}
      );

      if (entry && this.isWithinLevel(entry.proficiencyLevel, maxLevel)) {
        return entry;
      }
    } catch (error) {
      // Fall through to fallback
    }

    // Use fallback if database lookup failed
    return this.findMatchFallback(normalized, maxLevel);
  }

  /**
   * Fallback word matching using in-memory list
   */
  private findMatchFallback(normalized: string, maxLevel: ProficiencyLevel): WordEntry | null {
    // Direct match
    let entry = this.fallbackWordList.get(normalized);

    // Variant match
    if (!entry) {
      const canonical = this.fallbackVariants.get(normalized);
      if (canonical) {
        entry = this.fallbackWordList.get(canonical);
      }
    }

    // Check proficiency level
    if (entry && this.isWithinLevel(entry.proficiencyLevel, maxLevel)) {
      return entry;
    }

    return null;
  }

  /**
   * Find matches for multiple words efficiently
   */
  async findMatches(
    words: string[],
    maxLevel: ProficiencyLevel
  ): Promise<Map<string, WordEntry | null>> {
    await this.initialize();

    const results = new Map<string, WordEntry | null>();

    for (const word of words) {
      const match = await this.findMatch(word, maxLevel);
      results.set(word, match);
    }

    return results;
  }

  /**
   * Get all words at a specific proficiency level
   */
  async getWordsByLevel(level: ProficiencyLevel): Promise<WordEntry[]> {
    await this.initialize();

    try {
      return await this.database.getWordsByProficiency(
        this.sourceLanguage,
        this.targetLanguage,
        level
      );
    } catch (error) {
      // Use fallback
      const words: WordEntry[] = [];
      this.fallbackWordList.forEach(entry => {
        if (entry.proficiencyLevel === level) {
          words.push(entry);
        }
      });
      return words;
    }
  }

  /**
   * Get random words for practice/review
   */
  async getRandomWords(level: ProficiencyLevel, count: number): Promise<WordEntry[]> {
    await this.initialize();

    try {
      return await this.database.getRandomWords(
        this.sourceLanguage,
        this.targetLanguage,
        level,
        count
      );
    } catch (error) {
      // Fallback: get random from in-memory list
      const levelWords = await this.getWordsByLevel(level);
      const shuffled = [...levelWords].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
  }

  /**
   * Search for words by prefix
   */
  async searchWords(query: string, limit: number = 20): Promise<WordEntry[]> {
    await this.initialize();

    try {
      return await this.database.searchWords(
        query,
        this.sourceLanguage,
        this.targetLanguage,
        limit
      );
    } catch (error) {
      // Fallback search
      const results: WordEntry[] = [];
      const lowerQuery = query.toLowerCase();

      this.fallbackWordList.forEach(entry => {
        if (
          entry.sourceWord.toLowerCase().startsWith(lowerQuery) ||
          entry.targetWord.toLowerCase().startsWith(lowerQuery)
        ) {
          results.push(entry);
        }
      });

      return results.slice(0, limit);
    }
  }

  /**
   * Get statistics about the word database
   */
  async getStats(): Promise<{
    total: number;
    beginner: number;
    intermediate: number;
    advanced: number;
  }> {
    await this.initialize();

    try {
      const stats = await this.database.getStats(this.sourceLanguage, this.targetLanguage);
      return {
        total: stats.totalWords,
        ...stats.byProficiency,
      };
    } catch (error) {
      // Fallback stats
      let beginner = 0;
      let intermediate = 0;
      let advanced = 0;

      this.fallbackWordList.forEach(entry => {
        switch (entry.proficiencyLevel) {
          case 'beginner':
            beginner++;
            break;
          case 'intermediate':
            intermediate++;
            break;
          case 'advanced':
            advanced++;
            break;
        }
      });

      return {
        total: this.fallbackWordList.size,
        beginner,
        intermediate,
        advanced,
      };
    }
  }

  /**
   * Check if a word's level is within the max allowed level
   */
  private isWithinLevel(wordLevel: ProficiencyLevel, maxLevel: ProficiencyLevel): boolean {
    const levels: ProficiencyLevel[] = ['beginner', 'intermediate', 'advanced'];
    return levels.indexOf(wordLevel) <= levels.indexOf(maxLevel);
  }

  /**
   * Get the current language pair
   */
  getLanguagePair(): {source: Language; target: Language} {
    return {
      source: this.sourceLanguage,
      target: this.targetLanguage,
    };
  }
}
