/**
 * MOBI Parser - Parses Mobipocket and Kindle (KF8/AZW3) format
 * 
 * Uses @lingo-reader/mobi-parser library for parsing MOBI files
 */

import {initMobiFile, type Mobi, type MobiSpine, type MobiMetadata, type MobiToc} from '@lingo-reader/mobi-parser';
import type {IBookParser, ParsedBook, Chapter, BookMetadata, TableOfContentsItem} from '../types';
import { readFileAsBase64 } from '../../utils/FileSystem.electron';

// ============================================================================
// MOBI Parser Implementation
// ============================================================================

export class MOBIParser implements IBookParser {
  private filePath: string | null = null;
  private mobi: Mobi | null = null;
  private metadata: BookMetadata | null = null;
  private chapters: Chapter[] = [];
  private toc: TableOfContentsItem[] = [];

  /**
   * Parse a MOBI file
   */
  async parse(filePath: string): Promise<ParsedBook> {
    this.filePath = filePath;
    
    try {
      // Read file as Uint8Array
      let fileData: Uint8Array;
      try {
        const base64Data = await readFileAsBase64(filePath);
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        fileData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          fileData[i] = binaryString.charCodeAt(i);
        }
      } catch (error) {
        if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
          const response = await fetch(filePath);
          const arrayBuffer = await response.arrayBuffer();
          fileData = new Uint8Array(arrayBuffer);
        } else {
          throw new Error(`Cannot read MOBI file: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Initialize MOBI file
      this.mobi = await initMobiFile(fileData);
      
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
    } catch (error) {
      console.error('Failed to parse MOBI:', error);
      throw new Error(
        `Failed to parse MOBI: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract metadata from MOBI file
   */
  private extractMetadata(): BookMetadata {
    if (!this.mobi) {
      return {title: 'Unknown', author: 'Unknown'};
    }
    
    try {
      const metadata: MobiMetadata = this.mobi.getMetadata();
      
      return {
        title: metadata.title || 'Untitled',
        author: metadata.author && metadata.author.length > 0 ? metadata.author.join(', ') : undefined,
        description: metadata.description || undefined,
        language: metadata.language || undefined,
      };
    } catch (error) {
      console.warn('Failed to extract MOBI metadata:', error);
      return {title: 'Untitled', author: undefined};
    }
  }

  /**
   * Extract chapters from MOBI file
   */
  private extractChapters(): Chapter[] {
    if (!this.mobi) {
      return [];
    }
    
    try {
      // Get spine (ordered list of content sections)
      const spine: MobiSpine = this.mobi.getSpine();
      const chapters: Chapter[] = [];
      
      if (spine && spine.length > 0) {
        // Process each section in the spine
        spine.forEach((chapterItem, index) => {
          try {
            // Load chapter content
            const processedChapter = this.mobi!.loadChapter(chapterItem.id);
            
            if (processedChapter && processedChapter.html) {
              // Extract title from HTML (try h1, h2, or first text)
              const titleMatch = processedChapter.html.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
              const title = titleMatch 
                ? this.stripHtml(titleMatch[1]).trim() 
                : `Chapter ${index + 1}`;
              
              // Clean and process HTML content
              const content = this.cleanHtml(processedChapter.html);
              const wordCount = this.countWords(content);
              
              chapters.push({
                id: chapterItem.id || `chapter-${index}`,
                title,
                index,
                content,
                wordCount,
              });
            } else {
              // Add empty chapter as fallback
              chapters.push({
                id: chapterItem.id || `chapter-${index}`,
                title: `Chapter ${index + 1}`,
                index,
                content: '<p>Content unavailable</p>',
                wordCount: 0,
              });
            }
          } catch (error) {
            console.warn(`Failed to extract chapter ${index}:`, error);
            // Add empty chapter as fallback
            chapters.push({
              id: `chapter-${index}`,
              title: `Chapter ${index + 1}`,
              index,
              content: '<p>Content unavailable</p>',
              wordCount: 0,
            });
          }
        });
      }
      
      // Ensure at least one chapter
      if (chapters.length === 0) {
        chapters.push({
          id: 'chapter-0',
          title: 'Chapter 1',
          index: 0,
          content: '<p>No content available</p>',
          wordCount: 0,
        });
      }
      
      return chapters;
    } catch (error) {
      console.error('Failed to extract chapters:', error);
      // Return empty chapter as fallback
      return [{
        id: 'chapter-0',
        title: 'Chapter 1',
        index: 0,
        content: '<p>Failed to parse content</p>',
        wordCount: 0,
      }];
    }
  }

  /**
   * Extract table of contents
   */
  private extractTableOfContents(): TableOfContentsItem[] {
    if (!this.mobiFile) {
      return [];
    }
    
    try {
      // Try to get TOC from MOBI file
      const toc = this.mobiFile.getTOC();
      const tocItems: TableOfContentsItem[] = [];
      
      if (toc && toc.length > 0) {
        toc.forEach((item, index) => {
          tocItems.push({
            id: `chapter-${index}`,
            title: item.title || `Chapter ${index + 1}`,
            href: item.href || `#chapter-${index}`,
            level: item.level || 1,
          });
        });
      } else {
        // Fallback: create TOC from chapters
        this.chapters.forEach((chapter, index) => {
          tocItems.push({
            id: chapter.id,
            title: chapter.title,
            href: `#${chapter.id}`,
            level: 1,
          });
        });
      }
      
      return tocItems;
    } catch (error) {
      console.warn('Failed to extract TOC, using chapter list:', error);
      // Fallback: create TOC from chapters
      return this.chapters.map((chapter, index) => ({
        id: chapter.id,
        title: chapter.title,
        href: `#${chapter.id}`,
        level: 1,
      }));
    }
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
   * Clean HTML content
   */
  private cleanHtml(html: string): string {
    // Remove script and style tags
    let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Ensure we have valid HTML structure
    if (!cleaned.trim().startsWith('<')) {
      // Wrap in paragraph if no HTML tags
      cleaned = `<p>${this.escapeHtml(cleaned)}</p>`;
    }
    
    return cleaned;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
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
   * Count words in HTML content
   */
  private countWords(html: string): number {
    const text = this.stripHtml(html);
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.mobi) {
      this.mobi.destroy();
    }
    this.filePath = null;
    this.mobi = null;
    this.metadata = null;
    this.chapters = [];
    this.toc = [];
  }
}
