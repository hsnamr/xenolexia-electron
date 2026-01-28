/**
 * Chapter Content Service - Extracts and processes chapter HTML for rendering
 */

import JSZip from 'jszip';
import type { Chapter, ReaderSettings } from '../types';
import { readFileAsBase64 } from '../../utils/FileSystem.electron';

// ============================================================================
// Types
// ============================================================================

export interface ChapterStyles {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  textAlign: 'left' | 'justify';
  marginHorizontal: number;
  theme: 'light' | 'dark' | 'sepia';
  foreignWordColor: string;
}

export interface ProcessedChapterContent {
  html: string;
  baseStyles: string;
  scripts: string;
}

// ============================================================================
// Theme Configurations
// ============================================================================

const THEME_COLORS = {
  light: {
    background: '#ffffff',
    text: '#1f2937',
    foreignWord: '#6366f1',
    link: '#0ea5e9',
  },
  dark: {
    background: '#1a1a2e',
    text: '#e5e7eb',
    foreignWord: '#818cf8',
    link: '#38bdf8',
  },
  sepia: {
    background: '#f4ecd8',
    text: '#5c4b37',
    foreignWord: '#9333ea',
    link: '#0891b2',
  },
};

// ============================================================================
// Chapter Content Service
// ============================================================================

export class ChapterContentService {
  private zip: JSZip | null = null;
  private basePath: string = '';

