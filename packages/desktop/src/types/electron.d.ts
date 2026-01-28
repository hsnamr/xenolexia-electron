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

  readFile: (filePath: string) => Promise<ArrayBuffer>;
  readFileText: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: ArrayBuffer | string) => Promise<string>;
  fileExists: (filePath: string) => Promise<boolean>;
  getAppDataPath: () => Promise<string>;
  getBooksDirectory: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
