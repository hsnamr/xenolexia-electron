/**
 * Translation API Service - Multi-provider translation support
 *
 * Supports multiple free translation APIs:
 * - LibreTranslate (open source, self-hostable)
 * - MyMemory (free tier: 1000 words/day)
 * - Lingva Translate (open source Google Translate frontend)
 *
 * Features:
 * - Automatic fallback between providers
 * - Response caching
 * - Rate limiting
 * - Offline mode with cached translations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../types';

// ============================================================================
// Types
// ============================================================================

export type TranslationProvider = 'libretranslate' | 'mymemory' | 'lingva';

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  provider: TranslationProvider;
  confidence?: number;
  cached?: boolean;
}

export interface TranslationAPIConfig {
  provider: TranslationProvider;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  enabled: boolean;
}

export interface BulkTranslationResult {
  translations: Map<string, string>;
  provider: TranslationProvider;
  failed: string[];
}

// ============================================================================
// API Provider Configurations
// ============================================================================

const DEFAULT_PROVIDERS: TranslationAPIConfig[] = [
  {
    provider: 'libretranslate',
    baseUrl: 'https://libretranslate.com',
    rateLimit: 30,
    enabled: true,
  },
  {
    provider: 'mymemory',
    baseUrl: 'https://api.mymemory.translated.net',
    rateLimit: 100,
    enabled: true,
  },
  {
    provider: 'lingva',
    baseUrl: 'https://lingva.ml',
    rateLimit: 60,
    enabled: true,
  },
];

// Alternative LibreTranslate instances (community-hosted)
const LIBRETRANSLATE_MIRRORS = [
  'https://libretranslate.com',
  'https://translate.argosopentech.com',
  'https://translate.terraprint.co',
];

// ============================================================================
// Language Code Mapping
// ============================================================================

/**
 * Maps our internal language codes to API-specific codes
 */
const LANGUAGE_CODES: Record<Language, { iso639_1: string; name: string }> = {
  en: { iso639_1: 'en', name: 'English' },
  el: { iso639_1: 'el', name: 'Greek' },
  es: { iso639_1: 'es', name: 'Spanish' },
  fr: { iso639_1: 'fr', name: 'French' },
  de: { iso639_1: 'de', name: 'German' },
  it: { iso639_1: 'it', name: 'Italian' },
  pt: { iso639_1: 'pt', name: 'Portuguese' },
  ru: { iso639_1: 'ru', name: 'Russian' },
  ja: { iso639_1: 'ja', name: 'Japanese' },
  zh: { iso639_1: 'zh', name: 'Chinese' },
  ko: { iso639_1: 'ko', name: 'Korean' },
  ar: { iso639_1: 'ar', name: 'Arabic' },
};

// ============================================================================
// Cache Keys
// ============================================================================

const CACHE_PREFIX = '@xenolexia/translation_cache_';
const RATE_LIMIT_PREFIX = '@xenolexia/rate_limit_';

// ============================================================================
// Translation API Service
// ============================================================================

export class TranslationAPIService {
  private providers: TranslationAPIConfig[];
  private cache: Map<string, TranslationResult> = new Map();
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();
  private currentMirrorIndex: number = 0;

  constructor(customProviders?: TranslationAPIConfig[]) {
    this.providers = customProviders || [...DEFAULT_PROVIDERS];
  }

  /**
   * Translate a single word or phrase
   */
  async translate(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<TranslationResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Try each provider in order
    for (const provider of this.providers) {
      if (!provider.enabled) continue;
      if (this.isRateLimited(provider.provider)) continue;

      try {
        const result = await this.translateWithProvider(
          text,
          sourceLanguage,
          targetLanguage,
          provider
        );

        // Cache successful result
        await this.saveToCache(cacheKey, result);
        this.incrementRateLimit(provider.provider);

        return result;
      } catch (error) {
        console.warn(`Translation failed with ${provider.provider}:`, error);
        continue;
      }
    }

    throw new Error('All translation providers failed');
  }

