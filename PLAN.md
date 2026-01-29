# Xenolexia Electron Implementation Plan 📋

## Overview

This document outlines the implementation plan for **Xenolexia**, a **desktop-only** application built with **Electron**, targeting **Windows**, **macOS**, and **Linux**. There are no mobile (iOS/Android) or web targets; the app is Electron-only.

---

## 🎯 Goals

1. **Electron-only application**: Single codebase for Windows, macOS, and Linux
2. **Cross-platform desktop**: Support Windows 10+, macOS 10.15+, and mainstream Linux distributions
3. **Core features**: Import books, read with word replacement, hover-to-reveal, vocabulary, settings, statistics
4. **Open source stack**: Free and open source libraries only
5. **Clean architecture**: Shared business logic in `@xenolexia/shared`, Electron-specific code in `packages/desktop`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                    │
│  (main.js, preload.js, IPC handlers, file system access)    │
└──────────────────────────┬──────────────────────────────────┘
                          │ IPC
┌──────────────────────────┴──────────────────────────────────┐
│                  Electron Renderer Process                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React + React Router DOM (SPA)                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Library  │  │ Reader   │  │ Vocabulary       │   │   │
│  │  │ Screen   │  │ Screen   │  │ Screen          │   │   │
│  │  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │   │
│  │       │             │                 │             │   │
│  │  ┌────┴─────────────┴─────────────────┴─────────┐   │   │
│  │  │         @xenolexia/shared Package              │   │   │
│  │  │  (Stores, Services, Types, Utils)              │   │   │
│  │  └───────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                          │
┌──────────────────────────┴──────────────────────────────────┐
│              Electron-Specific Adapters                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FileSystemService.electron.ts                        │  │
│  │  DatabaseService.electron.ts (better-sqlite3)         │  │
│  │  StorageService.electron.ts                           │  │
│  │  AsyncStorage.electron.ts (electron-store)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Technology Stack

### Core Framework

- **Electron**: ^40.0.0 (latest stable)
- **React**: ^18.2.0
- **React Router DOM**: ^6.26.0 (for SPA navigation)
- **TypeScript**: ^5.4.5

### State Management

- **Zustand**: ^4.5.4 (already in use)
- **@tanstack/react-query**: ^5.51.1 (already in use)

### Storage & Database

- **better-sqlite3**: ^11.0.0 (replaces react-native-sqlite-storage)
- **electron-store**: ^10.0.0 (replaces @react-native-async-storage/async-storage)

### File System

- **Node.js fs/promises**: Native (replaces react-native-fs)
- **Electron dialog**: Native (replaces react-native-document-picker)

### Book Parsing

- **epubjs**: ^0.3.93 (already in use, works in Electron)
- **jszip**: ^3.10.1 (already in use)
- **@lingo-reader/mobi-parser**: ^0.4.5 (already in use)

### UI & Styling

- **CSS Modules**: For component styling (replaces NativeWind)
- **CSS Variables**: For theming (light/dark/sepia)

### Build & Packaging

- **electron-builder**: ^26.4.0 (already configured)
- **webpack**: ^5.104.1 (already configured)

### Testing

- **Jest**: ^29.7.0 — unit tests for shared package and services
- **@testing-library/react**: Component tests where applicable
- **Playwright**: E2E / UI tests for Electron (launch app, interact with UI)

---

## 🔄 Implementation Status

The application is **Electron-only**. Shared code uses Electron-compatible adapters (FileSystem.electron, AsyncStorage.electron, DatabaseService.electron, Platform via process.platform). Root and docs may still reference React Native in historical or cleanup context.

### Phase 1: Dependency Replacement

#### 1.1 Remove React Native Dependencies (cleanup)

**Status: ⚠️ PARTIAL** — Shared package uses Electron adapters; root `package.json` may still list legacy deps.

Files to update:

- `packages/shared/package.json` - Remove React Native deps
- `package.json` (root) - Remove React Native deps
- All service files using React Native APIs

**Replacements:**

