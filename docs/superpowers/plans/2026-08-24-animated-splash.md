# Animated Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a high-fidelity animated splash screen with an "Eagle Flight" entrance effect and a smooth transition to the main application.

**Architecture:** A standalone `SplashScreen` component utilizing the React Native `Animated` API for coordinated translation, scaling, and opacity effects. The component will manage its own animation lifecycle and trigger a callback to the root `App.js` to handle the handoff to the main navigation.

**Tech Stack:** React Native `Animated` API, `expo-linear-gradient` (optional for depth), `react-native-safe-area-context`.

**Spec:** Custom Animated Splash Screen Specification.

## Global Constraints
- No data analytics, telemetry, or tracking libraries.
- Background color must be `#0F172A`.
- Motto text: "Looking out for you, rain or shine."
- Assets: `require('../../assets/kalasagicon.png')`.

---

## File Mapping
- Create: `src/screens/SplashScreen.js` - The animated splash component.
- Modify: `App.js` - Root logic to toggle between `SplashScreen` and `AppNavigator`.

---

### Task 1: Create SplashScreen Component

**Files:**
- Create: `src/screens/SplashScreen.js`

**Interfaces:**
- Produces: `SplashScreen` component.
- Prop: `onFinish` (function) - Called after animation and delay complete.

- [ ] **Step 1: Set up basic layout and styles**
  Implement a full-screen container with `backgroundColor: '#0F172A'`. Place the `Image` and `Text` components. Apply `borderRadius` and `overflow: 'hidden'` to the `Image` to mask white corners.

- [ ] **Step 2: Initialize Animated values**
  Create `iconY` (translation), `iconScale` (scaling), and `textOpacity` (opacity) using `new Animated.Value()`.

- [ ] **Step 3: Implement "Eagle Flight" animation sequence**
  Use `Animated.parallel` and `Animated.sequence`.
  - **Icon**: Animate `iconY` from offset to 0 and `iconScale` from 0.8 to 1.0 over 1000ms.
  - **Text**: Animate `textOpacity` from 0 to 1, starting as the icon finishes movement.

- [ ] **Step 4: Implement finish delay and callback**
  Add a `setTimeout` for 3000ms after the animation sequence completes, then call `props.onFinish()`.

- [ ] **Step 5: Commit**
  ```bash
  git add src/screens/SplashScreen.js
  git commit -m "feat: add animated splash screen component"
  ```

### Task 2: Integrate SplashScreen into App Root

**Files:**
- Modify: `App.js`

**Interfaces:**
- Consumes: `SplashScreen` component.

- [ ] **Step 1: Add `showSplash` state**
  Initialize `const [showSplash, setShowSplash] = useState(true);` in the `App` component.

- [ ] **Step 2: Implement conditional rendering**
  Wrap the current return statement: if `showSplash` is true, return `<SplashScreen onFinish={() => setShowSplash(false)} />`; otherwise, return the existing `SafeAreaProvider` / `NavigationContainer` tree.

- [ ] **Step 3: Verify transition**
  Run the app and ensure the splash animation plays fully, holds for 3s, and then reveals the main app.

- [ ] **Step 4: Commit**
  ```bash
  git add App.js
  git commit -m "feat: integrate splash screen into app root"
  ```