  /**
   * Translate multiple words efficiently
   */
  async translateBulk(
    words: string[],
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<BulkTranslationResult> {
    const translations = new Map<string, string>();
    const failed: string[] = [];
    const toTranslate: string[] = [];

    // Check cache first
    for (const word of words) {
      const cacheKey = this.getCacheKey(word, sourceLanguage, targetLanguage);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        translations.set(word, cached.translatedText);
      } else {
        toTranslate.push(word);
      }
    }

    // Translate uncached words in batches
    const batchSize = 10;
    let usedProvider: TranslationProvider = 'libretranslate';

    for (let i = 0; i < toTranslate.length; i += batchSize) {
      const batch = toTranslate.slice(i, i + batchSize);

      for (const word of batch) {
        try {
          const result = await this.translate(word, sourceLanguage, targetLanguage);
          translations.set(word, result.translatedText);
          usedProvider = result.provider;
        } catch (error) {
          failed.push(word);
        }
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < toTranslate.length) {
        await this.delay(200);
      }
    }

    return { translations, provider: usedProvider, failed };
  }

  /**
   * Get supported languages for a provider
   */
  async getSupportedLanguages(provider?: TranslationProvider): Promise<Language[]> {
    const targetProvider = provider || this.providers[0].provider;

    try {
      switch (targetProvider) {
        case 'libretranslate':
          return this.getLibreTranslateLanguages();
        case 'mymemory':
          // MyMemory supports all major languages
          return Object.keys(LANGUAGE_CODES) as Language[];
        case 'lingva':
          return this.getLingvaLanguages();
        default:
          return Object.keys(LANGUAGE_CODES) as Language[];
      }
    } catch (error) {
      console.warn('Failed to get supported languages:', error);
      return Object.keys(LANGUAGE_CODES) as Language[];
    }
  }

  /**
   * Check if a language pair is supported
   */
  async isLanguagePairSupported(
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<boolean> {
    const supported = await this.getSupportedLanguages();
    return supported.includes(sourceLanguage) && supported.includes(targetLanguage);
  }

  // ============================================================================
  // Provider-Specific Translation Methods
  // ============================================================================

  private async translateWithProvider(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    config: TranslationAPIConfig
  ): Promise<TranslationResult> {
    switch (config.provider) {
      case 'libretranslate':
        return this.translateWithLibreTranslate(text, sourceLanguage, targetLanguage, config);
      case 'mymemory':
        return this.translateWithMyMemory(text, sourceLanguage, targetLanguage, config);
      case 'lingva':
        return this.translateWithLingva(text, sourceLanguage, targetLanguage, config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  /**
   * LibreTranslate API
   * https://github.com/LibreTranslate/LibreTranslate
   */
  private async translateWithLibreTranslate(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    config: TranslationAPIConfig
  ): Promise<TranslationResult> {
    const baseUrl = this.getLibreTranslateMirror(config.baseUrl);

    const response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: LANGUAGE_CODES[sourceLanguage].iso639_1,
        target: LANGUAGE_CODES[targetLanguage].iso639_1,
        format: 'text',
        api_key: config.apiKey || '',
      }),
    });

    if (!response.ok) {
      // Try next mirror
      this.currentMirrorIndex = (this.currentMirrorIndex + 1) % LIBRETRANSLATE_MIRRORS.length;
      throw new Error(`LibreTranslate error: ${response.status}`);
    }

    const data = await response.json();

    return {
      translatedText: data.translatedText,
      sourceLanguage,
      targetLanguage,
      provider: 'libretranslate',
    };
  }

