# Monorepo Migration Status

## ✅ Completed

1. **Workspace Structure Created**
   - `packages/shared/` directory created
   - `packages/mobile/` directory created
   - `packages/desktop/` directory created

2. **Shared Package Setup**
   - `packages/shared/package.json` created with dependencies
   - `packages/shared/tsconfig.json` created
   - Shared code copied to `packages/shared/src/`:
     - ✅ stores/
     - ✅ services/
     - ✅ types/
     - ✅ utils/
     - ✅ hooks/
     - ✅ constants/
     - ✅ data/
   - Barrel exports (`index.ts`) created for all modules

3. **Root Package.json**
   - Workspaces configuration added: `"workspaces": ["packages/*"]`

## 🔄 In Progress / Next Steps

### 1. Create Mobile Package
- [ ] Create `packages/mobile/package.json`
- [ ] Move React Native code from `src/` to `packages/mobile/src/`
- [ ] Move `android/` and `ios/` to `packages/mobile/`
- [ ] Move `App.tsx`, `index.js` to `packages/mobile/`
- [ ] Update Metro config to watch `packages/shared`
- [ ] Update imports to use `@xenolexia/shared`

### 2. Create Desktop Package
- [ ] Create `packages/desktop/package.json`
- [ ] Move Electron files (`electron/`) to `packages/desktop/`
- [ ] Move `public/` to `packages/desktop/`
- [ ] Create React DOM app structure
- [ ] Update Webpack config to resolve `@xenolexia/shared`
- [ ] Convert React Native components to React DOM

### 3. Update Build Configurations
- [ ] Update `metro.config.js`:
  ```js
  watchFolders: [path.resolve(__dirname, 'packages/shared')],
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    extraNodeModules: {
      '@xenolexia/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  }
  ```
- [ ] Update `webpack.config.js`:
  ```js
  resolve: {
    alias: {
      '@xenolexia/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  }
  ```
- [ ] Update TypeScript paths in `tsconfig.json`

### 4. Update Imports
All files need to update imports from:
```typescript
// Old
import { useLibraryStore } from '@stores/libraryStore';
import type { Book } from '@types/index';

// New
import { useLibraryStore } from '@xenolexia/shared/stores';
import type { Book } from '@xenolexia/shared/types';
```

### 5. Update Build Scripts
- [ ] Update root `package.json` scripts to reference packages
- [ ] Update Android/iOS build paths
- [ ] Update Electron build paths

## 📝 Notes

- The shared code has been copied (not moved) to preserve the original structure
- Platform-specific code (components, screens, navigation) should remain in their respective packages
- Services that use platform APIs (like `react-native-fs`) need adapters or platform-specific implementations

## 🚀 Quick Start (After Completion)

```bash
# Install dependencies for all workspaces
npm install

# Run mobile app
cd packages/mobile
npm run android  # or ios

# Run desktop app
cd packages/desktop
npm run electron:dev
```
