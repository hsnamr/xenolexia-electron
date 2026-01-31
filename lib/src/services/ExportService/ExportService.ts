/**
 * Export Service - Export vocabulary to various formats
 *
 * Supported formats:
 * - CSV - Standard comma-separated values
 * - TSV/Anki - Tab-separated for Anki import
 * - JSON - Full data export with metadata
 */

import { format } from 'date-fns';
import type { VocabularyItem, Language } from '../types';
import { getLanguageInfo } from '../types';
import { Platform } from '../../utils/platform.electron';
import { getAppDataPath, writeFile, mkdir } from '../../utils/FileSystem.electron';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'csv' | 'anki' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeContext?: boolean;
  includeSRSData?: boolean;
  includeBookInfo?: boolean;
  filterByStatus?: string[];
  filterByLanguage?: { source?: Language; target?: Language };
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  itemCount: number;
  error?: string;
}

// ============================================================================
// Export Service
// ============================================================================

class ExportService {
  private readonly exportDir: string;

  constructor() {
    this.exportDir = Platform.OS === 'ios'
      ? RNFS.DocumentDirectoryPath
      : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
  }

  /**
   * Export vocabulary items to the specified format
   */
  async export(
    vocabulary: VocabularyItem[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Apply filters
      let filteredVocabulary = [...vocabulary];

      if (options.filterByStatus && options.filterByStatus.length > 0) {
        filteredVocabulary = filteredVocabulary.filter(
          (v) => options.filterByStatus!.includes(v.status)
        );
      }

      if (options.filterByLanguage) {
        if (options.filterByLanguage.source) {
          filteredVocabulary = filteredVocabulary.filter(
            (v) => v.sourceLanguage === options.filterByLanguage!.source
          );
        }
        if (options.filterByLanguage.target) {
          filteredVocabulary = filteredVocabulary.filter(
            (v) => v.targetLanguage === options.filterByLanguage!.target
          );
        }
      }

      if (filteredVocabulary.length === 0) {
        return {
          success: false,
          itemCount: 0,
          error: 'No vocabulary items match the export criteria',
        };
      }

      // Generate content based on format
      let content: string;
      let fileExtension: string;

      switch (options.format) {
        case 'csv':
          content = this.generateCSV(filteredVocabulary, options);
          fileExtension = 'csv';
          break;
        case 'anki':
          content = this.generateAnki(filteredVocabulary, options);
          fileExtension = 'txt';
          break;
        case 'json':
          content = this.generateJSON(filteredVocabulary, options);
          fileExtension = 'json';
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Generate filename
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
      const fileName = `xenolexia_vocabulary_${timestamp}.${fileExtension}`;
      const exportDir = await this.getExportDir();
      const filePath = `${exportDir}/${fileName}`;

      // Write file
      await writeFile(filePath, content, 'utf8');

      return {
        success: true,
        filePath,
        fileName,
        itemCount: filteredVocabulary.length,
      };
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        itemCount: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Export and share via system share sheet (Electron: opens file location)
   */
  async exportAndShare(
    vocabulary: VocabularyItem[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const result = await this.export(vocabulary, options);

    if (result.success && result.filePath) {
      try {
        // In Electron, we can open the file location or the file itself
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          // Open file location in file manager
          const { shell } = require('electron');
          if (shell && shell.showItemInFolder) {
            shell.showItemInFolder(result.filePath);
          }
        } else {
          // Share not available; file was saved
          console.log('File saved to:', result.filePath);
        }
      } catch (error) {
        // User cancelled share - not an error
        console.log('Share cancelled');
      }
    }

    return result;
  }

  /**
   * Generate CSV format
   */
  private generateCSV(vocabulary: VocabularyItem[], options: ExportOptions): string {
    const headers = ['source_word', 'target_word', 'source_language', 'target_language'];

    if (options.includeContext) {
      headers.push('context_sentence');
    }
    if (options.includeBookInfo) {
      headers.push('book_title');
    }
    if (options.includeSRSData) {
      headers.push('status', 'review_count', 'ease_factor', 'interval', 'added_at');
    }

    const rows = vocabulary.map((item) => {
      const row: string[] = [
        this.escapeCSV(item.sourceWord),
        this.escapeCSV(item.targetWord),
        item.sourceLanguage,
        item.targetLanguage,
      ];

      if (options.includeContext) {
        row.push(this.escapeCSV(item.contextSentence || ''));
      }
      if (options.includeBookInfo) {
        row.push(this.escapeCSV(item.bookTitle || ''));
      }
      if (options.includeSRSData) {
        row.push(
          item.status,
          item.reviewCount.toString(),
          item.easeFactor.toFixed(2),
          item.interval.toString(),
          format(item.addedAt, 'yyyy-MM-dd')
        );
      }

      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate Anki-compatible TSV format
   *
   * Format: front<TAB>back<TAB>tags
   * - Front: Foreign word
   * - Back: Original word + context (if available)
   * - Tags: language pair + proficiency level
   */
  private generateAnki(vocabulary: VocabularyItem[], options: ExportOptions): string {
    const rows = vocabulary.map((item) => {
      // Front of card (foreign word)
      const front = item.targetWord;

      // Back of card (original word + optional context)
      let back = item.sourceWord;
      if (options.includeContext && item.contextSentence) {
        back += `<br><br><i>"${item.contextSentence}"</i>`;
      }
      if (options.includeBookInfo && item.bookTitle) {
        back += `<br><small>From: ${item.bookTitle}</small>`;
      }

      // Tags
      const tags = [
        `${item.sourceLanguage}-${item.targetLanguage}`,
        item.status,
      ];

      return `${front}\t${back}\t${tags.join(' ')}`;
    });

    // Add Anki header comment
    const header = '#separator:tab\n#html:true\n#tags column:3\n';
    return header + rows.join('\n');
  }

  /**
   * Generate JSON format with full metadata
   */
  private generateJSON(vocabulary: VocabularyItem[], options: ExportOptions): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      itemCount: vocabulary.length,
      format: 'xenolexia-vocabulary-v1',
      items: vocabulary.map((item) => {
        const exportItem: Record<string, any> = {
          sourceWord: item.sourceWord,
          targetWord: item.targetWord,
          sourceLanguage: item.sourceLanguage,
          targetLanguage: item.targetLanguage,
        };

        if (options.includeContext && item.contextSentence) {
          exportItem.contextSentence = item.contextSentence;
        }

        if (options.includeBookInfo) {
          exportItem.bookId = item.bookId;
          exportItem.bookTitle = item.bookTitle;
        }

        if (options.includeSRSData) {
          exportItem.status = item.status;
          exportItem.reviewCount = item.reviewCount;
          exportItem.easeFactor = item.easeFactor;
          exportItem.interval = item.interval;
          exportItem.addedAt = item.addedAt.toISOString();
          exportItem.lastReviewedAt = item.lastReviewedAt?.toISOString() || null;
        }

        return exportItem;
      }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Escape a value for CSV (handle commas, quotes, newlines)
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Get export format description
   */
  static getFormatDescription(format: ExportFormat): string {
    switch (format) {
      case 'csv':
        return 'CSV file that can be opened in Excel or Google Sheets';
      case 'anki':
        return 'Tab-separated file ready for import into Anki flashcard app';
      case 'json':
        return 'JSON file with full vocabulary data and metadata';
      default:
        return '';
    }
  }

  /**
   * Get suggested filename for format
   */
  static getSuggestedFilename(format: ExportFormat): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    switch (format) {
      case 'csv':
        return `xenolexia_vocabulary_${timestamp}.csv`;
      case 'anki':
        return `xenolexia_anki_${timestamp}.txt`;
      case 'json':
        return `xenolexia_backup_${timestamp}.json`;
      default:
        return `xenolexia_export_${timestamp}`;
    }
  }
}

// Export singleton instance
export const exportService = new ExportService();
