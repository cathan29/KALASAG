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
- Screens should communicate purpose through icons, hierarchy, data, and actions instead of long intro text.

## UI Rules Going Forward

- Use `THEME.colors.background` instead of raw black.
- Use card surfaces with `THEME.colors.surface`.
- Cards should generally use `borderRadius: 16`, `padding: 16`, and subtle elevation/shadow.
- Use blue for normal actions.
- Use red only for emergency/alert actions.
- Use gradients sparingly on hero cards and high-priority sections.
- Keep tab bar floating and rounded.
- Keep screens compact and thumb-friendly so the app feels native on phones, not like a web dashboard.
- Avoid explanatory paragraphs in the UI unless the user is blocked or an empty/error state needs context.
- Prefer short labels such as "Now", "Live", "Local", "Feeds", and "Guides".
- Make primary actions obvious through button shape, icon, color, and placement.
