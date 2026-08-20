# Emergency Directory Logic

## Goal

Show the most relevant emergency hotlines based on the user's current municipality while preserving offline-first reliability.

## Detection Flow

File: `src/screens/EmergencyScreen.js`

1. Request foreground location permission.
2. Read current GPS coordinates.
3. Reverse geocode using `Location.reverseGeocodeAsync`.
4. Extract best available locality: `city`, `subregion`, `district`, or `region`.
5. Store result in `detectedCity`.
6. Match `detectedCity` against `hotlines.municipalities`.

## Manual Search

If GPS fails or the user wants another area:

- Search bar accepts city/municipality names.
- Search matches bundled municipality keys.
- Current example search terms: `Rosales`, `Dagupan City`.

## Rendering Priority

1. Your Local Hotlines
2. National Hotlines
3. Regional Response
4. Survival Guides

## Current Local Dummy Data

### Dagupan City

- PNP Dagupan City
- BFP Dagupan City
- MDRRMO Dagupan City

### Rosales

- PNP Rosales
- BFP Rosales
- MDRRMO Rosales

## Engineering Rule

Do not scrape hotline data at runtime from the mobile app. Keep local hotline data bundled and periodically update it through app releases or controlled data sync later.
