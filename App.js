import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';
import useWeatherStore from './src/store/useWeatherStore';
import { createAppTheme } from './src/constants/theme';

const buildLocationLabel = (places) => {
  const place = places?.[0];

  if (!place) {
    return 'Current Location';
  }

  return [place.city, place.region, place.country].filter(Boolean).join(', ') || 'Current Location';
};

export default function App() {
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

  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
      <NavigationContainer
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
