/**
 * ExportService Tests
 */

import { exportService } from '@services/ExportService';
import { createMockVocabularyList, createMockVocabularyItem } from '../utils/testUtils';

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  ExternalDirectoryPath: '/mock/external',
  writeFile: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

// Mock Share
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Share: {
    share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
  },
}));

describe('ExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('export', () => {
    it('should return error when vocabulary is empty', async () => {
      const result = await exportService.export([], { format: 'csv' });
      
      expect(result.success).toBe(false);
      expect(result.itemCount).toBe(0);
      expect(result.error).toContain('No vocabulary items');
    });

    it('should export vocabulary to CSV format', async () => {
      const vocabulary = createMockVocabularyList(3);
      
      const result = await exportService.export(vocabulary, { format: 'csv' });
      
      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(3);
      expect(result.fileName).toContain('.csv');
    });

    it('should export vocabulary to Anki format', async () => {
      const vocabulary = createMockVocabularyList(3);
      
      const result = await exportService.export(vocabulary, { format: 'anki' });
      
      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(3);
      expect(result.fileName).toContain('.txt');
    });

    it('should export vocabulary to JSON format', async () => {
      const vocabulary = createMockVocabularyList(3);
      
      const result = await exportService.export(vocabulary, { format: 'json' });
      
      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(3);
      expect(result.fileName).toContain('.json');
    });

    it('should filter vocabulary by status', async () => {
      const vocabulary = [
        createMockVocabularyItem({ id: '1', status: 'new' }),
        createMockVocabularyItem({ id: '2', status: 'learning' }),
        createMockVocabularyItem({ id: '3', status: 'learned' }),
      ];
      
      const result = await exportService.export(vocabulary, {
        format: 'csv',
        filterByStatus: ['new', 'learning'],
      });
      
      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(2);
    });

    it('should filter vocabulary by language', async () => {
      const vocabulary = [
        createMockVocabularyItem({ id: '1', sourceLanguage: 'en', targetLanguage: 'es' }),
        createMockVocabularyItem({ id: '2', sourceLanguage: 'en', targetLanguage: 'fr' }),
        createMockVocabularyItem({ id: '3', sourceLanguage: 'en', targetLanguage: 'es' }),
      ];
      
      const result = await exportService.export(vocabulary, {
        format: 'csv',
        filterByLanguage: { target: 'es' },
      });
      
      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(2);
    });

    it('should include context when option is set', async () => {
      const vocabulary = [
        createMockVocabularyItem({ contextSentence: 'Test context sentence' }),
      ];
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, {
        format: 'csv',
        includeContext: true,
      });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      
      expect(content).toContain('context_sentence');
      expect(content).toContain('Test context sentence');
    });

    it('should include SRS data when option is set', async () => {
      const vocabulary = [
        createMockVocabularyItem({ easeFactor: 2.5, interval: 10 }),
      ];
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, {
        format: 'csv',
        includeSRSData: true,
      });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      
      expect(content).toContain('ease_factor');
      expect(content).toContain('interval');
    });
  });

  describe('CSV generation', () => {
    it('should escape commas in CSV values', async () => {
      const vocabulary = [
        createMockVocabularyItem({ sourceWord: 'hello, world' }),
      ];
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, { format: 'csv' });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      
      // Commas should be quoted
      expect(content).toContain('"hello, world"');
    });

    it('should escape quotes in CSV values', async () => {
      const vocabulary = [
        createMockVocabularyItem({ sourceWord: 'say "hello"' }),
      ];
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, { format: 'csv' });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      
      // Quotes should be doubled and quoted
      expect(content).toContain('"say ""hello"""');
    });
  });

  describe('Anki format', () => {
    it('should include proper Anki headers', async () => {
      const vocabulary = createMockVocabularyList(1);
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, { format: 'anki' });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      
      expect(content).toContain('#separator:tab');
      expect(content).toContain('#html:true');
      expect(content).toContain('#tags column:3');
    });

    it('should use tab separator', async () => {
      const vocabulary = [
        createMockVocabularyItem({ targetWord: 'hola', sourceWord: 'hello' }),
      ];
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, { format: 'anki' });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      const lines = content.split('\n');
      const dataLine = lines.find((l: string) => !l.startsWith('#'));
      
      expect(dataLine).toContain('\t');
    });

    it('should include language tags', async () => {
      const vocabulary = [
        createMockVocabularyItem({ sourceLanguage: 'en', targetLanguage: 'es', status: 'learning' }),
      ];
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, { format: 'anki' });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      
      expect(content).toContain('en-es');
      expect(content).toContain('learning');
    });
  });

  describe('JSON format', () => {
    it('should create valid JSON', async () => {
      const vocabulary = createMockVocabularyList(3);
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, { format: 'json' });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should include metadata in JSON', async () => {
      const vocabulary = createMockVocabularyList(2);
      
      const RNFS = require('react-native-fs');
      
      await exportService.export(vocabulary, { format: 'json' });
      
      const writeCall = RNFS.writeFile.mock.calls[0];
      const content = writeCall[1];
      const parsed = JSON.parse(content);
      
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('itemCount', 2);
      expect(parsed).toHaveProperty('format', 'xenolexia-vocabulary-v1');
      expect(parsed).toHaveProperty('items');
    });
  });

  describe('getFormatDescription', () => {
    it('should return description for CSV', () => {
      const desc = (exportService.constructor as any).getFormatDescription('csv');
      expect(desc).toContain('CSV');
    });

    it('should return description for Anki', () => {
      const desc = (exportService.constructor as any).getFormatDescription('anki');
      expect(desc).toContain('Anki');
    });

    it('should return description for JSON', () => {
      const desc = (exportService.constructor as any).getFormatDescription('json');
      expect(desc).toContain('JSON');
    });
  });
});
