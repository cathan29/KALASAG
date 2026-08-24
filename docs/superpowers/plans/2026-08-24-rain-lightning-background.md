# Rain & Lightning Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate a high-fidelity immersive Rain & Lightning background from React Web to React Native (Expo).

**Architecture:** 
The component will be a wrapper (`RainBackground`) that manages a collection of animated raindrops and a random lightning cycle. It uses `react-native-reanimated` for 60fps animations and `react-native-svg` for the lightning bolt paths.

**Tech Stack:** `react-native-reanimated`, `react-native-svg`, `expo-linear-gradient`.

**Spec:** User provided Web source code translation request.

## Global Constraints

- Strictly no user tracking or data analytics.
- Targeted for Expo environment.
- Use `react-native-reanimated` for all primary animations.
- Use `StyleSheet.absoluteFillObject` for absolute positioning of raindrops.

---

## File Structure

- Create: `src/components/ui/RainBackground.tsx` - Main component and internal sub-components (RainDrop, LightningBolt).
- Modify: `src/screens/WeatherScreen.tsx` - Integrate background with conditional weather logic.

## Task Decomposition

### Task 1: Rain Background Core & Raindrops
**Files:**
- Create: `src/components/ui/RainBackground.tsx`

**Interfaces:**
- Produces: `RainBackground` component with props `intensity`, `speed`, `color`, `angle`, `dropSize`.

- [ ] **Step 1: Define `RainDrop` interface and `RainBackground` props**
- [ ] **Step 2: Implement raindrop generation logic in `useEffect`**
- [ ] **Step 3: Create `RainDrop` sub-component using `react-native-reanimated`**
  - Use `useAnimatedStyle` for Y-translation from `-20` to `screenHeight + 20`.
  - Use `withRepeat` and `withTiming` for infinite loop.
  - Add random `delay` to start animations.
  - Use `expo-linear-gradient` for the drop appearance.
- [ ] **Step 4: implement `RainBackground` container with `StyleSheet.absoluteFillObject` and rotation `angle`**
- [ ] **Step 5: Verify rain falling at 60fps on device**
- [ ] **Step 6: Commit**

---

### Task 2: Lightning Flash & Bolt
**Files:**
- Modify: `src/components/ui/RainBackground.tsx`

**Interfaces:**
- Consumes: `RainBackground` core.

- [ ] **Step 1: Implement `triggerLightning` cycle using `useCallback` and `setTimeout`**
  - Randomize between `flash` and `bolt` types.
  - Manage lightning state (intensity, duration).
- [ ] **Step 2: Implement "Flash" effect**
  - Full-screen `Animated.View` with opacity animation.
  - Use `radial-gradient` equivalent (or simply a white overlay with low opacity).
- [ ] **Step 3: Implement "Bolt" effect using `react-native-svg`**
  - Translate `generateBoltPath` logic to RN.
  - Use `Svg`, `Path` with `stroke` and `strokeWidth`.
  - Add opacity animation via Reanimated.
- [ ] **Step 4: Commit**

---

### Task 3: Integration into WeatherScreen
**Files:**
- Modify: `src/screens/WeatherScreen.tsx`

**Interfaces:**
- Consumes: `RainBackground`.

- [ ] **Step 1: Add `weatherCondition` state to `WeatherScreen`**
- [ ] **Step 2: Implement conditional rendering for `RainBackground`**
  - Render only if `weatherCondition` is `'Rain'`, `'Thunderstorm'`, or `'Drizzle'`.
- [ ] **Step 3: Add `// TODO: Add Sunny background later` comment block**
- [ ] **Step 4: Verify full integration: Rain + Lightning based on weather state**
- [ ] **Step 5: Commit**
