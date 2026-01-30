/**
 * Database Service - Renderer stub using IPC
 * Used in the Electron renderer so better-sqlite3 (native) never runs in the renderer.
 * All operations are forwarded to the main process via IPC.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowsAffected: number;
  insertId?: number;
}

export interface MigrationDefinition {
  version: number;
  description: string;
  up: string;
  down?: string;
}

function getAPI() {
  if (typeof window === 'undefined' || !window.electronAPI?.dbInvoke) {
    throw new Error('electronAPI.dbInvoke not available (preload not loaded?)');
  }
  return window.electronAPI.dbInvoke;
}

interface Transaction {
  executeSql: (
    sql: string,
    params: any[],
    success?: (tx: Transaction, result: any) => void,
    error?: (tx: Transaction, err: any) => boolean,
  ) => any;
}

export class DatabaseService {
  static getInstance(): DatabaseService {
    return databaseService;
  }

  async initialize(): Promise<void> {
    return getAPI()('initialize');
  }

  async execute<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<{rows: T[]; rowsAffected: number; insertId?: number}> {
    return getAPI()('execute', sql, params);
  }

  async getOne<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T | null> {
    return getAPI()('getOne', sql, params);
  }

  async getAll<T = Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T[]> {
    return getAPI()('getAll', sql, params);
  }

  async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    const ops: Array<{sql: string; params: (string | number | null)[]}> = [];
    const tx: Transaction = {
      executeSql: (sql: string, params: any[]) => {
        ops.push({sql, params: params ?? []});
        return {rows: [], rowsAffected: 0};
      },
    };
    const result = await callback(tx);
    await getAPI()('transaction', ops);
    return result;
  }

  async executeBatch(
    statements: Array<{sql: string; params?: (string | number | null)[]}>,
  ): Promise<void> {
    return getAPI()('executeBatch', statements);
  }

  async insert(
    table: string,
    data: Record<string, string | number | null>,
  ): Promise<number | undefined> {
    return getAPI()('insert', table, data);
  }

  async update(
    table: string,
    data: Record<string, string | number | null>,
    where: string,
    whereParams: (string | number | null)[] = [],
  ): Promise<number> {
    return getAPI()('update', table, data, where, whereParams);
  }

  async delete(
    table: string,
    where: string,
    whereParams: (string | number | null)[] = [],
  ): Promise<number> {
    return getAPI()('delete', table, where, whereParams);
  }

  async getSchemaVersion(): Promise<number> {
    return getAPI()('getSchemaVersion');
  }

  async tableExists(tableName: string): Promise<boolean> {
    return getAPI()('tableExists', tableName);
  }

  async getTableInfo(tableName: string): Promise<Array<{name: string; type: string}>> {
    return getAPI()('getTableInfo', tableName);
  }

  async vacuum(): Promise<void> {
    return getAPI()('vacuum');
  }

  isReady(): boolean {
    return true;
  }

  async close(): Promise<void> {
    return getAPI()('close');
  }
}

export const databaseService = new DatabaseService();
