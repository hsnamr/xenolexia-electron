# Xenolexia Development Plan 📋

## Overview

This document outlines the complete development roadmap for Xenolexia, from initial setup to production release.

---

## 📅 Development Phases

### Phase 0: Project Setup (Week 1)
**Status: ✅ COMPLETED**

#### 0.1 Environment Configuration
- [x] Create project structure
- [x] Initialize React Native with TypeScript
- [x] Set up Git repository
- [x] Configure ESLint + Prettier
- [x] Set up Husky pre-commit hooks
- [x] Configure path aliases (@components, @services, etc.)

#### 0.2 Core Dependencies Installation
- [x] All core dependencies installed (see package.json)
- [x] Navigation: @react-navigation/native, bottom-tabs, native-stack
- [x] State Management: zustand, @tanstack/react-query
- [x] Storage: @react-native-async-storage/async-storage, react-native-sqlite-storage
- [x] File System: react-native-fs, react-native-document-picker
- [x] UI/Styling: nativewind, tailwindcss, react-native-reanimated
- [x] Book Parsing: epubjs, jszip, react-native-webview
- [x] Utils: lodash, date-fns, uuid, react-native-svg

#### 0.3 Initial App Structure
- [x] Create navigation skeleton with Stack + Bottom Tabs
- [x] Implement basic screens (Library, Reader, Vocabulary, Statistics, Settings, Profile)
- [x] Set up theme provider with Light/Dark/Sepia modes
- [x] Configure fonts and base styles (Inter, Merriweather, JetBrains Mono)
- [x] Create reusable UI components (Text, Button, Card, Input, ThemeSwitcher)
- [x] Set up deep linking configuration
- [x] Implement SVG-based tab bar icons

#### 0.4 Quality & Testing (Completed)
- [x] Jest test configuration with path aliases
- [x] Test utilities for rendering with providers
- [x] Navigation smoke tests
- [x] Screen component tests (Library, Vocabulary)
- [x] UI component tests (Text, Button, Card, Input)
- [x] Store tests (vocabularyStore, utils)

---

### Phase 1: Library Screen (Weeks 2-3)
**Status: ✅ COMPLETED**

#### 1.1 Book Import
- [x] Implement document picker for file selection
- [x] Support multiple file formats (EPUB, TXT, MOBI, FB2)
- [x] Parse EPUB metadata (title, author, cover, TOC)
- [x] Store book files in app storage
- [x] Create database schema for books
- [x] Import progress modal with status indicator

**Technical Details:**
```typescript
// Book entity structure (Implemented)
interface Book {
  id: string;
  title: string;
  author: string;
  coverPath: string | null;
  filePath: string;
  format: 'epub' | 'fb2' | 'mobi' | 'txt';
  addedAt: Date;
  lastReadAt: Date | null;
  progress: number; // 0-100
  currentLocation: string | null; // CFI for EPUB
  languagePair: LanguagePair;
  settings: BookSettings;
}
```

#### 1.2 Library UI
- [x] Grid/List view toggle (ViewToggle component)
- [x] Book cards with cover, title, progress (BookCard, BookCover)
- [x] Search and filter functionality (SortFilterBar)
- [x] Sort options (recent, title, author, progress)
- [x] Delete/edit book functionality (BookContextMenu)
- [x] Book detail screen (BookDetailScreen)
- [x] List view item (BookListItem)

#### 1.3 Collections (Stretch)
- [ ] Create custom collections
- [ ] Drag books into collections
- [x] Smart collections (currently reading, completed) - via store selectors

---

### Phase 2: EPUB Parser Service (Weeks 3-4)
**Status: ✅ COMPLETED**

#### 2.1 Core Parsing
- [x] Extract EPUB structure (spine, manifest, toc) - EPUBExtractor
- [x] Parse table of contents (NCX for EPUB 2, NAV for EPUB 3) - TOCParser
- [x] Extract metadata (title, author, description, cover) - MetadataExtractor
- [x] Parse chapter content to HTML/text - EPUBParser.extractChapters()
- [x] Handle embedded images and styles - ChapterContentService + EPUBExtractor.resolveStylesheets()
- [x] Extract all text nodes for word replacement - TextProcessingService.extractContent()
- [x] TXT format parser - TXTParser (simple text file support)
- [x] FB2 format parser - FB2Parser (XML-based, uses DOMParser)
- [x] MOBI format parser - MOBIParser (uses @lingo-reader/mobi-parser)

