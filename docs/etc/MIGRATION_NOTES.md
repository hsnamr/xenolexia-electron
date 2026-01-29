# React Native to Electron Migration Notes

## Status: IN PROGRESS

This document tracks the migration from React Native dependencies to Electron equivalents.

## Completed Migrations

### ✅ Utility Modules Created
- `packages/shared/src/utils/platform.electron.ts` - Platform detection
- `packages/shared/src/utils/AsyncStorage.electron.ts` - Storage using electron-store
- `packages/shared/src/utils/FileSystem.electron.ts` - File system operations

### ✅ Services Updated
- `ChapterContentService.ts` - Uses Electron file system
- `EPUBExtractor.ts` - Uses Electron file system
- `TXTParser.ts` - Uses Electron file system
- `FB2Parser.ts` - Uses Electron file system
- `MOBIParser.ts` - Uses Electron file system
- `MetadataExtractor.ts` - Uses Electron file system
- `TranslationAPIService.ts` - Uses Electron AsyncStorage
- `FrequencyListService.ts` - Uses Electron AsyncStorage
- `ReaderStyleService.ts` - Uses Electron AsyncStorage
- `libraryStore.ts` - Uses Electron Platform

## Remaining Work

### ⚠️ Services Needing Updates

1. **BookDownloadService.ts**
   - Replace all `RNFS.*` calls with Electron file system utilities
   - Update `downloadWithRNFS` method to use Electron APIs
   - Replace `RNFS.downloadFile` with fetch + writeFile

2. **ImportService.ts**
   - Replace `DocumentPicker` with Electron dialog API
   - Replace `RNFS.*` calls with Electron file system utilities
   - Update file selection logic

3. **ExportService.ts**
   - Replace `Platform` and `Share` with Electron equivalents
   - Replace `RNFS.*` calls with Electron file system utilities
   - Use Electron dialog for save location

4. **ImageService.ts** and **ImageCache.ts**
   - Replace `RNFS.*` calls with Electron file system utilities
   - Update cache directory paths

5. **DatabaseService.ts**
   - **CRITICAL**: Replace `react-native-sqlite-storage` with `better-sqlite3`
   - This requires significant refactoring as better-sqlite3 is synchronous
   - Create `DatabaseService.electron.ts` with better-sqlite3 implementation

6. **StorageService.ts**
   - Update to use new DatabaseService.electron.ts
   - Ensure all database operations work with better-sqlite3

## Dependencies to Remove

From `package.json` (root):
- `@react-native-async-storage/async-storage`
- `react-native`
- `react-native-document-picker`
- `react-native-fs`
- `react-native-sqlite-storage`
- `react-native-web`
- `react-native-webview`
- `nativewind`
- All `@react-native/*` packages

From `packages/shared/package.json`:
- None (already clean)

## Dependencies to Add

To `packages/shared/package.json`:
- `better-sqlite3`: ^11.0.0
- `electron-store`: ^10.0.0

To `packages/desktop/package.json`:
- `better-sqlite3`: ^11.0.0 (if needed)
- `electron-store`: ^10.0.0 (if needed)

## Migration Strategy

1. **Phase 1**: Create utility modules ✅
2. **Phase 2**: Update BookParser services ✅
3. **Phase 3**: Update Translation/Storage services ✅
4. **Phase 4**: Update Import/Export services (IN PROGRESS)
5. **Phase 5**: Update DatabaseService with better-sqlite3 (TODO)
6. **Phase 6**: Update Image services (TODO)
7. **Phase 7**: Remove React Native dependencies from package.json (TODO)
8. **Phase 8**: Update test files (TODO)

## Notes

- The `packages/mobile` directory can remain as-is for now (it's not used in Electron)
- All Electron-specific code should be in utility modules for reusability
- DatabaseService migration is the most critical and complex change
- Some services may need platform-specific implementations

## Testing

After migration:
1. Test book import
2. Test book reading
3. Test vocabulary saving
4. Test database operations
5. Test file system operations
6. Test settings persistence
