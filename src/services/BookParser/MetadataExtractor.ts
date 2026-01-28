/**
 * Metadata Extractor
 *
 * High-level utility for extracting complete metadata from EPUB files.
 * Combines EPUBExtractor with TOC parsing to provide a unified API.
 */

import RNFS from 'react-native-fs';

import type {BookMetadata, TableOfContentsItem} from '@/types';

import {EPUBExtractor} from './EPUBExtractor';
import type {EPUBPackage, EPUBManifestItem} from './EPUBExtractor';
import {parseNCX, parseNAV} from './TOCParser';
import type {TOCParseResult} from './TOCParser';

// ============================================================================
// Types
// ============================================================================

export interface ExtractedMetadata {
  metadata: BookMetadata;
  tableOfContents: TableOfContentsItem[];
  coverImagePath?: string;
  chapterCount: number;
  estimatedWordCount?: number;
  epubVersion: string;
  language?: string;
}

export interface CoverExtractionResult {
  base64Data: string;
  mimeType: string;
  fileName: string;
}

// ============================================================================
// Metadata Extractor Class
// ============================================================================

export class MetadataExtractor {
  private extractor: EPUBExtractor;
  private epubPackage: EPUBPackage | null = null;
  private filePath: string = '';

  constructor() {
    this.extractor = new EPUBExtractor();
  }

  /**
   * Extract complete metadata from an EPUB file
   */
  async extractFromFile(filePath: string): Promise<ExtractedMetadata> {
    this.filePath = filePath;

    // Load the EPUB
    await this.extractor.load(filePath);

    // Parse container.xml
    const container = await this.extractor.parseContainer();

    // Parse the OPF package
    this.epubPackage = await this.extractor.parsePackage(container.rootFilePath);

    // Extract table of contents
    const tocResult = await this.extractTableOfContents();

    // Build metadata object
    const metadata: BookMetadata = {
      title: this.epubPackage.metadata.title,
      author: this.epubPackage.metadata.creator,
      description: this.epubPackage.metadata.description,
      publisher: this.epubPackage.metadata.publisher,
      publishDate: this.epubPackage.metadata.date,
      isbn: this.extractISBN(this.epubPackage.metadata.identifier),
      subjects: this.epubPackage.metadata.subject,
    };

    // Count chapters (spine items)
    const chapterCount = this.epubPackage.spine.filter(
      item => item.linear,
    ).length;

    return {
      metadata,
      tableOfContents: tocResult.items,
      chapterCount,
      epubVersion: this.epubPackage.version,
      language: this.epubPackage.metadata.language,
    };
  }

  /**
   * Extract and save cover image
   */
  async extractCover(outputDir: string): Promise<string | null> {
    if (!this.epubPackage) {
      throw new Error('EPUB not loaded. Call extractFromFile first.');
    }

    const coverId = this.epubPackage.coverImageId;
    if (!coverId) {
      return null;
    }

    const coverItem = this.epubPackage.manifest.get(coverId);
    if (!coverItem) {
      return null;
    }

    try {
      // Get cover image as base64
      const base64Data = await this.extractor.getBase64File(coverItem.href);

      // Determine file extension
      const extension = this.getImageExtension(coverItem.mediaType);
      const fileName = `cover.${extension}`;
      const outputPath = `${outputDir}/${fileName}`;

      // Ensure output directory exists
      await RNFS.mkdir(outputDir);

      // Write the image file
      await RNFS.writeFile(outputPath, base64Data, 'base64');

      return outputPath;
    } catch (error) {
      console.warn('Failed to extract cover image:', error);
      return null;
    }
  }

  /**
   * Get cover image as base64 (for preview without saving)
   */
  async getCoverBase64(): Promise<CoverExtractionResult | null> {
    if (!this.epubPackage) {
      throw new Error('EPUB not loaded. Call extractFromFile first.');
    }

    const coverId = this.epubPackage.coverImageId;
    if (!coverId) {
      return null;
    }

    const coverItem = this.epubPackage.manifest.get(coverId);
    if (!coverItem) {
      return null;
    }

    try {
      const base64Data = await this.extractor.getBase64File(coverItem.href);
      const extension = this.getImageExtension(coverItem.mediaType);

      return {
        base64Data,
        mimeType: coverItem.mediaType,
        fileName: `cover.${extension}`,
      };
    } catch (error) {
      console.warn('Failed to get cover image:', error);
      return null;
    }
  }

