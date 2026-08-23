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

## Live Disaster Alerts

File: `src/services/alertsApi.js`

Current behavior:

- Uses PAGASA's WMO-registered CAP/Atom feed for active Philippine weather and flood advisories.
- Uses the official GDACS cached GeoJSON event feed for multi-hazard events.
- Uses the USGS FDSN GeoJSON API for recent Philippine-region earthquakes.
- Uses NASA EONET for active storms, floods, landslides, volcanoes, and wildfires within Philippine bounds.
- Checks the NOAA Pacific Tsunami Warning Center CAP document and only displays active, actionable, Philippines-relevant messages.
- Refreshes every five minutes while AlertsScreen is active, on app foreground, and on pull-to-refresh.
- Parses structured JSON, GeoJSON, Atom, and CAP data, filters expired alerts, deduplicates, and sorts by publication time.
- Keeps the last successful feed in AsyncStorage when providers are unavailable.
- Supports a controlled official Philippine feed through EXPO_PUBLIC_ALERTS_FEED_URL.

Live endpoints:

- PAGASA: `https://publicalert.pagasa.dost.gov.ph/feeds/`
- GDACS: `https://www.gdacs.org/contentdata/xml/gdacsAPP_Home.geojson`
- USGS: `https://earthquake.usgs.gov/fdsnws/event/1/query`
- NASA EONET: `https://eonet.gsfc.nasa.gov/api/v3/events`
- NOAA PTWC: `https://www.tsunami.gov/events/xml/PHEBCAP.xml`

Official Philippine feed contract:

- The endpoint must return a JSON array or an object with an alerts array.
- Each alert should provide id, title, description, publishedAt, severity, source, sourceUrl, and category.
- Optional location fields are latitude and longitude.
- Allowed severity values are Low, Medium, High, and Critical.
- Suggested categories are weather, earthquake, tsunami, volcano, and wildfire.

Important:

- Do not scrape Facebook HTML in the mobile app. Official PAGASA, NDRRMC, LGU, and social posts must be normalized by the controlled feed.
- PHIVOLCS' latest-earthquake page is official but currently HTML-only; keep it behind a server-side normalized adapter instead of brittle mobile scraping.
- ReliefWeb is no longer the primary feed because API access requires a pre-approved app name.

## Local Emergency Data

File: `src/data/hotlines.json`

Current behavior:

- Bundled JSON is the source of truth for emergency hotlines.
- Contains default/national hotlines, regional hotlines, and municipality-specific hotlines.

Reason:

- Disaster mode must stay offline-first.
- No mobile runtime web scraping.