  /**
   * Load an EPUB file for content extraction
   */
  async loadEpub(filePath: string): Promise<void> {
    try {
      const content = await readFileAsBase64(filePath);
      this.zip = await JSZip.loadAsync(content, { base64: true });
      
      // Determine base path from container.xml
      const containerXml = await this.zip.file('META-INF/container.xml')?.async('string');
      if (containerXml) {
        const rootFileMatch = containerXml.match(/full-path="([^"]+)"/);
        if (rootFileMatch) {
          const opfPath = rootFileMatch[1];
          this.basePath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
        }
      }
    } catch (error) {
      console.error('Failed to load EPUB for content extraction:', error);
      throw error;
    }
  }

  /**
   * Get chapter HTML content with embedded styles and images
   */
  async getChapterHtml(
    chapter: Chapter,
    settings: ChapterStyles
  ): Promise<ProcessedChapterContent> {
    let html = chapter.content;

    // Process embedded images to base64 (continue even if it fails)
    try {
      html = await this.processImages(html);
    } catch (error) {
      console.warn('Failed to process images, continuing with original HTML:', error);
      // Continue with original HTML if image processing fails
    }

    // Ensure we have content
    if (!html || html.trim().length === 0) {
      html = '<p>No content available for this chapter.</p>';
    }

    // Generate base CSS
    const baseStyles = this.generateBaseStyles(settings);

    // Generate interaction scripts
    const scripts = this.generateInteractionScripts();

    // Wrap in complete HTML document
    const wrappedHtml = this.wrapInDocument(html, baseStyles, scripts, settings);

    return {
      html: wrappedHtml,
      baseStyles,
      scripts,
    };
  }

  /**
   * Process images in HTML and convert to base64
   */
  private async processImages(html: string): Promise<string> {
    if (!this.zip) return html;

    // Find all image references
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    let processedHtml = html;

    while ((match = imgRegex.exec(html)) !== null) {
      const [fullMatch, src] = match;
      
      try {
        // Resolve relative path
        const imagePath = this.resolveImagePath(src);
        const imageFile = this.zip.file(imagePath);
        
        if (imageFile) {
          const base64 = await imageFile.async('base64');
          const mimeType = this.getMimeType(imagePath);
          const dataUrl = `data:${mimeType};base64,${base64}`;
          
          processedHtml = processedHtml.replace(
            fullMatch,
            fullMatch.replace(src, dataUrl)
          );
        }
      } catch (error) {
        console.warn('Failed to process image:', src, error);
      }
    }

    return processedHtml;
  }

  /**
   * Resolve image path relative to EPUB structure
   */
  private resolveImagePath(src: string): string {
    if (src.startsWith('../')) {
      // Handle parent directory references
      const cleanSrc = src.replace(/^\.\.\//, '');
      return this.basePath + cleanSrc;
    } else if (src.startsWith('./')) {
      return this.basePath + src.substring(2);
    } else if (!src.startsWith('/')) {
      return this.basePath + src;
    }
    return src.substring(1); // Remove leading slash
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Generate base CSS styles based on reader settings
   */
  private generateBaseStyles(settings: ChapterStyles): string {
    const theme = THEME_COLORS[settings.theme];

    return `
      :root {
        --bg-color: ${theme.background};
        --text-color: ${theme.text};
        --foreign-color: ${theme.foreignWord};
        --link-color: ${theme.link};
        --font-family: ${settings.fontFamily};
        --font-size: ${settings.fontSize}px;
        --line-height: ${settings.lineHeight};
        --text-align: ${settings.textAlign};
        --margin-h: ${settings.marginHorizontal}px;
      }

      * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      html, body {
        margin: 0;
        padding: 0;
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: var(--font-family);
        font-size: var(--font-size);
        line-height: var(--line-height);
        text-align: var(--text-align);
        word-wrap: break-word;
        overflow-wrap: break-word;
        -webkit-font-smoothing: antialiased;
      }

      body {
        padding: 24px var(--margin-h);
        max-width: 100%;
      }

      p {
        margin: 0 0 1em 0;
      }

      h1, h2, h3, h4, h5, h6 {
        margin: 1.5em 0 0.5em 0;
        line-height: 1.3;
        font-weight: 600;
      }

      h1 { font-size: 1.5em; }
      h2 { font-size: 1.3em; }
      h3 { font-size: 1.15em; }
      h4, h5, h6 { font-size: 1em; }

      a {
        color: var(--link-color);
        text-decoration: underline;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
      }

      blockquote {
        margin: 1em 0;
        padding-left: 1em;
        border-left: 3px solid var(--foreign-color);
        font-style: italic;
      }

      pre, code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.9em;
        background-color: rgba(0, 0, 0, 0.05);
        padding: 0.2em 0.4em;
        border-radius: 4px;
      }

      pre {
        padding: 1em;
        overflow-x: auto;
      }

      /* Foreign word styling */
      .foreign-word {
        color: var(--foreign-color);
        text-decoration: underline;
        text-decoration-style: dotted;
        text-underline-offset: 3px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }

      .foreign-word:active {
        background-color: rgba(99, 102, 241, 0.2);
      }

      /* Reading progress indicator */
      #progress-indicator {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background-color: var(--foreign-color);
        width: 0%;
        transition: width 0.1s ease-out;
        z-index: 1000;
      }
    `;
  }

  /**
   * Generate JavaScript for interaction handling
   */
  private generateInteractionScripts(): string {
    return `
      (function() {
        // Track scroll progress
        let scrollTimeout;
        function updateProgress() {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
          
          // Update progress bar
          const indicator = document.getElementById('progress-indicator');
          if (indicator) {
            indicator.style.width = progress + '%';
          }
          
          // Notify React Native
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'progress',
            progress: Math.min(100, Math.max(0, progress)),
            scrollY: window.scrollY,
            scrollHeight: scrollHeight
          }));
        }

        window.addEventListener('scroll', function() {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(updateProgress, 100);
        });

        // Handle foreign word taps
        document.addEventListener('click', function(e) {
          const target = e.target;
          if (target.classList.contains('foreign-word')) {
            e.preventDefault();
            
            const rect = target.getBoundingClientRect();
            
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'wordTap',
              foreignWord: target.textContent,
              originalWord: target.dataset.original,
              pronunciation: target.dataset.pronunciation || null,
              partOfSpeech: target.dataset.pos || 'unknown',
              wordId: target.dataset.wordId,
              position: {
                x: rect.left + rect.width / 2,
                y: rect.top
              }
            }));
          }
        });

        // Handle long press for more options
        let longPressTimer;
        document.addEventListener('touchstart', function(e) {
          const target = e.target;
          if (target.classList.contains('foreign-word')) {
            longPressTimer = setTimeout(function() {
              const rect = target.getBoundingClientRect();
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'wordLongPress',
                foreignWord: target.textContent,
                originalWord: target.dataset.original,
                wordId: target.dataset.wordId,
                position: {
                  x: rect.left + rect.width / 2,
                  y: rect.top
                }
              }));
            }, 500);
          }
        });

        document.addEventListener('touchend', function() {
          clearTimeout(longPressTimer);
        });

        document.addEventListener('touchmove', function() {
          clearTimeout(longPressTimer);
        });

        // Apply reader settings from React Native
        window.applyReaderSettings = function(settings) {
          const root = document.documentElement;
          if (settings.fontSize) root.style.setProperty('--font-size', settings.fontSize + 'px');
          if (settings.fontFamily) root.style.setProperty('--font-family', settings.fontFamily);
          if (settings.lineHeight) root.style.setProperty('--line-height', settings.lineHeight);
          if (settings.textAlign) root.style.setProperty('--text-align', settings.textAlign);
          if (settings.marginHorizontal) root.style.setProperty('--margin-h', settings.marginHorizontal + 'px');
        };

        // Scroll to saved position
        window.scrollToPosition = function(y) {
          window.scrollTo({ top: y, behavior: 'instant' });
        };

        // Scroll to element by ID
        window.scrollToElement = function(id) {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };

        // Initial progress update
        setTimeout(updateProgress, 100);

        // Notify that content is ready
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'contentReady',
          scrollHeight: document.documentElement.scrollHeight
        }));
      })();
    `;
  }

  /**
   * Wrap content in a complete HTML document
   */
  private wrapInDocument(
    content: string,
    styles: string,
    scripts: string,
    settings: ChapterStyles
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>${styles}</style>
</head>
<body>
  <div id="progress-indicator"></div>
  <div id="content">
    ${content}
  </div>
  <script>${scripts}</script>
</body>
</html>
    `.trim();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.zip = null;
    this.basePath = '';
  }
}

// Export singleton instance
export const chapterContentService = new ChapterContentService();
