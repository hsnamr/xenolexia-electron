/**
 * Storage Service - Re-export from xenolexia-typescript core.
 * Electron IDataStore implementation (LowDB) lives in DatabaseService.electron.ts.
 */

export {
  StorageService,
  createStorageService,
  BookRepository,
  VocabularyRepository,
  SessionRepository,
  DatabaseSchema,
} from 'xenolexia-typescript';
export type {
  IDataStore,
  BookRow,
  VocabularyRow,
  SessionRow,
  WordListRow,
  BookSort,
  BookFilter,
  VocabularySort,
  VocabularyFilter,
  QueryResult,
  MigrationDefinition,
} from 'xenolexia-typescript';

export { databaseService, DatabaseService } from './DatabaseService.electron';
