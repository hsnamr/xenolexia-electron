/**
 * Book Parser Service - Parses various e-book formats
 */

// Main service and parser
export {BookParserService} from './BookParserService';
export {EPUBParser} from './EPUBParser';

// Chapter content service
export {ChapterContentService, chapterContentService} from './ChapterContentService';
export type {ChapterStyles, ProcessedChapterContent} from './ChapterContentService';

// Text processing service (tokenization, word replacement)
export {TextProcessingService, textProcessingService} from './TextProcessingService';
export type {
  ProcessingOptions,
  ProcessedContent,
  ProcessingStats,
  ExtractedContent,
} from './TextProcessingService';

// Low-level utilities
export {EPUBExtractor} from './EPUBExtractor';
export type {
  EPUBContainer,
  EPUBManifestItem,
  EPUBSpineItem,
  EPUBPackage,
  EPUBRawMetadata,
} from './EPUBExtractor';

// TOC parsing
export {parseNCX, parseNAV, flattenTOC, countTOCItems, findTOCItemByHref} from './TOCParser';
export type {TOCParseResult, PageListItem} from './TOCParser';

// Metadata extraction
export {
  MetadataExtractor,
  extractEPUBMetadata,
  extractEPUBInfo,
  extractEPUBCover,
} from './MetadataExtractor';
export type {ExtractedMetadata, CoverExtractionResult} from './MetadataExtractor';

// Types
export type {IBookParser, SearchResult, ParserOptions} from './types';