  /**
   * MyMemory Translation API
   * https://mymemory.translated.net/doc/spec.php
   * Free: 1000 words/day, 10000 with email
   */
  private async translateWithMyMemory(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    config: TranslationAPIConfig
  ): Promise<TranslationResult> {
    const langPair = `${LANGUAGE_CODES[sourceLanguage].iso639_1}|${LANGUAGE_CODES[targetLanguage].iso639_1}`;
    const url = `${config.baseUrl}/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MyMemory error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(`MyMemory error: ${data.responseDetails}`);
    }

    return {
      translatedText: data.responseData.translatedText,
      sourceLanguage,
      targetLanguage,
      provider: 'mymemory',
      confidence: data.responseData.match,
    };
  }

  /**
   * Lingva Translate API
   * https://github.com/thedaviddelta/lingva-translate
   */
  private async translateWithLingva(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    config: TranslationAPIConfig
  ): Promise<TranslationResult> {
    const source = LANGUAGE_CODES[sourceLanguage].iso639_1;
    const target = LANGUAGE_CODES[targetLanguage].iso639_1;
    const url = `${config.baseUrl}/api/v1/${source}/${target}/${encodeURIComponent(text)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Lingva error: ${response.status}`);
    }

    const data = await response.json();

    return {
      translatedText: data.translation,
      sourceLanguage,
      targetLanguage,
      provider: 'lingva',
    };
  }

  // ============================================================================
  // Language Support Methods
  // ============================================================================

  private async getLibreTranslateLanguages(): Promise<Language[]> {
    try {
      const baseUrl = this.getLibreTranslateMirror(DEFAULT_PROVIDERS[0].baseUrl);
      const response = await fetch(`${baseUrl}/languages`);
      const data = await response.json();

      const supported: Language[] = [];
      for (const lang of data) {
        const match = Object.entries(LANGUAGE_CODES).find(
          ([, v]) => v.iso639_1 === lang.code
        );
        if (match) {
          supported.push(match[0] as Language);
        }
      }
      return supported;
    } catch (error) {
      return Object.keys(LANGUAGE_CODES) as Language[];
    }
  }

  private async getLingvaLanguages(): Promise<Language[]> {
    try {
      const response = await fetch(`${DEFAULT_PROVIDERS[2].baseUrl}/api/v1/languages`);
      const data = await response.json();

      const supported: Language[] = [];
      for (const lang of data.languages) {
        const match = Object.entries(LANGUAGE_CODES).find(
          ([, v]) => v.iso639_1 === lang.code
        );
        if (match) {
          supported.push(match[0] as Language);
        }
      }
      return supported;
    } catch (error) {
      return Object.keys(LANGUAGE_CODES) as Language[];
    }
  }

  private getLibreTranslateMirror(defaultUrl: string): string {
    if (LIBRETRANSLATE_MIRRORS.includes(defaultUrl)) {
      return LIBRETRANSLATE_MIRRORS[this.currentMirrorIndex];
    }
    return defaultUrl;
  }

  // ============================================================================
  // Cache Methods
  // ============================================================================

  private getCacheKey(text: string, source: Language, target: Language): string {
    return `${source}_${target}_${text.toLowerCase()}`;
  }

  private async getFromCache(key: string): Promise<TranslationResult | null> {
    // Check memory cache
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Check persistent cache
    try {
      const stored = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (stored) {
        const result = JSON.parse(stored) as TranslationResult;
        this.cache.set(key, result);
        return result;
      }
    } catch (error) {
      // Cache miss
    }

    return null;
  }

  private async saveToCache(key: string, result: TranslationResult): Promise<void> {
    // Save to memory cache
    this.cache.set(key, result);

    // Limit memory cache size
    if (this.cache.size > 10000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    // Save to persistent cache
    try {
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(result));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }

  /**
   * Clear all cached translations
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ memorySize: number; persistentSize: number }> {
    let persistentSize = 0;
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      persistentSize = keys.filter((k) => k.startsWith(CACHE_PREFIX)).length;
    } catch (error) {
      // Ignore
    }

    return {
      memorySize: this.cache.size,
      persistentSize,
    };
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  private isRateLimited(provider: TranslationProvider): boolean {
    const counter = this.rateLimitCounters.get(provider);
    if (!counter) return false;

    if (Date.now() > counter.resetTime) {
      this.rateLimitCounters.delete(provider);
      return false;
    }

    const config = this.providers.find((p) => p.provider === provider);
    return counter.count >= (config?.rateLimit || 60);
  }

  private incrementRateLimit(provider: TranslationProvider): void {
    const counter = this.rateLimitCounters.get(provider);
    const now = Date.now();

    if (!counter || now > counter.resetTime) {
      this.rateLimitCounters.set(provider, {
        count: 1,
        resetTime: now + 60000, // Reset after 1 minute
      });
    } else {
      counter.count++;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enable or disable a provider
   */
  setProviderEnabled(provider: TranslationProvider, enabled: boolean): void {
    const config = this.providers.find((p) => p.provider === provider);
    if (config) {
      config.enabled = enabled;
    }
  }

  /**
   * Set API key for a provider
   */
  setApiKey(provider: TranslationProvider, apiKey: string): void {
    const config = this.providers.find((p) => p.provider === provider);
    if (config) {
      config.apiKey = apiKey;
    }
  }

  /**
   * Get language display name
   */
  static getLanguageName(code: Language): string {
    return LANGUAGE_CODES[code]?.name || code;
  }

  /**
   * Get all supported language codes
   */
  static getAllLanguages(): Array<{ code: Language; name: string }> {
    return Object.entries(LANGUAGE_CODES).map(([code, data]) => ({
      code: code as Language,
      name: data.name,
    }));
  }
}

// Export singleton instance
export const translationAPI = new TranslationAPIService();