```typescript
// BEFORE (React Native)
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';
import {Platform} from 'react-native';

// AFTER (Electron)
import {promises as fs} from 'fs';
import Store from 'electron-store';
import Database from 'better-sqlite3';
// Platform detection via process.platform
```

#### 1.2 Create Electron Adapters

**Status: ❌ NOT STARTED**

Create platform-specific implementations:

- `packages/shared/src/services/FileSystemService/FileSystemService.electron.ts`
- `packages/shared/src/services/StorageService/DatabaseService.electron.ts`
- `packages/shared/src/services/StorageService/StorageService.electron.ts`
- `packages/shared/src/utils/AsyncStorage.electron.ts`

#### 1.3 Update Shared Package

**Status: ❌ NOT STARTED**

- Remove all `react-native-*` imports
- Create abstraction layer for platform-specific code
- Update service implementations to use Electron APIs

---

### Phase 2: Core Services Implementation

#### 2.1 File System Service (Electron)

**Status: ⚠️ PARTIAL** (ElectronFileService exists but not integrated)

**Implementation Plan:**

```typescript
// packages/shared/src/services/FileSystemService/FileSystemService.electron.ts
import {promises as fs} from 'fs';
import {app} from 'electron';
import path from 'path';

export class ElectronFileSystemService {
  static async readFile(filePath: string): Promise<ArrayBuffer> {
    const buffer = await fs.readFile(filePath);
    return buffer.buffer;
  }

  static async writeFile(filePath: string, content: Buffer | string): Promise<void> {
    await fs.writeFile(filePath, content);
  }

  static async getAppDataPath(): Promise<string> {
    return app.getPath('userData');
  }

  static async getBooksDirectory(): Promise<string> {
    const userData = app.getPath('userData');
    const booksDir = path.join(userData, 'books');
    await fs.mkdir(booksDir, {recursive: true});
    return booksDir;
  }
}
```

**Files to Update:**

- `packages/shared/src/services/BookParser/*.ts` - Replace RNFS with Electron FS
- `packages/shared/src/services/ImportService/ImportService.ts` - Use Electron dialog
- `packages/shared/src/services/ImageService/*.ts` - Use Electron FS
- `packages/shared/src/services/BookDownloadService/BookDownloadService.ts` - Use Electron FS

#### 2.2 Database Service (Electron)

**Status: ❌ NOT STARTED**

**Implementation Plan:**

```typescript
// packages/shared/src/services/StorageService/DatabaseService.electron.ts
import Database from 'better-sqlite3';
import {app} from 'electron';
import path from 'path';

export class ElectronDatabaseService {
  private static db: Database.Database | null = null;

  static async initialize(): Promise<void> {
    const dbPath = path.join(app.getPath('userData'), 'xenolexia.db');
    this.db = new Database(dbPath);
    // Run migrations
    this.db.exec(DatabaseSchema.createTables);
  }

  static getDatabase(): Database.Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }
}
```

**Files to Update:**

- `packages/shared/src/services/StorageService/DatabaseService.ts` - Replace react-native-sqlite-storage
- `packages/shared/src/services/StorageService/StorageService.ts` - Update to use better-sqlite3

#### 2.3 AsyncStorage Replacement (Electron)

**Status: ❌ NOT STARTED**

**Implementation Plan:**

```typescript
// packages/shared/src/utils/AsyncStorage.electron.ts
import Store from 'electron-store';

const store = new Store();

export const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return store.get(key, null) as string | null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    store.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    store.delete(key);
  },
  clear: async (): Promise<void> => {
    store.clear();
  },
};
```

**Files to Update:**

- `packages/shared/src/services/TranslationEngine/TranslationAPIService.ts`
- `packages/shared/src/services/TranslationEngine/FrequencyListService.ts`
- `packages/shared/src/services/ReaderStyleService.ts`

#### 2.4 Platform Detection

**Status: ❌ NOT STARTED**

**Implementation Plan:**

```typescript
// packages/shared/src/utils/platform.electron.ts
export const Platform = {
  OS: process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux',
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
};
```

**Files to Update:**

