/**
 * EPUB Extractor
 *
 * Low-level EPUB file extraction using JSZip.
 * EPUB files are ZIP archives with a specific structure:
 *
 * /META-INF/
 *   container.xml         - Points to the OPF file location
 * /OEBPS/ (or similar)
 *   content.opf           - Package document with metadata
 *   toc.ncx               - Navigation (EPUB 2)
 *   nav.xhtml             - Navigation (EPUB 3)
 *   *.xhtml               - Content files
 *   images/               - Image resources
 */

import RNFS from 'react-native-fs';
import JSZip from 'jszip';

// ============================================================================
// Types
// ============================================================================

export interface EPUBContainer {
  rootFilePath: string;
  version?: string;
}

export interface EPUBManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface EPUBSpineItem {
  idref: string;
  linear: boolean;
}

export interface EPUBPackage {
  version: string;
  uniqueIdentifier: string;
  metadata: EPUBRawMetadata;
  manifest: Map<string, EPUBManifestItem>;
  spine: EPUBSpineItem[];
  tocId?: string;
  coverImageId?: string;
}

export interface EPUBRawMetadata {
  title: string;
  creator?: string;
  language?: string;
  identifier?: string;
  publisher?: string;
  date?: string;
  description?: string;
  subject?: string[];
  rights?: string;
  contributors?: string[];
}

// ============================================================================
// EPUB Extractor Class
// ============================================================================

export class EPUBExtractor {
  private zip: JSZip | null = null;
  private basePath: string = '';

  /**
   * Load an EPUB file
   */
  async load(filePath: string): Promise<void> {
    try {
      // Read the file as base64
      const base64Data = await RNFS.readFile(filePath, 'base64');

      // Load with JSZip
      this.zip = new JSZip();
      await this.zip.loadAsync(base64Data, {base64: true});
    } catch (error) {
      throw new Error(`Failed to load EPUB: ${error}`);
    }
  }

  /**
   * Parse container.xml to find the OPF file path
   */
  async parseContainer(): Promise<EPUBContainer> {
    if (!this.zip) throw new Error('EPUB not loaded');

    const containerPath = 'META-INF/container.xml';
    const containerFile = this.zip.file(containerPath);

    if (!containerFile) {
      throw new Error('Invalid EPUB: missing container.xml');
    }

    const containerXml = await containerFile.async('text');

    // Parse rootfile path from container.xml
    // <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    const rootfileMatch = containerXml.match(
      /rootfile[^>]+full-path=["']([^"']+)["']/i,
    );

    if (!rootfileMatch) {
      throw new Error('Invalid EPUB: cannot find rootfile in container.xml');
    }

    const rootFilePath = rootfileMatch[1];

    // Set base path for relative references
    const lastSlash = rootFilePath.lastIndexOf('/');
    this.basePath = lastSlash > 0 ? rootFilePath.substring(0, lastSlash + 1) : '';

    // Try to extract version
    const versionMatch = containerXml.match(/version=["']([^"']+)["']/i);

