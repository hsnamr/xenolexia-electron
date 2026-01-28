/**
 * Frequency List Service - Manages frequency-ranked word lists
 *
 * Sources:
 * - Bundled: Core vocabulary for common language pairs
 * - Open source word frequency lists from various corpora
 * - User-generated vocabulary from reading
 *
 * Word frequency determines proficiency level:
 * - Beginner (A1-A2): Top 500 most frequent words
 * - Intermediate (B1-B2): Words 501-2000
 * - Advanced (C1-C2): Words 2001-5000+
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language, ProficiencyLevel } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface FrequencyWord {
  word: string;
  rank: number;
  frequency?: number;
  partOfSpeech?: string;
}

export interface FrequencyList {
  language: Language;
  source: string;
  lastUpdated: string;
  wordCount: number;
  words: FrequencyWord[];
}

export interface FrequencyListStats {
  language: Language;
  totalWords: number;
  beginner: number;
  intermediate: number;
  advanced: number;
  source: string;
}

// ============================================================================
// Open Source Frequency List Sources
// ============================================================================

/**
 * URLs to open frequency lists (various licenses, mostly CC/public domain)
 * These are word lists from linguistic research and open corpora
 */
const FREQUENCY_LIST_SOURCES: Record<Language, string | null> = {
  en: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
  es: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt',
  fr: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fr/fr_50k.txt',
  de: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt',
  it: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt',
  pt: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt/pt_50k.txt',
  ru: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt',
  el: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/el/el_50k.txt',
  ja: null, // Japanese requires special handling
  zh: null, // Chinese requires special handling
  ko: null, // Korean requires special handling
  ar: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ar/ar_50k.txt',
};

// ============================================================================
// Constants
// ============================================================================

const STORAGE_PREFIX = '@xenolexia/frequency_';
const MAX_WORDS_TO_STORE = 5000;

export const PROFICIENCY_THRESHOLDS = {
  beginner: { min: 1, max: 500 },
  intermediate: { min: 501, max: 2000 },
  advanced: { min: 2001, max: 5000 },
} as const;

// ============================================================================
// Frequency List Service
// ============================================================================

export class FrequencyListService {
  private cache: Map<Language, FrequencyList> = new Map();

  /**
   * Get frequency list for a language
   */
  async getFrequencyList(language: Language): Promise<FrequencyList | null> {
    // Check memory cache
    if (this.cache.has(language)) {
      return this.cache.get(language)!;
    }

    // Check persistent storage
    const stored = await this.loadFromStorage(language);
    if (stored) {
      this.cache.set(language, stored);
      return stored;
    }

    // Try to fetch from remote source
    const fetched = await this.fetchFrequencyList(language);
    if (fetched) {
      await this.saveToStorage(language, fetched);
      this.cache.set(language, fetched);
      return fetched;
    }

    return null;
  }

  /**
   * Get words for a specific proficiency level
   */
  async getWordsByProficiency(
    language: Language,
    level: ProficiencyLevel
  ): Promise<FrequencyWord[]> {
    const list = await this.getFrequencyList(language);
    if (!list) return [];

    const { min, max } = PROFICIENCY_THRESHOLDS[level];
    return list.words.filter((w) => w.rank >= min && w.rank <= max);
  }

  /**
   * Get proficiency level for a word rank
   */
  getProficiencyLevel(rank: number): ProficiencyLevel {
    if (rank <= PROFICIENCY_THRESHOLDS.beginner.max) return 'beginner';
    if (rank <= PROFICIENCY_THRESHOLDS.intermediate.max) return 'intermediate';
    return 'advanced';
  }

  /**
   * Check if a word is in the frequency list
   */
  async getWordRank(language: Language, word: string): Promise<number | null> {
    const list = await this.getFrequencyList(language);
    if (!list) return null;

    const normalizedWord = word.toLowerCase();
    const found = list.words.find((w) => w.word.toLowerCase() === normalizedWord);
    return found?.rank || null;
  }

