/**
 * Electron IFileSystem adapter - uses IPC (window.electronAPI) in renderer.
 */

import type { IFileSystem } from 'xenolexia-typescript';

declare global {
  interface Window {
    electronAPI?: {
      readFile?: (filePath: string) => Promise<ArrayBuffer>;
      readFileText?: (filePath: string) => Promise<string>;
      writeFile?: (filePath: string, content: string | ArrayBuffer, encoding?: string) => Promise<void>;
      fileExists?: (filePath: string) => Promise<boolean>;
      unlink?: (filePath: string) => Promise<void>;
      getAppDataPath?: () => Promise<string>;
    };
  }
}

function getAPI(): NonNullable<Window['electronAPI']> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('window.electronAPI not available (Electron preload only)');
  }
  return window.electronAPI;
}

export const electronFileSystem: IFileSystem = {
  async readFile(filePath: string): Promise<ArrayBuffer> {
    const buf = await getAPI().readFile!(filePath);
    return buf;
  },

  async readFileAsText(filePath: string): Promise<string> {
    return getAPI().readFileText!(filePath);
  },

  async readFileAsBase64(filePath: string): Promise<string> {
    const buf = await getAPI().readFile!(filePath);
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  },

  async writeFile(
    filePath: string,
    content: string | ArrayBuffer,
    encoding?: 'utf8' | 'base64'
  ): Promise<void> {
    await getAPI().writeFile!(filePath, content, encoding);
  },

  async fileExists(filePath: string): Promise<boolean> {
    try {
      return (await getAPI().fileExists?.(filePath)) ?? false;
    } catch {
      return false;
    }
  },

  async unlink(filePath: string): Promise<void> {
    await getAPI().unlink!(filePath);
  },

  async getAppDataPath(): Promise<string> {
    return getAPI().getAppDataPath?.() ?? '/tmp/xenolexia';
  },
};