- `packages/shared/src/services/BookDownloadService/BookDownloadService.ts`
- `packages/shared/src/services/ImportService/ImportService.ts`
- `packages/shared/src/stores/libraryStore.ts`
- `packages/shared/src/services/ExportService/ExportService.ts`

---

### Phase 3: UI & Navigation

#### 3.1 Navigation System

**Status: ✅ COMPLETE** (React Router DOM already implemented)

**Current Implementation:**

- `packages/desktop/src/App.tsx` - Uses React Router DOM
- All routes are configured

**No changes needed.**

#### 3.2 Component Library

**Status: ✅ COMPLETE** (Basic components exist)

**Current Components:**

- `Button.tsx`, `Card.tsx`, `Input.tsx`, `Text.tsx` - Basic UI components
- CSS modules for styling

**Enhancements Needed:**

- [ ] Add more components (Modal, Dropdown, Tabs, etc.)
- [ ] Improve theme system with CSS variables
- [ ] Add keyboard shortcuts support

#### 3.3 Screen Implementations

**Status: ⚠️ PARTIAL**

**Existing Screens:**

- ✅ `LibraryScreen.tsx` - Basic implementation
- ✅ `ReaderScreen.tsx` - Basic implementation
- ✅ `VocabularyScreen.tsx` - Basic implementation
- ✅ `SettingsScreen.tsx` - Basic implementation
- ✅ `StatisticsScreen.tsx` - Basic implementation
- ✅ `BookDiscoveryScreen.tsx` - Basic implementation
- ✅ `AboutScreen.tsx` - Basic implementation

**Missing Features:**

- [ ] Onboarding flow (first-time setup)
- [ ] Book detail screen
- [ ] Review screen (flashcard review)
- [ ] Word detail modal
- [ ] Export modal

---

### Phase 4: Core Features Implementation

#### 4.1 Book Import & Library Management

**Status: ⚠️ PARTIAL**

**Current State:**

- `ElectronImportService.ts` exists
- Basic file dialog integration
- Book parsing services exist in shared package

**Missing:**

- [ ] Complete integration with shared ImportService
- [ ] Progress reporting during import
- [ ] Error handling and user feedback
- [ ] Book metadata extraction
- [ ] Cover image extraction and caching

**Implementation Tasks:**

1. Update `ImportService.ts` to use Electron file system
2. Integrate with `ElectronFileService.ts`
3. Add progress callbacks
4. Implement book storage in SQLite
5. Add cover image processing

#### 4.2 EPUB Reader

**Status: ⚠️ PARTIAL**

**Current State:**

- `ReaderScreen.tsx` exists
- `ReaderContent.tsx` exists
- epubjs is available

**Missing:**

- [ ] EPUB rendering with epubjs
- [ ] Chapter navigation
- [ ] Progress tracking
- [ ] Reading position persistence
- [ ] Customizable reader settings (font, theme, spacing)
- [ ] Word replacement integration
- [ ] Tap/hover to reveal translations
- [ ] Translation popup component

**Implementation Tasks:**

1. Integrate epubjs for EPUB rendering
2. Implement chapter navigation
3. Add progress tracking and persistence
4. Create reader settings UI
5. Integrate TranslationEngine for word replacement
6. Implement word interaction (hover for desktop)
7. Create translation popup component

#### 4.3 Translation Engine Integration

**Status: ⚠️ PARTIAL**

**Current State:**

- TranslationEngine exists in shared package
- TranslationAPIService exists
- WordMatcher, WordReplacer exist

**Missing:**

- [ ] Integration with ReaderScreen
- [ ] Word replacement in rendered content
- [ ] Translation caching
- [ ] Offline mode support
- [ ] Frequency list integration

**Implementation Tasks:**

1. Integrate TranslationEngine with EPUB renderer
2. Implement word replacement in chapter content
3. Add translation caching layer
4. Implement offline fallback
5. Load frequency lists for word ranking

#### 4.4 Vocabulary Management

**Status: ⚠️ PARTIAL**

**Current State:**

- `VocabularyScreen.tsx` exists
- VocabularyStore exists in shared package
- VocabularyRepository exists