  /**
   * Get statistics about a frequency list
   */
  async getStats(language: Language): Promise<FrequencyListStats | null> {
    const list = await this.getFrequencyList(language);
    if (!list) return null;

    let beginner = 0;
    let intermediate = 0;
    let advanced = 0;

    for (const word of list.words) {
      const level = this.getProficiencyLevel(word.rank);
      switch (level) {
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
    }

    return {
      language,
      totalWords: list.wordCount,
      beginner,
      intermediate,
      advanced,
      source: list.source,
    };
  }

  /**
   * Check if frequency list is available for a language
   */
  async hasFrequencyList(language: Language): Promise<boolean> {
    // Check if we have it cached or stored
    if (this.cache.has(language)) return true;

    const stored = await this.loadFromStorage(language);
    if (stored) return true;

    // Check if we can fetch it
    return FREQUENCY_LIST_SOURCES[language] !== null;
  }

  /**
   * Get list of languages with available frequency data
   */
  getAvailableLanguages(): Language[] {
    return Object.entries(FREQUENCY_LIST_SOURCES)
      .filter(([, url]) => url !== null)
      .map(([lang]) => lang as Language);
  }

  /**
   * Refresh frequency list from remote source
   */
  async refreshFrequencyList(language: Language): Promise<boolean> {
    const fetched = await this.fetchFrequencyList(language);
    if (fetched) {
      await this.saveToStorage(language, fetched);
      this.cache.set(language, fetched);
      return true;
    }
    return false;
  }

  /**
   * Clear cached frequency list
   */
  async clearCache(language?: Language): Promise<void> {
    if (language) {
      this.cache.delete(language);
      await AsyncStorage.removeItem(STORAGE_PREFIX + language);
    } else {
      this.cache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const frequencyKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(frequencyKeys);
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Fetch frequency list from remote source
   */
  private async fetchFrequencyList(language: Language): Promise<FrequencyList | null> {
    const url = FREQUENCY_LIST_SOURCES[language];
    if (!url) {
      console.log(`No frequency list source for ${language}`);
      return null;
    }

    try {
      console.log(`Fetching frequency list for ${language}...`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const words = this.parseFrequencyText(text, language);

      return {
        language,
        source: 'FrequencyWords/hermitdave',
        lastUpdated: new Date().toISOString(),
        wordCount: words.length,
        words: words.slice(0, MAX_WORDS_TO_STORE),
      };
    } catch (error) {
      console.error(`Failed to fetch frequency list for ${language}:`, error);
      return null;
    }
  }

  /**
   * Parse frequency list text format
   * Format: word frequency (space-separated, one per line)
   */
  private parseFrequencyText(text: string, _language: Language): FrequencyWord[] {
    const lines = text.trim().split('\n');
    const words: FrequencyWord[] = [];

    for (let i = 0; i < lines.length && i < MAX_WORDS_TO_STORE; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/\s+/);
      if (parts.length >= 1) {
        const word = parts[0];
        const frequency = parts.length > 1 ? parseInt(parts[1], 10) : undefined;

        // Skip very short words, numbers, and special characters
        if (word.length < 2 || /^\d+$/.test(word) || /[^a-zA-Z\u0370-\u03FF\u0400-\u04FF]/.test(word)) {
          continue;
        }

        words.push({
          word: word.toLowerCase(),
          rank: words.length + 1,
          frequency,
        });
      }
    }

    return words;
  }

  /**
   * Load frequency list from persistent storage
   */
  private async loadFromStorage(language: Language): Promise<FrequencyList | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_PREFIX + language);
      if (stored) {
        return JSON.parse(stored) as FrequencyList;
      }
    } catch (error) {
      console.warn(`Failed to load frequency list for ${language}:`, error);
    }
    return null;
  }

  /**
   * Save frequency list to persistent storage
   */
  private async saveToStorage(language: Language, list: FrequencyList): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_PREFIX + language, JSON.stringify(list));
    } catch (error) {
      console.warn(`Failed to save frequency list for ${language}:`, error);
    }
  }
}

// Export singleton instance
export const frequencyListService = new FrequencyListService();
