# Smooth Splash Screen Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abrupt splash screen transition with a professional fade-out animation using a custom `Animated.View` overlay.

**Architecture:** 
1. Hold the native splash screen using `SplashScreen.preventAutoHideAsync()`.
2. Render a React Native `Animated.View` that matches the native splash screen's appearance.
3. Once app is ready, hide the native splash screen and trigger a timing animation to fade the overlay's opacity from 1 to 0.
4. Unmount the overlay upon animation completion.

**Tech Stack:** `expo-splash-screen`, `react-native` (Animated API).

**Spec:** User request for buttery-smooth entrance transition in `App.js`.

## Global Constraints

- No pushing or committing.
- Overlay must exactly match native splash screen (background color and logo).
- `pointerEvents="none"` must be applied to prevent interaction during fade.

---

### Task 1: Setup Animated Overlay State and UI

**Files:**
- Modify: `App.js`

**Interfaces:**
- Produces: `fadeAnim` (Animated.Value), `isOverlayVisible` (boolean state).

- [ ] **Step 1: Import `Animated` and `SplashScreen`**
  Ensure `Animated` is imported from `react-native` and `* as SplashScreen` from `expo-splash-screen`.

- [ ] **Step 2: Initialize animation state**
  Add `const fadeAnim = useRef(new Animated.Value(1)).current;` and `const [isOverlayVisible, setIsOverlayVisible] = useState(true);`.

- [ ] **Step 3: Create the Overlay Component**
  Implement an `Animated.View` that:
  - Uses `StyleSheet.absoluteFillObject`.
  - Sets `backgroundColor` to match the app's splash background.
  - Centers the app logo (use existing asset paths).
  - Sets `opacity: fadeAnim`.
  - Sets `pointerEvents="none"`.
  - Wraps the root return in `App.js` so it sits on top of the `NavigationContainer`.

---

### Task 2: Implement Transition Logic

**Files:**
- Modify: `App.js`

**Interfaces:**
- Consumes: `fadeAnim`, `setIsOverlayVisible`.

- [ ] **Step 1: Prevent auto-hide of native splash**
  Call `SplashScreen.preventAutoHideAsync()` at the top level (outside the component).

- [ ] **Step 2: Coordinate hide and fade**
  In the `useEffect` where `showSplash` is set to false (or a new initialization effect):
  - Call `await SplashScreen.hideAsync()`.
  - Start `Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true })`.

- [ ] **Step 3: Handle unmounting**
  Add a callback to the animation that calls `setIsOverlayVisible(false)` to completely remove the overlay from the DOM.

- [ ] **Step 4: Verify transition**
  Test on physical device to ensure there is no "flash" between native splash and animated overlay.