**Architecture:**
```typescript
// BookParser interface (Implemented)
interface IBookParser {
  parse(filePath: string): Promise<ParsedBook>;
  getChapter(index: number): Promise<Chapter>;
  getTableOfContents(): TOCItem[];
  search(query: string): SearchResult[];
}

// EPUB-specific implementation (Fully Implemented)
class EPUBParser implements IBookParser {
  // Uses JSZip for extraction
  // EPUBExtractor for ZIP/XML parsing
  // TOCParser for NCX/NAV parsing
  // MetadataExtractor for metadata
  // resolveStylesheets() for CSS inlining
}

// TextProcessingService - Integrates tokenization and replacement
class TextProcessingService {
  processChapter(chapter, options): ProcessedContent;
  extractContent(html): ExtractedContent;
  // ... word lookup, caching, context extraction
}
```

#### 2.2 Text Processing Pipeline
- [x] Tokenize text into words - Tokenizer.tokenize()
- [x] Preserve HTML structure around words - Tokenizer.extractTextSegments()
- [x] Handle punctuation correctly - Token.prefix/suffix
- [x] Support hyphenated words - regex in Tokenizer
- [x] Maintain word positions for tap detection - Token.startIndex/endIndex

**Implemented Files:**
- `TextProcessingService.ts` - Main integration service
- `Tokenizer.ts` - HTML-aware tokenization
- `WordReplacer.ts` - Position-based word replacement
- `EPUBExtractor.ts` - CSS stylesheet resolution
- `ChapterContentService.ts` - Image processing, styling

---

### Phase 3: Translation Engine (Weeks 4-6) ⭐ CORE FEATURE
**Status: ✅ COMPLETED**

#### 3.1 Word Database Setup
- [x] Import frequency-ranked word lists per language (FrequencyListService)
- [x] Map words to proficiency levels:
  - **Beginner (A1-A2)**: Top 500 most common words
  - **Intermediate (B1-B2)**: Words ranked 501-2000
  - **Advanced (C1-C2)**: Words ranked 2001-5000+
- [x] Create translation pairs database (DynamicWordDatabase)
- [x] Multi-provider translation API (LibreTranslate, MyMemory, Lingva)
- [x] Support 28+ languages with metadata

**Implementation:**
```typescript
// TranslationAPIService - Multiple free translation providers
const result = await translationAPI.translate('house', 'en', 'es');
// { translatedText: 'casa', provider: 'libretranslate', ... }

// FrequencyListService - Word frequency from open corpora
const rank = await frequencyListService.getWordRank('en', 'house');
// Returns rank (1-5000+) used for proficiency level

// DynamicWordDatabase - Combines API + frequency for any language pair
const entry = await dynamicWordDatabase.lookupWord('hello', 'en', 'fr');
// { sourceWord: 'hello', targetWord: 'bonjour', proficiencyLevel: 'beginner', ... }
```

#### 3.2 Word Replacement Algorithm
- [x] Identify replaceable words in text (Tokenizer class)
- [x] Match words accounting for:
  - Case sensitivity
  - Plural forms (variants support)
  - Verb conjugations (basic)
- [x] Respect density setting (% of words to replace)
- [x] Avoid replacing within quotes, names, technical terms (Tokenizer)
- [x] Preserve case in replacements (WordReplacer)

**Algorithm (Implemented in TranslationEngine.ts):**
```typescript
// Process content and replace words based on settings
const processed = await translationEngine.processContent(chapterHtml);
// Returns: { content: htmlWithForeignWords, foreignWords: [...], stats: {...} }
```

#### 3.3 Context-Aware Selection
- [x] Random selection based on density setting
- [x] Distributed selection strategy (evenly spread words)
- [x] Frequency-based selection (prefer common words)
- [x] Minimum word spacing constraint
- [x] Skip protected content (quotes, names, code)
- [x] Track replaced words to avoid repetition

---

### Phase 4: Reader Screen (Weeks 6-8)
**Status: ✅ COMPLETED**

#### 4.1 Basic Reader
- [x] Render processed book content (WebView-based EPUBRenderer)
- [x] Implement continuous scroll with progress tracking
- [x] Chapter navigation (prev/next + chapter list)
- [x] Progress tracking (scroll position + chapter)
- [x] Save reading position automatically

