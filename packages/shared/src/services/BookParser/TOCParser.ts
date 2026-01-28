/**
 * Table of Contents Parser
 *
 * Parses EPUB navigation documents:
 * - NCX (EPUB 2.0) - Navigation Control file for XML
 * - NAV (EPUB 3.0) - HTML5 navigation document
 */

import type {TableOfContentsItem} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface TOCParseResult {
  title?: string;
  items: TableOfContentsItem[];
  pageList?: PageListItem[];
}

export interface PageListItem {
  label: string;
  href: string;
}

// ============================================================================
// NCX Parser (EPUB 2.0)
// ============================================================================

/**
 * Parse NCX (Navigation Control file for XML) format
 *
 * Structure:
 * <ncx>
 *   <navMap>
 *     <navPoint id="..." playOrder="1">
 *       <navLabel><text>Chapter Title</text></navLabel>
 *       <content src="chapter1.xhtml"/>
 *       <navPoint>...</navPoint>  <!-- nested -->
 *     </navPoint>
 *   </navMap>
 * </ncx>
 */
export function parseNCX(ncxXml: string): TOCParseResult {
  const items: TableOfContentsItem[] = [];

  // Extract document title
  const titleMatch = ncxXml.match(
    /<docTitle>\s*<text>([^<]*)<\/text>\s*<\/docTitle>/i,
  );
  const title = titleMatch?.[1]?.trim();

  // Extract navMap
  const navMapMatch = ncxXml.match(/<navMap[^>]*>([\s\S]*?)<\/navMap>/i);
  if (navMapMatch) {
    const navPoints = parseNavPoints(navMapMatch[1], 0);
    items.push(...navPoints);
  }

  // Extract pageList if present
  const pageList: PageListItem[] = [];
  const pageListMatch = ncxXml.match(/<pageList[^>]*>([\s\S]*?)<\/pageList>/i);
  if (pageListMatch) {
    const pageTargetPattern =
      /<pageTarget[^>]*>[\s\S]*?<navLabel>\s*<text>([^<]*)<\/text>\s*<\/navLabel>[\s\S]*?<content\s+src=["']([^"']+)["']/gi;
    let pageMatch;
    while ((pageMatch = pageTargetPattern.exec(pageListMatch[1])) !== null) {
      pageList.push({
        label: decodeEntities(pageMatch[1].trim()),
        href: decodeEntities(pageMatch[2]),
      });
    }
  }

  return {
    title,
    items,
    pageList: pageList.length > 0 ? pageList : undefined,
  };
}

/**
 * Recursively parse navPoint elements
 */