    return {
      rootFilePath,
      version: versionMatch?.[1],
    };
  }

  /**
   * Parse the OPF (Open Packaging Format) file
   */
  async parsePackage(opfPath: string): Promise<EPUBPackage> {
    if (!this.zip) throw new Error('EPUB not loaded');

    const opfFile = this.zip.file(opfPath);
    if (!opfFile) {
      throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
    }

    const opfXml = await opfFile.async('text');

    // Extract package version
    const versionMatch = opfXml.match(/<package[^>]+version=["']([^"']+)["']/i);
    const version = versionMatch?.[1] || '2.0';

    // Extract unique identifier attribute
    const uniqueIdMatch = opfXml.match(
      /<package[^>]+unique-identifier=["']([^"']+)["']/i,
    );
    const uniqueIdentifier = uniqueIdMatch?.[1] || '';

    // Parse metadata
    const metadata = this.parseMetadata(opfXml);

    // Parse manifest
    const manifest = this.parseManifest(opfXml);

    // Parse spine
    const spine = this.parseSpine(opfXml);

    // Find TOC reference
    const tocId = this.findTocId(opfXml, manifest);

    // Find cover image
    const coverImageId = this.findCoverImageId(opfXml, manifest);

    return {
      version,
      uniqueIdentifier,
      metadata,
      manifest,
      spine,
      tocId,
      coverImageId,
    };
  }

  /**
   * Parse metadata section from OPF
   */
  private parseMetadata(opfXml: string): EPUBRawMetadata {
    // Extract metadata block
    const metadataMatch = opfXml.match(
      /<metadata[^>]*>([\s\S]*?)<\/metadata>/i,
    );
    const metadataXml = metadataMatch?.[1] || '';

    // Helper to extract tag content
    const extractTag = (tag: string): string | undefined => {
      // Try dc:tag first, then just tag
      const patterns = [
        new RegExp(`<dc:${tag}[^>]*>([^<]*)</dc:${tag}>`, 'i'),
        new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = metadataXml.match(pattern);
        if (match) return this.decodeEntities(match[1].trim());
      }
      return undefined;
    };

    // Extract all occurrences of a tag
    const extractAllTags = (tag: string): string[] => {
      const results: string[] = [];
      const patterns = [
        new RegExp(`<dc:${tag}[^>]*>([^<]*)</dc:${tag}>`, 'gi'),
        new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi'),
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(metadataXml)) !== null) {
          const value = this.decodeEntities(match[1].trim());
          if (value && !results.includes(value)) {
            results.push(value);
          }
        }
      }
      return results;
    };

    return {
      title: extractTag('title') || 'Untitled',
      creator: extractTag('creator'),
      language: extractTag('language'),
      identifier: extractTag('identifier'),
      publisher: extractTag('publisher'),
      date: extractTag('date'),
      description: extractTag('description'),
      subject: extractAllTags('subject'),
      rights: extractTag('rights'),
      contributors: extractAllTags('contributor'),
    };
  }

  /**
   * Parse manifest section from OPF
   */
  private parseManifest(opfXml: string): Map<string, EPUBManifestItem> {
    const manifest = new Map<string, EPUBManifestItem>();

    // Extract manifest block
    const manifestMatch = opfXml.match(
      /<manifest[^>]*>([\s\S]*?)<\/manifest>/i,
    );
    const manifestXml = manifestMatch?.[1] || '';

    // Match each item
    const itemPattern =
      /<item\s+([^>]*)\/?>(?:<\/item>)?/gi;
    let match;

    while ((match = itemPattern.exec(manifestXml)) !== null) {
      const attrs = match[1];

      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      const mediaTypeMatch = attrs.match(/media-type=["']([^"']+)["']/i);
      const propertiesMatch = attrs.match(/properties=["']([^"']+)["']/i);

      if (idMatch && hrefMatch && mediaTypeMatch) {
        manifest.set(idMatch[1], {
          id: idMatch[1],
          href: this.decodeEntities(hrefMatch[1]),
          mediaType: mediaTypeMatch[1],
          properties: propertiesMatch?.[1],
        });
      }
    }

    return manifest;
  }

  /**
   * Parse spine section from OPF
   */
  private parseSpine(opfXml: string): EPUBSpineItem[] {
    const spine: EPUBSpineItem[] = [];

    // Extract spine block
    const spineMatch = opfXml.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i);
    const spineXml = spineMatch?.[1] || '';

    // Match each itemref
    const itemPattern = /<itemref\s+([^>]*)\/?>(?:<\/itemref>)?/gi;
    let match;

    while ((match = itemPattern.exec(spineXml)) !== null) {
      const attrs = match[1];

      const idrefMatch = attrs.match(/idref=["']([^"']+)["']/i);
      const linearMatch = attrs.match(/linear=["']([^"']+)["']/i);

      if (idrefMatch) {
        spine.push({
          idref: idrefMatch[1],
          linear: linearMatch?.[1] !== 'no',
        });
      }
    }

    return spine;
  }

  /**
   * Find TOC document ID
   */
  private findTocId(
    opfXml: string,
    manifest: Map<string, EPUBManifestItem>,
  ): string | undefined {
    // EPUB 3: Look for nav document in manifest
    for (const [id, item] of manifest) {
      if (item.properties?.includes('nav')) {
        return id;
      }
    }

    // EPUB 2: Look for toc attribute in spine
    const spineTocMatch = opfXml.match(/<spine[^>]+toc=["']([^"']+)["']/i);
    if (spineTocMatch) {
      return spineTocMatch[1];
    }

    // Fallback: Look for ncx file in manifest
    for (const [id, item] of manifest) {
      if (
        item.mediaType === 'application/x-dtbncx+xml' ||
        item.href.endsWith('.ncx')
      ) {
        return id;
      }
    }

    return undefined;
  }

  /**
   * Find cover image ID
   */
  private findCoverImageId(
    opfXml: string,
    manifest: Map<string, EPUBManifestItem>,
  ): string | undefined {
    // EPUB 3: Look for cover-image property
    for (const [id, item] of manifest) {
      if (item.properties?.includes('cover-image')) {
        return id;
      }
    }

    // EPUB 2: Look for meta with name="cover"
    const coverMetaMatch = opfXml.match(
      /<meta[^>]+name=["']cover["'][^>]+content=["']([^"']+)["']/i,
    );
    if (coverMetaMatch) {
      return coverMetaMatch[1];
    }

    // Alternative meta format
    const coverMetaAlt = opfXml.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']cover["']/i,
    );
    if (coverMetaAlt) {
      return coverMetaAlt[1];
    }

    // Fallback: Look for item with 'cover' in id
    for (const [id, item] of manifest) {
      if (
        id.toLowerCase().includes('cover') &&
        item.mediaType.startsWith('image/')
      ) {
        return id;
      }
    }

    return undefined;
  }

  /**
   * Get file content from the EPUB
   */
  async getFile(path: string): Promise<string> {
    if (!this.zip) throw new Error('EPUB not loaded');

    // Try with base path first, then without
    const fullPath = path.startsWith('/') ? path.substring(1) : this.basePath + path;
    let file = this.zip.file(fullPath);

    if (!file) {
      // Try without base path
      file = this.zip.file(path);
    }

    if (!file) {
      throw new Error(`File not found in EPUB: ${path}`);
    }

    return file.async('text');
  }

  /**
   * Get binary file content from the EPUB
   */
  async getBinaryFile(path: string): Promise<ArrayBuffer> {
    if (!this.zip) throw new Error('EPUB not loaded');

    const fullPath = path.startsWith('/') ? path.substring(1) : this.basePath + path;
    let file = this.zip.file(fullPath);

    if (!file) {
      file = this.zip.file(path);
    }

    if (!file) {
      throw new Error(`File not found in EPUB: ${path}`);
    }

    return file.async('arraybuffer');
  }

  /**
   * Get base64 encoded file
   */
  async getBase64File(path: string): Promise<string> {
    if (!this.zip) throw new Error('EPUB not loaded');

    const fullPath = path.startsWith('/') ? path.substring(1) : this.basePath + path;
    let file = this.zip.file(fullPath);

    if (!file) {
      file = this.zip.file(path);
    }

    if (!file) {
      throw new Error(`File not found in EPUB: ${path}`);
    }

    return file.async('base64');
  }

  /**
   * Check if a file exists in the EPUB
   */
  fileExists(path: string): boolean {
    if (!this.zip) return false;

    const fullPath = path.startsWith('/') ? path.substring(1) : this.basePath + path;
    return this.zip.file(fullPath) !== null || this.zip.file(path) !== null;
  }

  /**
   * Get all CSS stylesheets from the EPUB
   */
  async getAllStylesheets(manifest: Map<string, EPUBManifestItem>): Promise<Map<string, string>> {
    const stylesheets = new Map<string, string>();

    for (const [id, item] of manifest) {
      if (item.mediaType === 'text/css' || item.href.endsWith('.css')) {
        try {
          const content = await this.getFile(item.href);
          stylesheets.set(item.href, content);
        } catch (error) {
          console.warn(`Failed to load stylesheet ${item.href}:`, error);
        }
      }
    }

    return stylesheets;
  }

  /**
   * Resolve stylesheet links in HTML content
   */
  async resolveStylesheets(
    html: string,
    manifest: Map<string, EPUBManifestItem>
  ): Promise<string> {
    // Find all linked stylesheets
    const linkRegex = /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
    let match;
    const stylesToInline: string[] = [];

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      try {
        const cssContent = await this.getFile(href);
        stylesToInline.push(cssContent);
      } catch (error) {
        console.warn(`Failed to load linked stylesheet ${href}:`, error);
      }
    }

    // Remove link tags
    let modifiedHtml = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

    // Add inline styles
    if (stylesToInline.length > 0) {
      const inlineStyle = `<style>${stylesToInline.join('\n')}</style>`;
      // Insert before </head> or at the start
      if (modifiedHtml.includes('</head>')) {
        modifiedHtml = modifiedHtml.replace('</head>', `${inlineStyle}</head>`);
      } else {
        modifiedHtml = inlineStyle + modifiedHtml;
      }
    }

    return modifiedHtml;
  }

  /**
   * List all files in the EPUB
   */
  listFiles(): string[] {
    if (!this.zip) return [];

    const files: string[] = [];
    this.zip.forEach((relativePath) => {
      files.push(relativePath);
    });
    return files;
  }

  /**
   * Get the base path for relative references
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Decode HTML entities
   */
  private decodeEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.zip = null;
    this.basePath = '';
  }
}
