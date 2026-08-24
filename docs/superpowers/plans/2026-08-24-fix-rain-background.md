# RainBackground Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix visual artifacts and critical performance/touch issues in the `RainBackground` component.

**Architecture:** Refactor `RainBackground` to use `react-native-reanimated` for GPU-accelerated animations, eliminate re-render loops caused by unstable prop objects, and expand the drawing surface to hide rotation gaps.

**Tech Stack:** React Native, `react-native-reanimated`, `expo-linear-gradient`.

**Spec:** User request for fixing thickness, cutoff, gaps, and infinite reload loop.

## Global Constraints
- Use `Dimensions.get('window').height` for animation boundaries.
- Outer wrapper must have `pointerEvents="none"`.
- Animations must use shared values (`useSharedValue`, `withRepeat`, `withTiming`).
- Rain container must be `150%` width/height with `-25%` offset.

---

### Task 1: Performance & Touch Fixes (CRITICAL)

**Files:**
- Modify: `src/components/ui/RainBackground.tsx`

**Interfaces:**
- Produces: A non-blocking, stable `RainBackground` component.

- [ ] **Step 1: Install/Ensure `react-native-reanimated` is available**
  Check `package.json` for `react-native-reanimated`.

- [ ] **Step 2: Update `RainDrop` to use Reanimated**
  Replace `Animated.Value` and `Animated.timing` with `useSharedValue`, `useAnimatedStyle`, and `withRepeat(withTiming(...))`.

```tsx
// Example change in RainDrop
const translateY = useSharedValue(-100);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: translateY.value }],
}));

useEffect(() => {
  translateY.value = withRepeat(
    withTiming(SCREEN_HEIGHT + 100, {
      duration: duration,
      easing: Easing.linear,
    }),
    -1, // infinite
    false // do not reverse
  );
}, [duration]);
```

- [ ] **Step 3: Stabilize `drops` generation**
  Move default `dropSize` to a constant outside the component or destructure it to prevent `useMemo` from triggering on every render due to object reference changes.

- [ ] **Step 4: Add `pointerEvents="none"`**
  Add `pointerEvents="none"` to the outermost `View` in `RainBackground`.

- [ ] **Step 5: Verify touch responsiveness**
  Run the app and ensure `ScrollView` refresh indicators and other touch events work correctly.

- [ ] **Step 6: Commit**
  ```bash
  git add src/components/ui/RainBackground.tsx
  git commit -m "perf: fix infinite loop and touch blocking in RainBackground"
  ```

### Task 2: Visual Refinements (Density & Cutoff)

**Files:**
- Modify: `src/components/ui/RainBackground.tsx`

**Interfaces:**
- Consumes: Stabilized `RainBackground` from Task 1.

- [ ] **Step 1: Lower default intensity**
  Change `intensity` default from `100` to `40`.

- [ ] **Step 2: Thinner rain lines**
  Reduce `width` in `RainDrop` (e.g., change `size * 2` to `size`).

- [ ] **Step 3: Ensure full screen fall**
  Confirm `translateY` animation goes from `-100` to `SCREEN_HEIGHT + 100`.

- [ ] **Step 4: Verify visuals**
  Run app and confirm rain is less dense and falls completely off-screen.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/ui/RainBackground.tsx
  git commit -m "style: reduce rain density and fix cutoff"
  ```

### Task 3: Fix Rotation Gaps

**Files:**
- Modify: `src/components/ui/RainBackground.tsx`

**Interfaces:**
- Consumes: Refined `RainBackground` from Task 2.

- [ ] **Step 1: Expand container size**
  Update `styles.container` to:
  ```tsx
  container: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    top: '-25%',
    left: '-25%',
    overflow: 'hidden',
  }
  ```

- [ ] **Step 2: Verify gap removal**
  Set a non-zero `angle` prop and ensure no empty gaps are visible at the screen edges.

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/ui/RainBackground.tsx
  git commit -m "style: remove rotation gaps by expanding container"
  ```
