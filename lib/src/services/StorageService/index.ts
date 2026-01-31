/**
 * Storage Service - Database operations and repositories
 * Uses direct LowDB data API (no SQL).
 */

export {StorageService} from './StorageService';
export {DatabaseSchema} from './DatabaseSchema';
export {databaseService} from './DatabaseService';
export type {QueryResult, MigrationDefinition} from './DatabaseService';
export type {
  IDataStore,
  BookRow,
  VocabularyRow,
  SessionRow,
  WordListRow,
  VocabularySort,
  VocabularyFilter,
} from './DataStore.types';

// Repositories
export {
  bookRepository,
  vocabularyRepository,
  sessionRepository,
} from './repositories';
export type {
  BookFilter,
  BookSort,
  VocabularyFilter,
  VocabularySort,
} from './repositories';
