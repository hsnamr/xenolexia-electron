# Platform Configuration Status

## Overview

This project is configured to produce native apps for all target platforms:

- ✅ **Android** - React Native (APK)
- ✅ **iOS** - React Native (.app via Xcode)
- ✅ **Windows** - Electron (.exe installer + portable)
- ✅ **macOS** - Electron (.app bundle + DMG)
- ✅ **Linux** - Electron (.AppImage)

## Platform Details

### Mobile Platforms (React Native Native)

#### Android ✅
- **Technology**: React Native
- **Build Command**: `npm run android` or `npm run build:android`
- **Output**: APK file
- **Location**: `android/app/build/outputs/apk/`
- **Status**: Fully configured and ready

#### iOS ✅
- **Technology**: React Native
- **Build Command**: `npm run ios` or `npm run build:ios`
- **Output**: .app bundle (via Xcode)
- **Location**: `ios/build/` (or via Xcode)
- **Status**: Fully configured and ready
- **Note**: Requires macOS and Xcode to build

### Desktop Platforms (Electron)

All desktop platforms use Electron to package the React Native Web build.

#### Windows ✅
- **Technology**: Electron
- **Build Command**: `npm run build:windows` or `npm run electron:build:win`
- **Output**: 
  - `Xenolexia Setup 0.1.0.exe` (NSIS installer)
  - `Xenolexia-0.1.0-win.zip` (portable executable)
- **Location**: `release/`
- **Status**: Fully configured
- **Note**: Can build on Windows, macOS, or Linux

#### macOS ✅
- **Technology**: Electron
- **Build Command**: `npm run build:macos` or `npm run electron:build:mac`
- **Output**: 
  - `Xenolexia.app` (application bundle in `release/mac/`)
  - `Xenolexia-0.1.0.dmg` (disk image installer)
- **Location**: `release/` and `release/mac/`
- **Status**: Fully configured
- **Note**: Can build on macOS, Linux, or Windows (with macOS SDK)

#### Linux ✅
- **Technology**: Electron
- **Build Command**: `npm run build:linux` or `npm run electron:build:linux`
- **Output Formats**:
  - `Xenolexia-0.1.0.AppImage` - AppImage (portable, all distributions)
  - `xenolexia_0.1.0_amd64.deb` - Debian/Ubuntu package
  - `xenolexia-0.1.0.x86_64.rpm` - RedHat/Fedora package
  - `xenolexia-0.1.0.pacman` - Arch Linux package
  - `xenolexia-0.1.0.tar.gz` - Tarball (portable)
- **Individual Format Commands**:
  - `npm run build:linux:deb` - Debian/Ubuntu only
  - `npm run build:linux:rpm` - RedHat/Fedora only
  - `npm run build:linux:arch` - Arch Linux only
  - `npm run build:linux:tarball` - Tarball only
- **Location**: `release/`
- **Status**: Fully configured and tested
- **Note**: Can build on any platform

## Build Scripts

### Mobile (React Native)
```bash
npm run android      # Build and run Android app
npm run ios          # Build and run iOS app
npm run build:android # Build Android APK
npm run build:ios    # Build iOS app
```

### Desktop (Electron)
```bash
# Individual platforms
npm run build:windows  # Build Windows .exe
npm run build:macos    # Build macOS .app + DMG
npm run build:linux    # Build Linux AppImage

# Or use electron commands directly
npm run electron:build:win   # Windows
npm run electron:build:mac   # macOS
npm run electron:build:linux # Linux
npm run electron:build       # Current platform
```

### Development
```bash
# Start Metro bundler
npm start

# Run Electron in dev mode
npm run electron:dev

# Run web dev server (for Electron testing)
npm run web
```

## Configuration Files

### Electron Configuration
- **Main Process**: `electron/main.js`
- **Preload Script**: `electron/preload.js`
- **Builder Config**: `package.json` → `"build"` section
- **Webpack Config**: `webpack.config.js` (handles Electron publicPath)

### React Native Configuration
- **Android**: `android/` directory
- **iOS**: `ios/` directory (requires Xcode project setup)
- **Metro Config**: `metro.config.js`

## Output Locations

All built applications are placed in the `release/` directory:

```
release/
├── Xenolexia-0.1.0.AppImage          # Linux
├── Xenolexia Setup 0.1.0.exe         # Windows installer
├── Xenolexia-0.1.0-win.zip           # Windows portable
├── Xenolexia-0.1.0.dmg                # macOS installer
└── mac/
    └── Xenolexia.app                  # macOS app bundle
```

## Prerequisites

### For All Platforms
- Node.js 18+
- npm or yarn

### For Mobile Builds
- **Android**: Android Studio, Android SDK 34+, Java Development Kit
- **iOS**: macOS, Xcode 15+, CocoaPods

### For Desktop Builds
- **Windows**: Can build on any OS (requires Windows SDK for native features)
- **macOS**: Can build on macOS or Linux (requires macOS SDK for signing)
- **Linux**: Can build on any OS

## Notes

1. **React Native for Windows/macOS**: The packages (`react-native-windows`, `react-native-macos`) are installed but **not used** for production builds. All desktop platforms use Electron instead.

2. **Web Build**: The web build (`npm run web:build`) is used as the foundation for all Electron desktop apps.

3. **Electron publicPath**: The webpack configuration automatically uses relative paths (`./`) when building for Electron to ensure assets load correctly with the `file://` protocol.

4. **Platform-Specific Features**: All native module mocks (for `react-native-fs`, `react-native-document-picker`, etc.) work correctly in Electron builds.

## Verification

To verify the configuration:

1. **Android**: `npm run android` → Should build and launch on Android device/emulator
2. **iOS**: `npm run ios` → Should build and launch on iOS simulator/device (macOS only)
3. **Windows**: `npm run build:windows` → Should produce `.exe` files in `release/`
4. **macOS**: `npm run build:macos` → Should produce `.app` and `.dmg` in `release/`
5. **Linux**: `npm run build:linux` → Should produce `.AppImage` in `release/`

## Status Summary

| Platform | Technology | Output Format | Status |
|----------|-----------|---------------|--------|
| Android | React Native | APK | ✅ Ready |
| iOS | React Native | .app | ✅ Ready |
| Windows | Electron | .exe | ✅ Configured |
| macOS | Electron | .app + DMG | ✅ Configured |
| Linux | Electron | AppImage, DEB, RPM, Arch, Tarball | ✅ Configured & Tested |
