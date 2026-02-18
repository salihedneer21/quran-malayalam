import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { BannerAdSize } from 'react-native-google-mobile-ads';

import { AdBanner } from '@/src/features/ads/ad-banner';
import { env } from '@/src/config/env';
import { fetchPlaceDetails, fetchPlaceSuggestions, reverseGeocode, type PlaceSuggestion } from '@/src/features/location/google-places';
import { getTimeZoneId } from '@/src/features/timezone/timezone';
import { useAppStore } from '@/src/store/app-store';
import { palette } from '@/src/theme/palette';

type SelectedLocation = {
  latitude: number;
  longitude: number;
  name?: string;
};

const FALLBACK_LOCATION: SelectedLocation = {
  latitude: 21.4225,
  longitude: 39.8262,
  name: 'Makkah',
};

export default function LocationScreen() {
  const mapRef = useRef<MapView>(null);
  const setLocation = useAppStore((s) => s.setLocation);

  const [selected, setSelected] = useState<SelectedLocation>(FALLBACK_LOCATION);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const region: Region = useMemo(
    () => ({
      latitude: selected.latitude,
      longitude: selected.longitude,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    }),
    [selected.latitude, selected.longitude]
  );

  const animateTo = useCallback(
    (lat: number, lng: number) => {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.12, longitudeDelta: 0.12 },
        350
      );
    },
    []
  );

  const updateSelected = useCallback(
    async (lat: number, lng: number, optimisticName?: string) => {
      setSelected({ latitude: lat, longitude: lng, name: optimisticName });

      const apiKey = env.googleMapsApiKey;
      if (apiKey) {
        const name = await reverseGeocode(lat, lng, apiKey);
        if (name) setSelected({ latitude: lat, longitude: lng, name });
        return;
      }

      try {
        const native = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const first = native?.[0];
        const fallbackName = [first?.city, first?.region, first?.country].filter(Boolean).join(', ');
        if (fallbackName) setSelected({ latitude: lat, longitude: lng, name: fallbackName });
      } catch {
        // ignore
      }
    },
    []
  );

  const locateMe = useCallback(async () => {
    setIsGpsLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable location access to auto-select your current location.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;

      animateTo(latitude, longitude);
      await updateSelected(latitude, longitude);
    } catch (e) {
      console.warn('locateMe failed', e);
      Alert.alert('Could not locate', 'Please try again or choose a location on the map.');
    } finally {
      setIsGpsLoading(false);
    }
  }, [animateTo, updateSelected]);

  useEffect(() => {
    void locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const apiKey = env.googleMapsApiKey;
      const next = await fetchPlaceSuggestions(text, apiKey);
      setSuggestions(next);
      setShowSuggestions(next.length > 0);
    }, 250);
  };

  const selectSuggestion = async (item: PlaceSuggestion) => {
    const apiKey = env.googleMapsApiKey;
    if (!apiKey) {
      Alert.alert('Missing API key', 'Google Maps API key is not configured.');
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchText('');
    Keyboard.dismiss();

    try {
      const details = await fetchPlaceDetails(item.placeId, apiKey);
      if (!details) {
        Alert.alert('Not found', 'Could not fetch that place. Try again.');
        return;
      }

      animateTo(details.latitude, details.longitude);
      setSelected({ latitude: details.latitude, longitude: details.longitude, name: details.name });
    } catch (e) {
      console.warn('selectSuggestion failed', e);
      Alert.alert('Error', 'Could not fetch place details.');
    } finally {
      setIsSearching(false);
    }
  };

  const onContinue = async () => {
    if (!Number.isFinite(selected.latitude) || !Number.isFinite(selected.longitude)) {
      Alert.alert('Invalid location', 'Please choose a valid location.');
      return;
    }

    setIsSaving(true);
    try {
      const apiKey = env.googleMapsApiKey;
      const timeZoneId = (await getTimeZoneId(selected.latitude, selected.longitude, apiKey)) ?? 'UTC';

      setLocation({
        latitude: selected.latitude,
        longitude: selected.longitude,
        name: selected.name,
        timeZoneId,
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const onMapPress = async (lat: number, lng: number) => {
    await updateSelected(lat, lng);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}
      >
        <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>Select your location</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              We use it to calculate Qibla direction and prayer times.
            </Text>
          </View>

          <View style={[styles.searchWrapper, { zIndex: 10 }]}>
            <View style={[styles.searchContainer, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <TextInput
                value={searchText}
                onChangeText={handleSearchTextChange}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                placeholder="Search city, area, or address…"
                placeholderTextColor={palette.muted}
                style={[styles.searchInput, { color: palette.text }]}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isSearching ? (
                <View style={styles.searchAdornment}>
                  <ActivityIndicator color={palette.muted} />
                </View>
              ) : searchText.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setSearchText('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  style={({ pressed }) => [styles.searchAdornment, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.clearText, { color: palette.muted }]}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View style={[styles.suggestions, { backgroundColor: palette.card, borderColor: palette.border }]}>
                {suggestions.map((s) => (
                  <Pressable
                    key={s.placeId}
                    onPress={() => void selectSuggestion(s)}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      { borderBottomColor: palette.border },
                      pressed && { backgroundColor: '#1B1814' },
                    ]}
                  >
                    <Text style={[styles.suggestionText, { color: palette.text }]} numberOfLines={1}>
                      {s.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.mapContainer, { borderColor: palette.border }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              onPress={(e) => void onMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
              showsUserLocation
              showsMyLocationButton={false}
              rotateEnabled
            >
              <Marker
                coordinate={{ latitude: selected.latitude, longitude: selected.longitude }}
                draggable
                onDragEnd={(e) => void onMapPress(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
              />
            </MapView>

            <Pressable
              onPress={() => void locateMe()}
              disabled={isGpsLoading}
              style={({ pressed }) => [
                styles.gpsButton,
                { backgroundColor: palette.card, borderColor: palette.border },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              {isGpsLoading ? <ActivityIndicator color={palette.text} /> : <Text style={{ fontSize: 18 }}>📍</Text>}
            </Pressable>
          </View>

          <View style={[styles.bottomCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.bottomRow}>
              <View style={styles.bottomText}>
                <Text style={[styles.placeName, { color: palette.text }]} numberOfLines={2}>
                  {selected.name ?? 'Tap on the map to select'}
                </Text>
                <Text style={[styles.coords, { color: palette.muted }]}>
                  {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                </Text>
              </View>
              <Pressable
                onPress={onContinue}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: palette.accent },
                  (pressed || isSaving) && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={palette.accentText} />
                ) : (
                  <Text style={[styles.ctaText, { color: palette.accentText }]}>Continue</Text>
                )}
              </Pressable>
            </View>

            <AdBanner placement="bottomDock" size={BannerAdSize.MEDIUM_RECTANGLE} style={styles.adWrap} />

            {!env.googleMapsApiKey && (
              <Text style={[styles.apiWarning, { color: palette.danger }]}>
                Missing Google Maps API key. Search and place names will be limited.
              </Text>
            )}
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 6 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  searchWrapper: { paddingHorizontal: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  searchAdornment: { paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 16, fontWeight: '700' },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  suggestionText: { fontSize: 14 },
  mapContainer: { marginTop: 12, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1, flex: 1 },
  map: { flex: 1 },
  gpsButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCard: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottomText: { flex: 1, gap: 4 },
  placeName: { fontSize: 16, fontWeight: '700' },
  coords: { fontSize: 12 },
  cta: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, minWidth: 110, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '800' },
  apiWarning: { fontSize: 12, lineHeight: 16 },
  adWrap: { paddingTop: 8, paddingBottom: 2 },
});
