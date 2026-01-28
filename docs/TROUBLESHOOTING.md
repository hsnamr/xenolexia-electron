# Troubleshooting Guide

Common issues and solutions for Xenolexia development and usage.

---

## Development Issues

### Build Errors

#### "Unable to resolve module" errors

**Problem:** Metro bundler can't find modules.

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or delete all caches
rm -rf node_modules
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
npm install
```

#### iOS Pod install fails

**Problem:** CocoaPods installation errors.

**Solution:**
```bash
cd ios
pod deintegrate
pod cache clean --all
pod install
```

#### Android Gradle build fails

**Problem:** Gradle build errors.

**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

---

### Runtime Errors

#### "Cannot read property of undefined" in stores

**Problem:** Zustand store not initialized.

**Solution:** Ensure stores are imported before use:
```typescript
import { useLibraryStore } from '@stores/libraryStore';
// Not: import { libraryStore } from '@stores';
```

#### SQLite database errors

**Problem:** Database initialization fails.

**Solution:**
1. Check `react-native-sqlite-storage` is linked
2. For iOS, ensure pod is installed
3. For Android, check gradle includes the module

```bash
# iOS
cd ios && pod install

# Android - verify in android/app/build.gradle:
implementation project(':react-native-sqlite-storage')
```

#### WebView not rendering EPUB

**Problem:** EPUB content doesn't display.

**Solution:**
1. Check EPUB file is valid
2. Verify `react-native-webview` is linked
3. Check console for JavaScript errors in WebView

---

### Testing Issues

#### Jest tests fail with module errors

**Problem:** Path aliases not resolved in tests.

**Solution:** Ensure `jest.config.js` has correct `moduleNameMapper`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@components/(.*)$': '<rootDir>/src/components/$1',
  // ... other aliases
},
```

#### React Native component mocks missing

**Problem:** Tests fail due to native module mocks.

**Solution:** Add mock to `jest.setup.js`:
```javascript
jest.mock('react-native-module-name', () => ({
  // mock implementation
}));
```

---

## User-Facing Issues

### Book Import

#### "Failed to import book"

**Causes:**
1. File is not a valid EPUB
2. EPUB is encrypted/DRM protected
3. File permissions issue

**Solutions:**
1. Try a different EPUB file
2. Ensure EPUB is DRM-free
3. Check app has storage permissions

#### Book cover not showing

**Causes:**
1. EPUB doesn't contain cover image
2. Cover extraction failed
3. Image cache corrupted

**Solutions:**
1. The book may not have embedded cover art
2. Try re-importing the book
3. Clear app cache in Settings → Data Management

---

### Reader

#### Foreign words not appearing

**Causes:**
1. Proficiency level too high
2. Target language same as source
3. Word density set to 0%

**Solutions:**
1. Lower proficiency level in Settings
2. Select a different target language
3. Increase word density in Reader Settings

#### Tap on word not responding

**Causes:**
1. WebView JavaScript not loaded
2. Word not marked as foreign
3. Popup blocked by gesture handler

**Solutions:**
1. Wait for page to fully load
2. Check if word is colored/underlined
3. Try tapping directly on the word center

#### Reader performance slow

**Causes:**
1. Chapter too large
2. Too many foreign words
3. Low device memory

**Solutions:**
1. This is expected for very long chapters
2. Reduce word density
3. Close other apps

---

### Vocabulary

#### Words not saving

**Causes:**
1. Database write failed
2. Duplicate word exists
3. Storage full

**Solutions:**
1. Restart the app
2. Check if word already in vocabulary
3. Free up device storage

#### Review not showing due words

**Causes:**
1. No words due for review
2. Filter hiding words
3. Database sync issue

**Solutions:**
1. Check "Due Today" count in stats
2. Clear all filters
3. Pull to refresh vocabulary list

---

### Performance

#### App launches slowly

**Causes:**
1. Large book library
2. Database optimization needed
3. Too much cached data

**Solutions:**
1. This may be normal with many books
2. The app optimizes on subsequent launches
3. Clear cache in Settings

#### High battery usage

**Causes:**
1. Background processes
2. Translation API calls
3. Screen always on while reading

**Solutions:**
1. App should not run in background
2. Translations are cached after first lookup
3. Adjust auto-lock settings on device

---

## Platform-Specific Issues

### iOS

#### App crashes on launch

**Solution:**
1. Update to latest iOS version
2. Reinstall the app
3. Free up device storage

#### Document picker not showing

**Solution:**
1. Check Files app has EPUB files
2. Allow "All Files" in picker
3. Check app permissions in Settings

### Android

#### Permission denied errors

**Solution:**
1. Go to Settings → Apps → Xenolexia → Permissions
2. Enable Storage permission
3. On Android 11+, grant "All files access"

#### App not installing

**Solution:**
1. Enable "Install from unknown sources" (if sideloading)
2. Check device has sufficient storage
3. Uninstall old version first

---

## Data Recovery

### Export vocabulary backup

```
Settings → Data Management → Export All Data
```

This creates a JSON file with:
- All vocabulary items
- Book metadata
- User preferences

### Import backup

```
Settings → Data Management → Import Data
```

Select your exported JSON file to restore.

---

## Getting Help

If your issue isn't listed here:

1. **Check GitHub Issues:** [github.com/xenolexia/xenolexia-react/issues](https://github.com/xenolexia/xenolexia-react/issues)
2. **Search Discussions:** [github.com/xenolexia/xenolexia-react/discussions](https://github.com/xenolexia/xenolexia-react/discussions)
3. **Contact Support:** support@xenolexia.app

When reporting issues, please include:
- Device model and OS version
- App version
- Steps to reproduce
- Error messages (if any)
- Screenshots (if applicable)
