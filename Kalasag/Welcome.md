# KALASAG System Notes

Last updated: 2026-08-21

This vault tracks the current state of the KALASAG mobile app: architecture, product behavior, integrations, UI decisions, and known external limitations.

## Quick Links

- [[System Status - 2026-08-24]]
- [[Frontend Architecture]]
- [[Data Sources and API Notes]]
- [[Emergency Directory Logic]]

## Current Product Direction

KALASAG is an offline-first disaster preparedness and situational awareness mobile app. The current implementation focuses on:

- GPS-based local weather
- Weather radar map with RainViewer tiles
- ReliefWeb-based hazard report feed with graceful fallback
- Location-aware emergency hotlines from bundled local data
- Premium deep navy/slate UI with floating tabs, cards, gradients, icons, skeleton loaders, and Lottie empty states
