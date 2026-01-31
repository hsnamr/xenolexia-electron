/**
 * Type definitions for Electron API exposed via preload script
 */

export interface ElectronAPI {
  platform: string;

  onMenuAction: (callback: (event: any, action: string) => void) => void;
  openExternal?: (url: string) => Promise<void>;

  showOpenDialog: (options: {
    filters: Array<{name: string; extensions: string[]}>;
    properties: string[];
  }) => Promise<{path: string; name: string; size: number} | null>;

  showSaveDialog: (options?: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{name: string; extensions: string[]}>;
  }) => Promise<string | null>;

  readFile: (filePath: string) => Promise<ArrayBuffer>;
  readFileText: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: ArrayBuffer | string) => Promise<string>;
  fileExists: (filePath: string) => Promise<boolean>;
  getAppDataPath: () => Promise<string>;
  getBooksDirectory: () => Promise<string>;

  /** Database operations (renderer calls main process) */
  dbInvoke: (method: string, ...args: unknown[]) => Promise<unknown>;

  /** Translation in main process (avoids renderer fetch/CSP) */
  translateBulk: (
    words: string[],
    sourceLanguage: string,
    targetLanguage: string
  ) => Promise<{ translations: Record<string, string>; provider: string; failed: string[] }>;

  /** Download dictionary JSON from URL (main process fetch). Expected format: array of { source, target, rank?, pos?, variants?, pronunciation? }. */
  downloadDictionary: (url: string) => Promise<{
    words?: Array<{ source: string; target: string; rank?: number; pos?: string; variants?: string[]; pronunciation?: string }>;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
