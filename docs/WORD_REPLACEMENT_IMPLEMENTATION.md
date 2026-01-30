# Word Replacement (Language Learning) — How It Works and Alternatives

This document explains how **word replacement** (showing target-language words in the text) is implemented and why it might not be working in your environment. It also suggests alternative approaches.

---

## 1. Current Implementation Overview

Word replacement has **two code paths**:

| Path | When | Where it runs | How content is processed |
|------|------|----------------|--------------------------|
| **Non-EPUB (TXT, MOBI)** | User opens a book; reader store loads chapters | **Renderer** | `ChapterContentService.getChapterHtml()` receives chapter HTML and `translationOptions`; calls `TranslationEngine.processContent(html)`; returns HTML with `<span class="foreign-word">` markers. That HTML is rendered in `ReaderContent`. |
| **EPUB** | User opens an EPUB; epub.js renders each section in an iframe | **Renderer** | On epub.js `rendered` event we get the iframe `document`, read `doc.body.innerHTML`, call `TranslationEngine.processContent(rawHtml)` in the renderer, then set `doc.body.innerHTML = processed.content` and attach hover/click listeners. |

So in **both** paths:

1. **TranslationEngine.processContent(html)** is called (in the **renderer process**).
2. It uses:
   - **Tokenizer** — splits HTML into tokens (words + tags), keeps positions.
   - **DynamicWordDatabase.lookupWords(words, sourceLang, targetLang)** — gets translations.
   - **WordReplacer.replace(html, tokens, wordEntries)** — selects words by density/proficiency and replaces them with `<span class="foreign-word" data-original="..." data-word-id="...">translated</span>`.

If **no words are ever replaced**, the failure is almost certainly in the **translation lookup** step: `DynamicWordDatabase.lookupWords` returns no (or very few) entries.

---

## 2. Translation Lookup — Where Translations Come From

`DynamicWordDatabase` (used by `TranslationEngine`) gets translations in this order:

1. **Memory cache** (in-process, per session).
2. **Persistent DB (LowDB)** — `word_list` in `xenolexia.json`. Populated when we successfully translate via API and cache.
3. **Translation API** — `TranslationAPIService.translateBulk(words, source, target)`:
   - Calls **LibreTranslate**, then **MyMemory**, then **Lingva** (first successful provider wins).
   - Uses **fetch()** from the **renderer** to hit public URLs (e.g. `https://libretranslate.com/translate`).

So:

- **First time** a word is seen: renderer → `fetch()` to LibreTranslate/MyMemory/Lingva → response → create `WordEntry` → cache in memory and (via IPC) in main process LowDB.
- **Next time**: served from cache or DB, no API call.

If **replacements are always zero**, likely causes:

1. **fetch() from the renderer fails**  
   - Electron renderer can block external requests (CSP, `webSecurity`, or no network).  
   - No error may be shown; `translateBulk` just returns empty/failed and no entries are produced.

2. **API limits / errors**  
   - LibreTranslate/MyMemory/Lingva can rate-limit or return errors; failed words get no entry.

3. **EPUB-specific**  
   - `rendered` event not firing, or `doc`/`view.contents.document` being null, so we never call `processContent` for that section.

4. **Book settings**  
   - Wrong or missing `languagePair` / `wordDensity` / `proficiencyLevel` so options are invalid or replacement is skipped.

---

## 3. Why Running in the Renderer Is Fragile

- **Network**: Renderer is a browser context; external `fetch()` can be blocked by CSP, `webSecurity`, or environment.
- **No visible errors**: API failures often only result in “0 replacements” and a console warning.
- **EPUB**: Depends on epub.js lifecycle and iframe document access; one wrong step and that section is never processed.

So the **design** (tokenize → lookup → replace) is fine; the **environment** (renderer + external API) is where things break.

---

## 4. Alternative Approaches

### Option A: Move translation to the main process (recommended) — **implemented**

- **Idea**: Renderer never calls translation APIs. It asks the main process for “translations for these words” via IPC.
- **Current implementation**: When `window.electronAPI.translateBulk` exists (Electron renderer), `DynamicWordDatabase.lookupWords` uses it instead of `TranslationAPIService.translateBulk`. Main process handles `translation:translateBulk` IPC by calling LibreTranslate (and a mirror) with Node’s `fetch`, then returns `{ translations, provider, failed }`. So translation API calls run in the main process and no longer depend on renderer fetch or CSP.
- **Flow**:
  1. Renderer: `TranslationEngine.processContent(html)` → tokenize, get `uniqueWords`.
  2. Renderer → IPC → Main: “lookupWords(words, sourceLang, targetLang)”.
  3. Main: uses a **Node** HTTP client (e.g. `axios` or `node-fetch`) to call LibreTranslate/MyMemory/Lingva (no browser CSP), then caches in LowDB and returns `Map<word, WordEntry>`.
  4. Renderer: receives map, runs `WordReplacer.replace(html, tokens, wordEntries)` and uses the result (same as now).
