/**
 * Types - Re-export from xenolexia-typescript core + Electron app navigation types.
 */
export type {
  Language,
  ProficiencyLevel,
  LanguagePair,
  LanguageInfo,
  BookFormat,
  Book,
  BookMetadata,
  Chapter,
  TableOfContentsItem,
  ParsedBook,
  PartOfSpeech,
  WordEntry,
  VocabularyItem,
  VocabularyStatus,
  ReaderTheme,
  ReaderSettings,
  ForeignWordData,
  ProcessedChapter,
  ReadingSession,
  ReadingStats,
  UserPreferences,
  AppState,
} from 'xenolexia-typescript';
export { SUPPORTED_LANGUAGES, getLanguageInfo, getLanguageName } from 'xenolexia-typescript';

// Electron app navigation param lists (used by navigation.ts)
export interface RootStackParamList {
  MainTabs: undefined;
  Onboarding: undefined;
  Reader: { bookId: string };
  Settings: undefined;
  About: undefined;
}
export interface MainTabsParamList {
  Library: undefined;
  Vocabulary: undefined;
  Statistics: undefined;
  Profile: undefined;
}

export * from './navigation';
