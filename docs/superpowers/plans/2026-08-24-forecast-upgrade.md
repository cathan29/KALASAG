# 7-Day Forecast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the weather forecast from a 3-day short outlook to a clean, vertical 7-day forecast list.

**Architecture:** 
1. Update `weatherApi.js` to request 7 days of data from Open-Meteo.
2. Refactor `WeatherScreen.js` to replace the horizontal 3-day forecast with a vertical list.
3. Implement date formatting to show "Today", "Tomorrow", or the weekday.

**Tech Stack:** React Native, `@expo/vector-icons`.

**Spec:** User request for a professional 7-day forecast view with Day, Icon, and Min/Max Temps.

## Global Constraints

- No pushing or committing.
- Maintain dark theme consistency.
- Ensure smooth scrolling (integrated into main `ScrollView`).

---

### Task 1: Update API Request for 7-Day Data

**Files:**
- Modify: `src/services/weatherApi.js`

**Interfaces:**
- Modifies: `buildWeatherUrl` parameters.

- [ ] **Step 1: Update `forecast_days` parameter**
  Change `forecast_days: '3'` to `forecast_days: '7'` in `buildWeatherUrl`.

---

### Task 2: Refactor Forecast UI in WeatherScreen

**Files:**
- Modify: `src/screens/WeatherScreen.js`

**Interfaces:**
- Consumes: `weatherData.daily` (now contains 7 items).

- [ ] **Step 1: Update Forecast Section Header**
  Change "3-day outlook" to "7-day forecast".

- [ ] **Step 2: Implement Vertical Forecast List**
  Replace the current `Surface` forecast block (lines 330-341) with a map over `daily.time`.
  
- [ ] **Step 3: Implement Day Label Logic**
  Create a helper to format the date:
  - Day 0 $\rightarrow$ "Today"
  - Day 1 $\rightarrow$ "Tomorrow"
  - Day 2+ $\rightarrow$ Weekday (e.g., "Wed")
  
- [ ] **Step 4: Design the Forecast Row**
  Each row should be a `View` with:
  - Left: Day label.
  - Center: Weather icon (via `weatherIconForCode`).
  - Right: Min/Max temperatures (e.g., "22° / 30°").
  - Style: Clean border/separator between rows.

- [ ] **Step 5: Update styles for Vertical Layout**
  Add/Modify styles in `createStyles`:
  - `forecastList`: Container for the list.
  - `forecastRow`: Row styling (padding, alignment, border).
  - `dayLabel`: Font styling for the day.
  - `tempRange`: Font styling for min/max temps.

- [ ] **Step 6: Verify Visuals**
  Check that the 7-day list fits well and maintains professional spacing.
