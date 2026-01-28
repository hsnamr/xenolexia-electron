/**
 * FB2 Parser - Parses FictionBook 2.0 format
 * 
 * FB2 is an XML-based e-book format. This parser uses DOMParser
 * (available in browsers and Electron) or a fallback XML parser.
 */

import type {IBookParser, ParsedBook, Chapter, BookMetadata, TableOfContentsItem} from '../types';

// ============================================================================
// FB2 Parser Implementation
// ============================================================================

export class FB2Parser implements IBookParser {
  private filePath: string | null = null;
  private xmlContent: string | null = null;
  private document: Document | null = null;
  private metadata: BookMetadata | null = null;
  private chapters: Chapter[] = [];
  private toc: TableOfContentsItem[] = [];

  /**
   * Parse an FB2 file
   */
  async parse(filePath: string): Promise<ParsedBook> {
    this.filePath = filePath;
    
    // Read file content
    let content: string;
    try {
      const RNFS = require('react-native-fs');
      content = await RNFS.readFile(filePath, 'utf8');
    } catch (error) {
      if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
        const response = await fetch(filePath);
        content = await response.text();
      } else {
        throw new Error(`Cannot read FB2 file: ${filePath}`);
      }
    }
    
    this.xmlContent = content;
    
    // Parse XML
    this.document = this.parseXML(content);
    
    // Extract metadata
    this.metadata = this.extractMetadata();
    
    // Extract chapters
    this.chapters = this.extractChapters();
    
    // Extract table of contents
    this.toc = this.extractTableOfContents();
    
