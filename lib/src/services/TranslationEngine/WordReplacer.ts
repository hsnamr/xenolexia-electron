/**
 * Word Replacer - Handles word replacement logic with context awareness
 *
 * Features:
 * - Respects word density settings
 * - Preserves original case
 * - Creates properly formatted foreign word markers
 * - Handles replacement in HTML without breaking structure
 * - Supports configurable replacement strategies
 */

import type { WordEntry, ProficiencyLevel, ForeignWordData } from '../types';
import type { Token } from './Tokenizer';

// ============================================================================
// Types
// ============================================================================

export interface ReplacementCandidate {
  token: Token;
  entry: WordEntry;
  score: number;
}

export interface ReplacementResult {
  /** The modified HTML content */
  html: string;
  /** Array of foreign words that were inserted */
  foreignWords: ForeignWordData[];
  /** Statistics about the replacement */
  stats: ReplacementStats;
}

export interface ReplacementStats {
  /** Total tokens processed */
  totalTokens: number;
  /** Tokens eligible for replacement */
  eligibleTokens: number;
  /** Tokens actually replaced */
  replacedTokens: number;
  /** Tokens skipped due to protection */
  protectedTokens: number;
  /** Tokens skipped due to density limit */
  densitySkipped: number;
}

export interface ReplacerOptions {
  /** Target word density (0.0 - 1.0) */
  density: number;
  /** Maximum proficiency level to include */
  maxProficiency: ProficiencyLevel;
  /** Prefer replacing certain parts of speech */
  preferredPartsOfSpeech?: string[];
  /** Words to never replace */
  excludeWords?: Set<string>;
  /** Minimum spacing between replaced words */
  minWordSpacing?: number;
  /** Strategy for selecting which words to replace */
  selectionStrategy?: 'random' | 'frequency' | 'distributed';
}

// ============================================================================
// Constants
// ============================================================================

const PROFICIENCY_ORDER: ProficiencyLevel[] = ['beginner', 'intermediate', 'advanced'];

// ============================================================================
// Word Replacer Class
// ============================================================================

export class WordReplacer {
  private options: Required<ReplacerOptions>;

  constructor(options: Partial<ReplacerOptions> = {}) {
    this.options = {
      density: options.density ?? 0.15,
      maxProficiency: options.maxProficiency ?? 'beginner',
      preferredPartsOfSpeech: options.preferredPartsOfSpeech ?? [],
      excludeWords: options.excludeWords ?? new Set(),
      minWordSpacing: options.minWordSpacing ?? 3,
      selectionStrategy: options.selectionStrategy ?? 'distributed',
    };
  }

  /**
   * Replace words in HTML content with foreign equivalents
   */
  replace(
    html: string,
    tokens: Token[],
    wordEntries: Map<string, WordEntry | null>
  ): ReplacementResult {
    // Build list of replacement candidates
    const candidates = this.buildCandidates(tokens, wordEntries);

    // Select which words to replace based on density and strategy
    const selected = this.selectReplacements(candidates, tokens.length);

    // Sort by position descending to replace from end to start
    // This prevents position shifts from affecting subsequent replacements
    selected.sort((a, b) => b.token.startIndex - a.token.startIndex);

    // Perform replacements
    let modifiedHtml = html;
    const foreignWords: ForeignWordData[] = [];
    let offset = 0;

    for (const candidate of selected) {
      const { token, entry } = candidate;

      // Preserve original case
      const foreignWord = this.preserveCase(token.original, entry.targetWord);

      // Create the foreign word marker HTML
      const marker = this.createMarker(foreignWord, entry, token);

      // Calculate positions
      const start = token.startIndex;
      const end = token.endIndex;

      // Replace in HTML
      modifiedHtml =
        modifiedHtml.substring(0, start) +
        marker +
        modifiedHtml.substring(end);

      // Track foreign word data
      foreignWords.push({
        originalWord: token.original,
        foreignWord,
        startIndex: start,
        endIndex: start + marker.length,
        wordEntry: entry,
      });
    }

    // Reverse foreignWords to maintain original order
    foreignWords.reverse();

    const stats: ReplacementStats = {
      totalTokens: tokens.length,
      eligibleTokens: candidates.length,
      replacedTokens: selected.length,
      protectedTokens: tokens.filter(t => t.isProtected).length,
      densitySkipped: candidates.length - selected.length,
    };

    return {
      html: modifiedHtml,
      foreignWords,
      stats,
    };
  }

  /**
   * Build list of replacement candidates from tokens
   */
  private buildCandidates(
    tokens: Token[],
    wordEntries: Map<string, WordEntry | null>
  ): ReplacementCandidate[] {
    const candidates: ReplacementCandidate[] = [];

    for (const token of tokens) {
      // Skip protected tokens
      if (token.isProtected) {
        continue;
      }

      // Skip excluded words
      if (this.options.excludeWords.has(token.word)) {
        continue;
      }

      // Get word entry
      const entry = wordEntries.get(token.word);
      if (!entry) {
        continue;
      }

      // Check proficiency level
      if (!this.isWithinProficiency(entry.proficiencyLevel)) {
        continue;
      }

      // Calculate replacement score
      const score = this.calculateScore(token, entry);

      candidates.push({ token, entry, score });
    }

    return candidates;
  }

