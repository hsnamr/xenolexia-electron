# Dependency Resolution Fix

## Issue
Peer dependency conflicts between:
- `react@18.2.0` (required by React Native 0.74.3)
- `react-dom@18.3.1` (requires `react@^18.3.1`)
- `react-native-macos@0.74.37` (requires `react-native@0.74.7`)

## Solution

1. **React Version**: Keep at `18.2.0` for React Native compatibility
2. **React DOM Version**: Set to `18.2.0` to match React
3. **Removed Unused Dependencies**: 
   - Removed `react-native-macos` (using Electron for desktop)
   - Removed `react-native-windows` (using Electron for desktop)

## Updated Versions

### Root package.json
- `react: "18.2.0"`
- `react-dom: "18.2.0"`

### packages/mobile/package.json
- `react: "18.2.0"`

### packages/desktop/package.json
- `react: "18.2.0"`
- `react-dom: "18.2.0"`

### packages/shared/package.json
- `peerDependencies.react: "^18.2.0"`

## Installation

If you encounter peer dependency warnings, use:
```bash
npm install --legacy-peer-deps
```

This is safe because:
- React Native requires exact React 18.2.0
- React DOM 18.2.0 is compatible with React 18.2.0
- The monorepo structure allows different packages to have their own dependencies