    // Calculate total word count
    const totalWordCount = this.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    
    return {
      metadata: this.metadata,
      chapters: this.chapters,
      tableOfContents: this.toc,
      totalWordCount,
    };
  }

  /**
   * Parse XML string to Document
   */
  private parseXML(xmlString: string): Document {
    // Try DOMParser (browser/Electron)
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error(`XML parsing error: ${parserError.textContent}`);
      }
      
      return doc;
    }
    
    // Fallback: simple regex-based parsing (basic support)
    // This is a minimal fallback - DOMParser is preferred
    throw new Error('DOMParser not available. FB2 parsing requires XML support.');
  }

  /**
   * Extract metadata from FB2 document
   */
  private extractMetadata(): BookMetadata {
    if (!this.document) {
      return {title: 'Unknown', author: 'Unknown'};
    }
    
    // FB2 structure: <FictionBook><description><title-info>...
    const titleInfo = this.document.querySelector('title-info');
    if (!titleInfo) {
      return {title: 'Unknown', author: 'Unknown'};
    }
    
    // Extract title
    const titleElement = titleInfo.querySelector('book-title');
    const title = titleElement?.textContent?.trim() || 'Untitled';
    
    // Extract author (first-name + last-name)
    const authorElement = titleInfo.querySelector('author');
    let author: string | undefined;
    if (authorElement) {
      const firstName = authorElement.querySelector('first-name')?.textContent?.trim() || '';
      const lastName = authorElement.querySelector('last-name')?.textContent?.trim() || '';
      const middleName = authorElement.querySelector('middle-name')?.textContent?.trim() || '';
      author = [firstName, middleName, lastName].filter(Boolean).join(' ') || undefined;
    }
    
    // Extract description
    const annotation = titleInfo.querySelector('annotation');
    const description = annotation?.textContent?.trim() || undefined;
    
    // Extract language
    const langElement = titleInfo.querySelector('lang');
    const language = langElement?.textContent?.trim() || undefined;
    
    return {
      title,
      author,
      description,
      language,
    };
  }

  /**
   * Extract chapters from FB2 body
   */
  private extractChapters(): Chapter[] {
    if (!this.document) {
      return [];
    }
    
    // FB2 structure: <FictionBook><body><section>...
    const body = this.document.querySelector('body');
    if (!body) {
      return [];
    }
    
    const sections = body.querySelectorAll('section');
    const chapters: Chapter[] = [];
    
    sections.forEach((section, index) => {
      // Extract section title
      const titleElement = section.querySelector('title > p, title');
      const title = titleElement?.textContent?.trim() || `Chapter ${index + 1}`;
      
      // Extract all paragraphs in this section
      const paragraphs = section.querySelectorAll('p');
      const contentParts: string[] = [];
      
      paragraphs.forEach(p => {
        const text = p.textContent?.trim();
        if (text) {
          contentParts.push(`<p>${this.escapeHtml(text)}</p>`);
        }
      });
      
      // If no paragraphs, try to get all text content
      if (contentParts.length === 0) {
        const text = section.textContent?.trim();
        if (text) {
          contentParts.push(`<p>${this.escapeHtml(text)}</p>`);
        }
      }
      
      const content = contentParts.join('\n') || '<p>No content</p>';
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      
      chapters.push({
        id: `chapter-${index}`,
        title,
        index,
        content,
        wordCount,
      });
    });
    
    // If no sections, treat entire body as one chapter
    if (chapters.length === 0) {
      const text = body.textContent?.trim() || '';
      const content = `<p>${this.escapeHtml(text)}</p>`;
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      
      chapters.push({
        id: 'chapter-0',
        title: 'Chapter 1',
        index: 0,
        content,
        wordCount,
      });
    }
    
    return chapters;
  }

  /**
   * Extract table of contents from FB2
   */
  private extractTableOfContents(): TableOfContentsItem[] {
    if (!this.document) {
      return [];
    }
    
    // FB2 can have a custom TOC in <body><title> or we can use sections
    const body = this.document.querySelector('body');
    if (!body) {
      return [];
    }
    
    const sections = body.querySelectorAll('section');
    const toc: TableOfContentsItem[] = [];
    
    sections.forEach((section, index) => {
      const titleElement = section.querySelector('title > p, title');
      const title = titleElement?.textContent?.trim() || `Chapter ${index + 1}`;
      
      toc.push({
        id: `chapter-${index}`,
        title,
        href: `#chapter-${index}`,
        level: 1,
      });
    });
    
    // If no sections, add single entry
    if (toc.length === 0) {
      toc.push({
        id: 'chapter-0',
        title: 'Chapter 1',
        href: '#chapter-0',
        level: 1,
      });
    }
    
    return toc;
  }

  /**
   * Get a specific chapter
   */
  async getChapter(index: number): Promise<Chapter> {
    if (index < 0 || index >= this.chapters.length) {
      throw new Error(`Chapter index ${index} out of range`);
    }
    
    return this.chapters[index];
  }

  /**
   * Get table of contents
   */
  getTableOfContents(): TableOfContentsItem[] {
    return this.toc;
  }

  /**
   * Get metadata
   */
  getMetadata(): BookMetadata {
    if (!this.metadata) {
      return {title: 'Unknown', author: 'Unknown'};
    }
    return this.metadata;
  }

  /**
   * Search within the book
   */
  async search(query: string): Promise<Array<{chapterIndex: number; chapterTitle: string; excerpt: string; position: number}>> {
    if (!this.xmlContent) {
      return [];
    }
    
    const results: Array<{chapterIndex: number; chapterTitle: string; excerpt: string; position: number}> = [];
    const lowerQuery = query.toLowerCase();
    
    this.chapters.forEach((chapter, chapterIndex) => {
      const content = chapter.content.toLowerCase();
      let position = 0;
      
      while ((position = content.indexOf(lowerQuery, position)) !== -1) {
        const start = Math.max(0, position - 50);
        const end = Math.min(content.length, position + query.length + 50);
        const excerpt = chapter.content.substring(start, end);
        
        results.push({
          chapterIndex,
          chapterTitle: chapter.title,
          excerpt,
          position,
        });
        
        position += query.length;
      }
    });
    
    return results;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.filePath = null;
    this.xmlContent = null;
    this.document = null;
    this.metadata = null;
    this.chapters = [];
    this.toc = [];
  }
}
