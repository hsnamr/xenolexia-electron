/**
 * Export vocabulary to CSV, JSON, or Anki format (desktop - uses save dialog)
 */

import {format} from 'date-fns';
import type {VocabularyItem} from '@xenolexia/shared/types';

export type ExportFormat = 'csv' | 'anki' | 'json';

const defaultOptions = {
  includeContext: true,
  includeSRSData: true,
  includeBookInfo: true,
};

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateExportContent(
  vocabulary: VocabularyItem[],
  formatType: ExportFormat,
  options: Partial<typeof defaultOptions> = {}
): string {
  const opts = {...defaultOptions, ...options};

  if (formatType === 'csv') {
    const headers = [
      'source_word',
      'target_word',
      'source_language',
      'target_language',
    ];
    if (opts.includeContext) headers.push('context_sentence');
    if (opts.includeBookInfo) headers.push('book_title');
    if (opts.includeSRSData) {
      headers.push('status', 'review_count', 'ease_factor', 'interval', 'added_at');
    }
    const rows = vocabulary.map((item) => {
      const row: string[] = [
        escapeCSV(item.sourceWord),
        escapeCSV(item.targetWord),
        item.sourceLanguage,
        item.targetLanguage,
      ];
      if (opts.includeContext) row.push(escapeCSV(item.contextSentence || ''));
      if (opts.includeBookInfo) row.push(escapeCSV(item.bookTitle || ''));
      if (opts.includeSRSData) {
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

  if (formatType === 'anki') {
    const rows = vocabulary.map((item) => {
      const front = item.targetWord;
      let back = item.sourceWord;
      if (opts.includeContext && item.contextSentence) {
        back += `<br><br><i>"${item.contextSentence}"</i>`;
      }
      if (opts.includeBookInfo && item.bookTitle) {
        back += `<br><small>From: ${item.bookTitle}</small>`;
      }
      const tags = [`${item.sourceLanguage}-${item.targetLanguage}`, item.status];
      return `${front}\t${back}\t${tags.join(' ')}`;
    });
    return '#separator:tab\n#html:true\n#tags column:3\n' + rows.join('\n');
  }

  // json
  const exportData = {
    exportedAt: new Date().toISOString(),
    itemCount: vocabulary.length,
    format: 'xenolexia-vocabulary-v1',
    items: vocabulary.map((item) => {
      const exportItem: Record<string, unknown> = {
        sourceWord: item.sourceWord,
        targetWord: item.targetWord,
        sourceLanguage: item.sourceLanguage,
        targetLanguage: item.targetLanguage,
      };
      if (opts.includeContext && item.contextSentence) {
        exportItem.contextSentence = item.contextSentence;
      }
      if (opts.includeBookInfo) {
        exportItem.bookId = item.bookId;
        exportItem.bookTitle = item.bookTitle;
      }
      if (opts.includeSRSData) {
        exportItem.status = item.status;
        exportItem.reviewCount = item.reviewCount;
        exportItem.easeFactor = item.easeFactor;
        exportItem.interval = item.interval;
        exportItem.addedAt = item.addedAt.toISOString();
        exportItem.lastReviewedAt = item.lastReviewedAt?.toISOString() ?? null;
      }
      return exportItem;
    }),
  };
  return JSON.stringify(exportData, null, 2);
}

export function getSuggestedFilename(formatType: ExportFormat): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  switch (formatType) {
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

export function getSaveDialogFilters(
  formatType: ExportFormat
): Array<{name: string; extensions: string[]}> {
  switch (formatType) {
    case 'csv':
      return [{name: 'CSV', extensions: ['csv']}];
    case 'anki':
      return [{name: 'Text (Anki)', extensions: ['txt']}];
    case 'json':
      return [{name: 'JSON', extensions: ['json']}];
    default:
      return [{name: 'All', extensions: ['*']}];
  }
}