**Missing:**

- [ ] Complete vocabulary list display
- [ ] Word saving from reader
- [ ] Word editing and deletion
- [ ] Search and filtering
- [ ] Export functionality
- [ ] Spaced repetition review
- [ ] Flashcard review screen

**Implementation Tasks:**

1. Complete vocabulary list UI
2. Integrate word saving from reader
3. Implement word CRUD operations
4. Add search and filter UI
5. Implement export service (CSV, Anki, JSON)
6. Create review screen with flashcards
7. Integrate SM-2 algorithm

#### 4.5 Statistics & Analytics

**Status: ⚠️ PARTIAL**

**Current State:**

- `StatisticsScreen.tsx` exists
- StatisticsStore exists
- SessionRepository exists

**Missing:**

- [ ] Reading statistics display
- [ ] Vocabulary progress tracking
- [ ] Time spent reading
- [ ] Words learned over time
- [ ] Charts and visualizations

**Implementation Tasks:**

1. Implement statistics calculations
2. Create chart components (or use library like recharts)
3. Display reading time, words learned, etc.
4. Add time-based analytics

#### 4.6 Settings & Preferences

**Status: ⚠️ PARTIAL**

**Current State:**

- `SettingsScreen.tsx` exists
- UserStore exists

**Missing:**

- [ ] Language pair selection
- [ ] Proficiency level selection
- [ ] Word density control
- [ ] Reader appearance defaults
- [ ] Data export/import
- [ ] About screen content

**Implementation Tasks:**

1. Create language selection UI
2. Add proficiency level selector
3. Implement density slider
4. Add reader settings persistence
5. Implement data export/import
6. Complete about screen

---

### Phase 5: Electron-Specific Features

#### 5.1 Main Process Enhancements

**Status: ⚠️ PARTIAL**

**Current State:**

- `electron/main.js` exists with basic setup
- IPC handlers for file operations
- Menu system exists

**Enhancements Needed:**

- [ ] Additional IPC handlers for database operations
- [ ] Window state persistence (size, position)
- [ ] Auto-updater integration (optional)
- [ ] Crash reporting (optional)
- [ ] Native notifications
- [ ] System tray support (optional)

#### 5.2 Preload Script

**Status: ✅ COMPLETE**

**Current State:**

- `electron/preload.js` exists
- Exposes electronAPI to renderer

**Enhancements Needed:**

- [ ] Add database operation handlers
- [ ] Add notification handlers
- [ ] Add window control handlers

#### 5.3 Build & Packaging

**Status: ✅ COMPLETE**

**Current State:**

- `electron-builder` configured
- Build scripts exist
- Platform-specific configs exist

**Enhancements Needed:**

- [ ] Code signing for macOS/Windows
- [ ] Auto-updater configuration
- [ ] App icons for all platforms
- [ ] Installer customization

---

## 📋 Implementation Checklist

### Core Infrastructure

- [ ] Remove all React Native dependencies
- [ ] Replace react-native-fs with Node.js fs
- [ ] Replace react-native-sqlite-storage with better-sqlite3
- [ ] Replace @react-native-async-storage with electron-store
- [ ] Remove Platform from react-native, use process.platform
- [ ] Update all service files to use Electron APIs
- [ ] Create Electron-specific adapters
- [ ] Update shared package exports

### Database & Storage

- [ ] Implement DatabaseService.electron.ts
- [ ] Migrate database schema to better-sqlite3
- [ ] Update StorageService to use Electron database
- [ ] Implement AsyncStorage replacement with electron-store
- [ ] Test database operations on all platforms

### File System

- [ ] Implement FileSystemService.electron.ts
- [ ] Update BookParser services to use Electron FS
- [ ] Update ImportService to use Electron dialog
- [ ] Update ImageService to use Electron FS
- [ ] Update BookDownloadService to use Electron FS

### UI Components

- [ ] Complete basic component library
- [ ] Implement Modal component
- [ ] Implement Dropdown/Select component
- [ ] Implement Tabs component
- [ ] Improve theme system
- [ ] Add keyboard shortcuts

