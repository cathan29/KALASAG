# Fix Tab Bar Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Bottom Tab bar icons being cut off on Android by dynamically increasing tab bar height to accommodate system navigation insets.

**Architecture:** Introduce a base height constant and calculate the total height as `BASE_HEIGHT + insets.bottom` to ensure content remains visible while maintaining the required padding.

**Tech Stack:** React Native, `@react-navigation/bottom-tabs`, `react-native-safe-area-context`.

**Spec:** User request for dynamic height adjustment of Bottom Tab Navigator.

## Global Constraints

- No pushing or committing.
- Maintain iOS behavior.
- Content must not be cropped or squished.

---

### Task 1: Update Tab Bar Dynamic Height

**Files:**
- Modify: `src/navigation/AppNavigator.js`

**Interfaces:**
- Consumes: `useSafeAreaInsets()` hook.
- Produces: Updated `tabBarStyle` in `MainTabs` component.

- [ ] **Step 1: Define base height constant**
  Add `const BASE_HEIGHT = 60;` inside `MainTabs` or at the top level of the file.

- [ ] **Step 2: Update tabBarStyle height and padding**
  Modify `tabBarStyle` to:
  ```javascript
  tabBarStyle: [
    styles.bar, 
    { 
      height: Platform.OS === 'ios' ? 78 : BASE_HEIGHT + Math.max(insets.bottom, 8), 
      paddingBottom: Platform.OS === 'ios' ? 18 : Math.max(insets.bottom, 8) 
    }
  ],
  ```

- [ ] **Step 3: Verify styles.bar height**
  Ensure `styles.bar` does not have a hardcoded height that conflicts with the dynamic value (remove `height` from `styles.bar` for Android if necessary).

- [ ] **Step 4: Verify on Android device/emulator**
  Check that icons are no longer cut off and labels are aligned.
