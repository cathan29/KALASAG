import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StatusBar, StyleSheet, useColorScheme, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import OfflineBanner from './src/components/OfflineBanner';
import useWeatherStore from './src/store/useWeatherStore';
import { createAppTheme } from './src/constants/theme';
import { useAlertsStore } from './src/store/useAlertsStore';
import useAlertNotifications from './src/hooks/useAlertNotifications';
import { navigationRef } from './src/navigation/navigationRef';
import {
  getLastNotificationAlertId,
  subscribeToNotificationResponses,
} from './src/services/notificationService';
// import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ALERT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const buildLocationLabel = (places) => {
  const place = places?.[0];

  if (!place) {
    return 'Current Location';
  }

  return [place.city, place.region, place.country].filter(Boolean).join(', ') || 'Current Location';
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme !== 'light';
  const appTheme = createAppTheme(isDarkMode);
  const {
    fetchWeather,
    setLocationError,
    setLocationLoading,
    setLocationPermissionStatus,
    setUserLocation,
  } = useWeatherStore();
  const fetchAlerts = useAlertsStore((state) => state.fetchAlerts);
  const pendingAlertIdRef = useRef(null);
  useAlertNotifications();

  const openAlert = useCallback((alertId) => {
    if (!alertId) return;
    if (navigationRef.isReady()) {
      navigationRef.navigate('AlertDetails', { alertId: String(alertId) });
    } else {
      pendingAlertIdRef.current = String(alertId);
    }
  }, []);

  const handleNavigationReady = useCallback(() => {
    if (!pendingAlertIdRef.current) return;
    const alertId = pendingAlertIdRef.current;
    pendingAlertIdRef.current = null;
    navigationRef.navigate('AlertDetails', { alertId });
  }, []);

  // useEffect(() => {
  //   mobileAds().setRequestConfiguration({
  //     tagForUnderAgeOfConsent: true,
  //     maxAdContentRating: MaxAdContentRating.PG,
  //   });
  //   mobileAds().initialize();
  // }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, ALERT_REFRESH_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchAlerts();
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [fetchAlerts]);

  useEffect(() => {
    const subscription = subscribeToNotificationResponses(openAlert);
    getLastNotificationAlertId().then(openAlert).catch(() => {});
    return () => subscription.remove();
  }, [openAlert]);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    const initializeLocation = async () => {
      setLocationLoading(true);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        setLocationPermissionStatus(permission.status);

        if (!permission.granted) {
          setLocationError('Location permission is required for local weather and radar.');
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = currentPosition.coords;

        let label = 'Current Location';
        try {
          label = buildLocationLabel(await Location.reverseGeocodeAsync({ latitude, longitude }));
        } catch {
          label = 'Current Location';
        }

        const location = { latitude, longitude, label };
        setUserLocation(location);
        setLocationLoading(false);
        fetchWeather(location);
      } catch (error) {
        setLocationError(error instanceof Error ? error.message : 'Unable to read your current location.');
      }
    };

    initializeLocation();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={appTheme}>
          <NavigationContainer
            ref={navigationRef}
            onReady={handleNavigationReady}
            theme={{
              ...(isDarkMode ? DarkTheme : DefaultTheme),
              colors: {
                ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
                background: appTheme.colors.background,
                card: appTheme.colors.surface,
                border: appTheme.colors.border,
                primary: appTheme.colors.primary,
                text: appTheme.colors.text.primary,
              },
            }}
          >
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={appTheme.colors.background}
              translucent={false}
            />
            <SafeAreaView style={[styles.safeArea, { backgroundColor: appTheme.colors.background }]} edges={['top']}>
              <OfflineBanner />
              <View style={styles.navigator}>
                <AppNavigator />
              </View>
            </SafeAreaView>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  navigator: {
    flex: 1,
  },
});
