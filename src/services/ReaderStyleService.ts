/**
 * Reader Style Service - Generates CSS styles for the EPUB reader
 */

import type { ReaderSettings, ReaderTheme } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

export interface ReaderStyleConfig {
  theme: ReaderTheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  marginHorizontal: number;
  textAlign: 'left' | 'justify';
  wordDensity?: number;
  brightness?: number;
}

export interface ThemeColors {
  background: string;
  text: string;
  textMuted: string;
  foreignWord: string;
  link: string;
  selection: string;
  border: string;
}

// ============================================================================
// Font Definitions
// ============================================================================

export const READER_FONTS = [
  {
    id: 'Georgia',
    label: 'Serif',
    family: 'Georgia, serif',
    description: 'Classic reading font',
  },
  {
    id: 'System',
    label: 'Sans-serif',
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    description: 'Clean and modern',
  },
  {
    id: 'Merriweather',
    label: 'Merriweather',
    family: '"Merriweather", Georgia, serif',
    description: 'Optimized for screens',
  },
  {
    id: 'OpenDyslexic',
    label: 'Dyslexic',
    family: '"OpenDyslexic", sans-serif',
    description: 'Easier to read for dyslexia',
  },
  {
    id: 'JetBrainsMono',
    label: 'Mono',
    family: '"JetBrains Mono", "Courier New", monospace',
    description: 'Fixed-width coding font',
  },
];

// ============================================================================
// Theme Definitions
// ============================================================================

