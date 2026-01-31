/**
 * Electron IKeyValueStore adapter using electron-store (renderer-safe).
 */

import Store from 'electron-store';
import type { IKeyValueStore } from 'xenolexia-typescript';

let storeInstance: InstanceType<typeof Store> | null = null;

function getStore(): InstanceType<typeof Store> & { get: (k: string) => unknown; set: (k: string, v: unknown) => void; delete: (k: string) => void; clear: () => void; store?: Record<string, unknown> } {
  if (!storeInstance) {
    storeInstance = new Store() as any;
  }
  return storeInstance as any;
}

export function createElectronKeyValueStore(): IKeyValueStore {
  return {
    async getItem(key: string): Promise<string | null> {
      const v = getStore().get(key);
      return v != null ? String(v) : null;
    },
    async setItem(key: string, value: string): Promise<void> {
      getStore().set(key, value);
    },
    async removeItem(key: string): Promise<void> {
      getStore().delete(key);
    },
    async clear(): Promise<void> {
      getStore().clear();
    },
    async getAllKeys(): Promise<string[]> {
      const s = getStore();
      return s.store ? Object.keys(s.store) : [];
    },
    async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
      const s = getStore();
      return keys.map((k) => [k, (s.get(k) as string) ?? null]);
    },
    async multiSet(pairs: Array<[string, string]>): Promise<void> {
      const s = getStore();
      for (const [k, v] of pairs) s.set(k, v);
    },
    async multiRemove(keys: string[]): Promise<void> {
      const s = getStore();
      for (const k of keys) s.delete(k);
    },
  };
}