  /**
   * Extract table of contents
   */
  private async extractTableOfContents(): Promise<TOCParseResult> {
    if (!this.epubPackage) {
      return {items: []};
    }

    const tocId = this.epubPackage.tocId;
    if (!tocId) {
      // Fallback: generate TOC from spine
      return this.generateTOCFromSpine();
    }

    const tocItem = this.epubPackage.manifest.get(tocId);
    if (!tocItem) {
      return this.generateTOCFromSpine();
    }

    try {
      const tocContent = await this.extractor.getFile(tocItem.href);

      // Determine format and parse
      if (
        tocItem.mediaType === 'application/x-dtbncx+xml' ||
        tocItem.href.endsWith('.ncx')
      ) {
        // NCX format (EPUB 2)
        return parseNCX(tocContent);
      } else {
        // NAV format (EPUB 3)
        return parseNAV(tocContent);
      }
    } catch (error) {
      console.warn('Failed to parse TOC, generating from spine:', error);
      return this.generateTOCFromSpine();
    }
  }

  /**
   * Generate a basic TOC from the spine when no proper TOC exists
   */
  private generateTOCFromSpine(): TOCParseResult {
    if (!this.epubPackage) {
      return {items: []};
    }

    const items: TableOfContentsItem[] = [];

    this.epubPackage.spine.forEach((spineItem, index) => {
      if (!spineItem.linear) return;

      const manifestItem = this.epubPackage!.manifest.get(spineItem.idref);
      if (manifestItem) {
        items.push({
          id: spineItem.idref,
          title: `Chapter ${index + 1}`,
          href: manifestItem.href,
          level: 0,
        });
      }
    });

    return {items};
  }

  /**
   * Get ordered list of content files from spine
   */
  getSpineItems(): EPUBManifestItem[] {
    if (!this.epubPackage) {
      return [];
    }

    const items: EPUBManifestItem[] = [];

    for (const spineItem of this.epubPackage.spine) {
      const manifestItem = this.epubPackage.manifest.get(spineItem.idref);
      if (manifestItem) {
        items.push(manifestItem);
      }
    }

    return items;
  }

  /**
   * Get content of a chapter by href
   */
  async getChapterContent(href: string): Promise<string> {
    return this.extractor.getFile(href);
  }

  /**
   * Extract ISBN from identifier if present
   */
  private extractISBN(identifier?: string): string | undefined {
    if (!identifier) return undefined;

    // Try to extract ISBN-10 or ISBN-13
    const isbn13Match = identifier.match(/(?:ISBN[:\s-]?)?(\d{13})/i);
    if (isbn13Match) return isbn13Match[1];

    const isbn10Match = identifier.match(
      /(?:ISBN[:\s-]?)?(\d{9}[\dXx])/i,
    );
    if (isbn10Match) return isbn10Match[1];

    // If it looks like a URN, try to extract ISBN
    const urnMatch = identifier.match(/urn:isbn:(\d{10}|\d{13})/i);
    if (urnMatch) return urnMatch[1];

    return undefined;
  }

  /**
   * Get image file extension from MIME type
   */
  private getImageExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'image/webp': 'webp',
    };

    return mimeToExt[mimeType.toLowerCase()] || 'jpg';
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.extractor.dispose();
    this.epubPackage = null;
    this.filePath = '';
  }
}

// ============================================================================
// Quick Extraction Functions
// ============================================================================

/**
 * Quick function to extract just the basic metadata
 */
export async function extractEPUBMetadata(
  filePath: string,
): Promise<BookMetadata> {
  const extractor = new MetadataExtractor();
  try {
    const result = await extractor.extractFromFile(filePath);
    return result.metadata;
  } finally {
    extractor.dispose();
  }
}

/**
 * Quick function to extract metadata and TOC
 */
export async function extractEPUBInfo(
  filePath: string,
): Promise<ExtractedMetadata> {
  const extractor = new MetadataExtractor();
  try {
    return await extractor.extractFromFile(filePath);
  } finally {
    extractor.dispose();
  }
}

/**
 * Quick function to extract cover image
 */
export async function extractEPUBCover(
  filePath: string,
  outputDir: string,
): Promise<string | null> {
  const extractor = new MetadataExtractor();
  try {
    await extractor.extractFromFile(filePath);
    return await extractor.extractCover(outputDir);
  } finally {
    extractor.dispose();
  }
}
