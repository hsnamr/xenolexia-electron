/**
 * EPUB reader using epub.js (BSD-2-Clause, GPL-compatible).
 * Uses the open-source epub.js library instead of custom parsing for EPUB.
 * Post-processes rendered content with TranslationEngine for language learning
 * (word replacement, hover-to-reveal, save to vocabulary).
 */

import React, {useEffect, useRef, useImperativeHandle, forwardRef, useCallback} from 'react';
import type {Book, ForeignWordData} from '@xenolexia/shared/types';
import {createTranslationEngine} from '@xenolexia/shared/services/TranslationEngine/TranslationEngine';
import {generateForeignWordStyles} from '@xenolexia/shared/services/TranslationEngine/InjectedScript';

// epub.js (BSD-2-Clause, GPL-compatible) - open-source EPUB renderer
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ePub = require('epubjs').default;

export interface EpubJsReaderHandle {
  goPrev: () => void;
  goNext: () => void;
  canGoPrev: () => boolean;
  canGoNext: () => boolean;
}

interface EpubJsReaderProps {
  book: Book;
  onLocationChange?: (current: number, total: number) => void;
  onWordClick?: (word: ForeignWordData) => void;
  onWordHover?: (word: ForeignWordData) => void;
  onWordHoverEnd?: () => void;
}

function buildForeignWordData(
  el: HTMLElement,
  sourceLanguage: string,
  targetLanguage: string
): ForeignWordData {
  return {
    originalWord: el.dataset.original ?? '',
    foreignWord: el.textContent ?? '',
    startIndex: 0,
    endIndex: 0,
    wordEntry: {
      id: el.dataset.wordId ?? '',
      sourceWord: el.dataset.original ?? '',
      targetWord: el.textContent ?? '',
      sourceLanguage,
      targetLanguage,
      proficiencyLevel: 'beginner',
      frequencyRank: 0,
      partOfSpeech: (el.dataset.pos as any) ?? 'other',
      variants: [],
      pronunciation: el.dataset.pronunciation ?? undefined,
    },
  };
}

