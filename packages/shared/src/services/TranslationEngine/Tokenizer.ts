/**
 * Tokenizer - Extracts words from HTML while preserving structure
 *
 * Features:
 * - Preserves HTML tags and structure
 * - Handles punctuation attached to words
 * - Identifies word boundaries correctly
 * - Supports Unicode characters for non-Latin scripts
 * - Skips content that shouldn't be translated (code, scripts, styles)
 */

// ============================================================================
// Types
// ============================================================================

export interface Token {
  /** The extracted word (lowercase, normalized) */
  word: string;
  /** Original text as found in source */
  original: string;
  /** Start position in the original HTML */
  startIndex: number;
  /** End position in the original HTML */
  endIndex: number;
  /** Leading punctuation/whitespace */
  prefix: string;
  /** Trailing punctuation/whitespace */
  suffix: string;
  /** Whether this token is inside a protected context */
  isProtected: boolean;
  /** Type of protection if any */
  protectionType?: 'quote' | 'code' | 'name' | 'tag' | 'script' | 'style';
}

export interface TextSegment {
  /** Text content */
  text: string;
  /** Start position in original HTML */
  startIndex: number;
  /** End position in original HTML */
  endIndex: number;
  /** Whether this segment is inside a protected context */
  isProtected: boolean;
  /** Type of protection */
  protectionType?: Token['protectionType'];
}

export interface TokenizerOptions {
  /** Skip words inside quotation marks */
  skipQuotes?: boolean;
  /** Skip words that look like proper names (capitalized) */
  skipNames?: boolean;
  /** Skip words inside code blocks */
  skipCode?: boolean;
  /** Minimum word length to tokenize */
  minWordLength?: number;
  /** Maximum word length to tokenize */
  maxWordLength?: number;
  /** Custom words to always skip */
  skipWords?: Set<string>;
}

// ============================================================================
// Constants
// ============================================================================

/** Tags whose content should not be processed */
const SKIP_TAGS = new Set([
  'script',
  'style',
  'code',
  'pre',
  'kbd',
  'samp',
  'var',
  'noscript',
  'svg',
  'math',
]);

/** Common English contractions to handle */
const CONTRACTIONS = new Set([
  "n't",
  "'s",
  "'re",
  "'ve",
  "'ll",
  "'d",
  "'m",
]);

/** Common proper name prefixes */
const NAME_PREFIXES = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sir',
  'lord',
  'lady',
]);

/** Common abbreviations that shouldn't be translated */
const ABBREVIATIONS = new Set([
  'etc',
  'eg',
  'ie',
  'vs',
  'mr',
  'mrs',
  'ms',
  'dr',
  'jr',
  'sr',
  'inc',
  'ltd',
  'co',
  'corp',
]);

// ============================================================================
// Tokenizer Class
// ============================================================================

export class Tokenizer {
  private options: Required<TokenizerOptions>;

  constructor(options: TokenizerOptions = {}) {
    this.options = {
      skipQuotes: options.skipQuotes ?? true,
      skipNames: options.skipNames ?? true,
      skipCode: options.skipCode ?? true,
      minWordLength: options.minWordLength ?? 2,
      maxWordLength: options.maxWordLength ?? 30,
      skipWords: options.skipWords ?? new Set(),
    };
  }

  /**
   * Tokenize HTML content into words while preserving structure
   */
  tokenize(html: string): Token[] {
    const segments = this.extractTextSegments(html);
    const tokens: Token[] = [];

    for (const segment of segments) {
      if (segment.isProtected && this.shouldSkipProtected(segment.protectionType)) {
        continue;
      }

      const segmentTokens = this.tokenizeSegment(segment);
      tokens.push(...segmentTokens);
    }

    return tokens;
  }

  /**
   * Extract text segments from HTML, marking protected regions
   */
  extractTextSegments(html: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let currentIndex = 0;
    let insideSkipTag = false;
    let skipTagName = '';
    let quoteDepth = 0;

    // Regex to match HTML tags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const tagStart = match.index;
      const tagEnd = match.index + match[0].length;
      const tagName = match[1].toLowerCase();
      const isClosing = match[0].startsWith('</');

      // Extract text before this tag
      if (tagStart > currentIndex) {
        const text = html.substring(currentIndex, tagStart);
        if (text.trim()) {
          segments.push({
            text,
            startIndex: currentIndex,
            endIndex: tagStart,
            isProtected: insideSkipTag || quoteDepth > 0,
            protectionType: insideSkipTag
              ? (skipTagName === 'code' || skipTagName === 'pre' ? 'code' : 'script')
              : quoteDepth > 0
                ? 'quote'
                : undefined,
          });
        }
      }

      // Track skip tags
      if (SKIP_TAGS.has(tagName)) {
        if (!isClosing) {
          insideSkipTag = true;
          skipTagName = tagName;
        } else if (tagName === skipTagName) {
          insideSkipTag = false;
          skipTagName = '';
        }
      }

      currentIndex = tagEnd;
    }

    // Handle remaining text after last tag
    if (currentIndex < html.length) {
      const text = html.substring(currentIndex);
      if (text.trim()) {
        segments.push({
          text,
          startIndex: currentIndex,
          endIndex: html.length,
          isProtected: insideSkipTag,
          protectionType: insideSkipTag ? 'script' : undefined,
        });
      }
    }

