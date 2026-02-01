/**
 * Book Parser - Re-export from xenolexia-typescript core.
 */

export {
  BookParserService,
  EPUBParser,
  TXTParser,
  MOBIParser,
  ChapterContentService,
  TextProcessingService,
  EPUBExtractor,
  MetadataExtractor,
  extractEPUBMetadata,
  extractEPUBInfo,
  extractEPUBCover,
} from 'xenolexia-typescript';
export type { IBookParser, ParserOptions, SearchResult } from 'xenolexia-typescript';
