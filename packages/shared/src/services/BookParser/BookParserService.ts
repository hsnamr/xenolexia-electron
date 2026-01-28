/**
 * Book Parser Service - Factory for creating appropriate parsers
 */

import type {BookFormat, ParsedBook} from '../types/index';
import type {IBookParser, ParserOptions} from './types';
import {EPUBParser} from './EPUBParser';
import {TXTParser} from './TXTParser';
import {FB2Parser} from './FB2Parser';
import {MOBIParser} from './MOBIParser';

export class BookParserService {
  private static parsers: Map<string, IBookParser> = new Map();

  /**
   * Parse a book file based on its format
   */
  static async parse(
    filePath: string,
    format: BookFormat,
    options?: ParserOptions,
  ): Promise<ParsedBook> {
    const parser = this.getParser(filePath, format, options);
    return parser.parse(filePath);
  }

  /**
   * Get or create a parser for the given file
   */
  static getParser(
    filePath: string,
    format: BookFormat,
    options?: ParserOptions,
  ): IBookParser {
    // Check if we already have a parser for this file
    const existingParser = this.parsers.get(filePath);
    if (existingParser) {
      return existingParser;
    }

    // Create appropriate parser based on format
    let parser: IBookParser;
    switch (format) {
      case 'epub':
        parser = new EPUBParser(options);
        break;
      case 'fb2':
        parser = new FB2Parser();
        break;
      case 'mobi':
        parser = new MOBIParser();
        break;
      case 'txt':
        parser = new TXTParser();
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    this.parsers.set(filePath, parser);
    return parser;
  }

  /**
   * Detect book format from file extension
   */
  static detectFormat(filePath: string): BookFormat {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'epub':
        return 'epub';
      case 'fb2':
        return 'fb2';
      case 'mobi':
      case 'azw':
      case 'azw3':
        return 'mobi';
      case 'txt':
        return 'txt';
      default:
        throw new Error(`Unknown file extension: ${extension}`);
    }
  }

  /**
   * Clean up a specific parser
   */
  static dispose(filePath: string): void {
    const parser = this.parsers.get(filePath);
    if (parser) {
      parser.dispose();
      this.parsers.delete(filePath);
    }
  }

  /**
   * Clean up all parsers
   */
  static disposeAll(): void {
    this.parsers.forEach(parser => parser.dispose());
    this.parsers.clear();
  }
}
