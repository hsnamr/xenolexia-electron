/**
 * EPUB Parser - Parses EPUB format e-books
 *
 * Uses EPUBExtractor for low-level ZIP handling and XML parsing,
 * and MetadataExtractor for high-level metadata extraction.
 */

import type {
  BookMetadata,
  Chapter,
  TableOfContentsItem,
  ParsedBook,
} from '@/types';

import {EPUBExtractor} from './EPUBExtractor';
import type {EPUBPackage, EPUBManifestItem} from './EPUBExtractor';
import {parseNCX, parseNAV, flattenTOC} from './TOCParser';
import type {IBookParser, SearchResult, ParserOptions} from './types';

// ============================================================================
// EPUB Parser Implementation
// ============================================================================

export class EPUBParser implements IBookParser {
  private extractor: EPUBExtractor;
  private epubPackage: EPUBPackage | null = null;
  private metadata: BookMetadata | null = null;
  private chapters: Chapter[] = [];
  private toc: TableOfContentsItem[] = [];
  private options: ParserOptions;
  private loaded: boolean = false;

  constructor(options?: ParserOptions) {
    this.extractor = new EPUBExtractor();
    this.options = {
      extractImages: true,
      maxImageSize: 5 * 1024 * 1024, // 5MB
      ...options,
    };
  }