function parseNavPoints(xml: string, level: number): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = [];

  // Match top-level navPoints (not nested ones)
  // We need to be careful not to capture nested navPoints
  const navPointPattern =
    /<navPoint\s+([^>]*)>([\s\S]*?)<\/navPoint>(?=\s*(?:<navPoint|<\/navMap|<\/navPoint|$))/gi;

  let match;
  let idCounter = 0;

  while ((match = navPointPattern.exec(xml)) !== null) {
    const attrs = match[1];
    const content = match[2];

    // Extract id
    const idMatch = attrs.match(/id=["']([^"']+)["']/i);
    const id = idMatch?.[1] || `nav-${level}-${idCounter++}`;

    // Extract playOrder
    const playOrderMatch = attrs.match(/playOrder=["'](\d+)["']/i);
    const playOrder = playOrderMatch ? parseInt(playOrderMatch[1], 10) : undefined;

    // Extract label
    const labelMatch = content.match(
      /<navLabel>\s*<text>([^<]*)<\/text>\s*<\/navLabel>/i,
    );
    const label = labelMatch?.[1]?.trim() || 'Untitled';

    // Extract content src
    const srcMatch = content.match(/<content\s+src=["']([^"']+)["']/i);
    const href = srcMatch?.[1] || '';

    // Look for nested navPoints
    const nestedNavPointsMatch = content.match(
      /(<navPoint[\s\S]*<\/navPoint>)(?=\s*$)/i,
    );
    let children: TableOfContentsItem[] | undefined;

    if (nestedNavPointsMatch) {
      const nestedItems = parseNavPoints(nestedNavPointsMatch[1], level + 1);
      if (nestedItems.length > 0) {
        children = nestedItems;
      }
    }

    items.push({
      id,
      title: decodeEntities(label),
      href: decodeEntities(href),
      level,
      children,
    });
  }

  return items;
}

// ============================================================================
// NAV Parser (EPUB 3.0)
// ============================================================================

/**
 * Parse NAV (EPUB 3 Navigation Document) format
 *
 * Structure:
 * <nav epub:type="toc">
 *   <h1>Table of Contents</h1>
 *   <ol>
 *     <li><a href="chapter1.xhtml">Chapter 1</a>
 *       <ol>
 *         <li><a href="chapter1.xhtml#section1">Section 1</a></li>
 *       </ol>
 *     </li>
 *   </ol>
 * </nav>
 */
export function parseNAV(navHtml: string): TOCParseResult {
  const items: TableOfContentsItem[] = [];

  // Find the toc nav element
  const tocNavMatch = navHtml.match(
    /<nav[^>]+epub:type=["']toc["'][^>]*>([\s\S]*?)<\/nav>/i,
  );

  if (!tocNavMatch) {
    // Try without epub:type (some EPUBs use different formats)
    const altNavMatch = navHtml.match(
      /<nav[^>]*id=["']toc["'][^>]*>([\s\S]*?)<\/nav>/i,
    );
    if (altNavMatch) {
      const olMatch = altNavMatch[1].match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
      if (olMatch) {
        items.push(...parseNavList(olMatch[1], 0));
      }
    }
    return {items};
  }

  // Extract title from h1/h2
  const titleMatch = tocNavMatch[1].match(/<h[12][^>]*>([^<]*)<\/h[12]>/i);
  const title = titleMatch?.[1]?.trim();

  // Parse the ordered list
  const olMatch = tocNavMatch[1].match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (olMatch) {
    items.push(...parseNavList(olMatch[1], 0));
  }

  // Check for page-list nav
  const pageList: PageListItem[] = [];
  const pageNavMatch = navHtml.match(
    /<nav[^>]+epub:type=["']page-list["'][^>]*>([\s\S]*?)<\/nav>/i,
  );
  if (pageNavMatch) {
    const pagePattern = /<a\s+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let pageMatch;
    while ((pageMatch = pagePattern.exec(pageNavMatch[1])) !== null) {
      pageList.push({
        href: decodeEntities(pageMatch[1]),
        label: decodeEntities(pageMatch[2].trim()),
      });
    }
  }

  return {
    title,
    items,
    pageList: pageList.length > 0 ? pageList : undefined,
  };
}

/**
 * Recursively parse <ol><li> navigation lists
 */
function parseNavList(html: string, level: number): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = [];

  // Match <li> elements (being careful about nesting)
  // This regex matches <li> with its content until the next </li> at the same level
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>(?=\s*(?:<li|<\/ol|$))/gi;

  let match;
  let idCounter = 0;

  while ((match = liPattern.exec(html)) !== null) {
    const content = match[1];

    // Extract the anchor
    const anchorMatch = content.match(/<a\s+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/i);

    if (anchorMatch) {
      const href = anchorMatch[1];
      const label = anchorMatch[2].trim();

      // Look for nested <ol>
      const nestedOlMatch = content.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
      let children: TableOfContentsItem[] | undefined;

      if (nestedOlMatch) {
        const nestedItems = parseNavList(nestedOlMatch[1], level + 1);
        if (nestedItems.length > 0) {
          children = nestedItems;
        }
      }

      items.push({
        id: `nav-${level}-${idCounter++}`,
        title: decodeEntities(label),
        href: decodeEntities(href),
        level,
        children,
      });
    }
  }

  return items;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Flatten a nested TOC structure
 */
export function flattenTOC(items: TableOfContentsItem[]): TableOfContentsItem[] {
  const result: TableOfContentsItem[] = [];

  function traverse(item: TableOfContentsItem) {
    result.push(item);
    if (item.children) {
      item.children.forEach(traverse);
    }
  }

  items.forEach(traverse);
  return result;
}

/**
 * Count total TOC items
 */
export function countTOCItems(items: TableOfContentsItem[]): number {
  return flattenTOC(items).length;
}

/**
 * Find TOC item by href
 */
export function findTOCItemByHref(
  items: TableOfContentsItem[],
  href: string,
): TableOfContentsItem | undefined {
  const normalizedHref = href.split('#')[0]; // Remove fragment

  function search(item: TableOfContentsItem): TableOfContentsItem | undefined {
    const itemHref = item.href.split('#')[0];
    if (itemHref === normalizedHref) {
      return item;
    }
    if (item.children) {
      for (const child of item.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return undefined;
  }

  for (const item of items) {
    const found = search(item);
    if (found) return found;
  }
  return undefined;
}

/**
 * Decode HTML entities
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}
