/**
 * Central type definitions for Xenolexia
 */

// ============================================================================
// Language & Proficiency Types
// ============================================================================

export type Language =
  | 'en' // English
  | 'el' // Greek
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'ja' // Japanese
  | 'zh' // Chinese
  | 'ko' // Korean
  | 'ar' // Arabic
  | 'nl' // Dutch
  | 'pl' // Polish
  | 'tr' // Turkish
  | 'sv' // Swedish
  | 'da' // Danish
  | 'fi' // Finnish
  | 'no' // Norwegian
  | 'cs' // Czech
  | 'hu' // Hungarian
  | 'ro' // Romanian
  | 'uk' // Ukrainian
  | 'hi' // Hindi
  | 'th' // Thai
  | 'vi' // Vietnamese
  | 'id'; // Indonesian

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LanguagePair {
  sourceLanguage: Language;
  targetLanguage: Language;
}

/**
 * Language metadata for display purposes
 */
export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag?: string; // Emoji flag
  rtl?: boolean; // Right-to-left language
}

/**
 * All supported languages with metadata
 */
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇵' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇵🇸', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
];

/**
 * Get language info by code
 */
export function getLanguageInfo(code: Language): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get language name by code
 */
export function getLanguageName(code: Language): string {
  return getLanguageInfo(code)?.name || code.toUpperCase();
}

// ============================================================================
// Book Types
// ============================================================================

export type BookFormat = 'epub' | 'mobi' | 'txt';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverPath: string | null;
  filePath: string;
  format: BookFormat;
  fileSize: number; // in bytes
  addedAt: Date;
  lastReadAt: Date | null;
  languagePair: LanguagePair;
  proficiencyLevel: ProficiencyLevel;
  wordDensity: number; // 0.0 - 1.0

  // Reading Progress
  progress: number; // 0-100 percentage
  currentLocation: string | null; // CFI for EPUB, chapter index otherwise
  currentChapter: number; // Current chapter index
  totalChapters: number; // Total number of chapters
  currentPage: number; // Estimated current page
  totalPages: number; // Estimated total pages
  readingTimeMinutes: number; // Total reading time in minutes

  // Download/Source info
  sourceUrl?: string; // Original download URL if downloaded
  isDownloaded: boolean; // Whether the file is stored locally
}

export interface BookMetadata {
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  language?: string;
  publisher?: string;
  publishDate?: string;
  isbn?: string;
  subjects?: string[]; // Genre/categories
}

export interface Chapter {
  id: string;
  title: string;
  index: number;
  content: string; // HTML or plain text
  wordCount: number;
  href?: string; // Path to the chapter file in EPUB
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  href: string;
  level: number;
  children?: TableOfContentsItem[];
}

export interface ParsedBook {
  metadata: BookMetadata;
  chapters: Chapter[];
  tableOfContents: TableOfContentsItem[];
  totalWordCount: number;
}

// ============================================================================
// Word & Vocabulary Types
// ============================================================================

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'article'
  | 'other';

export interface WordEntry {
  id: string;
  sourceWord: string;
  targetWord: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  proficiencyLevel: ProficiencyLevel;
  frequencyRank: number;
  partOfSpeech: PartOfSpeech;
  variants: string[]; // Alternative forms (plurals, conjugations)
  pronunciation?: string; // IPA or transliteration
}

export interface VocabularyItem {
  id: string;
  sourceWord: string;
  targetWord: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  contextSentence: string | null;
  bookId: string | null;
  bookTitle: string | null;
  addedAt: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
  easeFactor: number; // SM-2 algorithm
  interval: number; // Days until next review
  status: VocabularyStatus;
}

export type VocabularyStatus = 'new' | 'learning' | 'review' | 'learned';

// ============================================================================
// Reader Types
// ============================================================================

export type ReaderTheme = 'light' | 'dark' | 'sepia';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: string;
  fontSize: number; // in sp/pt
  lineHeight: number; // multiplier
  marginHorizontal: number; // in dp/pt
  marginVertical: number; // in dp/pt
  textAlign: 'left' | 'justify';
  brightness: number; // 0.0 - 1.0
}

export interface ForeignWordData {
  originalWord: string;
  foreignWord: string;
  startIndex: number;
  endIndex: number;
  wordEntry: WordEntry;
}

export interface ProcessedChapter extends Chapter {
  foreignWords: ForeignWordData[];
  processedContent: string; // HTML with foreign words marked
}

// ============================================================================
// Reading Session & Statistics
// ============================================================================

export interface ReadingSession {
  id: string;
  bookId: string;
  startedAt: Date;
  endedAt: Date | null;
  pagesRead: number;
  wordsRevealed: number;
  wordsSaved: number;
  duration: number; // in seconds
}

export interface ReadingStats {
  totalBooksRead: number;
  totalReadingTime: number; // in seconds
  totalWordsLearned: number;
  currentStreak: number; // days
  longestStreak: number;
  averageSessionDuration: number;
  wordsRevealedToday: number;
  wordsSavedToday: number;
}

// ============================================================================
// Navigation Types (Basic - see @navigation/types for comprehensive types)
// ============================================================================

import type {NavigatorScreenParams} from '@react-navigation/native';

/**
 * Main Tab Navigator params
 */
export type MainTabsParamList = {
  Library: undefined;
  Vocabulary: {filter?: 'all' | 'learning' | 'mastered' | 'new'};
  Statistics: undefined;
  Profile: undefined;
};

/**
 * Root Stack Navigator params
 */
export type RootStackParamList = {
  // Initial flow
  Onboarding: undefined;

  // Main app
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;

  // Reader
  Reader: {bookId: string; initialLocation?: string};

  // Book management
  BookDetail: {bookId: string};
  BookDiscovery: {searchQuery?: string};

  // Vocabulary
  VocabularyDetail: {wordId: string};
  VocabularyQuiz: {wordIds?: string[]};

  // Settings
  Settings: undefined;
  LanguageSettings: undefined;
  ReaderSettings: undefined;
  NotificationSettings: undefined;
  DataManagement: undefined;
  About: undefined;
};

// ============================================================================
// App State Types
// ============================================================================

export interface UserPreferences {
  defaultSourceLanguage: Language;
  defaultTargetLanguage: Language;
  defaultProficiencyLevel: ProficiencyLevel;
  defaultWordDensity: number;
  readerSettings: ReaderSettings;
  hasCompletedOnboarding: boolean;
  notificationsEnabled: boolean;
  dailyGoal: number; // minutes
}

export interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  currentBook: Book | null;
  preferences: UserPreferences;
}
