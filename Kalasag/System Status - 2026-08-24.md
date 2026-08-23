# System Status - 2026-08-24

## Executive Summary

The app has transitioned from a native-centric radar and alert system to a high-fidelity, data-rich disaster intelligence tool. The most significant updates include:

- **Windy WebView Integration**: Replaced the native `react-native-maps` radar implementation with a high-performance Windy WebView embed. This includes a custom JavaScript bridge for real-time control of map overlays and a dedicated 5-day forecast timeline.
- **Weather-Aware Mascot**: Introduced an interactive Kalasag mascot in the weather hero section. The mascot's mood (Happy, Neutral, Rain, Storm) dynamically shifts based on weather codes, wind speeds, precipitation levels, and active cyclone alerts.
- **Polished Animations**: Integrated a comprehensive suite of Lottie animations for weather states (Clear, Cloudy, Storm, etc.) and category-specific empty states for the Alerts screen, enhancing the premium feel.
- **Official Alert Feed Aggregation**: Upgraded the alerts system to aggregate data from five official global and national sources: PAGASA (via CAP), GDACS, USGS, NASA EONET, and NOAA PTWC. Implemented strict deduplication and severity mapping.
- **Critical Alert Notifications**: Implemented `expo-notifications` for high/critical alerts with a location-aware radius and quiet hours settings. The `useAlertNotifications` hook manages logic for distance-based triggering and deduplication.
- **Detailed Hazard Intelligence**: Added `AlertDetailScreen` to provide deeper context for disasters, including affected locations, category-specific recommended actions, and direct integration with the Radar map for location focus.
- **Nearby Evacuation Centers**: Integrated OpenStreetMap (Overpass API) via `SheltersScreen` to find nearby evacuation centers and assembly points, featuring offline caching and direct directions.
- **Expanded Emergency Directory**: Significantly expanded the verified municipal hotline dataset. The directory now includes a wide range of verified LGUs (e.g., Dagupan, Alitagtag, Compostela, etc.) with explicit verification dates and source URLs.
- **Global Safe Area Layout**: Implemented a root-level `SafeAreaView` to eliminate UI clipping on notch-devices and ensure consistent layout across various Android and iOS screen morphologies.

## Runtime Flow

1. `App.js` initializes location permissions and wraps the application in a `SafeAreaView`.
2. `useWeatherStore` fetches real-time data from Open-Meteo.
3. The Weather screen uses this data to determine the **Mascot mood** and select the appropriate **Lottie weather animation**.
4. The Radar Map loads the Windy WebView; a custom JS bridge (`WINDY_BRIDGE_SCRIPT`) allows the React Native layer to inject weather states (overlay and timestamp) into the map.
5. `alertsApi.js` concurrently fetches from five official feeds, normalizes the data into a unified schema, and deduplicates entries before updating `useAlertsStore`.
6. `useAlertNotifications` monitors the `useAlertsStore` and `useWeatherStore`; it triggers `expo-notifications` for High/Critical alerts if the user is within the configured radius and not in quiet hours.
7. The Emergency screen matches the user's reverse-geocoded municipality against the expanded `hotlines.json` verified directory.
8. `SheltersScreen` queries the OpenStreetMap Overpass API for emergency assembly points and shelters within the user's proximity, caching results in `useSheltersStore` for offline access.

## Screens

### Weather
File: `src/screens/WeatherScreen.js`

Current behavior:
- Features a high-impact hero section with the weather-aware mascot.
- Displays a dynamic Lottie animation reflecting the current weather code (e.g., thunderstorms, drizzle).
- Shows a risk summary card (Low, Moderate, High) based on wind, rain, and cyclone context.
- Includes a 12-hour forecast rail and 3-day outlook.

### Alerts
File: `src/screens/AlertsScreen.js`

Current behavior:
- Aggregates live feeds from PAGASA, GDACS, USGS, EONET, and PTWC.
- Maps source-specific severities to a unified "Critical", "High", "Medium", "Low" scale.
- Uses animated Lottie empty states when no active disasters are found.
- Each alert card links directly to the official source URL or opens the `AlertDetailScreen`.

### Alert Details
File: `src/screens/AlertDetailScreen.js`

Current behavior:
- Shows full advisory details, including affected locations, publication time, and official source.
- Provides category-based recommended actions (e.g., "Drop, Cover, Hold" for earthquakes).
- Includes share functionality and a "Open on Radar" button that focuses the map on the hazard coordinates.

### Notification Settings
File: `src/screens/NotificationSettingsScreen.js`

Current behavior:
- Manages `expo-notifications` permissions.
- Allows users to set a notification radius (50km, 100km, 250km) for critical alerts.
- Configures quiet hours presets to mute overnight notifications.

### Radar Map
File: `src/screens/MapScreen.js`

Current behavior:
- Embeds the Windy WebView for professional-grade meteorological visualization.
- **Layer Sidebar**: Allows users to switch between Radar, Satellite, Wind, Rain, Temperature, and Hurricane trackers.
- **Forecast Timeline**: A bottom-docked control panel allowing users to scrub through 5 days of forecast data with hour-by-hour precision.
- **JS Bridge**: Syncs the WebView's viewport (lat/lon/zoom) back to React Native and allows the app to force overlay changes.

### Emergency
File: `src/screens/EmergencyScreen.js`

Current behavior:
- Uses an expanded `hotlines.json` verified directory.
- Prioritizes local municipal hotlines based on detected city/municipality.
- Provides direct `tel:` links for rapid emergency dialing.
- Lists national and regional hotlines as fallbacks.

### Evacuation Centers
File: `src/screens/SheltersScreen.js`

Current behavior:
- Uses OpenStreetMap (Overpass API) to locate nearby assembly points and emergency shelters.
- Searchable list with distance calculation, address, and operator details.
- Provides direct Google Maps directions and `tel:` links for shelter contacts.
- Caches data in `useSheltersStore` for offline access during network outages.

## Theme & Assets

### Assets
- **Mascot**: A set of mood-based PNGs (`kalasag-weather-happy.png`, etc.) located in `assets/mascot/`.
- **Animations**: Lottie JSON files from the `@meteocons/lottie` package for weather states.

### Layout
- Root-level `SafeAreaView` prevents content from bleeding into the status bar or notch.
- Consistent use of `GlassCard` and deep slate backgrounds (`#0F172A`) across all screens.

## Verification Already Run

- **Windy Integration**: Verified JS bridge communication and timeline scrubbing on Android.
- **Alerts**: Confirmed successful fetch and normalization from PAGASA and USGS feeds.
- **Notifications**: Verified `expo-notifications` trigger for Critical alerts within the 50km radius; confirmed quiet hours mute behavior.
- **Shelters**: Confirmed successful Overpass API query and correct distance sorting for assembly points in Metro Manila.
- **Mascot**: Verified mood transitions across different weather code simulations.
- **Safe Area**: Confirmed no UI clipping on simulated notch devices.
- **Emergency**: Verified municipality matching for newly added LGUs in `hotlines.json`.
