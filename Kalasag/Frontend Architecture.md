# Frontend Architecture

## Stack

- Expo SDK 54
- React Native 0.81
- React 19.1
- Zustand for app state
- AsyncStorage persistence
- React Navigation bottom tabs
- `react-native-maps`
- `expo-location`
- `expo-linear-gradient`
- `lottie-react-native`
- `@expo/vector-icons`

## State Stores

### Weather Store

File: `src/store/useWeatherStore.js`

Owns:

- Current GPS location
- Location permission status
- Reverse-geocoded label
- Weather API data
- Loading and error state

### Alerts Store

File: `src/store/useAlertsStore.js`

Owns:

- ReliefWeb alert/report data
- Last updated timestamp
- Loading and error state

### Preparedness Store

File: `src/store/usePreparednessStore.js`

Owns:

- Saved places
- Go-bag checklist completion
- Family plan notes
- AsyncStorage persistence for offline use

## Shared Components

### SkeletonLoader

File: `src/components/SkeletonLoader.js`

Purpose:

- Replaces raw spinners with shimmering card placeholders.
- Uses `Animated` plus `expo-linear-gradient`.

### EmptyState

File: `src/components/EmptyState.js`

Purpose:

- Reusable polished empty/error state.
- Uses `lottie-react-native` with a bundled local animation.
- Includes icon fallback styling.

### GlassCard

File: `src/components/GlassCard.js`

Purpose:

- Provides reusable translucent glass cards without native blur dependencies.
- Adds a subtle top sheen, tint layer, and translucent surface styling.
- Keeps glass effects consistent across Weather, Alerts, Radar, Ready, and Emergency.

## Mobile-First Product Areas

- Weather: large native hero card, risk summary, metric cards, hourly rain strip, short "Now" status label.
- Alerts: compact live summary, ReliefWeb report cards, official feed cards, Lottie empty state.
- Radar: full-screen map, OSM base tiles, RainViewer radar overlay, frame selector, compact HUD.
- Ready: packed percentage, saved locations, go-bag progress, shelters, family plan.
- Emergency: `SOS` tab, location-aware hotline directory, manual city search, dial-first cards.

## Navigation Direction

- Default React Navigation headers are hidden.
- Bottom tabs are the primary navigation surface.
- Emergency appears as `SOS` in the tab bar.
- Weather appears as `Now` in the tab bar to keep five-tab spacing clean.
- Screens should communicate purpose through icons, hierarchy, data, and actions instead of long intro text.
- The tab bar uses translucent styling for an iOS-style floating glass effect.
- Blur and native-only UI must provide fallbacks for unsupported preview targets.
- Active tab state should be an icon pill, not a full item background.
- Current tab bar height is 76px with compact 10px labels and 40x30 icon pills.

## Brand Assets

- App icon: `assets/icon.png`
- Android adaptive icon: `assets/adaptive-icon.png`
- Splash image: `assets/splash.png`
- Web favicon: `assets/favicon.png`
- Current direction: abstract shield plus radar sweep, no text, no official seal, no over-detailed AI illustration.

## UI Rules Going Forward

- Use `THEME.colors.background` instead of raw black.
- Use card surfaces with `THEME.colors.surface`.
- Cards should generally use `borderRadius: 16`, `padding: 16`, and subtle elevation/shadow.
- Use blue for normal actions.
- Use red only for emergency/alert actions.
- Use gradients sparingly on hero cards and high-priority sections.
- Keep tab bar floating and rounded.
- Keep bottom navigation labels short; avoid labels wider than the tab item.
- Keep screens compact and thumb-friendly so the app feels native on phones, not like a web dashboard.
- Avoid explanatory paragraphs in the UI unless the user is blocked or an empty/error state needs context.
- Prefer short labels such as "Now", "Live", "Local", "Feeds", and "Guides".
- Make primary actions obvious through button shape, icon, color, and placement.
- Use glass selectively on panels and controls; avoid making every element frosted or the screen will look noisy.
- Avoid raw unsupported native components in previews; use polished fallback cards instead.
- Do not use `ExpoBlurView` in Expo Go unless the runtime is confirmed to support it.