  /**
   * Parse an EPUB file and extract its content
   */
  async parse(filePath: string): Promise<ParsedBook> {
    try {
      // Load the EPUB file
      await this.extractor.load(filePath);

      // Parse container.xml to find OPF location
      const container = await this.extractor.parseContainer();

      // Parse the OPF package document
      this.epubPackage = await this.extractor.parsePackage(container.rootFilePath);

      // Extract metadata
      this.metadata = this.buildMetadata();

      // Extract table of contents
      this.toc = await this.extractTableOfContents();

      // Extract chapters from spine
      this.chapters = await this.extractChapters();

      // Calculate total word count
      const totalWordCount = this.chapters.reduce(
        (sum, ch) => sum + ch.wordCount,
        0,
      );

      this.loaded = true;

      return {
        metadata: this.metadata,
        chapters: this.chapters,
        tableOfContents: this.toc,
        totalWordCount,
      };
    } catch (error) {
      console.error('Failed to parse EPUB:', error);
      throw new Error(
        `Failed to parse EPUB: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Build BookMetadata from EPUB package metadata
   */
  private buildMetadata(): BookMetadata {
    if (!this.epubPackage) {
      return {title: 'Unknown', author: 'Unknown'};
    }

    const raw = this.epubPackage.metadata;

    return {
      title: raw.title,
      author: raw.creator,
      description: raw.description,
      publisher: raw.publisher,
      publishDate: raw.date,
      isbn: this.extractISBN(raw.identifier),
      subjects: raw.subject,
      language: raw.language,
    };
  }

  /**
   * Extract ISBN from identifier string
   */
  private extractISBN(identifier?: string): string | undefined {
    if (!identifier) return undefined;

    // ISBN-13
    const isbn13Match = identifier.match(/(?:ISBN[:\s-]?)?(\d{13})/i);
    if (isbn13Match) return isbn13Match[1];

    // ISBN-10
    const isbn10Match = identifier.match(/(?:ISBN[:\s-]?)?(\d{9}[\dXx])/i);
    if (isbn10Match) return isbn10Match[1];

    // URN format
    const urnMatch = identifier.match(/urn:isbn:(\d{10}|\d{13})/i);
    if (urnMatch) return urnMatch[1];

    return undefined;
  }

  /**
   * Extract table of contents
   */
  private async extractTableOfContents(): Promise<TableOfContentsItem[]> {
    if (!this.epubPackage) return [];

    const tocId = this.epubPackage.tocId;
    if (!tocId) {
      return this.generateTOCFromSpine();
    }

    const tocItem = this.epubPackage.manifest.get(tocId);
    if (!tocItem) {
      return this.generateTOCFromSpine();
    }

    try {
      const tocContent = await this.extractor.getFile(tocItem.href);

      // Parse based on format
      if (
        tocItem.mediaType === 'application/x-dtbncx+xml' ||
        tocItem.href.endsWith('.ncx')
      ) {
        // NCX format (EPUB 2)
        return parseNCX(tocContent).items;
      } else {
        // NAV format (EPUB 3)
        return parseNAV(tocContent).items;
      }
    } catch (error) {
      console.warn('Failed to parse TOC, generating from spine:', error);
      return this.generateTOCFromSpine();
    }
  }

  /**
   * Generate basic TOC from spine when no proper TOC exists
   */
  private generateTOCFromSpine(): TableOfContentsItem[] {
    if (!this.epubPackage) return [];

    const items: TableOfContentsItem[] = [];
    let chapterNum = 1;

    for (const spineItem of this.epubPackage.spine) {
      if (!spineItem.linear) continue;

      const manifestItem = this.epubPackage.manifest.get(spineItem.idref);
      if (manifestItem) {
        items.push({
          id: spineItem.idref,
          title: `Chapter ${chapterNum++}`,
          href: manifestItem.href,
          level: 0,
        });
      }
    }

    return items;
  }

  /**
   * Extract chapters from spine
   */
  private async extractChapters(): Promise<Chapter[]> {
    if (!this.epubPackage) return [];

    const chapters: Chapter[] = [];
    const flatToc = flattenTOC(this.toc);

    for (let index = 0; index < this.epubPackage.spine.length; index++) {
      const spineItem = this.epubPackage.spine[index];
      if (!spineItem.linear) continue;

      const manifestItem = this.epubPackage.manifest.get(spineItem.idref);
      if (!manifestItem) continue;

      try {
        let content = await this.extractor.getFile(manifestItem.href);

        // Resolve and inline stylesheets
        content = await this.extractor.resolveStylesheets(
          content,
          this.epubPackage.manifest
        );

        // Find title from TOC or generate one
        const tocEntry = flatToc.find(item => {
          const tocHref = item.href.split('#')[0];
          return tocHref === manifestItem.href;
        });

        const title = tocEntry?.title || this.extractTitleFromContent(content) || `Chapter ${chapters.length + 1}`;

        // Count words
        const wordCount = this.countWords(content);

        chapters.push({
          id: spineItem.idref,
          title,
          index: chapters.length,
          content,
          wordCount,
          href: manifestItem.href,
        });
      } catch (error) {
        console.warn(`Failed to load chapter ${manifestItem.href}:`, error);
      }
    }

    return chapters;
  }

  /**
   * Extract title from HTML content
   */
  private extractTitleFromContent(html: string): string | null {
    // Try <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // Try first <h1> tag
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Try first <h2> tag
    const h2Match = html.match(/<h2[^>]*>([^<]+)<\/h2>/i);
    if (h2Match) {
      return h2Match[1].trim();
    }

    return null;
  }

  /**
   * Get chapter content with resolved stylesheets and images
   */
  async getProcessedChapter(index: number): Promise<Chapter> {
    const chapter = await this.getChapter(index);

    // Content should already have stylesheets resolved from extractChapters
    // But we can do additional processing if needed

    return chapter;
  }

  /**
   * Get all stylesheets from the EPUB
   */
  async getStylesheets(): Promise<Map<string, string>> {
    if (!this.epubPackage) return new Map();
    return this.extractor.getAllStylesheets(this.epubPackage.manifest);
  }

  /**
   * List all files in the EPUB (for debugging)
   */
  listFiles(): string[] {
    return this.extractor.listFiles();
  }

  /**
   * Get a specific chapter by index
   */
  async getChapter(index: number): Promise<Chapter> {
    if (index < 0 || index >= this.chapters.length) {
      throw new Error(`Chapter index out of bounds: ${index}`);
    }
    return this.chapters[index];
  }

  /**
   * Get the table of contents
   */
  getTableOfContents(): TableOfContentsItem[] {
    return this.toc;
  }

  /**
   * Search for text within the book
   */
  async search(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const chapter of this.chapters) {
      // Strip HTML and search
      const plainText = this.stripHtml(chapter.content);
      let position = 0;

      while (true) {
        const foundPos = plainText.toLowerCase().indexOf(lowerQuery, position);
        if (foundPos === -1) break;

        // Extract excerpt around the match
        const start = Math.max(0, foundPos - 50);
        const end = Math.min(plainText.length, foundPos + query.length + 50);
        const excerpt = plainText.substring(start, end);

        results.push({
          chapterIndex: chapter.index,
          chapterTitle: chapter.title,
          excerpt:
            (start > 0 ? '...' : '') +
            excerpt +
            (end < plainText.length ? '...' : ''),
          position: foundPos,
        });

        position = foundPos + 1;
      }
    }

    return results;
  }

  /**
   * Get book metadata
   */
  getMetadata(): BookMetadata {
    if (!this.metadata) {
      throw new Error('Book not parsed yet');
    }
    return this.metadata;
  }

  /**
   * Get cover image as base64
   */
  async getCoverImage(): Promise<{data: string; mimeType: string} | null> {
    if (!this.epubPackage) return null;

    const coverId = this.epubPackage.coverImageId;
    if (!coverId) return null;

    const coverItem = this.epubPackage.manifest.get(coverId);
    if (!coverItem) return null;

    try {
      const data = await this.extractor.getBase64File(coverItem.href);
      return {
        data,
        mimeType: coverItem.mediaType,
      };
    } catch (error) {
      console.warn('Failed to get cover image:', error);
      return null;
    }
  }

  /**
   * Get EPUB version
   */
  getVersion(): string {
    return this.epubPackage?.version || 'unknown';
  }

  /**
   * Check if EPUB has been loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.extractor.dispose();
    this.epubPackage = null;
    this.metadata = null;
    this.chapters = [];
    this.toc = [];
    this.loaded = false;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Count words in HTML content
   */
  private countWords(html: string): number {
    const plainText = this.stripHtml(html);
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }
}
