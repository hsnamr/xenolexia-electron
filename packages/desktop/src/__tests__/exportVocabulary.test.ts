/**
 * Unit tests for exportVocabulary - CSV, Anki, JSON export (desktop)
 */

import {
  generateExportContent,
  getSuggestedFilename,
  getSaveDialogFilters,
  type ExportFormat,
} from '../utils/exportVocabulary';
import type {VocabularyItem} from '@xenolexia/shared/types';

const baseItem: VocabularyItem = {
  id: 'v1',
  sourceWord: 'hello',
  targetWord: 'hola',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  contextSentence: null,
  bookId: null,
  bookTitle: null,
  addedAt: new Date('2024-01-15T10:00:00Z'),
  lastReviewedAt: null,
  reviewCount: 0,
  easeFactor: 2.5,
  interval: 0,
  status: 'new',
};

describe('exportVocabulary', () => {
  describe('generateExportContent', () => {
    it('should generate CSV with default options', () => {
      const vocabulary: VocabularyItem[] = [
        { ...baseItem, sourceWord: 'cat', targetWord: 'gato' },
      ];
      const result = generateExportContent(vocabulary, 'csv');
      expect(result).toContain('source_word,target_word,source_language,target_language');
      expect(result).toContain('context_sentence');
      expect(result).toContain('book_title');
      expect(result).toContain('status,review_count');
      expect(result).toContain('cat,gato,en,es');
    });

    it('should escape CSV fields with commas and quotes', () => {
      const vocabulary: VocabularyItem[] = [
        { ...baseItem, sourceWord: 'say', targetWord: 'decir', contextSentence: 'She said, "hello"' },
      ];
      const result = generateExportContent(vocabulary, 'csv');
      expect(result).toContain('"She said, ""hello"""');
    });

    it('should respect options.includeContext and includeSRSData', () => {
      const vocabulary: VocabularyItem[] = [{ ...baseItem }];
      const result = generateExportContent(vocabulary, 'csv', {
        includeContext: false,
        includeSRSData: false,
        includeBookInfo: false,
      });
      expect(result).not.toContain('context_sentence');
      expect(result).not.toContain('book_title');
      expect(result).not.toContain('status');
      expect(result).toContain('source_word,target_word,source_language,target_language');
    });

    it('should generate Anki format with tab separator and tags', () => {
      const vocabulary: VocabularyItem[] = [
        { ...baseItem, sourceWord: 'dog', targetWord: 'perro' },
      ];
      const result = generateExportContent(vocabulary, 'anki');
      expect(result).toContain('#separator:tab');
      expect(result).toContain('#html:true');
      expect(result).toContain('#tags column:3');
      expect(result).toContain('perro\tdog\ten-es new');
    });

    it('should include context and book in Anki back side when options set', () => {
      const vocabulary: VocabularyItem[] = [
        {
          ...baseItem,
          contextSentence: 'The dog ran.',
          bookTitle: 'My Book',
        },
      ];
      const result = generateExportContent(vocabulary, 'anki', { includeContext: true, includeBookInfo: true });
      expect(result).toContain('"The dog ran."');
      expect(result).toContain('From: My Book');
    });

    it('should generate JSON with exportedAt and itemCount', () => {
      const vocabulary: VocabularyItem[] = [
        { ...baseItem, sourceWord: 'one', targetWord: 'uno' },
        { ...baseItem, id: 'v2', sourceWord: 'two', targetWord: 'dos' },
      ];
      const result = generateExportContent(vocabulary, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.format).toBe('xenolexia-vocabulary-v1');
      expect(parsed.itemCount).toBe(2);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items[0].sourceWord).toBe('one');
      expect(parsed.items[0].targetWord).toBe('uno');
    });

    it('should include SRS fields in JSON when includeSRSData true', () => {
      const vocabulary: VocabularyItem[] = [{ ...baseItem }];
      const result = generateExportContent(vocabulary, 'json', { includeSRSData: true });
      const parsed = JSON.parse(result);
      expect(parsed.items[0].status).toBe('new');
      expect(parsed.items[0].reviewCount).toBe(0);
      expect(parsed.items[0].addedAt).toBeDefined();
    });
  });

  describe('getSuggestedFilename', () => {
    it('should return CSV filename with timestamp pattern', () => {
      const name = getSuggestedFilename('csv');
      expect(name).toMatch(/^xenolexia_vocabulary_\d{4}-\d{2}-\d{2}_\d{4}\.csv$/);
    });

    it('should return Anki filename with .txt', () => {
      const name = getSuggestedFilename('anki');
      expect(name).toMatch(/^xenolexia_anki_.*\.txt$/);
    });

    it('should return JSON filename with .json', () => {
      const name = getSuggestedFilename('json');
      expect(name).toMatch(/^xenolexia_backup_.*\.json$/);
    });

    it('should return generic name for unknown format', () => {
      const unknown = getSuggestedFilename('unknown' as ExportFormat);
      expect(unknown).toMatch(/^xenolexia_export_\d{4}-\d{2}-\d{2}_\d{4}$/);
    });
  });

  describe('getSaveDialogFilters', () => {
    it('should return CSV filter with .csv extension', () => {
      const filters = getSaveDialogFilters('csv');
      expect(filters).toEqual([{ name: 'CSV', extensions: ['csv'] }]);
    });

    it('should return Anki filter with .txt', () => {
      const filters = getSaveDialogFilters('anki');
      expect(filters).toEqual([{ name: 'Text (Anki)', extensions: ['txt'] }]);
    });

    it('should return JSON filter with .json', () => {
      const filters = getSaveDialogFilters('json');
      expect(filters).toEqual([{ name: 'JSON', extensions: ['json'] }]);
    });

    it('should return All filter for unknown format', () => {
      const filters = getSaveDialogFilters('unknown' as ExportFormat);
      expect(filters).toEqual([{ name: 'All', extensions: ['*'] }]);
    });
  });
});
