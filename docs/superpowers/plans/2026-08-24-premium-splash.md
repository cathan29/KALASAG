# Premium Animated Splash Screen (iOS Polish) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the generic splash screen into a premium, high-polish experience using spring physics and staggered cinematic typography.

**Architecture:** Upgrade the `SplashScreen` component from linear `Animated.timing` to physics-based `Animated.spring` for the icon and coordinated `translateY` + `opacity` transitions for the motto.

**Tech Stack:** React Native `Animated` API (`spring`, `timing`), `createAnimatedComponent`.

**Spec:** Premium UI/UX Specification (Spring Physics & Cinematic Typography).

## Global Constraints
- Strictly no data analytics, telemetry, or tracking libraries.
- Background color: `#0F172A`.
- Motto: "Looking out for you, rain or shine."
- Asset: `require('../../assets/mascot/kalasagicon.png')`.
- Masking: `borderRadius` + `overflow: 'hidden'` on wrapper.

---

## File Mapping
- Modify: `src/screens/SplashScreen.js` - Refactor animations and styles.

---

### Task 1: Implement Spring-Based "Eagle Flight" Entrance

**Files:**
- Modify: `src/screens/SplashScreen.js`

**Interfaces:**
- Consumes: `Animated.spring` for `iconY` and `iconScale`.

- [ ] **Step 1: Update Animated Values**
  Set `iconY` to `30`, `iconScale` to `0.8`, and add `iconOpacity` initialized to `0`.

- [ ] **Step 2: Replace Timing with Spring Physics**
  Replace the icon's `Animated.timing` with `Animated.spring`.
  - Config: `friction: 7`, `tension: 40`.
  - Target: `iconY` $\rightarrow$ `0`, `iconScale` $\rightarrow$ `1`.

- [ ] **Step 3: Add Icon Opacity Fade**
  Parallelize a `timing` animation for `iconOpacity` (0 $\rightarrow$ 1) during the spring movement.

- [ ] **Step 4: Commit**
  ```bash
  git add src/screens/SplashScreen.js
  git commit -m "style: apply spring physics to splash icon entrance"
  ```

### Task 2: Implement Cinematic Staggered Typography

**Files:**
- Modify: `src/screens/SplashScreen.js`

**Interfaces:**
- Consumes: `Animated.timing` for `textOpacity` and `textY`.

- [ ] **Step 1: Initialize Text Physics**
  Add `textY` initialized to `15`.

- [ ] **Step 2: Create Staggered Sequence**
  Ensure the motto animation starts *after* the icon spring completes.
  - Animation: `opacity` (0 $\rightarrow$ 1) AND `translateY` (15 $\rightarrow$ 0) over 1000ms.

- [ ] **Step 3: Apply Premium Typography Styles**
  Update `styles.motto`:
  - Color: `#94A3B8` (slate gray).
  - Weight: `'500'`.
  - Letter Spacing: `0.5`.
  - Font Size: `16`.

- [ ] **Step 4: Commit**
  ```bash
  git add src/screens/SplashScreen.js
  git commit -m "style: implement cinematic staggered motto typography"
  ```

### Task 3: Final Polish and Timing Verification

**Files:**
- Modify: `src/screens/SplashScreen.js`

**Interfaces:**
- Produces: Final `onFinish` trigger.

- [ ] **Step 1: Verify Bulletproof Masking**
  Confirm `iconWrapper` has `borderRadius: 60`, `overflow: 'hidden'`, and `backgroundColor: '#0F172A'` to chop white corners.

- [ ] **Step 2: Adjust Readability Delay**
  Set the `setTimeout` after the total animation sequence to `4000ms` to ensure total screen time is ~5s.

- [ ] **Step 3: Commit**
  ```bash
  git add src/screens/SplashScreen.js
  git commit -m "style: finalize splash timing and masking polish"
  ```
