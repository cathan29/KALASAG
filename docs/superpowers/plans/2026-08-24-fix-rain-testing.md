# Rain Background Debugging Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the "black screen" issue in the RainBackground testing ground so animations are visible.

**Architecture:** The primary suspect is the missing/incorrect Reanimated Babel plugin. The plan involves fixing the configuration, implementing a "smoke test" (static rendering), and then incrementally restoring animations.

**Tech Stack:** `react-native-reanimated`, `Babel`.

**Spec:** User report of black screen despite code implementation.

## Global Constraints

- Fix must not break existing project build.
- Ensure `react-native-reanimated` is correctly initialized.

---

## File Structure

- Create/Modify: `babel.config.js` - Add Reanimated plugin.
- Modify: `src/components/ui/RainBackground.tsx` - Add debug modes (static vs animated).
- Modify: `src/screens/WeatherScreen.tsx` - Optimize for high-visibility testing.

## Task Decomposition

### Task 1: Fix Babel Configuration
**Files:**
- Create/Modify: `babel.config.js`

- [ ] **Step 1: Create/Update `babel.config.js` with `react-native-reanimated/plugin`**
  ```javascript
  module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: ['react-native-reanimated/plugin'],
    };
  };
  ```
- [ ] **Step 2: Commit**

---

### Task 2: Rain Background "Smoke Test" (Static Rendering)
**Files:**
- Modify: `src/components/ui/RainBackground.tsx`

**Goal:** Verify that drops actually render before attempting to animate them.

- [ ] **Step 1: Add a `debugStatic` prop to `RainBackground`**
- [ ] **Step 2: Implement static rendering logic**
  - If `debugStatic` is true, skip `useAnimatedStyle` and use a fixed `translateY` (e.g., 100).
- [ ] **Step 3: Verify in `WeatherScreen` that static blue/white lines appear on screen**
- [ ] **Step 4: Commit**

---

### Task 3: Incremental Animation Restoration
**Files:**
- Modify: `src/components/ui/RainBackground.tsx`

- [ ] **Step 1: Restore basic `withTiming` animation without `withRepeat`**
- [ ] **Step 2: Verify a single drop falls once**
- [ ] **Step 3: Restore `withRepeat` and `withDelay`**
- [ ] **Step 4: Verify full rain effect**
- [ ] **Step 5: Commit**

---

### Task 4: Final Testing Ground Polish
**Files:**
- Modify: `src/screens/WeatherScreen.tsx`

- [ ] **Step 1: Set a high-contrast background (e.g., dark navy `#000033`)**
- [ ] **Step 2: Ensure `RainBackground` is rendered at the top level of the view stack**
- [ ] **Step 3: Verify the "Rain" button triggers the visible effect**
- [ ] **Step 4: Commit**
