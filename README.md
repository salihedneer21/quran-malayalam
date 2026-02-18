# Qibla & Namaz (Expo + Expo Router)

An offline-first React Native app built with Expo SDK 54 and Expo Router:

- Location selection (Map + search)
- Qibla compass (live heading + haptics)
- 5 daily prayer times (on-device calculation via `react-native-adhan`)
- Persisted state with Zustand + MMKV

## Setup

### 1) Install dependencies

```bash
pnpm install
```

### 2) Create a Development Build (required)

This project uses native modules (`react-native-maps`, `react-native-mmkv`), so it will **not** run in Expo Go.

```bash
pnpm prebuild
pnpm ios
# or
pnpm android
```

### 3) Start Metro for a dev client

```bash
pnpm start
```

## Google Maps API key

The API key is currently set in `app.json`:

- `expo.android.config.googleMaps.apiKey`
- `expo.extra.googleMapsApiKey` (used for Places/Geocoding HTTP calls)

For production: restrict the key by package/bundle identifier in Google Cloud Console.

## Offline behavior

- Prayer times and Qibla work offline after location is saved (stored in MMKV).
- Maps/search require internet for tiles and Google APIs.

## EAS Build (optional)

This repo includes `eas.json` with `development`, `preview`, and `production` profiles.

## Routes

- `app/(onboarding)/location.tsx`: initial location picker
- `app/(tabs)/index.tsx`: Home (calendar, Qibla, prayer times)
- `app/(tabs)/about.tsx`: About + change location

## Notes

- If you hit compass issues, calibrate by moving the phone in a “figure 8” motion.
# quran-malayalam
