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
- **Review screen**: Flashcard UI, SM-2 grading (Again/Hard/Good/Easy/Already Knew), due-for-review
- **Session and progress persistence**: start/end session, wordsRevealed/Saved, position per book
- **Onboarding**: First-run flow (welcome, language pair, proficiency, word density), skip option
- **Export**: UI in Settings (JSON/CSV/Anki), save dialog
- **Reader settings in UI**: Theme, font size, font family, line spacing panel in reader
- **Book detail**: Modal from Library (metadata, progress, Read/Change language/Forget/Delete)
- **Keyboard shortcuts**: Reader next/prev chapter (Arrow keys, Page Up/Down), toggle controls (c/Escape)
- **Theme consistency**: CSS variables in App.css (--primary, --background, --text-*, --border, etc.)
- **Window state persistence**: Save/restore size, position, maximized in Electron main
- **Unit tests**: ReaderStore (DatabaseService/StorageService mocked), VocabularyStore getDueForReview

---

## 🔶 Completed (remaining tasks)

- **Package cleanup**: React Native / iOS / Android removed from root `package.json`; ESLint updated (no react-native plugin).
- **Statistics chart**: “Reading over time” bar chart (last 7 days, words revealed) on Statistics screen.
- **E2E tests**: Launch, #root content, Library/Onboarding content checks in `e2e/electron-app.spec.ts`.
- **README/PLAN**: Electron-only note in README; roadmap updated; PLAN already desktop-only.
- **System tray**: Tray icon with Show/Hide and Quit (Electron main).

### Optional / later

- App icons and installers per platform (icons exist; electron-builder config in place).
- Auto-updater, code signing (require certs and release pipeline).

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

- [x] Remove React Native / iOS / Android from root package.json and scripts
- [x] Review screen (flashcards + SM-2)
- [x] Reading session start/end and position persistence
- [x] Onboarding flow
- [x] Export UI and save dialog
- [x] Reader settings in UI (font, theme, spacing)
- [x] Book detail screen/modal
- [x] Unit tests for StorageService, TranslationEngine, ChapterContentService, stores, ReaderStore, VocabularyStore (getDueForReview)
- [x] E2E/UI tests (Electron)
- [x] Window state persistence
- [x] Statistics chart (reading over time)
- [x] System tray
- [x] README/PLAN in sync with Electron-only
- [ ] App icons and installer polish (optional)
