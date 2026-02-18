import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppStore } from '@/src/store/app-store';

export default function IndexRoute() {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const hasLocation = useAppStore((s) => Boolean(s.location));

  if (!hasHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={hasLocation ? '/(tabs)' : '/(onboarding)/location'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

