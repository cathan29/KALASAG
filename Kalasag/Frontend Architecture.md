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
- `expo-notifications`
- `expo-dev-client`
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

### Notification Store

File: `src/store/useNotificationStore.js`

Owns:

- Notification permission status
- Enabled/Disabled toggle
- Notification radius (km)
- Quiet hours settings (Start/End, Enabled toggle)
- Set of notified alert IDs (to prevent duplicates)

### Shelters Store

File: `src/store/useSheltersStore.js`

Owns:

- Cached list of nearby shelters
- Search radius
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
- Alerts: compact live summary, ReliefWeb report cards, official feed cards, Lottie empty state. Detailed view via `AlertDetailScreen` for specific hazard instructions and Radar focus.
- Radar: full-screen native map, RainViewer radar overlay, software rain/wind/temp overlays, collapsible layer sidebar, autoplay timeline.
- Ready: packed percentage, saved locations, go-bag progress, evacuation centers via `SheltersScreen`, family plan.
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

## Radar Map Direction

- Use the native map provider as the base map; avoid depending on public OSM tile access for the base layer.
- Radar layer uses RainViewer tile frames.
- Rain, wind, and temperature layers are software overlays driven by Open-Meteo hourly data.
- Non-radar forecast layers must show actual hourly values on the map through persistent data pucks, not only decorative tints or appearing/disappearing animation.
- Controls live in a right-side collapsible panel.
- Controls should be vertically centered for one-handed use.
- Timeline starts paused; the user must tap play.
- Timeline controls should live in a bottom bar, separate from the layer panel, following familiar weather-map app behavior.
- Bottom timeline should show play/pause, frame label, layer value, progress, frame count, and source.
- A visible info card should explain the active layer and expose useful values, not just show animation.
- Map taps should drop an inspection pin and fetch a point forecast when online.
- Map styling should follow `useColorScheme()` so dark-mode devices get dark map styling.
- Layer buttons must represent real data sources and show source labels.
- Disable a layer if its required data is unavailable rather than showing a fake static layer.
- PAGASA public bulletins/files can be linked or summarized, but do not use them as a map tile/API source unless a stable documented endpoint is confirmed.
- Windy can be used as UX inspiration for layer and timeline interaction, but do not depend on Windy paid layers or copy Windy branding.

## Dev Infrastructure

- **Development Build**: Transitioned from Expo Go to Development Builds using `expo-dev-client` to support native modules like `expo-notifications`.
- **Native Identity**: Configured Android package name and iOS bundle identifier as `com.cathan.kalasag` in `app.json`.
- **Deployment**: App requires a custom development client build for testing notification and location-aware features.

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
- Keep map controls compact enough for one-handed mobile use; avoid covering the user's location marker.
