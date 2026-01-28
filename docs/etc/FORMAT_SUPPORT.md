# Ebook Format Support

## Supported Formats

Xenolexia now supports **4 ebook formats**:

### ✅ EPUB (Electronic Publication)
- **Status**: Fully supported
- **Parser**: `EPUBParser` using `epubjs` library
- **Features**: 
  - Full metadata extraction (title, author, description, cover)
  - Table of contents (NCX for EPUB 2, NAV for EPUB 3)
  - Chapter navigation
  - Image support
  - CSS styling

### ✅ TXT (Plain Text)
- **Status**: Fully supported
- **Parser**: `TXTParser` (simple text file parser)
- **Features**:
  - Automatic chapter splitting (by double newlines or page breaks)
  - Word count calculation
  - Basic search functionality

### ✅ FB2 (FictionBook 2.0)
- **Status**: Fully supported
- **Parser**: `FB2Parser` (XML-based parser using DOMParser)
- **Features**:
  - XML-based format parsing
  - Metadata extraction (title, author, description, language)
  - Section-based chapter extraction
  - Table of contents support
- **Requirements**: DOMParser (available in browsers and Electron)

### ✅ MOBI (Mobipocket / Kindle)
- **Status**: Fully supported
- **Parser**: `MOBIParser` using `@lingo-reader/mobi-parser` library
- **Features**:
  - MOBI and KF8 (Kindle Format 8 / AZW3) support
  - Full metadata extraction
  - Chapter extraction from spine
  - Table of contents support
  - Image and CSS support
- **Library**: `@lingo-reader/mobi-parser` v0.4.5

## Format Detection

The `BookParserService` automatically detects the format from file extension:

- `.epub` → EPUB
- `.txt` → TXT
- `.fb2` → FB2
- `.mobi`, `.azw`, `.azw3` → MOBI

## Usage

All parsers implement the `IBookParser` interface:

```typescript
import { BookParserService } from '@xenolexia/shared/services';

// Parse any supported format
const parsedBook = await BookParserService.parse(filePath, format);

// Or let the service detect the format
const format = BookParserService.detectFormat(filePath);
const parsedBook = await BookParserService.parse(filePath, format);
```

## Platform Support

All formats work on:
- ✅ **Mobile (React Native)**: Android and iOS
- ✅ **Desktop (Electron)**: Linux, macOS, Windows

## Implementation Details

### FB2 Parser
- Uses native `DOMParser` for XML parsing
- Extracts content from `<body><section>` structure
- Handles nested sections and paragraphs
- Falls back gracefully if structure is non-standard

### MOBI Parser
- Uses `@lingo-reader/mobi-parser` library
- Supports both MOBI and KF8 formats
- Processes HTML content with CSS
- Handles blob URLs for images and resources
- Properly disposes resources to prevent memory leaks

## Future Enhancements

Potential additions:
- PDF support (would require PDF.js or similar)
- CBZ/CBR (comic book formats)
- RTF (Rich Text Format)

## Notes

- All parsers handle errors gracefully and provide fallback content
- File reading uses `react-native-fs` on mobile and appropriate APIs on desktop
- All parsers implement proper resource cleanup via `dispose()` method