### Screens

- [ ] Complete LibraryScreen with all features
- [ ] Complete ReaderScreen with EPUB rendering
- [ ] Complete VocabularyScreen with all features
- [ ] Complete SettingsScreen with all options
- [ ] Complete StatisticsScreen with charts
- [ ] Implement OnboardingScreen
- [ ] Implement BookDetailScreen
- [ ] Implement ReviewScreen (flashcards)
- [ ] Implement WordDetailModal
- [ ] Implement ExportModal

### Features

- [ ] Book import with progress
- [ ] EPUB rendering with epubjs
- [ ] Chapter navigation
- [ ] Reading progress tracking
- [ ] Word replacement in reader
- [ ] Translation popup on hover
- [ ] Word saving to vocabulary
- [ ] Vocabulary list with search/filter
- [ ] Spaced repetition review
- [ ] Statistics and analytics
- [ ] Settings persistence
- [ ] Data export/import

### Electron-Specific

- [ ] Window state persistence
- [ ] Native notifications
- [ ] Menu enhancements
- [ ] Keyboard shortcuts
- [ ] System tray (optional)
- [ ] Auto-updater (optional)

### Testing

- [ ] Unit tests for Electron adapters
- [ ] Integration tests for services
- [ ] Component tests
- [ ] E2E tests (optional)

### Build & Release

- [ ] Test builds on macOS
- [ ] Test builds on Windows
- [ ] Test builds on Linux
- [ ] Code signing setup
- [ ] App icons
- [ ] Installer customization

---

## 🔍 Comparison: Existing vs. Required

### ✅ Already Implemented

1. **Basic Electron Setup**

   - Main process (`electron/main.js`)
   - Preload script (`electron/preload.js`)
   - IPC handlers for file operations
   - Menu system

2. **React Application Structure**

   - React Router DOM setup
   - Basic screen components
   - UI component library (Button, Card, Input, Text)
   - CSS modules for styling

3. **Shared Business Logic**

   - BookParser services (EPUB, TXT, FB2, MOBI)
   - TranslationEngine with multi-provider support
   - Vocabulary management (stores, repositories)
   - Statistics tracking
   - Export service

4. **Build Configuration**
   - electron-builder configuration
   - Webpack setup
   - Platform-specific build scripts

### ❌ Missing / Incomplete

1. **Dependency Migration**

   - React Native dependencies still present
   - Services still use react-native-\* packages
   - Platform detection uses React Native Platform

2. **Database Implementation**

   - DatabaseService uses react-native-sqlite-storage (commented out)
   - StorageService not fully implemented
   - No Electron-specific database adapter

3. **File System Integration**

   - Services still reference react-native-fs
   - ElectronFileService exists but not integrated
   - ImportService needs Electron dialog integration

4. **AsyncStorage Replacement**

   - Services use @react-native-async-storage
   - No electron-store implementation
   - Translation caching not working

5. **Reader Features**

   - EPUB rendering not integrated
   - Word replacement not working in reader
   - Translation popup not implemented
   - Reading progress not persisted

6. **Vocabulary Features**

   - Word saving from reader not implemented
   - Review screen (flashcards) missing
   - Export functionality not integrated

7. **Settings & Onboarding**

   - Onboarding flow missing
   - Settings not fully functional
   - Preferences not persisted

8. **UI Enhancements**
   - Missing modal components
   - Theme system incomplete
   - Keyboard shortcuts missing

---

## 🛠️ Recommended Libraries (Free & Open Source)

### Database

- **better-sqlite3**: Fast, synchronous SQLite3 for Node.js
  - License: MIT
  - GitHub: https://github.com/WiseLibs/better-sqlite3

### Storage

- **electron-store**: Simple data persistence for Electron
  - License: MIT
  - GitHub: https://github.com/sindresorhus/electron-store

### UI Components (Optional)

- **recharts**: Composable charting library for React
  - License: MIT
  - GitHub: https://github.com/recharts/recharts

### Utilities

