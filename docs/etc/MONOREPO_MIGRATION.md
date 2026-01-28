# Monorepo Migration Plan

## Overview

This document outlines the migration from a single React Native app to a monorepo structure that shares code between React Native (mobile) and Electron (desktop) platforms.

## Target Structure

```
xenolexia-react/
├── packages/
│   ├── shared/              # Shared business logic
│   │   ├── src/
│   │   │   ├── stores/      # Zustand stores
│   │   │   ├── services/    # Business logic services
│   │   │   ├── types/       # TypeScript types
│   │   │   ├── utils/       # Utility functions
│   │   │   ├── hooks/       # React hooks
│   │   │   ├── constants/   # Constants
│   │   │   └── data/        # Static data
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mobile/              # React Native app
│   │   ├── src/
│   │   │   ├── components/  # React Native components
│   │   │   ├── screens/     # Screen components
│   │   │   ├── navigation/  # React Navigation
│   │   │   └── mocks/       # Web mocks (if needed)
│   │   ├── android/
│   │   ├── ios/
│   │   ├── App.tsx
│   │   ├── index.js
│   │   └── package.json
│   │
│   └── desktop/             # Electron app
│       ├── src/
│       │   ├── components/  # React DOM components
│       │   ├── screens/     # Screen components
│       │   └── navigation/  # React Router or similar
│       ├── electron/
│       │   ├── main.js
│       │   └── preload.js
│       ├── public/
│       ├── App.tsx
│       ├── index.html
│       └── package.json
│
├── package.json             # Root workspace config
├── tsconfig.json            # Root TypeScript config
└── ... (config files)
```

## Shared Code (packages/shared)

### What Goes in Shared:
- ✅ **Stores** (`stores/`) - All Zustand stores (libraryStore, vocabularyStore, readerStore, etc.)
- ✅ **Services** (`services/`) - Business logic:
  - BookParser/
  - TranslationEngine/
  - BookDownloadService/
  - ExportService/
  - StorageService/ (abstract interface)
- ✅ **Types** (`types/`) - All TypeScript type definitions
- ✅ **Utils** (`utils/`) - Utility functions
- ✅ **Hooks** (`hooks/`) - React hooks (useAsync, useDebounce, etc.)
- ✅ **Constants** (`constants/`) - App constants
- ✅ **Data** (`data/`) - Static data files

### What Stays Platform-Specific:
- ❌ **Components** - UI components differ (React Native vs React DOM)
- ❌ **Screens** - UI screens differ
- ❌ **Navigation** - React Navigation vs React Router
- ❌ **Theme** - May differ (or can be shared with platform adapters)

## Migration Steps

### Phase 1: Setup Workspace Structure ✅
- [x] Create packages directory structure
- [x] Create packages/shared/package.json
- [ ] Update root package.json with workspaces
- [ ] Create packages/mobile/package.json
- [ ] Create packages/desktop/package.json

### Phase 2: Move Shared Code
- [ ] Move stores/ to packages/shared/src/stores/
- [ ] Move services/ to packages/shared/src/services/
- [ ] Move types/ to packages/shared/src/types/
- [ ] Move utils/ to packages/shared/src/utils/
- [ ] Move hooks/ to packages/shared/src/hooks/
- [ ] Move constants/ to packages/shared/src/constants/
- [ ] Move data/ to packages/shared/src/data/
- [ ] Create packages/shared/src/index.ts barrel export

### Phase 3: Update Mobile Package
- [ ] Move React Native code to packages/mobile/
- [ ] Update imports to use @xenolexia/shared
- [ ] Update Metro config for workspace
- [ ] Update Android/iOS project paths

### Phase 4: Create Desktop Package
- [ ] Create Electron app structure
- [ ] Convert React Native components to React DOM
- [ ] Set up React Router or similar
- [ ] Update Webpack config for workspace
- [ ] Move Electron files

### Phase 5: Update Build Configs
- [ ] Update Metro config (watchFolders, resolver)
- [ ] Update Webpack config (resolve.alias)
- [ ] Update TypeScript paths
- [ ] Update build scripts

### Phase 6: Testing & Cleanup
- [ ] Test mobile builds
- [ ] Test desktop builds
- [ ] Update CI/CD workflows
- [ ] Update documentation

## Platform-Specific Components

Use platform-specific file extensions:
- `Button.native.tsx` - React Native version
- `Button.web.tsx` - Electron/Web version
- `Button.tsx` - Shared logic (if any)

## Import Examples

### From Mobile/Desktop:
```typescript
// Import from shared package
import { useLibraryStore } from '@xenolexia/shared/stores';
import { BookParserService } from '@xenolexia/shared/services';
import type { Book } from '@xenolexia/shared/types';
```

### In Shared Package:
```typescript
// Shared code should not import platform-specific code
// Use dependency injection or adapters for platform APIs
```

## Benefits

1. **Code Reuse**: Share business logic, stores, and utilities
2. **Consistency**: Same logic across platforms
3. **Maintainability**: Single source of truth
4. **Faster Development**: Changes propagate to all platforms

## Challenges

1. **UI Components**: Must be duplicated or abstracted
2. **Native APIs**: Need platform adapters
3. **Build Tooling**: More complex setup
4. **Testing**: Need to test shared code in both contexts