#### 4.2 Reader Customization
- [x] Font selection (Serif, Sans-serif, Dyslexic-friendly - 5 options)
- [x] Font size adjustment (12-32pt slider)
- [x] Line spacing control (1.0-2.5x slider)
- [x] Margin adjustment (8-56px slider)
- [x] Theme selection (Light, Dark, Sepia)
- [ ] Brightness control

#### 4.3 Foreign Word Interaction ⭐
- [x] Style foreign words distinctly (underline, color via CSS)
- [x] Tap detection on foreign words (InjectedScript + WebView postMessage)
- [x] Hover detection for desktop (InjectedScript mouseenter/mouseleave)
- [x] Translation popup component:
  - Original word ✅
  - Phonetic pronunciation ✅
  - Context sentence display ✅
  - Proficiency level badge ✅
  - Save to vocabulary button ✅
  - "I knew this" button ✅
- [x] Long-press for more options (InjectedScript)
- [x] Visual feedback on tap/hover (CSS animations)

**Implemented Components:**
- `EPUBRenderer.tsx` - WebView-based content renderer
- `ChapterContentService.ts` - CSS injection and JS for tap handling
- `InjectedScript.ts` - Comprehensive WebView JS for interactions
- `useWordTapHandler.ts` - Hook for handling word taps
- `ReaderSettingsModal.tsx` - Two-tab settings (Appearance/Reading)
- `TranslationPopup.tsx` - Themed word reveal modal with animations

#### 4.4 Reading Statistics
- [x] Track time spent reading (via ReadingSession)
- [x] Count chapters read
- [x] Track words revealed vs. saved (statisticsStore)
- [ ] Session summary on close

---

### Phase 5: Vocabulary Manager (Weeks 8-10)
**Status: ✅ COMPLETED**

#### 5.1 Word Storage
- [x] Save words from reader to vocabulary (vocabularyStore + VocabularyRepository)
- [x] Store context sentence with each word
- [x] Track when word was first seen (addedAt)
- [x] Track reveal count per word (via statisticsStore)
- [x] Mark words as "learned" (status field)

#### 5.2 Vocabulary Screen
- [x] List all saved words (VocabularyScreen with VocabularyCard)
- [x] Filter by book, date, status (VocabularyRepository + UI filters)
- [x] Search vocabulary (VocabularyRepository.search + SearchInput)
- [x] Edit/delete words (WordDetailModal)
- [x] Export vocabulary (ExportService - CSV, Anki, JSON)
- [x] Stats header with due count (VocabularyStatsHeader)

#### 5.3 Spaced Repetition System (SRS)
- [x] Implement SM-2 algorithm (VocabularyRepository.recordReview)
- [x] Schedule word reviews (getDueForReview)
- [x] Review mode UI (ReviewScreen):
  - Show foreign word (FlashCard front)
  - User attempts recall (tap to flip)
  - Reveal and self-grade (GradingButtons)
- [x] Track review statistics (ReviewSessionSummary + statisticsStore)

**Implemented Components:**
- `VocabularyScreen.tsx` - Main vocabulary list with search, filters, stats
- `VocabularyCard.tsx` - Animated reveal card for saved words
- `WordDetailModal.tsx` - Full word info with edit/delete
- `ReviewScreen.tsx` - Flashcard review session
- `FlashCard.tsx` - Animated flip card
- `GradingButtons.tsx` - SM-2 self-grading (Again/Hard/Good/Easy)
- `ReviewProgress.tsx` - Session progress bar
- `ReviewSessionSummary.tsx` - End-of-session stats
- `VocabularyStats.tsx` - Stats overview + header
- `ExportModal.tsx` - Export format selection
- `ExportService.ts` - CSV, Anki TSV, JSON export

---

### Phase 6: Settings & Onboarding (Weeks 10-11)
**Status: ✅ COMPLETED**

#### 6.1 Onboarding Flow
- [x] Welcome screen with app explanation
- [x] Select source language (28 languages supported)
- [x] Select target language (with search)
- [x] Select proficiency level (with CEFR + examples)
- [x] Adjust initial density preference (5 presets)
- [x] Summary and start screen
- [x] Skip option for returning users
- [x] Animated step transitions