export const EpubJsReader = forwardRef<EpubJsReaderHandle, EpubJsReaderProps>(
  function EpubJsReader({book, onLocationChange, onWordClick, onWordHover, onWordHoverEnd}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<{destroy: () => void} | null>(null);
    const renditionRef = useRef<{
      destroy: () => void;
      prev: () => Promise<unknown>;
      next: () => Promise<unknown>;
      display: (key?: string) => Promise<unknown>;
    } | null>(null);
    const blobUrlRef = useRef<string | null>(null);
    const onLocationChangeRef = useRef(onLocationChange);
    const onWordClickRef = useRef(onWordClick);
    const onWordHoverRef = useRef(onWordHover);
    const onWordHoverEndRef = useRef(onWordHoverEnd);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoveredElementRef = useRef<HTMLElement | null>(null);
    onLocationChangeRef.current = onLocationChange;
    onWordClickRef.current = onWordClick;
    onWordHoverRef.current = onWordHover;
    onWordHoverEndRef.current = onWordHoverEnd;

    const canGoPrev = useCallback(() => {
      const r = renditionRef.current;
      if (!r) return false;
      try {
        return (r as any).location?.start?.index > 0;
      } catch {
        return false;
      }
    }, []);

    const canGoNext = useCallback(() => {
      const r = renditionRef.current;
      if (!r) return false;
      try {
        const loc = (r as any).location;
        const total = (r as any).book?.spine?.length;
        if (total == null) return true;
        return (loc?.start?.index ?? 0) < total - 1;
      } catch {
        return true;
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        goPrev: () => {
          const r = renditionRef.current;
          if (r && typeof r.prev === 'function') r.prev();
        },
        goNext: () => {
          const r = renditionRef.current;
          if (r && typeof r.next === 'function') r.next();
        },
        canGoPrev,
        canGoNext,
      }),
      [canGoPrev, canGoNext]
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container || !book?.filePath) return;

      let mounted = true;

      async function openBook() {
        if (!window.electronAPI?.readFile) {
          console.error('EpubJsReader: Electron API not available');
          return;
        }
        try {
          const arrayBuffer = await window.electronAPI.readFile(book.filePath!);
          const blob = new Blob([arrayBuffer], {type: 'application/epub+zip'});
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;

          if (!mounted) {
            URL.revokeObjectURL(url);
            return;
          }

          const epubBook = ePub(url, {openAs: 'epub'});
          bookRef.current = epubBook;

          if (!mounted || !containerRef.current) {
            epubBook.destroy();
            URL.revokeObjectURL(url);
            return;
          }

          const rendition = epubBook.renderTo(container, {
            width: '100%',
            height: '100%',
            flow: 'scrolled-doc',
            allowScriptedContent: true, // avoids "Blocked script execution in about:srcdoc" (iframe sandbox); needed for some EPUBs/epub.js
          });
          renditionRef.current = rendition;

          rendition.display();

          rendition.on('relocated', (location: {start: {index: number}; end: {index: number}}) => {
            if (epubBook.spine) {
              const total = epubBook.spine.length;
              const current = location?.start?.index ?? 0;
              onLocationChangeRef.current?.(current, total);
            }
          });

          // Post-process each section for language learning: word replacement + hover/click
          // epub.js "rendered" emits (section, view); document is view.contents.document
          rendition.on('rendered', async (section: {document?: Document}, view: {contents?: {document?: Document}}) => {
            let doc = view?.contents?.document ?? section?.document;
            // Fallback: some epub.js flows only pass section; get document from current contents
            if (!doc?.body && typeof rendition.getContents === 'function') {
              const contentsList = rendition.getContents();
              const first = Array.isArray(contentsList) ? contentsList[0] : contentsList;
              doc = first?.document ?? undefined;
            }
            if (!mounted || !doc?.body || !book?.languagePair) return;

            const sourceLang = book.languagePair.sourceLanguage;
            const targetLang = book.languagePair.targetLanguage;
            const density = typeof book.wordDensity === 'number' ? book.wordDensity : 0.3;
            const proficiency = book.proficiencyLevel ?? 'beginner';

            try {
              const rawHtml = doc.body.innerHTML;
              const engine = createTranslationEngine({
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                proficiencyLevel: proficiency,
                density,
              });
              const processed = await engine.processContent(rawHtml);
              if (processed.stats.replacedWords === 0) {
                return; // No replacements; keep original content and skip listeners
              }

              doc.body.innerHTML = processed.content;

              // Inject foreign-word styles into the iframe
              let styleEl = doc.getElementById('xenolexia-epub-foreign-word-styles');
              if (!styleEl) {
                styleEl = doc.createElement('style');
                styleEl.id = 'xenolexia-epub-foreign-word-styles';
                styleEl.textContent = generateForeignWordStyles();
                (doc.head || doc.body).appendChild(styleEl);
              }

              // Clear previous hover timeout when content changes
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
              hoveredElementRef.current = null;

              const handleMouseEnter = (e: Event) => {
                const target = (e.target as HTMLElement);
                if (!target?.classList?.contains('foreign-word')) return;
                hoveredElementRef.current = target;
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = setTimeout(() => {
                  if (hoveredElementRef.current === target) {
                    onWordHoverRef.current?.(buildForeignWordData(target, sourceLang, targetLang));
                  }
                }, 300);
              };
              const handleMouseLeave = (e: Event) => {
                const target = (e.target as HTMLElement);
                if (!target?.classList?.contains('foreign-word')) return;
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
                hoveredElementRef.current = null;
                onWordHoverEndRef.current?.();
              };
              const handleClick = (e: Event) => {
                const target = (e.target as HTMLElement);
                if (!target?.classList?.contains('foreign-word')) return;
                e.preventDefault();
                e.stopPropagation();
                onWordClickRef.current?.(buildForeignWordData(target, sourceLang, targetLang));
              };

              doc.body.addEventListener('mouseenter', handleMouseEnter, true);
              doc.body.addEventListener('mouseleave', handleMouseLeave, true);
              doc.body.addEventListener('click', handleClick, true);
            } catch (err) {
              console.warn('EpubJsReader: word replacement failed', err);
            }
          });
        } catch (error) {
          console.error('EpubJsReader: Failed to open book', error);
        }
      }

      openBook();

      return () => {
        mounted = false;
        try {
          renditionRef.current?.destroy();
          renditionRef.current = null;
          bookRef.current?.destroy();
          bookRef.current = null;
        } catch (e) {
          console.warn('EpubJsReader cleanup:', e);
        }
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }, [book?.filePath, book?.id]);

    return (
      <div
        ref={containerRef}
        className="epubjs-reader"
        style={{width: '100%', flex: 1, minHeight: 0}}
      />
    );
  }
);
