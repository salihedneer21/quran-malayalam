type KV = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

const kv: KV = {
  getString(key) {
    if (typeof window === 'undefined') return undefined;
    const value = window.localStorage?.getItem(key);
    return value ?? undefined;
  },
  set(key, value) {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(key, value);
  },
  delete(key) {
    if (typeof window === 'undefined') return;
    window.localStorage?.removeItem(key);
  },
};

export default kv;