#### 6.2 Settings Screen
- [x] Language pair configuration (LanguageSettingsScreen)
- [x] Proficiency level adjustment
- [x] Word density slider
- [x] Reader appearance defaults (link to ReaderSettings)
- [x] Notification preferences (NotificationSettingsScreen)
- [x] Data export/backup (DataManagementScreen)
- [x] About & help section (AboutScreen)
- [x] Rate & Share app options

**Implemented Screens:**
- `OnboardingScreen.tsx` - 6-step onboarding with animations
- `SettingsScreen.tsx` - Main settings hub
- `LanguageSettingsScreen.tsx` - Language pair + proficiency
- `DataManagementScreen.tsx` - Export, import, clear data
- `NotificationSettingsScreen.tsx` - Reminder toggles + timing
- `AboutScreen.tsx` - Version, credits, links, acknowledgments

---

### Phase 7: Polish & Testing (Weeks 11-13)
**Status: ✅ COMPLETED**

#### 7.1 Testing
- [x] Unit tests for services (ExportService, SM-2 Algorithm)
- [x] Component tests (VocabularyCard, FlashCard, GradingButtons)
- [x] Store tests (vocabularyStore)
- [x] Test utilities and mocks
- [ ] E2E tests for critical flows (future)
- [ ] Performance testing with large books (future)

#### 7.2 Optimization
- [x] Performance monitoring utilities
- [x] Debounce/throttle helpers
- [x] List optimization helpers
- [x] Image optimization utilities
- [ ] Additional lazy loading (future)

#### 7.3 Error Handling
- [x] ErrorBoundary component
- [x] ScreenErrorBoundary wrapper
- [x] Error fallback UI
- [x] Dev mode error details

#### 7.4 Accessibility
- [ ] Screen reader support (future)
- [ ] Dynamic text sizing (future)
- [ ] High contrast mode (future)

**Implemented:**
- `src/__tests__/utils/testUtils.tsx` - Test utilities and mocks
- `src/__tests__/services/ExportService.test.ts` - Export service tests
- `src/__tests__/services/SM2Algorithm.test.ts` - Spaced repetition tests
- `src/__tests__/components/vocabulary/*.test.tsx` - Component tests
- `src/__tests__/stores/vocabularyStore.test.ts` - Store tests
- `src/components/common/ErrorBoundary.tsx` - Error boundary
- `src/utils/performance.ts` - Performance utilities

---

### Phase 8: Release Preparation (Weeks 13-14)
**Status: 🔶 IN PROGRESS**

#### 8.1 App Store Assets
- [x] App metadata configuration (app.json)
- [x] App Store description and keywords
- [x] Play Store description and keywords
- [x] Privacy policy
- [x] Terms of service
- [ ] App icons (all sizes)
- [ ] Screenshots for all devices
- [ ] App preview video

#### 8.2 CI/CD Pipeline
- [x] GitHub Actions for testing
- [x] GitHub Actions for iOS builds
- [x] GitHub Actions for Android builds
- [x] Fastlane for iOS deployments
- [x] Fastlane for Android deployments
- [ ] TestFlight / Internal testing setup
- [ ] Production deployment workflow

#### 8.3 Documentation
- [x] Launch checklist
- [x] Troubleshooting guide
- [x] Changelog
- [x] Updated README

#### 8.4 Launch
- [ ] Beta testing with real users
- [ ] Gather feedback and iterate
- [ ] App Store submission
- [ ] Play Store submission
- [ ] Launch marketing

---

## 🔧 Technical Decisions

### Why React Native?
- Cross-platform (iOS + Android) from single codebase
- Large ecosystem and community
- Excellent performance with New Architecture
- Familiar to web developers

### Why Zustand over Redux?
- Simpler API, less boilerplate
- Better TypeScript support
- Smaller bundle size
- Sufficient for app's state needs

### Why SQLite over Realm?
- Standard SQL queries
- Better tooling and debugging
- Familiar to most developers
- Excellent performance for our use case

### EPUB Rendering Strategy
- Use WebView with epub.js for complex EPUB rendering
- Inject custom CSS for foreign word styling
- Use postMessage bridge for tap detection
- Fall back to native Text components for simple content

---

## 📊 Data Models

### Database Schema (SQLite)

