# Xenolexia — Plan for Remaining Features

This document compares **app goals** (README, PLAN.md) with the **current implementation** and outlines a plan to implement the remaining features using **free and open source** libraries and dictionaries.

---

## 1. Goals vs Current State

### 1.1 Core Reading (from README)

| Goal | Non-EPUB (MOBI/TXT) | EPUB (epub.js) | Gap |
|------|---------------------|----------------|-----|
| Word replacement (target-language words in text) | ✅ ChapterContentService + TranslationEngine | ❌ Raw content only | **EPUB: no word replacement** |
| Hover-to-reveal (show original word) | ✅ ReaderContent + TranslationPopup | ❌ No hover/popup | **EPUB: no hover-to-reveal** |
| Save to vocabulary from reader | ✅ TranslationPopup "Save to Vocabulary" | ❌ No popup | **EPUB: no save from reader** |
| Progress & bookmarking | ✅ readerStore, session persistence | ⚠️ Progress not synced for EPUB | Optional: persist EPUB location |

**Conclusion:** Word replacement, hover-to-reveal, and save-to-vocabulary work for MOBI/TXT but **not for EPUB**, because the EPUB path uses epub.js only and does not run content through the TranslationEngine or ReaderContent.

### 1.2 Language Engine

| Goal | Current | Gap |
|------|---------|-----|
| 28+ language pairs | TranslationAPIService (LibreTranslate, MyMemory, Lingva); FrequencyListService (FrequencyWords); WordMatcher seeded with en→el only | Other pairs rely on API + frequency lists; no bundled seeds for most pairs |
| Proficiency (CEFR) | ✅ WordReplacer + frequency ranks | — |
| Word density | ✅ Settings, readerStore | — |
| Frequency-based selection | ✅ FrequencyListService (open corpus), WordDatabase | — |
| Offline-friendly | DynamicWordDatabase caches; WordMatcher fallback (en→el) | More language pairs need offline-capable word lists |

**Conclusion:** Engine is in place; gaps are (1) EPUB not using it, and (2) expanding offline/bundled or FOSS word lists for more language pairs.

### 1.3 Statistics

| Goal | Current | Gap |
|------|---------|-----|
| Session & reading stats | ✅ SessionRepository, getStatistics(), streak, today/all-time | — |
| “Reading over time” chart | UI shows last 7 days | **Chart uses only `wordsRevealedToday` for today and 0 for past days** — no per-day query |
| Insights (most active day, favorite time, etc.) | Placeholder text ("Monday", "Evening", "+42") | **Not computed from real data** |

**Conclusion:** Stats are persisted and aggregated; the chart and Insights need to be wired to real per-day data and simple analytics.

### 1.4 Vocabulary & Review

| Goal | Current | Gap |
|------|---------|-----|
| Save words from reader | ✅ Non-EPUB popup | EPUB: no popup |
| Spaced repetition (SM-2) | ✅ VocabularyRepository, getDueForReview | — |
| Review (flashcards) | ✅ ReviewScreen, SM-2 grading | — |
| Vocabulary screen | ✅ List, search, filter, edit, delete, detail modal | — |

**Conclusion:** Vocabulary and review are implemented; only EPUB path is missing “save from reader”.

### 1.5 Library, Settings, Export

| Goal | Current | Gap |
|------|---------|-----|
| Import (EPUB, MOBI, TXT) | ✅ | — |
| Discover (Gutenberg, etc.) | ✅ BookDownloadService | — |
| Library view | ✅ | — |
| Settings (theme, font, language pair, proficiency, density) | ✅ | — |
| Export (JSON/CSV/Anki) | ✅ REMAINING_TASKS says done | Verify and document |

---

## 2. Free/Open Source Stack (Current)

