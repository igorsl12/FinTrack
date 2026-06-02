/**
 * Storage adapter abstraction.
 *
 * The web implementation wraps `localStorage`. For React Native this can
 * be swapped by an adapter built on `AsyncStorage` exposing the same API.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryFallback = new Map<string, string>();

const isBrowser = typeof globalThis !== 'undefined' &&
  typeof (globalThis as { localStorage?: Storage }).localStorage !== 'undefined';

export const webStorage: StorageAdapter = {
  getItem: (key) =>
    isBrowser ? globalThis.localStorage.getItem(key) : memoryFallback.get(key) ?? null,
  setItem: (key, value) => {
    if (isBrowser) globalThis.localStorage.setItem(key, value);
    else memoryFallback.set(key, value);
  },
  removeItem: (key) => {
    if (isBrowser) globalThis.localStorage.removeItem(key);
    else memoryFallback.delete(key);
  },
};

/**
 * Adapter compatible with Zustand's `persist` middleware.
 * Built on top of the StorageAdapter so we can swap implementations.
 */
export const createZustandStorage = (adapter: StorageAdapter) => ({
  getItem: (name: string) => adapter.getItem(name),
  setItem: (name: string, value: string) => adapter.setItem(name, value),
  removeItem: (name: string) => adapter.removeItem(name),
});
