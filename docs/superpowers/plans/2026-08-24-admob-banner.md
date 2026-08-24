# AdMob Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a non-tracking, non-personalized Google AdMob banner at the bottom of the Weather screen.

**Architecture:** Configure SDK globally with strict privacy constraints (NPA) $\rightarrow$ Create a reusable `AdBanner` component $\rightarrow$ Place component at the bottom of `WeatherScreen`.

**Tech Stack:** `react-native-google-mobile-ads`.

**Spec:** User request for AdMob integration with strict NO-tracking/NPA rules.

## Global Constraints
- No user tracking or data analytics.
- Force Non-Personalized Ads (NPA).
- Use Google TEST App IDs and Ad Unit IDs.
- Use `BannerAdSize.ANCHORED_ADAPTIVE_BANNER`.

---

### Task 1: Library Setup & Configuration

**Files:**
- Modify: `app.json`

**Interfaces:**
- Produces: Correct SDK configuration for the native build process.

- [ ] **Step 1: Install dependency**
  Run: `npm install react-native-google-mobile-ads`

- [ ] **Step 2: Update `app.json` with Test App IDs**
  Add the `react-native-google-mobile-ads` configuration block to the `expo` object.

```json
{
  "expo": {
    "android": {
      "package": "com.kalasag.app"
    },
    "ios": {
      "bundleIdentifier": "com.kalasag.app"
    },
    "extra": {
      "react-native-google-mobile-ads": {
        "android_app_id": "ca-app-pub-3940256099942544~3347511713",
        "ios_app_id": "ca-app-pub-3940256099942544~1458002511"
      }
    }
  }
}
```

- [ ] **Step 3: Commit**
  ```bash
  git add app.json package.json
  git commit -m "chore: install and configure google-mobile-ads with test IDs"
  ```

### Task 2: Global SDK Initialization (Strict NPA)

**Files:**
- Modify: `App.js` (or main entry point)

**Interfaces:**
- Consumes: `mobileAds()` from `react-native-google-mobile-ads`.
- Produces: Initialized SDK with privacy constraints.

- [ ] **Step 1: Implement initialization logic**
  Call `mobileAds().setRequestConfiguration()` before `mobileAds().initialize()`.

```javascript
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

// Inside App component or entry point useEffect
useEffect(() => {
  mobileAds()
    .setRequestConfiguration({
      // Force Non-Personalized Ads (NPA)
      tagForUnderAgeOfConsent: true, 
      // Set content rating to avoid inappropriate ads
      maxAdContentRating: MaxAdContentRating.PG,
    })
    .then(() => {
      mobileAds().initialize();
    })
    .catch(err => console.error('AdMob Init Error:', err));
}, []);
```

- [ ] **Step 2: Verify initialization**
  Run app and check logs for AdMob initialization success.

- [ ] **Step 3: Commit**
  ```bash
  git add App.js
  git commit -m "feat: initialize AdMob with strict NPA and privacy settings"
  ```

### Task 3: Reusable `AdBanner` Component

**Files:**
- Create: `src/components/ui/AdBanner.tsx`

**Interfaces:**
- Produces: `AdBanner` component.

- [ ] **Step 1: Implement `AdBanner` component**
  Use `BannerAd` with adaptive sizing and the test unit ID.

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AdBanner: React.FC = () => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true, // Double-down on NPA
        }}
        onAdFailedToLoad={(error) => {
          console.error('AdBanner failed to load: ', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default AdBanner;
```

- [ ] **Step 2: Commit**
  ```bash
  git add src/components/ui/AdBanner.tsx
  git commit -m "feat: create reusable AdBanner component with NPA forced"
  ```

### Task 4: Screen Integration

**Files:**
- Modify: `src/screens/WeatherScreen.js`

**Interfaces:**
- Consumes: `AdBanner` component.

- [ ] **Step 1: Place `AdBanner` at the bottom of `WeatherScreen`**
  Import `AdBanner` and place it as the last child of the main container, outside the `ScrollView`.

```javascript
// Import AdBanner
import AdBanner from '../components/ui/AdBanner';

// In WeatherScreen return statement:
return (
  <View style={styles.screenContainer}>
    {/* ... RainBackground and ScrollView ... */}
    <ScrollView>
      {/* ... content ... */}
    </ScrollView>
    
    <AdBanner />
  </View>
);
```

- [ ] **Step 2: Verify UI layout**
  Ensure the banner does not overlap content and sits flush at the bottom.

- [ ] **Step 3: Commit**
  ```bash
  git add src/screens/WeatherScreen.js
  git commit -m "feat: integrate AdBanner into WeatherScreen"
  ```
