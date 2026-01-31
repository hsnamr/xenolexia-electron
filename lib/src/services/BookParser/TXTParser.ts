/**
 * TXT Parser - Simple text file parser
 * 
 * Uses Electron file system for file reading
 */

import type {IBookParser, ParsedBook, Chapter, BookMetadata, TableOfContentsItem} from '../types';
import { readFileAsText } from '../../utils/FileSystem.electron';

export class TXTParser implements IBookParser {
  private filePath: string | null = null;
  private content: string | null = null;

  /**
   * Parse a TXT file
   */
  async parse(filePath: string): Promise<ParsedBook> {
    this.filePath = filePath;
    
    // Read file content using Electron file system
    const content = await readFileAsText(filePath);
    this.content = content;
    
    // Extract metadata from filename
    const filename = filePath.split('/').pop()?.replace(/\.txt$/i, '') || 'Untitled';
    const metadata: BookMetadata = {
      title: filename,
      author: undefined,
      description: undefined,
      language: undefined,
    };
    
    // Split into chapters (by double newlines or page breaks)
    const chapters = this.splitIntoChapters(this.content);
    
    // Create simple TOC
    const tableOfContents: TableOfContentsItem[] = chapters.map((_, index) => ({
      id: `chapter-${index}`,
      title: `Chapter ${index + 1}`,
      href: `#chapter-${index}`,
      level: 1,
    }));
    
    // Calculate word count
    const totalWordCount = this.content
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
    
    return {
      metadata,
      chapters,
      tableOfContents,
      totalWordCount,
    };
  }

  /**
   * Get a specific chapter
   */
  async getChapter(index: number): Promise<Chapter> {
    if (!this.content) {
      throw new Error('Book not parsed. Call parse() first.');
    }
    
    const chapters = this.splitIntoChapters(this.content);
    if (index < 0 || index >= chapters.length) {
      throw new Error(`Chapter index ${index} out of range`);
    }
    
    return chapters[index];
  }

  /**
   * Get table of contents
   */
  getTableOfContents(): TableOfContentsItem[] {
    if (!this.content) {
      return [];
    }
    
    const chapters = this.splitIntoChapters(this.content);
    return chapters.map((_, index) => ({
      id: `chapter-${index}`,
      title: `Chapter ${index + 1}`,
      href: `#chapter-${index}`,
      level: 1,
    }));
  }

  /**
   * Get book metadata
   */
  getMetadata(): BookMetadata {
    if (!this.content) {
      throw new Error('Book not parsed. Call parse() first.');
    }
    
    const filename = this.filePath?.split('/').pop()?.replace(/\.txt$/i, '') || 'Untitled';
    return {
      title: filename,
      author: undefined,
      description: undefined,
      language: undefined,
    };
  }

  /**
   * Search within the book
   */
  async search(query: string): Promise<Array<{chapterIndex: number; chapterTitle: string; excerpt: string; position: number}>> {
    if (!this.content) {
      return [];
    }
    
    const results: Array<{chapterIndex: number; chapterTitle: string; excerpt: string; position: number}> = [];
    const chapters = this.splitIntoChapters(this.content);
    const lowerQuery = query.toLowerCase();
    
    chapters.forEach((chapter, chapterIndex) => {
      const content = chapter.content.toLowerCase();
      let position = 0;
      
      while ((position = content.indexOf(lowerQuery, position)) !== -1) {
        // Extract context (50 chars before and after)
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
   * Split content into chapters
   * Uses double newlines or form feed characters as chapter breaks
   */
  private splitIntoChapters(content: string): Chapter[] {
    // Split by double newlines, form feeds, or page breaks
    const splits = content.split(/\n\s*\n|\f/);
    
    // If no clear chapter breaks, split by approximate page length (2000 chars)
    if (splits.length === 1 && content.length > 5000) {
      const pageSize = 2000;
      const chapters: Chapter[] = [];
      let index = 0;
      
      for (let i = 0; i < content.length; i += pageSize) {
        const chapterContent = content.substring(i, i + pageSize);
        const wordCount = chapterContent.split(/\s+/).filter(w => w.length > 0).length;
        
        chapters.push({
          id: `chapter-${index}`,
          title: `Chapter ${index + 1}`,
          index: index++,
          content: chapterContent,
          wordCount,
        });
      }
      
      return chapters;
    }
    
    // Use natural splits
    return splits
      .filter(split => split.trim().length > 0)
      .map((split, index) => {
        const wordCount = split.split(/\s+/).filter(w => w.length > 0).length;
        return {
          id: `chapter-${index}`,
          title: `Chapter ${index + 1}`,
          index,
          content: split.trim(),
          wordCount,
        };
      });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.filePath = null;
    this.content = null;
  }
}
