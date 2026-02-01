/**
 * Unit tests for ChapterContentService (xenolexia-typescript core) - getChapterHtml with and without translation
 */

import { getCore } from '../electronCore';
import type { Chapter } from 'xenolexia-typescript';

const createTranslationEngine = jest.fn();
jest.mock('xenolexia-typescript', () => {
  const actual = jest.requireActual('xenolexia-typescript');
  return { ...actual, createTranslationEngine };
});

jest.mock('../utils/FileSystem.electron', () => ({
  readFileAsBase64: jest.fn().mockResolvedValue(''),
}));

describe('ChapterContentService', () => {
  let service: ReturnType<ReturnType<typeof getCore>['createChapterContentService']>;
  const baseStyles = {
    fontFamily: 'Georgia',
    fontSize: 18,
    lineHeight: 1.6,
    textAlign: 'left' as const,
    marginHorizontal: 24,
    theme: 'light' as const,
    foreignWordColor: '#6366f1',
  };

  beforeEach(() => {
    createTranslationEngine.mockImplementation(() => ({
      processContent: jest.fn().mockResolvedValue({
        content: '',
        foreignWords: [],
        stats: { totalWords: 0, eligibleWords: 0, replacedWords: 0, processingTime: 0 },
      }),
    }));
    service = getCore().createChapterContentService(createTranslationEngine as any);
    jest.clearAllMocks();
  });

  describe('getChapterHtml', () => {
    const chapter: Chapter = {
      id: 'ch1',
      title: 'Chapter 1',
      index: 0,
      content: '<p>Hello world. This is a test.</p>',
      wordCount: 5,
    };

    it('should return html, baseStyles, scripts without translation options', async () => {
      const result = await service.getChapterHtml(chapter, baseStyles);
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
      expect(result.baseStyles).toBeDefined();
      expect(result.scripts).toBeDefined();
      expect(createTranslationEngine).not.toHaveBeenCalled();
      expect(result.foreignWords).toEqual([]);
    });

    it('should call TranslationEngine when translationOptions provided', async () => {
      const mockProcessContent = jest.fn().mockResolvedValue({
        content: '<p>Hello <span class="foreign-word" data-original="world">κόσμος</span>.</p>',
        foreignWords: [
          {
            originalWord: 'world',
            foreignWord: 'κόσμος',
            startIndex: 0,
            endIndex: 5,
            wordEntry: {
              id: '1',
              sourceWord: 'world',
              targetWord: 'κόσμος',
              sourceLanguage: 'en',
              targetLanguage: 'el',
              proficiencyLevel: 'beginner',
              frequencyRank: 1,
              partOfSpeech: 'noun',
              variants: [],
            },
          },
        ],
        stats: {totalWords: 5, eligibleWords: 1, replacedWords: 1, processingTime: 0},
      });
      createTranslationEngine.mockReturnValue({
        processContent: mockProcessContent,
      });

      const result = await service.getChapterHtml(chapter, baseStyles, {
        sourceLanguage: 'en',
        targetLanguage: 'el',
        proficiencyLevel: 'beginner',
        density: 0.2,
      });

      expect(createTranslationEngine).toHaveBeenCalledWith({
        sourceLanguage: 'en',
        targetLanguage: 'el',
        proficiencyLevel: 'beginner',
        density: 0.2,
      });
      expect(mockProcessContent).toHaveBeenCalledWith(chapter.content);
      expect(result.foreignWords).toHaveLength(1);
      const first = result.foreignWords?.[0];
      expect(first?.originalWord).toBe('world');
      expect(first?.foreignWord).toBe('κόσμος');
      expect(result.html).toContain('foreign-word');
    });

    it('should return original content and empty foreignWords when translation fails', async () => {
      createTranslationEngine.mockReturnValue({
        processContent: jest.fn().mockRejectedValue(new Error('Translation failed')),
      });

      const result = await service.getChapterHtml(chapter, baseStyles, {
        sourceLanguage: 'en',
        targetLanguage: 'el',
        proficiencyLevel: 'beginner',
        density: 0.2,
      });

      expect(result.html).toBeDefined();
      expect(result.foreignWords).toEqual([]);
    });
  });
});
