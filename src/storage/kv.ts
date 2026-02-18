import { Platform } from 'react-native';

type KV = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

const kv: KV =
  Platform.OS === 'web'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./kv.web').default
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./kv.native').default;

export default kv;
