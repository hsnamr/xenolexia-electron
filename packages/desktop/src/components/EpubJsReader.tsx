/**
 * EPUB reader using epub.js (BSD-2-Clause, GPL-compatible).
 * Uses the open-source epub.js library instead of custom parsing for EPUB.
 */

import React, {useEffect, useRef, useImperativeHandle, forwardRef, useCallback} from 'react';
import type {Book} from '@xenolexia/shared/types';

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
}

export const EpubJsReader = forwardRef<EpubJsReaderHandle, EpubJsReaderProps>(
  function EpubJsReader({book, onLocationChange}, ref) {
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
    onLocationChangeRef.current = onLocationChange;

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
            allowScriptedContent: false,
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
