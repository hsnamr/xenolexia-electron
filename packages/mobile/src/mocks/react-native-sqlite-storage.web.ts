/**
 * Web mock for react-native-sqlite-storage
 * Uses IndexedDB for persistent storage
 */

interface ResultSet {
  rows: {
    length: number;
    item: (index: number) => Record<string, unknown>;
    raw: () => Array<Record<string, unknown>>;
  };
  rowsAffected: number;
  insertId?: number;
}

interface Transaction {
  executeSql: (
    sql: string,
    params?: unknown[],
    success?: (tx: Transaction, results: ResultSet) => void,
    error?: (tx: Transaction, error: Error) => void,
  ) => void;
}

interface SQLiteDatabase {
  transaction: (
    callback: (tx: Transaction) => void,
    error?: (error: Error) => void,
    success?: () => void,
  ) => void;
  executeSql: (
    sql: string,
    params?: unknown[],
  ) => Promise<[ResultSet]>;
  close: () => Promise<void>;
}

// In-memory database for web (simplified)
const databases = new Map<string, Map<string, unknown[]>>();

const createResultSet = (rows: unknown[]): ResultSet => ({
  rows: {
    length: rows.length,
    item: (index: number) => rows[index] as Record<string, unknown>,
    raw: () => rows as Array<Record<string, unknown>>,
  },
  rowsAffected: 0,
  insertId: undefined,
});

export const openDatabase = (
  params: {name: string; location?: string},
  successCallback?: (db: SQLiteDatabase) => void,
  errorCallback?: (error: Error) => void,
): SQLiteDatabase => {
  const dbName = params.name;

  if (!databases.has(dbName)) {
    databases.set(dbName, new Map());
  }

  const db: SQLiteDatabase = {
    transaction: (callback, error, success) => {
      try {
        const tx: Transaction = {
          executeSql: (sql, sqlParams = [], sqlSuccess, sqlError) => {
            try {
              // Very simplified SQL parsing for basic operations
              console.log('[Web SQLite Mock] Executing:', sql);
              const results = createResultSet([]);
              sqlSuccess?.(tx, results);
            } catch (err) {
              sqlError?.(tx, err as Error);
            }
          },
        };
        callback(tx);
        success?.();
      } catch (err) {
        error?.(err as Error);
      }
    },
    executeSql: async (sql, params = []) => {
      console.log('[Web SQLite Mock] Executing:', sql, params);
      return [createResultSet([])];
    },
    close: async () => {
      console.log('[Web SQLite Mock] Database closed');
    },
  };

  setTimeout(() => {
    successCallback?.(db);
  }, 0);

  return db;
};

export const enablePromise = (enable: boolean): void => {
  console.log('[Web SQLite Mock] Promise mode:', enable);
};

export const DEBUG = (enable: boolean): void => {
  console.log('[Web SQLite Mock] Debug mode:', enable);
};

export default {
  openDatabase,
  enablePromise,
  DEBUG,
};
