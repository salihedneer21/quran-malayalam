import { MMKV } from 'react-native-mmkv';

type KV = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

const memory = new Map<string, string>();

const memoryKv: KV = {
  getString(key) {
    return memory.get(key);
  },
  set(key, value) {
    memory.set(key, value);
  },
  delete(key) {
    memory.delete(key);
  },
};

let kv: KV;

try {
  const mmkv = new MMKV({ id: 'qibla-namaz' });
  kv = {
    getString: (key) => mmkv.getString(key) ?? undefined,
    set: (key, value) => mmkv.set(key, value),
    delete: (key) => mmkv.delete(key),
  };
} catch (e) {
  // MMKV uses JSI and will throw if JS is running in a remote debugger (e.g. Chrome).
  // In that case we fall back to an in-memory store so the app can still run.
  console.warn(
    '[storage] MMKV unavailable (likely Remote JS Debugging). Falling back to in-memory storage.'
  );
  kv = memoryKv;
}

export default kv;
