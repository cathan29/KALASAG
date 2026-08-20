# System Status - 2026-08-21

## Executive Summary

The app has moved from a barebones Expo prototype into a more complete premium React Native disaster app. The biggest changes are:

- Removed hardcoded Manila weather coordinates.
- Added dynamic foreground location permission flow through `expo-location`.
- Weather now uses actual GPS latitude and longitude.
- Map centers on the user and overlays RainViewer radar tiles.
- Emergency screen now detects municipality through reverse geocoding and supports manual offline city search.
- Added a mobile-native Preparedness tab for saved places, go-bag tracking, family plan notes, shelters, and official bulletin sources.
- UI theme changed from pure black to deep navy/slate.
- Added gradients, skeleton loading, Lottie empty states, floating tabs, and stronger card design.
- Latest UI pass removed web-like explanatory copy and moved screens toward compact, icon-led mobile app surfaces.

## Runtime Flow

1. `App.js` requests foreground location permission on launch.
2. If permission is granted, the app reads GPS coordinates.
3. `Location.reverseGeocodeAsync` builds a human-readable location label.
4. `useWeatherStore` stores `userLocation`, `locationLabel`, `locationPermissionStatus`, `weatherData`, and loading/error states.
5. Weather fetches from Open-Meteo using the actual device coordinates.
6. Radar map reads the same location store and centers the map on the user.
7. Emergency screen independently reverse geocodes to detect municipality and matches bundled hotline data.
8. Preparedness data persists offline through AsyncStorage.

## Screens

### Weather

File: `src/screens/WeatherScreen.js`

Current behavior:

- Uses `useWeatherStore`.
- Shows skeleton loading while GPS/weather loads.
- Shows a large gradient weather card with massive temperature text.
- Displays humidity, wind, rain, and 3-day outlook cards.
- Adds a compact 12-hour rain forecast strip and a risk summary card.
- Top label now uses a short native status label: "Now".
- Uses `expo-linear-gradient` and `@expo/vector-icons`.

### Alerts

File: `src/screens/AlertsScreen.js`

Current behavior:

- Reads from `useAlertsStore`.
- Uses ReliefWeb reports when available.
- Shows skeleton loading while fetching.
- Shows premium cards for alert items.
- Includes an official source watchlist for PAGASA, NDRRMC, PHIVOLCS, and ReliefWeb.
- Summary card now uses compact labels: "Live", "Alerts", "Reports", "Mapped", and "Feed".
- Empty state uses Lottie placeholder and Filipino copy: "Walang naitalang sakuna ngayon. Ligtas ang araw!"

Important caveat:

- ReliefWeb now requires an approved `appname`. Without `EXPO_PUBLIC_RELIEFWEB_APP_NAME`, the app degrades cleanly instead of spamming Axios errors.

### Radar Map

File: `src/screens/MapScreen.js`

Current behavior:

- Centers map on actual GPS location.
- Shows user location marker.
- Fetches latest RainViewer radar tile template from `src/services/radarApi.js`.
- Adds `UrlTile` overlay to `react-native-maps`.
- Plots hazard markers when alert records include coordinates.
- Includes HUD with current temperature, hazard count, and radar status.
- Lets the user switch recent RainViewer radar frames from the map HUD.
- HUD labels were shortened to feel more like a native radar panel instead of a web dashboard.

### Preparedness

File: `src/screens/PreparednessScreen.js`

Current behavior:

- Persists saved locations, go-bag checklist progress, and family plan text.
- Shows nearby shelter seed data from bundled JSON.
- Lists official bulletin sources for quick reference.
- Uses a compact mobile app layout with cards, chips, horizontal lists, and native text inputs.
- Hero now prioritizes progress: "Ready", packed percentage, and saved place count.

### Emergency

File: `src/screens/EmergencyScreen.js`

Current behavior:

- Requests location and reverse geocodes municipality/city/subregion.
- Stores `detectedCity` in component state.
- Searches bundled municipality hotline data.
- Renders "Your Local Hotlines" first when there is a match.
- Provides manual city search fallback.
- Shows national and regional hotlines below local results.
- Uses gradient local hotline section and premium cards.
- Screen copy was tightened to fast labels: "SOS", "Emergency", "Local", "National", "Regional", and "Guides".

Bundled municipality examples:

- Dagupan City
- Rosales

## Navigation

File: `src/navigation/AppNavigator.js`

Current behavior:

- Floating bottom tab bar.
- Rounded corners, detached from bottom edge.
- Deep slate surface, subtle shadow.
- Native icon tabs for Weather, Alerts, Radar, Ready, and SOS.
- Default React Navigation headers are hidden so each screen owns its visual hierarchy.

## Theme

File: `src/constants/theme.js`

Current palette:

- Main background: `#0F172A`
- Surface background: `#1E293B`
- Primary text: `#F8FAFC`
- Action blue: `#3B82F6`
- Emergency red: `#EF4444`

The UI should avoid pure black backgrounds going forward.

## Installed UI Libraries

Installed via npm/Expo:

- `lottie-react-native`
- `expo-linear-gradient`
- `react-native-reanimated`
- `@expo/vector-icons`

Notes:

- `react-native-reanimated` is installed.
- Current skeleton shimmer uses React Native `Animated` plus `expo-linear-gradient` to avoid unnecessary Babel complexity.
- `babel-preset-expo` is pinned to the Expo SDK 54 compatible version.

## Verification Already Run

Recent checks:

- `node --check` passed for changed JS files.
- `package.json` and `package-lock.json` parse cleanly.
- `npx expo export --platform android --output-dir .expo-export-check --clear` completed successfully.
- Temporary export folder was removed after verification.
- Latest UI-only patch was rechecked with `node --check` on touched screen/navigation files and a successful Android Expo export.

## Known Constraints

- No analytics or telemetry has been added.
- ReliefWeb live reports require an approved `appname`.
- Emergency municipal hotline lookup is intentionally local/offline-first, not live scraping.
- Lottie uses a bundled local JSON animation so the empty state remains available offline.
