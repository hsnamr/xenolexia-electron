# Electron Desktop Builds

Xenolexia uses Electron to package the React Native Web version for desktop platforms.

## Build Commands

### Linux (Multiple Formats)

#### All Formats (AppImage, DEB, RPM, Arch, Tarball)

```bash
npm run linux
# or
npm run electron:build:linux
```

This will create all Linux package formats:
- `Xenolexia-0.1.0.AppImage` - AppImage (portable)
- `xenolexia_0.1.0_amd64.deb` - Debian/Ubuntu package
- `xenolexia-0.1.0.x86_64.rpm` - RedHat/Fedora package
- `xenolexia-0.1.0.pacman` - Arch Linux package
- `xenolexia-0.1.0.tar.gz` - Tarball (portable)

#### Individual Formats

```bash
# Debian/Ubuntu (.deb)
npm run build:linux:deb

# RedHat/Fedora (.rpm)
npm run build:linux:rpm

# Arch Linux (.pacman)
npm run build:linux:arch

# Tarball (.tar.gz)
npm run build:linux:tarball
```

**Output Location**: `release/` directory

### macOS (DMG)

```bash
npm run electron:build:mac
```

**Output**: `release/Xenolexia-0.1.0.dmg`

### Windows (NSIS Installer + Portable)

```bash
npm run electron:build:win
```

**Output**:

- `release/Xenolexia Setup 0.1.0.exe` (installer)
- `release/Xenolexia-0.1.0-win.zip` (portable)

### All Platforms

```bash
npm run electron:build
```

Builds for the current platform.

## Running the AppImage

```bash
# Make executable (if needed)
chmod +x release/Xenolexia-0.1.0.AppImage

# Run
./release/Xenolexia-0.1.0.AppImage
```

## Development

To run Electron in development mode:

```bash
# Terminal 1: Start webpack dev server
npm run web

# Terminal 2: Start Electron
npm run electron:dev
```

## Project Structure

```
electron/
  ├── main.js      # Electron main process
  └── preload.js   # Preload script for secure IPC
```

## Configuration

Electron builder configuration is in `package.json` under the `"build"` field:

- App ID: `com.xenolexia.app`
- Product Name: `Xenolexia`
- Output: `release/` directory
- Linux: AppImage format
- macOS: DMG + ZIP
- Windows: NSIS installer + portable ZIP

## Linux Package Formats

### AppImage
- **Format**: Portable, self-contained executable
- **Installation**: None required - just make executable and run
- **Usage**: `chmod +x Xenolexia-0.1.0.AppImage && ./Xenolexia-0.1.0.AppImage`
- **Best for**: Users who want a portable app without installation

### DEB (Debian/Ubuntu)
- **Format**: `.deb` package
- **Installation**: `sudo dpkg -i xenolexia_0.1.0_amd64.deb` or `sudo apt install ./xenolexia_0.1.0_amd64.deb`
- **Best for**: Debian, Ubuntu, and derivatives

### RPM (RedHat/Fedora)
- **Format**: `.rpm` package
- **Installation**: `sudo rpm -i xenolexia-0.1.0.x86_64.rpm` or `sudo dnf install ./xenolexia-0.1.0.x86_64.rpm`
- **Best for**: RedHat, Fedora, CentOS, and derivatives

### Arch Linux (Pacman)
- **Format**: `.pkg.tar.xz` package
- **Installation**: `sudo pacman -U xenolexia-0.1.0.pacman`
- **Best for**: Arch Linux and derivatives

### Tarball
- **Format**: `.tar.gz` archive
- **Installation**: Extract and run - `tar -xzf xenolexia-0.1.0.tar.gz && ./xenolexia/xenolexia`
- **Best for**: Users who want maximum portability and manual control

## Notes

- All Linux packages are self-contained and include the Electron runtime
- File size: ~300MB per package (includes Electron runtime + app bundle)
- All native module mocks from web build work in Electron
- The AppImage is the most portable option (works on any Linux distribution)
- DEB and RPM packages integrate with system package managers