  /**
   * Select which candidates to replace based on density and strategy
   */
  private selectReplacements(
    candidates: ReplacementCandidate[],
    totalTokens: number
  ): ReplacementCandidate[] {
    if (candidates.length === 0) {
      return [];
    }

    // Calculate target count based on density
    const targetCount = Math.max(1, Math.floor(totalTokens * this.options.density));

    switch (this.options.selectionStrategy) {
      case 'frequency':
        return this.selectByFrequency(candidates, targetCount);
      case 'distributed':
        return this.selectDistributed(candidates, targetCount);
      case 'random':
      default:
        return this.selectRandom(candidates, targetCount);
    }
  }

  /**
   * Select words randomly
   */
  private selectRandom(
    candidates: ReplacementCandidate[],
    targetCount: number
  ): ReplacementCandidate[] {
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return this.applySpacingConstraint(shuffled, targetCount);
  }

  /**
   * Select words by frequency (prefer more common words)
   */
  private selectByFrequency(
    candidates: ReplacementCandidate[],
    targetCount: number
  ): ReplacementCandidate[] {
    // Sort by frequency rank (lower = more common)
    const sorted = [...candidates].sort(
      (a, b) => a.entry.frequencyRank - b.entry.frequencyRank
    );
    return this.applySpacingConstraint(sorted, targetCount);
  }

  /**
   * Select words distributed evenly throughout the text
   */
  private selectDistributed(
    candidates: ReplacementCandidate[],
    targetCount: number
  ): ReplacementCandidate[] {
    if (candidates.length <= targetCount) {
      return this.applySpacingConstraint(candidates, targetCount);
    }

    // Sort by position
    const sorted = [...candidates].sort(
      (a, b) => a.token.startIndex - b.token.startIndex
    );

    // Select evenly distributed indices
    const step = sorted.length / targetCount;
    const selected: ReplacementCandidate[] = [];

    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step + Math.random() * step * 0.5);
      if (index < sorted.length) {
        selected.push(sorted[index]);
      }
    }

    return this.applySpacingConstraint(selected, targetCount);
  }

  /**
   * Apply minimum word spacing constraint
   */
  private applySpacingConstraint(
    candidates: ReplacementCandidate[],
    maxCount: number
  ): ReplacementCandidate[] {
    if (this.options.minWordSpacing <= 0) {
      return candidates.slice(0, maxCount);
    }

    // Sort by position
    const sorted = [...candidates].sort(
      (a, b) => a.token.startIndex - b.token.startIndex
    );

    const selected: ReplacementCandidate[] = [];
    let lastPosition = -Infinity;

    for (const candidate of sorted) {
      if (selected.length >= maxCount) {
        break;
      }

      // Check spacing from last selected word
      // Use a rough estimate of word positions
      const wordsBetween = Math.floor(
        (candidate.token.startIndex - lastPosition) / 6 // Rough average word length
      );

      if (wordsBetween >= this.options.minWordSpacing) {
        selected.push(candidate);
        lastPosition = candidate.token.endIndex;
      }
    }

    return selected;
  }

  /**
   * Calculate a score for replacement priority
   */
  private calculateScore(token: Token, entry: WordEntry): number {
    let score = 100;

    // Prefer lower frequency rank (more common words)
    score -= Math.min(50, entry.frequencyRank / 100);

    // Prefer certain parts of speech
    if (
      this.options.preferredPartsOfSpeech.length > 0 &&
      this.options.preferredPartsOfSpeech.includes(entry.partOfSpeech)
    ) {
      score += 20;
    }

    // Prefer words that are not at sentence boundaries
    if (!token.prefix.match(/[.!?]\s*$/)) {
      score += 10;
    }

    // Prefer shorter words (easier to understand from context)
    if (token.word.length <= 6) {
      score += 5;
    }

    return score;
  }

  /**
   * Check if proficiency level is within max allowed
   */
  private isWithinProficiency(level: ProficiencyLevel): boolean {
    const maxIndex = PROFICIENCY_ORDER.indexOf(this.options.maxProficiency);
    const levelIndex = PROFICIENCY_ORDER.indexOf(level);
    return levelIndex <= maxIndex;
  }

  /**
   * Preserve the original word's case pattern
   */
  private preserveCase(original: string, replacement: string): string {
    if (!original || !replacement) {
      return replacement;
    }

    // All uppercase
    if (original === original.toUpperCase() && original.length > 1) {
      return replacement.toUpperCase();
    }

    // Title case (first letter uppercase)
    if (
      original[0] === original[0].toUpperCase() &&
      original.slice(1) === original.slice(1).toLowerCase()
    ) {
      return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
    }

    // All lowercase
    return replacement.toLowerCase();
  }

  /**
   * Create HTML marker for a foreign word
   */
  private createMarker(
    foreignWord: string,
    entry: WordEntry,
    token: Token
  ): string {
    const attrs = [
      `class="foreign-word"`,
      `data-original="${this.escapeHtml(entry.sourceWord)}"`,
      `data-word-id="${this.escapeHtml(entry.id)}"`,
      `data-pos="${this.escapeHtml(entry.partOfSpeech)}"`,
    ];

    if (entry.pronunciation) {
      attrs.push(`data-pronunciation="${this.escapeHtml(entry.pronunciation)}"`);
    }

    return `<span ${attrs.join(' ')}>${this.escapeHtml(foreignWord)}</span>`;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Update replacer options
   */
  updateOptions(options: Partial<ReplacerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): Required<ReplacerOptions> {
    return { ...this.options };
  }
}

// Export factory function
export function createWordReplacer(options?: Partial<ReplacerOptions>): WordReplacer {
  return new WordReplacer(options);
}
