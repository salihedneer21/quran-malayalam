import type { StateStorage } from 'zustand/middleware';

import kv from '@/src/storage/kv';

export const zustandStorage: StateStorage = {
  getItem: (name) => kv.getString(name) ?? null,
  setItem: (name, value) => kv.set(name, value),
  removeItem: (name) => kv.delete(name),
};

