import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { AdBanner } from '@/src/features/ads/ad-banner';
import { useAds } from '@/src/features/ads/use-ads';
import { useAppStore } from '@/src/store/app-store';
import { BannerAdSize } from 'react-native-google-mobile-ads';

export default function AboutScreen() {
  const location = useAppStore((s) => s.location);
  const ads = useAds();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>About</Text>
            <Text style={styles.subTitle}>Qibla & Namaz</Text>
          </View>

          <AdBanner placement="aboutTop" size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />

          <Text style={styles.body}>
            Works fully offline after you choose your location: prayer times and Qibla direction are calculated on-device.
          </Text>

          <AdBanner placement="aboutTop" size={BannerAdSize.MEDIUM_RECTANGLE} />

          <View style={styles.card}>
            <Text style={styles.label}>Current location</Text>
            <Text style={styles.value} numberOfLines={2}>
              {location?.name ?? 'Saved coordinates'}
            </Text>
            {location && (
              <Text style={styles.coords}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            )}

            <Pressable
              onPress={() => {
                void (async () => {
                  await ads.showInterstitial({ placement: 'about:change-location', maxWaitMs: 0 });
                  router.push('/(onboarding)/location');
                })();
              }}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.buttonText}>Change location</Text>
            </Pressable>
          </View>

          <AdBanner placement="aboutTop" size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with care for the Muslim community</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { alignItems: 'center', gap: 4 },
  title: { color: '#212121', fontSize: 28, fontWeight: '900' },
  subTitle: { color: '#757575', fontSize: 13, fontWeight: '600' },
  body: { color: '#757575', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: { color: '#9E9E9E', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: '#212121', fontSize: 18, fontWeight: '700' },
  coords: { color: '#757575', fontSize: 13 },
  button: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 100,
  },
  footerText: { color: '#9E9E9E', fontSize: 13, fontWeight: '500' },
});
