/**
 * Reader Content - Renders EPUB HTML with word interaction support for desktop
 */

import React, {useEffect, useRef, useCallback} from 'react';
import type {Book, ForeignWordData} from '@xenolexia/shared/types';
import {generateInjectedScript, generateForeignWordStyles} from '@xenolexia/shared/services/TranslationEngine/InjectedScript';
import './ReaderContent.css';

interface ReaderContentProps {
  html: string;
  book: Book;
  onWordClick: (word: ForeignWordData) => void;
  onWordHover: (word: ForeignWordData) => void;
  onWordHoverEnd: () => void;
  onProgressChange?: (progress: number) => void;
}

export function ReaderContent({
  html,
  book,
  onWordClick,
  onWordHover,
  onWordHoverEnd,
  onProgressChange,
}: ReaderContentProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  // Extract body content from full HTML document
  const extractBodyContent = useCallback((fullHtml: string): string => {
    // If HTML contains full document, extract body content
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    }
    // If it's just body content, return as-is
    return fullHtml;
  }, []);

  // Setup word interaction handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create a message bridge for desktop (replaces ReactNativeWebView.postMessage)
    (window as any).ReactNativeWebView = {
      postMessage: (messageStr: string) => {
        try {
          const message = JSON.parse(messageStr);
          if (message.type === 'wordTap' || message.type === 'wordLongPress') {
            const wordData: ForeignWordData = {
              originalWord: message.originalWord || '',
              foreignWord: message.foreignWord || '',
              startIndex: 0,
              endIndex: 0,
              wordEntry: {
                id: message.wordId || '',
                sourceWord: message.originalWord || '',
                targetWord: message.foreignWord || '',
                sourceLanguage: book.languagePair.sourceLanguage,
                targetLanguage: book.languagePair.targetLanguage,
                proficiencyLevel: 'beginner',
                frequencyRank: 0,
                partOfSpeech: (message.partOfSpeech as any) || 'other',
                variants: [],
                pronunciation: message.pronunciation || undefined,
              },
            };
            onWordClick(wordData);
          } else if (message.type === 'wordHoverEnd') {
            onWordHoverEnd();
          } else if (message.type === 'progress' && onProgressChange) {
            onProgressChange(message.progress || 0);
          }
        } catch (error) {
          console.warn('Failed to parse message:', error);
        }
      },
    };

    // Setup hover handlers for desktop
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('foreign-word')) {
        hoveredElementRef.current = target;
        
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        // Show popup after delay
        hoverTimeoutRef.current = setTimeout(() => {
          if (hoveredElementRef.current === target) {
            const wordData: ForeignWordData = {
              originalWord: target.dataset.original || '',
              foreignWord: target.textContent || '',
              startIndex: 0,
              endIndex: 0,
              wordEntry: {
                id: target.dataset.wordId || '',
                sourceWord: target.dataset.original || '',
                targetWord: target.textContent || '',
                sourceLanguage: book.languagePair.sourceLanguage,
                targetLanguage: book.languagePair.targetLanguage,
                proficiencyLevel: 'beginner',
                frequencyRank: 0,
                partOfSpeech: 'other',
                variants: [],
                pronunciation: target.dataset.pronunciation || undefined,
              },
            };
            onWordHover(wordData);
          }
        }, 300);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('foreign-word')) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        hoveredElementRef.current = null;
        onWordHoverEnd();
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('foreign-word')) {
        e.preventDefault();
        e.stopPropagation();
        
        const wordData: ForeignWordData = {
          originalWord: target.dataset.original || '',
          foreignWord: target.textContent || '',
          startIndex: 0,
          endIndex: 0,
          wordEntry: {
            id: target.dataset.wordId || '',
            sourceWord: target.dataset.original || '',
            targetWord: target.textContent || '',
            sourceLanguage: book.languagePair.sourceLanguage,
            targetLanguage: book.languagePair.targetLanguage,
            proficiencyLevel: 'beginner',
            frequencyRank: 0,
            partOfSpeech: 'other',
            variants: [],
            pronunciation: target.dataset.pronunciation || undefined,
          },
        };
        onWordClick(wordData);
      }
    };

    container.addEventListener('mouseenter', handleMouseEnter, true);
    container.addEventListener('mouseleave', handleMouseLeave, true);
    container.addEventListener('click', handleClick, true);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter, true);
      container.removeEventListener('mouseleave', handleMouseLeave, true);
      container.removeEventListener('click', handleClick, true);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      delete (window as any).ReactNativeWebView;
    };
  }, [book, onWordClick, onWordHover, onWordHoverEnd, onProgressChange]);

  // Inject scripts and styles into the HTML
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      console.warn('ReaderContent: container ref is null');
      return;
    }

    if (!html || html.trim().length === 0) {
      console.warn('ReaderContent: HTML is empty');
      container.innerHTML = '<div style="padding: 2em; text-align: center;"><p>No content available</p></div>';
      return;
    }

    console.log('ReaderContent: Setting HTML, length:', html.length);

    // Extract body content from full HTML document
    const bodyContent = extractBodyContent(html);
    console.log('ReaderContent: Body content length:', bodyContent.length);
    
    // If the HTML is a full document, we should render it in an iframe or extract body
    // For now, let's check if it's a full document
    if (html.includes('<!DOCTYPE') || html.includes('<html')) {
      // It's a full document - extract body or render in iframe
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        container.innerHTML = bodyMatch[1];
      } else {
        // Fallback: try to extract content between body tags or just use the HTML
        container.innerHTML = bodyContent;
      }
    } else {
      // It's just body content
      container.innerHTML = bodyContent;
    }

    // Inject foreign word styles if not already present
    if (!document.getElementById('xenolexia-foreign-word-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'xenolexia-foreign-word-styles';
      styleElement.textContent = generateForeignWordStyles();
      document.head.appendChild(styleElement);
    }

    // Inject interaction script
    const scriptElement = document.createElement('script');
    const injectedScript = generateInjectedScript();
    scriptElement.textContent = injectedScript;
    container.appendChild(scriptElement);

    // Execute the script by creating a new script element
    const newScript = document.createElement('script');
    newScript.textContent = scriptElement.textContent;
    scriptElement.parentNode?.replaceChild(newScript, scriptElement);

    console.log('ReaderContent: HTML rendered successfully');
  }, [html, extractBodyContent]);

  return <div ref={containerRef} className="reader-html-content" />;
}
