# Remaining Tasks

This document outlines remaining work for the Xenolexia Electron app (Windows, macOS, Linux only). It is derived from PLAN.md and current implementation status.

---

## ✅ Done

- Electron main/preload, IPC for file ops
- Shared: DatabaseService (better-sqlite3), StorageService, AsyncStorage (electron-store), FileSystem adapters, Platform (process.platform)
- Book import (dialog, copy, metadata), EPUB/TXT/FB2/MOBI parsing
- Reader: chapter load, navigation, word replacement (TranslationEngine), translation popup, save to vocabulary
- Library, Vocabulary, Settings, Statistics screens (functional)
- Vocabulary: list, search, filter, word detail modal, edit/delete
- Settings: persistence (electron-store), language pair, proficiency, density, daily goal
- Statistics: session and reading stats from DB
- Build: electron-builder for Windows, macOS, Linux

---

## 🔶 Remaining (by priority)

### High

1. **Package cleanup**

   - Remove React Native (and iOS/Android) dependencies and scripts from root `package.json`.
   - Ensure no code paths depend on React Native or mobile.

2. **Review screen**

   - Flashcard review UI.
   - SM-2 grading (Already Knew, Easy, Good, Hard, Again).
   - Integration with vocabulary store and due-for-review logic.

3. **Session and progress persistence**
   - Start/end reading session when opening/closing a book (or on idle).
   - Persist reading position (chapter, scroll) per book.

### Medium

4. **Onboarding**

   - First-run flow: welcome, language pair, proficiency, word density (optional skip).

5. **Export**

   - UI for data export (vocabulary, reading stats).
   - Export formats (e.g. JSON/CSV) and save dialog.

6. **Reader settings in UI**

   - Font size, font family, theme, line spacing in reader (not only in app settings).

7. **Book detail**
   - Dedicated screen or modal: metadata, progress, delete, change language/density.

### Low / Polish

8. **UI**

   - Keyboard shortcuts (e.g. next/prev chapter, toggle sidebar).
   - Theme consistency (CSS variables) across app.
   - Optional: charts on Statistics (e.g. reading over time).

9. **Electron**

   - Window state (size, position) persistence.
   - Optional: system tray, auto-updater, code signing.

10. **Testing**

    - Unit tests for all critical paths (see below).
    - E2E/UI tests for main flows (launch, library, open book, vocabulary).

11. **Docs and release**
    - App icons and installers per platform.
    - README/PLAN kept in sync with Electron-only scope (no iOS/Android).

---

## 🧪 Testing (current and desired)

### Unit tests (core)

- **Shared**
  - StorageService: init, addBook, getBook, addVocabulary, getReadingStats (with mocked DB).
  - TranslationEngine: processContent returns content + foreignWords; density/proficiency applied.
  - ChapterContentService: getChapterHtml with/without translation options; returns foreignWords when options provided.
  - Vocabulary store: addWord, removeWord, isWordSaved, getDueForReview (with mocked repo).
  - Library store: addBook, removeBook, refreshBooks (with mocked BookRepository).
  - Reader store: loadBook sets chapters; goToChapter passes translation options and sets processedHtml + foreignWords (mocked ChapterContentService).
- **Desktop**
  - Critical UI: Library list, Vocabulary list, Settings form (with mocked stores).

### UI / E2E tests

- Launch Electron app (Playwright or similar).
- Navigate to Library, Vocabulary, Settings.
- Open a book (mock or fixture), ensure reader loads.
- Optional: hover a foreign word, open popup, save to vocabulary; confirm in Vocabulary screen.

---

## 📋 Checklist (from PLAN, trimmed)

- [ ] Remove React Native / iOS / Android from root package.json and scripts
- [ ] Review screen (flashcards + SM-2)
- [ ] Reading session start/end and position persistence
- [ ] Onboarding flow
- [ ] Export UI and save dialog
- [ ] Reader settings in UI (font, theme, spacing)
- [ ] Book detail screen/modal
- [ ] Unit tests for StorageService, TranslationEngine, ChapterContentService, stores
- [ ] E2E/UI tests (Electron)
- [ ] Window state persistence
- [ ] App icons and installer polish