- **date-fns**: Already in use, modern date utility library
- **lodash**: Already in use, utility library
- **uuid**: Already in use, UUID generation

---

## 📝 File Structure After Migration

```
xenolexia-electron/
├── packages/
│   ├── desktop/                    # Electron app
│   │   ├── electron/
│   │   │   ├── main.js             # Main process
│   │   │   └── preload.js           # Preload script
│   │   ├── src/
│   │   │   ├── App.tsx             # React app entry
│   │   │   ├── components/         # UI components
│   │   │   ├── screens/            # Screen components
│   │   │   └── services/           # Electron-specific services
│   │   └── package.json
│   │
│   └── shared/                      # Shared business logic
│       ├── src/
│       │   ├── services/
│       │   │   ├── BookParser/     # Book parsing (platform-agnostic)
│       │   │   ├── TranslationEngine/  # Translation logic
│       │   │   ├── StorageService/
│       │   │   │   ├── DatabaseService.electron.ts  # NEW
│       │   │   │   └── StorageService.electron.ts   # NEW
│       │   │   ├── FileSystemService/
│       │   │   │   └── FileSystemService.electron.ts # NEW
│       │   │   └── ...
│       │   ├── stores/             # Zustand stores
│       │   ├── types/              # TypeScript types
│       │   └── utils/
│       │       └── AsyncStorage.electron.ts  # NEW
│       └── package.json
│
├── package.json                     # Root package.json (no RN deps)
└── ...
```

---

## 🚀 Implementation Priority

### High Priority (MVP)

1. **Dependency Migration** - Remove React Native, add Electron alternatives
2. **Database Service** - Implement better-sqlite3 integration
3. **File System Service** - Complete Electron FS integration
4. **Book Import** - Working book import with progress
5. **EPUB Reader** - Basic EPUB rendering and navigation
6. **Word Replacement** - Translation engine integration in reader
7. **Vocabulary Saving** - Save words from reader

### Medium Priority

8. **Vocabulary Management** - Complete vocabulary screen
9. **Settings** - Functional settings screen
10. **Statistics** - Basic statistics display
11. **Translation Popup** - Hover to reveal translations

### Low Priority (Polish)

12. **Onboarding** - First-time setup flow
13. **Review Screen** - Flashcard review
14. **Export** - Data export functionality
15. **UI Enhancements** - Modals, themes, shortcuts

---

## 📊 Estimated Effort

| Phase                         | Tasks           | Estimated Time |
| ----------------------------- | --------------- | -------------- |
| Phase 1: Dependency Migration | 15-20 tasks     | 2-3 days       |
| Phase 2: Core Services        | 10-15 tasks     | 3-4 days       |
| Phase 3: UI & Navigation      | 5-10 tasks      | 2-3 days       |
| Phase 4: Core Features        | 20-25 tasks     | 5-7 days       |
| Phase 5: Electron-Specific    | 5-10 tasks      | 2-3 days       |
| **Total**                     | **55-80 tasks** | **14-20 days** |

---

## ✅ Success Criteria

### MVP Success

- [ ] Can import EPUB/TXT/FB2/MOBI books
- [ ] Can read books with proper rendering
- [ ] Words are replaced based on proficiency level
- [ ] Can hover over words to see translations
- [ ] Can save words to vocabulary
- [ ] Can view vocabulary list
- [ ] App works on macOS, Windows, and Linux
- [ ] No React Native dependencies remain

### Full Feature Success

- [ ] All features from README implemented
- [ ] Settings fully functional
- [ ] Statistics and analytics working
- [ ] Spaced repetition review implemented
- [ ] Data export/import working
- [ ] Onboarding flow complete
- [ ] Polished UI with themes
- [ ] Keyboard shortcuts implemented

---

## 🔗 Resources

### Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [electron-store Documentation](https://github.com/sindresorhus/electron-store)
- [epub.js Documentation](http://epubjs.org/documentation/)

### Examples

- [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)
- [Electron + TypeScript Examples](https://github.com/electron/electron/tree/main/docs/fiddles)

---

_Last Updated: January 29, 2026_
