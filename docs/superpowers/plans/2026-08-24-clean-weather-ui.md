# Clean Up Weather Screen UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove developer/technical telemetry labels from the Weather (Now) screen to create a consumer-ready UI.

**Architecture:** Direct removal of the `sourceRow` component and its associated styles from the `WeatherScreen` component.

**Tech Stack:** React Native, `react-native-paper`.

**Spec:** User request to remove "Open-Meteo" telemetry and debug metadata.

## Global Constraints

- No pushing or committing.
- Maintain visual balance between the Hero card and Metrics section.

---

### Task 1: Remove Telemetry UI Elements

**Files:**
- Modify: `src/screens/WeatherScreen.js`

**Interfaces:**
- None.

- [ ] **Step 1: Remove sourceRow from JSX**
  Delete the `<View style={styles.sourceRow}>...</View>` block (lines 302-310).

- [ ] **Step 2: Remove unused styles**
  Delete `sourceRow`, `sourceText`, and `confidence` from `createStyles` (lines 398-400).

- [ ] **Step 3: Verify layout spacing**
  Ensure `styles.content` gap properly handles spacing between the `hero` and `metrics` components.
