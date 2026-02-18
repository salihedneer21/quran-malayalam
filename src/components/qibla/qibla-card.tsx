import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/card';
import { QiblaCompass } from '@/src/components/qibla/qibla-compass';
import { useDeviceHeading } from '@/src/features/qibla/use-device-heading';
import { useQiblaDirection } from '@/src/features/qibla/use-qibla-direction';
import { palette } from '@/src/theme/palette';

export function QiblaCard({
  latitude,
  longitude,
  isActive = true,
  onPressActivate,
}: {
  latitude: number;
  longitude: number;
  isActive?: boolean;
  onPressActivate?: () => void;
}) {
  const qibla = useQiblaDirection(latitude, longitude);
  const headingState = useDeviceHeading(isActive);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Qibla</Text>
        <Text style={styles.subtitle}>Point your phone toward Qibla direction</Text>
      </View>

      {!isActive && (
        <View style={styles.activation}>
          <Text style={styles.activationText}>Compass is off to save battery.</Text>
          <Pressable
            onPress={onPressActivate}
            disabled={!onPressActivate}
            accessibilityRole="button"
            accessibilityLabel="Activate Qibla finder"
            style={({ pressed }) => [
              styles.activationBtn,
              (pressed || !onPressActivate) && { opacity: 0.85 },
              !onPressActivate && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.activationBtnText}>Activate (Watch Ad)</Text>
          </Pressable>
        </View>
      )}

      <QiblaCompass
        qiblaBearing={qibla.direction}
        deviceHeading={headingState.heading}
        headingReference={headingState.northReference}
      />

      {headingState.error ? <Text style={styles.error}>{headingState.error}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16, paddingVertical: 20 },
  header: { gap: 4, alignItems: 'center' },
  title: { color: palette.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 13, textAlign: 'center' },
  error: { color: palette.danger, fontSize: 12, textAlign: 'center' },
  activation: { gap: 10, alignItems: 'center' },
  activationText: { color: palette.muted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  activationBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.accentDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(27, 94, 32, 0.08)',
  },
  activationBtnText: { color: palette.accentDark, fontSize: 13, fontWeight: '900' },
});