    return segments;
  }

  /**
   * Tokenize a single text segment into words
   */
  private tokenizeSegment(segment: TextSegment): Token[] {
    const tokens: Token[] = [];
    const text = segment.text;

    // Word pattern: supports Latin and common Unicode letters
    // Handles contractions and hyphenated words
    const wordPattern = /([^\w\u00C0-\u024F\u1E00-\u1EFF]*)([\w\u00C0-\u024F\u1E00-\u1EFF]+(?:[''][\w\u00C0-\u024F\u1E00-\u1EFF]+)?(?:-[\w\u00C0-\u024F\u1E00-\u1EFF]+)*)([^\w\u00C0-\u024F\u1E00-\u1EFF]*)/g;

    let match;
    let inQuote = false;
    let lastQuoteChar = '';

    while ((match = wordPattern.exec(text)) !== null) {
      const [, prefix, word, suffix] = match;
      const startInSegment = match.index + prefix.length;
      const endInSegment = startInSegment + word.length;

      // Track quotes in prefix
      for (const char of prefix) {
        if (char === '"' || char === '\u201C' || char === '\u201D' || char === "'" || char === '\u2018' || char === '\u2019') {
          if (!inQuote) {
            inQuote = true;
            lastQuoteChar = char;
          } else if (this.isMatchingQuote(lastQuoteChar, char)) {
            inQuote = false;
          }
        }
      }

      // Determine if word is protected
      let isProtected = segment.isProtected || (inQuote && this.options.skipQuotes);
      let protectionType = segment.protectionType;

      // Check for proper names (capitalized words not at sentence start)
      if (this.options.skipNames && this.looksLikeName(word, prefix, text, startInSegment)) {
        isProtected = true;
        protectionType = 'name';
      }

      // Check for abbreviations
      const normalized = word.toLowerCase().replace(/\./g, '');
      if (ABBREVIATIONS.has(normalized)) {
        isProtected = true;
        protectionType = 'name';
      }

      // Skip if word doesn't meet length requirements
      if (word.length < this.options.minWordLength || word.length > this.options.maxWordLength) {
        continue;
      }

      // Skip if in custom skip list
      if (this.options.skipWords.has(normalized)) {
        continue;
      }

      tokens.push({
        word: normalized,
        original: word,
        startIndex: segment.startIndex + startInSegment,
        endIndex: segment.startIndex + endInSegment,
        prefix,
        suffix,
        isProtected,
        protectionType,
      });

      // Track quotes in suffix
      for (const char of suffix) {
        if (char === '"' || char === '\u201C' || char === '\u201D' || char === "'" || char === '\u2018' || char === '\u2019') {
          if (inQuote && this.isMatchingQuote(lastQuoteChar, char)) {
            inQuote = false;
          }
        }
      }
    }

    return tokens;
  }

  /**
   * Check if a word looks like a proper name
   */
  private looksLikeName(
    word: string,
    prefix: string,
    fullText: string,
    positionInText: number
  ): boolean {
    // Must start with capital letter
    if (!/^[A-Z]/.test(word)) {
      return false;
    }

    // Check if it's at the start of a sentence
    const trimmedPrefix = prefix.trimEnd();
    if (
      positionInText === 0 ||
      trimmedPrefix.endsWith('.') ||
      trimmedPrefix.endsWith('!') ||
      trimmedPrefix.endsWith('?') ||
      trimmedPrefix.endsWith(':')
    ) {
      // Could be sentence start, not necessarily a name
      // But if ALL CAPS or has internal capitals, likely a name
      if (word === word.toUpperCase() || /[A-Z]/.test(word.slice(1))) {
        return true;
      }
      return false;
    }

    // Check for name prefixes (Mr., Dr., etc.)
    const prevWord = this.getPreviousWord(fullText, positionInText);
    if (prevWord && NAME_PREFIXES.has(prevWord.toLowerCase().replace('.', ''))) {
      return true;
    }

    // Mid-sentence capitalization is likely a name
    return true;
  }

  /**
   * Get the previous word in the text
   */
  private getPreviousWord(text: string, position: number): string | null {
    const before = text.substring(0, position).trimEnd();
    const match = before.match(/(\w+\.?)$/);
    return match ? match[1] : null;
  }

  /**
   * Check if two quote characters match
   */
  private isMatchingQuote(open: string, close: string): boolean {
    const pairs: Record<string, string> = {
      '"': '"',
      '\u201C': '\u201D',
      "'": "'",
      '\u2018': '\u2019',
    };
    return pairs[open] === close || open === close;
  }

  /**
   * Check if we should skip protected content
   */
  private shouldSkipProtected(type?: Token['protectionType']): boolean {
    switch (type) {
      case 'code':
      case 'script':
      case 'style':
        return this.options.skipCode;
      case 'quote':
        return this.options.skipQuotes;
      case 'name':
        return this.options.skipNames;
      default:
        return false;
    }
  }

  /**
   * Update tokenizer options
   */
  updateOptions(options: Partial<TokenizerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get unique words from tokens
   */
  static getUniqueWords(tokens: Token[]): string[] {
    const words = new Set<string>();
    for (const token of tokens) {
      if (!token.isProtected) {
        words.add(token.word);
      }
    }
    return Array.from(words);
  }
}

// Export singleton with default options
export const tokenizer = new Tokenizer();
