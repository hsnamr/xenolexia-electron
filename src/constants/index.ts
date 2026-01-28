/**
 * App Constants
 */

export const APP_NAME = 'Xenolexia';
export const APP_VERSION = '0.1.0';

/**
 * Language configuration
 */
export const SUPPORTED_LANGUAGES = {
  en: {name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false},
  el: {name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', rtl: false},
  es: {name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false},
  fr: {name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false},
  de: {name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false},
  it: {name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false},
  pt: {name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false},
  ru: {name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false},
  ja: {name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false},
  zh: {name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false},
  ko: {name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false},
  ar: {name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true},
} as const;

/**
 * Proficiency level configuration
 */
export const PROFICIENCY_LEVELS = {
  beginner: {
    label: 'Beginner',
    cefr: 'A1-A2',
    description: 'Basic vocabulary: numbers, colors, common objects',
    wordRange: [1, 500],
  },
  intermediate: {
    label: 'Intermediate',
    cefr: 'B1-B2',
    description: 'Everyday vocabulary: actions, descriptions, abstract concepts',
    wordRange: [501, 2000],
  },
  advanced: {
    label: 'Advanced',
    cefr: 'C1-C2',
    description: 'Complex vocabulary: idioms, technical terms, nuanced expressions',
    wordRange: [2001, 5000],
  },
} as const;

/**
 * Supported book formats
 */
export const SUPPORTED_FORMATS = {
  epub: {name: 'EPUB', extension: '.epub', mimeType: 'application/epub+zip'},
  fb2: {name: 'FictionBook', extension: '.fb2', mimeType: 'application/x-fictionbook+xml'},
  mobi: {name: 'Mobipocket', extension: '.mobi', mimeType: 'application/x-mobipocket-ebook'},
  txt: {name: 'Plain Text', extension: '.txt', mimeType: 'text/plain'},
} as const;

/**
 * Reader theme configurations
 */
export const READER_THEMES = {
  light: {
    background: '#ffffff',
    text: '#1f2937',
    accent: '#0ea5e9',
    foreignWord: '#6366f1',
    foreignWordBg: '#eef2ff',
  },
  dark: {
    background: '#1a1a2e',
    text: '#e5e7eb',
    accent: '#38bdf8',
    foreignWord: '#818cf8',
    foreignWordBg: '#312e81',
  },
  sepia: {
    background: '#f4ecd8',
    text: '#5c4b37',
    accent: '#b8860b',
    foreignWord: '#8b4513',
    foreignWordBg: '#f5e6c8',
  },
} as const;

/**
 * Default settings
 */
export const DEFAULT_SETTINGS = {
  wordDensity: 0.3,
  fontSize: 18,
  lineHeight: 1.6,
  marginHorizontal: 24,
  dailyGoal: 15, // minutes
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  CURRENT_BOOK: 'current_book',
  READING_STATS: 'reading_stats',
} as const;

/**
 * Navigation routes
 */
export const ROUTES = {
  ONBOARDING: 'Onboarding',
  MAIN_TABS: 'MainTabs',
  LIBRARY: 'Library',
  VOCABULARY: 'Vocabulary',
  STATISTICS: 'Statistics',
  PROFILE: 'Profile',
  READER: 'Reader',
  SETTINGS: 'Settings',
  LANGUAGE_SETTINGS: 'LanguageSettings',
} as const;

/**
 * API endpoints (for future cloud sync)
 */
export const API_ENDPOINTS = {
  BASE_URL: 'https://api.xenolexia.app',
  SYNC: '/sync',
  WORD_LISTS: '/word-lists',
  ANALYTICS: '/analytics',
} as const;

/**
 * Spaced Repetition System constants
 */
export const SRS = {
  INITIAL_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  EASY_BONUS: 1.3,
  INTERVAL_MODIFIER: 1.0,
  NEW_INTERVAL: 1,
  GRADUATING_INTERVAL: 6,
  LEARNED_THRESHOLD: 21, // days
} as const;
