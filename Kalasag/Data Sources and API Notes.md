# Data Sources and API Notes

## Open-Meteo

File: `src/services/weatherApi.js`

Current behavior:

- Uses dynamic GPS coordinates.
- Requests current weather, hourly forecast fields, and daily 3-day forecast fields.
- Normalizes response for WeatherScreen compatibility.

Important:

- Do not reintroduce hardcoded Manila coordinates for weather.

## RainViewer

File: `src/services/radarApi.js`

Current behavior:

- Fetches latest radar metadata from `https://api.rainviewer.com/public/weather-maps.json`.
- Builds latest tile URL template for `MapView` `UrlTile`.

## ReliefWeb

File: `src/services/alertsApi.js`

Current behavior:

- Uses API v2 reports endpoint.
- Normalizes reports into app alert cards.
- Infers severity and approximate coordinates from report content when possible.
- Gracefully returns an empty list for ReliefWeb access/version errors.

Important limitation:

- ReliefWeb requires an approved app name.
- Configure with `EXPO_PUBLIC_RELIEFWEB_APP_NAME`.

## Local Emergency Data

File: `src/data/hotlines.json`

Current behavior:

- Bundled JSON is the source of truth for emergency hotlines.
- Contains default/national hotlines, regional hotlines, and municipality-specific hotlines.

Reason:

- Disaster mode must stay offline-first.
- No mobile runtime web scraping.