- **Pros**: No renderer `fetch()`; main process has normal Node network access; easier to log and debug.
- **Cons**: Need to expose a “lookupWords” (or “processContent”) IPC handler and optionally move `TranslationEngine` (or at least the API call + cache) into the main process or a main-process service.

### Option B: Pre-fill word list (offline-first)

- **Idea**: Ship or install a **word list** (e.g. en→es, en→fr) so most common words don’t need the API.
- **Flow**: Same as now, but `DynamicWordDatabase.lookupFromDatabase` finds most words in the preloaded list; API is only for missing words.
- **Pros**: Works offline for common vocabulary; fewer API calls; no dependency on renderer network.
- **Cons**: Need to source and maintain word lists per language pair (e.g. from FrequencyWords or other FOSS lists).

### Option C: Hybrid (main process API + optional word lists)

- **Idea**: Main process does all translation API calls (Option A). Optionally add preloaded word lists (Option B) for popular pairs.
- **Flow**: Same as Option A, with a first lookup against a static/bundled list in main; on miss, call API and cache.
- **Pros**: Best of both: offline where possible, reliable API where needed.
- **Cons**: More implementation work.

### Option D: Keep current design but harden and debug

- **Idea**: Keep translation in the renderer but make it observable and more robust.
- **Actions**:
  - In **Electron**: Allow renderer to load external translation APIs (e.g. relax CSP or use a dedicated webview/preload that is allowed to fetch).
  - Add **logging**: e.g. “lookupWords called with N words”, “API returned M translations”, “replaced K words”. So you can see whether the failure is “no lookup”, “lookup returns 0”, or “replace returns 0”.
  - For **EPUB**: Log in the `rendered` handler (e.g. “doc present”, “processContent returned X replacements”). If X is always 0, the issue is lookup; if `rendered` never runs, the issue is epub.js integration.
- **Pros**: No big refactor; can confirm where the pipeline fails.
- **Cons**: Renderer `fetch()` may still be blocked in some deployments; fixing that might require CSP/webSecurity changes anyway.

---

## 5. Recommended Next Steps

1. **Confirm where it fails**  
   - Add logs (or use existing ones) in:  
     - `DynamicWordDatabase.lookupWords` (how many words, how many from cache/DB/API).  
     - `TranslationAPIService.translateBulk` (request/response or error).  
     - EPUB `rendered` handler (doc present? `processContent` result?).  
   - Then run the app and see: “0 from API” → network/API issue; “API ok but 0 replacements” → density/proficiency/options; “rendered never runs” → EPUB lifecycle.

2. **If the failure is renderer/network**  
   - Implement **Option A** (translation in main process via IPC) so word lookup and API calls happen in Node, then return results to the renderer for `WordReplacer.replace`. That keeps the current replacement logic and only moves the “where we call the API” part.

3. **Optional**  
   - Add **Option B** (bundled or installable word lists) for the language pairs you care about most, so replacement works even when the API is unavailable.

---

## 6. File Reference (current flow)

| File | Role |
|------|------|
| `packages/shared/src/services/TranslationEngine/TranslationEngine.ts` | `processContent()`: tokenize → lookupWords → replace. |
| `packages/shared/src/services/TranslationEngine/DynamicWordDatabase.ts` | lookupWords: cache → DB (IPC in renderer) → translationAPI.translateBulk(). |
| `packages/shared/src/services/TranslationEngine/TranslationAPIService.ts` | translateBulk(): fetch() to LibreTranslate/MyMemory/Lingva. |
| `packages/shared/src/services/TranslationEngine/WordReplacer.ts` | replace(): select words by density/proficiency, inject `<span class="foreign-word">`. |
| `packages/shared/src/services/BookParser/ChapterContentService.ts` | getChapterHtml(): for non-EPUB, calls TranslationEngine when translationOptions present. |
| `packages/desktop/src/components/EpubJsReader.tsx` | On `rendered`, gets iframe doc, calls processContent(), sets innerHTML and listeners. |
| `packages/desktop/src/services/DatabaseService.renderer.ts` | IPC stub: renderer DB calls go to main (including word_list cache). |

In the renderer, `databaseService` is this IPC stub. When running in Electron, translation API calls are made from the **main process** via IPC (`translation:translateBulk`); when not in Electron, `translationAPI` uses `fetch()` in the renderer.