- **Translation APIs:** LibreTranslate, MyMemory, Lingva (all FOSS/free tier).
- **Frequency lists:** [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (CC/open); used in FrequencyListService.
- **Bundled data:** `words_en_el.ts` (en→el); format can be reused for other pairs.
- **Book parsing:** epub.js (BSD-2-Clause), @lingo-reader/mobi-parser (MIT).
- **Database:** SQLite (reading_sessions, vocabulary, preferences).

No proprietary or non-FOSS dependencies are required for the remaining features below.

---

## 3. Implementation Plan (Remaining Features)

### 3.1 EPUB: Word Replacement + Hover-to-Reveal + Save to Vocabulary (High)

**Problem:** For EPUB we use epub.js only; content is never run through TranslationEngine, so there is no word replacement, no hover, and no save from reader.

**Options:**

- **A. Post-process epub.js content (recommended)**  
  - Use epub.js `rendition.on('rendered', ...)` (or equivalent) to get the DOM for the current section.  
  - Extract text (e.g. `innerHTML` or serialized body), run it through **ChapterContentService.getChapterHtml** (or a shared pipeline: tokenize → replace words via TranslationEngine → inject markers).  
  - Write the processed HTML back into the iframe/document that epub.js uses, and inject the same **foreign-word** markers and styles as in ReaderContent.  
  - In the **renderer (Electron)**, attach hover/click listeners to `.foreign-word` inside the epub.js iframe (e.g. via `contentDocument` or message bridge) and show **TranslationPopup**; on “Save to Vocabulary” call the same `addWord` flow as non-EPUB.  
  - **Libraries:** Existing TranslationEngine, ChapterContentService, WordMatcher/DynamicWordDatabase; no new dictionary dependency.

- **B. Hybrid: list of “sections” from epub.js, render section text in React**  
  - Use epub.js for navigation/spine only; for each section, get text from epub.js, run through TranslationEngine in the main app, render the result in a React component (like ReaderContent).  
  - More control and consistency with MOBI/TXT, but more work to keep “book feel” (pagination, layout).

**Recommendation:** Start with **A**: one shared “process HTML + attach hover/popup” path for both iframe (EPUB) and non-EPUB, reusing TranslationEngine and existing popup/save logic.

**Concrete steps:**

1. Add a small **content pipeline** in shared: “raw HTML string → TranslationEngine (with book’s language/proficiency/density) → HTML with `.foreign-word` spans” (reuse existing tokenize/replace/marker logic from ChapterContentService/TranslationEngine).
2. In **EpubJsReader**: on `rendition.on('rendered')`, get current section HTML, run through this pipeline (in worker or main thread to avoid blocking UI), then replace iframe body (or injected div) with processed HTML and inject styles.
3. In **desktop**: add a small **bridge** (e.g. postMessage from iframe to parent) so that clicks/hovers on `.foreign-word` inside the epub iframe trigger the same handlers as ReaderContent (setSelectedWord, show TranslationPopup, recordWordRevealed, save to vocabulary).
4. Reuse **TranslationPopup** and **addWord** from ReaderScreen; ensure `book` and language pair come from the current book (already available in EpubJsReader props).

**Dictionaries:** No new ones. Use existing DynamicWordDatabase + TranslationAPIService + FrequencyListService; for en→el, WordMatcher fallback remains.

---

### 3.2 Statistics: Real “Reading Over Time” Chart (Medium)

**Problem:** The “Reading over time” chart shows “Words revealed per day” but only today has data; other days are 0 because the UI only uses `stats.wordsRevealedToday`.

**Solution:**

1. **SessionRepository:** Add a method that returns words revealed (and optionally words saved) per day for the last N days, e.g.  
   `getWordsRevealedByDay(days: number): Promise<Array<{ date: string; wordsRevealed: number; wordsSaved?: number }>>`  
   - Query: `SELECT date(started_at/1000,'unixepoch','localtime') as day, SUM(words_revealed) as words_revealed, SUM(words_saved) as words_saved FROM reading_sessions WHERE ended_at IS NOT NULL AND started_at >= ? GROUP BY day ORDER BY day`.
2. **statisticsStore:** Add state for “daily breakdown” (e.g. `wordsRevealedByDay`) and an action (e.g. `loadDailyStats()`) that calls `sessionRepository.getWordsRevealedByDay(7)` and stores the result.
3. **StatisticsScreen:** On load, call `loadDailyStats()`; for the “Reading over time” chart, map the last 7 days to the returned values (use 0 for missing days). Optionally show “Words revealed” as bar height and keep “Words saved” for a second series or tooltip.

**Libraries:** None; SQLite only.

---

### 3.3 Statistics: Insights from Real Data (Low)

**Problem:** “Most active day”, “Favorite reading time”, “Words learned this week” are hardcoded.

**Solution:**

1. **SessionRepository:**  
   - “Most active day”: query reading_sessions grouped by weekday (e.g. `strftime('%w', ...)`) and sum duration or words_revealed; take the weekday with the max.  
   - “Favorite reading time”: group by hour (e.g. `strftime('%H', ...)`); return the hour (or range) with the max duration.  
   - “Words learned this week”: sum vocabulary added in the last 7 days (if vocabulary table has `added_at`) or use session `words_saved` for the last 7 days.
2. **statisticsStore:** Add fields and loaders for these (e.g. `mostActiveDay`, `favoriteReadingHour`, `wordsLearnedThisWeek`).
3. **StatisticsScreen:** Replace placeholders with these values; if no data, show “—” or “Not enough data yet”.

**Libraries:** None.

---

### 3.4 Dictionaries & Word Data (Medium — optional expansion)

**Current:**  
- Bundled: en→el only (`words_en_el.ts`).  
- DynamicWordDatabase: any pair via TranslationAPIService + FrequencyListService (FrequencyWords).  
- WordMatcher: en→el fallback when DB empty.

**Goal:** Support more language pairs with good offline behavior and FOSS data.

**Options:**

1. **Add more bundled seed lists** (same format as `words_en_el.ts`) for high-demand pairs (e.g. en→es, en→fr, en→de). Source words from:  
   - [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (word + frequency rank).  
   - For translations: use a one-time script that calls LibreTranslate/Lingva (or a FOSS bilingual list) and commit the generated `words_en_XX.ts` (or host the file and ship the app with a download step).  
   - License: keep to CC0/CC-BY or compatible (FrequencyWords is permissive).

2. **“Download dictionary” in Settings:**  
   - Let the user pick language pair; app fetches from a known FOSS URL (e.g. FrequencyWords + batch translate via LibreTranslate, or a pre-built JSON from your repo).  
   - Store in SQLite (same schema as current word tables) and use for offline lookups.

3. **Reuse existing services:**  
   - FrequencyListService already points to FrequencyWords for many languages.  
   - TranslationAPIService already caches; ensure DynamicWordDatabase fills the cache when online so offline works after first use.

**Recommendation:** Implement 3.1 (EPUB) first; then add one or two more bundled pairs (e.g. en→es, en→fr) and document how to add more. “Download dictionary” can be a later enhancement.

---

### 3.5 EPUB Progress Persistence (Low)

**Problem:** For EPUB we don’t persist or restore reading position (epub.js location); only non-EPUB path uses readerStore progress.

**Solution:**

1. When the user leaves the EPUB reader (or app closes), get current location from epub.js (e.g. `rendition.currentLocation()` or equivalent) and save to the book’s `currentLocation` (or equivalent field in library/preferences).
2. On open, if `book.currentLocation` exists, call `rendition.display(book.currentLocation)` (or the epub.js API that restores position).
3. Persist in the same place as non-EPUB progress (e.g. library store or preferences per book).

**Libraries:** None; epub.js API only.

---

## 4. Priority Order

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | EPUB: word replacement + hover + save to vocabulary | High | High — core learning experience for EPUB |
| 2 | Statistics: real “reading over time” chart (words revealed by day) | Low | Medium |
| 3 | Statistics: Insights from real data | Low | Low |
| 4 | More FOSS/bundled word lists (1–2 extra pairs) | Medium | Medium |
| 5 | EPUB progress persistence | Low | Low |

---

## 5. Summary

- **Word replacement and hover-to-reveal** are implemented for MOBI/TXT only. For **EPUB**, the plan is to post-process epub.js content with the existing TranslationEngine, inject the same `.foreign-word` markers, and wire hover/click in the iframe to the existing TranslationPopup and save-to-vocabulary flow (using only current FOSS stack).
- **Statistics** need the chart wired to a new per-day query (`getWordsRevealedByDay`) and Insights computed from sessions/vocabulary instead of placeholders.
- **Dictionaries** remain FOSS (LibreTranslate, MyMemory, Lingva, FrequencyWords); optional expansion is more bundled or downloadable FOSS word lists for more language pairs.

All of the above can be implemented with the **existing** free and open source libraries and data sources; no new proprietary or paid dependencies are required.
