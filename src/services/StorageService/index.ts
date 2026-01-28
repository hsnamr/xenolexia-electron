/**
 * Storage Service - Database operations and repositories
 */

// Legacy service (to be deprecated)
export {StorageService} from './StorageService';
export {DatabaseSchema} from './DatabaseSchema';

// New database service
export {databaseService} from './DatabaseService';
export type {QueryResult, MigrationDefinition} from './DatabaseService';

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
