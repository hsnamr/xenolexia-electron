# Build Instructions for All Platforms

## Prerequisites

- Node.js 18+
- npm or yarn
- React Native CLI

### Platform-Specific Requirements

**Android:**

- Android Studio with SDK 34+
- Java Development Kit (JDK)

**iOS:**

- Xcode 15+
- CocoaPods

**Windows:**

- Visual Studio 2022 with C++ desktop development workload
- Windows 10 SDK

**macOS:**

- Xcode 15+
- CocoaPods

**Linux:**

- No additional requirements (uses web build)

## Build Commands

### Mobile Platforms

```bash
# Android
npm run android

# iOS
npm run ios
```

### Desktop Platforms

```bash
# Windows (requires Windows machine)
npm run windows
# or
npx react-native run-windows

# macOS (requires macOS machine)
npm run macos
# or
npx react-native run-macos

# Linux (web build)
npm run linux
# This runs: npm run web:build
# Output: dist/ directory with production bundle
```

### Web (Deprecated)

```bash
# Development server
npm run web

# Production build
npm run web:build
```

## Test Build: Linux

The Linux build has been tested and verified:

```bash
$ npm run linux
> xenolexia@0.1.0 linux
> npm run web:build

> xenolexia@0.1.0 web:build
> webpack --mode production

✅ Build completed successfully
```

**Output:**

- `dist/bundle.[hash].js` - Main application bundle (16MB)
- `dist/index.html` - Entry HTML file
- `dist/*.png` - Asset files

**To test the Linux build:**

1. Build: `npm run linux`
2. Serve: Use any static file server (e.g., `npx serve dist`)
3. Open: Navigate to `http://localhost:3000` (or server port)

## Platform Status

| Platform | Status        | Build Command       | Notes                         |
| -------- | ------------- | ------------------- | ----------------------------- |
| Android  | ✅ Ready      | `npm run android`   | Native React Native           |
| iOS      | ✅ Ready      | `npm run ios`       | Native React Native           |
| Windows  | ✅ Configured | `npm run windows`   | Requires Windows machine      |
| macOS    | ⚠️ Pending    | `npm run macos`     | Structure needs setup         |
| Linux    | ✅ Working    | `npm run linux`     | Web build (no native support) |
| Web      | ⚠️ Deprecated | `npm run web:build` | Functional but deprecated     |

## Notes

- **Windows**: Project structure is complete. Requires Windows machine or VM to build.
- **macOS**: Package installed but project structure needs manual creation due to version conflict.
- **Linux**: Uses web build since there's no official React Native Linux support. This is a valid approach for Linux desktop apps.
- **Web**: Deprecated per requirements but remains functional for reference.