export const READER_THEMES: Record<ReaderTheme, ThemeColors> = {
  light: {
    background: '#ffffff',
    text: '#1f2937',
    textMuted: '#6b7280',
    foreignWord: '#6366f1',
    link: '#0ea5e9',
    selection: 'rgba(99, 102, 241, 0.3)',
    border: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: '#1a1a2e',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    foreignWord: '#818cf8',
    link: '#38bdf8',
    selection: 'rgba(129, 140, 248, 0.3)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  sepia: {
    background: '#f4ecd8',
    text: '#5c4b37',
    textMuted: '#8b7355',
    foreignWord: '#9333ea',
    link: '#0891b2',
    selection: 'rgba(147, 51, 234, 0.3)',
    border: 'rgba(0, 0, 0, 0.1)',
  },
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY = '@xenolexia/reader_settings';
const BOOK_SETTINGS_PREFIX = '@xenolexia/book_settings_';

// ============================================================================
// Reader Style Service
// ============================================================================

export class ReaderStyleService {
  /**
   * Get CSS variables string for a theme
   */
  static getThemeCSSVariables(theme: ReaderTheme): string {
    const colors = READER_THEMES[theme];
    return `
      --bg-color: ${colors.background};
      --text-color: ${colors.text};
      --text-muted: ${colors.textMuted};
      --foreign-color: ${colors.foreignWord};
      --link-color: ${colors.link};
      --selection-color: ${colors.selection};
      --border-color: ${colors.border};
    `;
  }

  /**
   * Get font CSS for a font ID
   */
  static getFontCSS(fontId: string): string {
    const font = READER_FONTS.find((f) => f.id === fontId);
    return font?.family || 'Georgia, serif';
  }

  /**
   * Generate complete CSS stylesheet for reader
   */
  static generateStylesheet(config: ReaderStyleConfig): string {
    const themeVars = this.getThemeCSSVariables(config.theme);
    const fontFamily = this.getFontCSS(config.fontFamily);

    return `
      :root {
        ${themeVars}
        --font-family: ${fontFamily};
        --font-size: ${config.fontSize}px;
        --line-height: ${config.lineHeight};
        --text-align: ${config.textAlign};
        --margin-h: ${config.marginHorizontal}px;
      }

      * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      ::selection {
        background-color: var(--selection-color);
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
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        padding: 24px var(--margin-h);
        max-width: 100%;
        min-height: 100vh;
      }

      /* Typography */
      p {
        margin: 0 0 1em 0;
        text-indent: 1.5em;
      }

      p:first-of-type {
        text-indent: 0;
      }

      h1, h2, h3, h4, h5, h6 {
        margin: 1.5em 0 0.5em 0;
        line-height: 1.3;
        font-weight: 600;
        text-indent: 0;
      }

      h1 { font-size: 1.5em; }
      h2 { font-size: 1.35em; }
      h3 { font-size: 1.2em; }
      h4 { font-size: 1.1em; }
      h5, h6 { font-size: 1em; }

      /* Links */
      a {
        color: var(--link-color);
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
      }

      a:visited {
        color: var(--text-muted);
      }

      /* Images */
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1.5em auto;
        border-radius: 4px;
      }

      figure {
        margin: 1.5em 0;
        text-align: center;
      }

      figcaption {
        font-size: 0.9em;
        color: var(--text-muted);
        font-style: italic;
        margin-top: 0.5em;
      }

      /* Blockquotes */
      blockquote {
        margin: 1.5em 0;
        padding: 1em 1.5em;
        border-left: 4px solid var(--foreign-color);
        background-color: rgba(0, 0, 0, 0.03);
        border-radius: 0 8px 8px 0;
        font-style: italic;
      }

      blockquote p {
        text-indent: 0;
        margin: 0;
      }

      blockquote cite {
        display: block;
        font-style: normal;
        color: var(--text-muted);
        font-size: 0.9em;
        margin-top: 0.5em;
      }

      /* Code */
      pre, code {
        font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
        font-size: 0.85em;
      }

      code {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 0.2em 0.4em;
        border-radius: 4px;
      }

      pre {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        line-height: 1.5;
      }

      pre code {
        background: none;
        padding: 0;
      }

      /* Lists */
      ul, ol {
        margin: 1em 0;
        padding-left: 2em;
      }

      li {
        margin-bottom: 0.5em;
      }

      li p {
        text-indent: 0;
        margin: 0;
      }

      /* Tables */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5em 0;
        font-size: 0.9em;
      }

      th, td {
        padding: 0.75em;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        font-weight: 600;
        background-color: rgba(0, 0, 0, 0.03);
      }

      /* Horizontal rules */
      hr {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 2em 0;
      }

      /* Foreign word styling */
      .foreign-word {
        color: var(--foreign-color);
        text-decoration: underline;
        text-decoration-style: dotted;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
        cursor: pointer;
        font-weight: 500;
        border-radius: 2px;
        transition: background-color 0.15s ease;
      }

      .foreign-word:hover {
        background-color: var(--selection-color);
      }

      .foreign-word:active {
        background-color: var(--selection-color);
        opacity: 0.8;
      }

      /* Progress indicator */
      #progress-indicator {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--foreign-color), var(--link-color));
        width: 0%;
        transition: width 0.1s ease-out;
        z-index: 1000;
      }

      /* Chapter title styling */
      .chapter-title {
        text-align: center;
        font-size: 1.8em;
        margin: 2em 0;
        font-weight: 700;
      }

      /* Drop cap for chapter starts */
      .chapter-start::first-letter {
        float: left;
        font-size: 3.5em;
        line-height: 1;
        padding-right: 0.1em;
        font-weight: 700;
        color: var(--foreign-color);
      }

      /* Footnotes */
      .footnote {
        font-size: 0.85em;
        color: var(--text-muted);
        border-top: 1px solid var(--border-color);
        padding-top: 1em;
        margin-top: 2em;
      }

      .footnote-ref {
        font-size: 0.75em;
        vertical-align: super;
        color: var(--link-color);
      }

      /* Prevent text selection on interactive elements */
      .foreign-word {
        -webkit-user-select: none;
        user-select: none;
      }
    `;
  }

  /**
   * Generate JavaScript for dynamic settings updates
   */
  static generateSettingsScript(): string {
    return `
      window.applyReaderSettings = function(settings) {
        const root = document.documentElement;
        
        if (settings.fontSize) {
          root.style.setProperty('--font-size', settings.fontSize + 'px');
        }
        if (settings.fontFamily) {
          root.style.setProperty('--font-family', settings.fontFamily);
        }
        if (settings.lineHeight) {
          root.style.setProperty('--line-height', settings.lineHeight);
        }
        if (settings.textAlign) {
          root.style.setProperty('--text-align', settings.textAlign);
        }
        if (settings.marginHorizontal) {
          root.style.setProperty('--margin-h', settings.marginHorizontal + 'px');
        }
        
        // Force reflow for smooth updates
        document.body.offsetHeight;
      };
    `;
  }

  /**
   * Save global reader settings
   */
  static async saveSettings(settings: Partial<ReaderSettings>): Promise<void> {
    try {
      const existing = await this.loadSettings();
      const merged = { ...existing, ...settings };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (error) {
      console.error('Failed to save reader settings:', error);
    }
  }

  /**
   * Load global reader settings
   */
  static async loadSettings(): Promise<Partial<ReaderSettings>> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load reader settings:', error);
    }
    return {};
  }

  /**
   * Save book-specific settings
   */
  static async saveBookSettings(
    bookId: string,
    settings: Partial<ReaderSettings>
  ): Promise<void> {
    try {
      const key = BOOK_SETTINGS_PREFIX + bookId;
      await AsyncStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save book settings:', error);
    }
  }

  /**
   * Load book-specific settings
   */
  static async loadBookSettings(
    bookId: string
  ): Promise<Partial<ReaderSettings>> {
    try {
      const key = BOOK_SETTINGS_PREFIX + bookId;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load book settings:', error);
    }
    return {};
  }

  /**
   * Get merged settings (global + book-specific)
   */
  static async getMergedSettings(
    bookId: string,
    defaults: ReaderSettings
  ): Promise<ReaderSettings> {
    const globalSettings = await this.loadSettings();
    const bookSettings = await this.loadBookSettings(bookId);
    return { ...defaults, ...globalSettings, ...bookSettings };
  }

  /**
   * Reset settings to defaults
   */
  static async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset reader settings:', error);
    }
  }

  /**
   * Reset book-specific settings
   */
  static async resetBookSettings(bookId: string): Promise<void> {
    try {
      const key = BOOK_SETTINGS_PREFIX + bookId;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to reset book settings:', error);
    }
  }
}

// Export convenience functions
export const {
  generateStylesheet,
  getThemeCSSVariables,
  getFontCSS,
  saveSettings,
  loadSettings,
  saveBookSettings,
  loadBookSettings,
  getMergedSettings,
  resetSettings,
  resetBookSettings,
} = ReaderStyleService;
