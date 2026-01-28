# Changelog

All notable changes to Xenolexia will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Custom book collections
- Additional language dictionaries
- Cloud backup and sync
- Widget for daily vocabulary

---

## [1.0.0] - 2026-01-21

### 🎉 Initial Release

This is the first public release of Xenolexia!

### Added

#### Library & Book Import
- Import EPUB ebooks from device storage
- Support for multiple ebook formats (EPUB primary)
- Book metadata extraction (title, author, cover, TOC)
- Grid and list view for book library
- Book search and filtering
- Sort by title, author, date, progress
- Book detail screen with statistics
- Delete and manage books

#### Reader
- WebView-based EPUB rendering
- Foreign word replacement with proficiency levels
- Tap-to-reveal word translations
- Customizable reader settings:
  - 5 font options (serif, sans-serif, monospace)
  - Font size (12-32pt)
  - Line height (1.0-2.5x)
  - Margins (8-56px)
  - Light, Dark, Sepia themes
- Chapter navigation
- Reading progress tracking
- Automatic position saving

#### Translation Engine
- Support for 28+ languages
- Multi-provider translation API:
  - LibreTranslate
  - MyMemory
  - Lingva Translate
- Word frequency-based proficiency levels
- Intelligent word selection algorithm
- Context-aware word replacement
- Protected content detection (quotes, names)

#### Vocabulary Management
- Save words from reader
- Context sentence storage
- Filter by status (new, learning, review, learned)
- Search vocabulary
- Edit and delete words
- Export to CSV, Anki, JSON

#### Spaced Repetition Review
- SM-2 algorithm implementation
- Flashcard review interface
- Self-grading (Again, Hard, Good, Easy)
- Session progress tracking
- Review statistics

#### Statistics & Progress
- Reading time tracking
- Words revealed/saved counts
- Learning streaks
- Daily goals

#### Settings & Onboarding
- 6-step onboarding flow
- Language pair selection
- Proficiency level selection
- Word density preferences
- Notification settings
- Data management (export, clear)

#### UI/UX
- Modern, clean design
- Light and dark themes
- Smooth animations
- Error boundaries
- Loading states
- Empty states

### Technical
- React Native with TypeScript
- Zustand state management
- SQLite local database
- Jest testing framework
- ESLint + Prettier code quality
- Husky pre-commit hooks

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2026-01-21 | Initial release with full feature set |

---

## Upgrade Notes

### From Beta to 1.0.0
If you were using the beta version:
- Your books and vocabulary will be preserved
- Settings may need to be reconfigured
- Backup your vocabulary export before updating

---

## Future Roadmap

### 1.1.0 (Planned)
- Custom word lists import
- Book collections/folders
- Improved Asian language support
- Reading goals and reminders

### 1.2.0 (Planned)
- Cloud backup (optional)
- Cross-device sync
- Social features (share progress)
- More ebook format support

### 2.0.0 (Planned)
- Audio pronunciation
- Sentence-level translations
- AI-powered difficulty adjustment
- Community word lists