```sql
-- Books table
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  cover_path TEXT,
  file_path TEXT NOT NULL,
  format TEXT NOT NULL,
  added_at INTEGER NOT NULL,
  last_read_at INTEGER,
  progress REAL DEFAULT 0,
  current_location TEXT,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  proficiency TEXT NOT NULL,
  density REAL DEFAULT 0.3
);

-- Vocabulary table
CREATE TABLE vocabulary (
  id TEXT PRIMARY KEY,
  source_word TEXT NOT NULL,
  target_word TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  context_sentence TEXT,
  book_id TEXT,
  added_at INTEGER NOT NULL,
  last_reviewed_at INTEGER,
  review_count INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Reading sessions table
CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  pages_read INTEGER DEFAULT 0,
  words_revealed INTEGER DEFAULT 0,
  words_saved INTEGER DEFAULT 0,
  FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Word list table (populated from assets)
CREATE TABLE word_list (
  id TEXT PRIMARY KEY,
  source_word TEXT NOT NULL,
  target_word TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  proficiency TEXT NOT NULL,
  frequency_rank INTEGER,
  part_of_speech TEXT,
  variants TEXT -- JSON array
);
```

---

## 🚧 Known Challenges & Solutions

### Challenge 1: EPUB Complexity
**Problem:** EPUBs vary wildly in structure and formatting.
**Solution:** Use battle-tested epub.js, implement fallbacks, test with diverse EPUBs.

### Challenge 2: Word Boundary Detection
**Problem:** Different languages have different tokenization rules.
**Solution:** Start with English source only, use language-specific tokenizers.

### Challenge 3: Grammatical Correctness
**Problem:** Direct word replacement can create awkward grammar.
**Solution:** Start with nouns (least grammar-dependent), expand carefully.

### Challenge 4: Performance with Large Books
**Problem:** Processing entire books at once is slow.
**Solution:** Process chapters on-demand, cache processed content.

### Challenge 5: Offline Functionality
**Problem:** Users expect to read without internet.
**Solution:** All core features work offline, sync when available.

---

## 📈 Success Metrics

### MVP Success (Phase 1 Release)
- [ ] Can import and read an EPUB
- [ ] Foreign words appear at correct proficiency level
- [ ] Tap-to-reveal works smoothly
- [ ] Can save words to vocabulary
- [ ] App doesn't crash on common operations

### Growth Metrics (Post-Launch)
- Daily Active Users (DAU)
- Average reading time per session
- Words revealed / Words saved ratio
- Retention (Day 1, Day 7, Day 30)
- App Store ratings

---

## 🔗 Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [epub.js Documentation](http://epubjs.org/documentation/)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)

### Word Lists
- [SUBTLEX frequency lists](https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus)
- [OpenSubtitles frequency lists](https://github.com/hermitdave/FrequencyWords)

### Design Inspiration
- Apple Books
- Kindle
- Moon+ Reader
- Duolingo (for learning UX)

---

## 📝 Notes

- ~~Start with English → Greek as primary pair~~ → **Now supports 28+ language pairs**
- Uses free translation APIs (LibreTranslate, MyMemory, Lingva) for any-to-any translation
- FrequencyListService fetches open source word frequency lists for proficiency ranking
- Keep MVP scope tight—resist feature creep
- Prioritize reading experience over learning features initially
- Get real user feedback early and often

---

## 🌍 Supported Languages (28+)

| Language | Code | Flag | RTL |
|----------|------|------|-----|
| English | en | 🇬🇧 | - |
| Spanish | es | 🇪🇸 | - |
| French | fr | 🇫🇷 | - |
| German | de | 🇩🇪 | - |
| Italian | it | 🇮🇹 | - |
| Portuguese | pt | 🇵🇹 | - |
| Russian | ru | 🇷🇺 | - |
| Greek | el | 🇬🇷 | - |
| Dutch | nl | 🇳🇱 | - |
| Polish | pl | 🇵🇱 | - |
| Turkish | tr | 🇹🇷 | - |
| Japanese | ja | 🇯🇵 | - |
| Chinese | zh | 🇨🇳 | - |
| Korean | ko | 🇰🇷 | - |
| Arabic | ar | 🇵🇸 | ✅ |
| Hebrew | he | 🇮🇱 | ✅ |
| + 12 more... | | | |

---

*Last Updated: January 2026*
