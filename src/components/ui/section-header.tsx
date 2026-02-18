import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/src/theme/palette';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  title: { color: palette.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 13, lineHeight: 18 },
});

