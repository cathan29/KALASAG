import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import useWeatherStore from '../store/useWeatherStore';
import { THEME } from '../constants/theme';

const WeatherScreen = () => {
  const {
    weatherData,
    isLoading,
    error,
    fetchWeather,
  } = useWeatherStore();

  useEffect(() => {
    fetchWeather();
  }, []);

  const onRefresh = () => {
    fetchWeather();
  };

  if (isLoading && !weatherData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (error && !weatherData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[THEME.colors.primary]} tintColor={THEME.colors.primary} />
      }
    >
      <View style={styles.content}>
        {weatherData ? (
          <>
            <Text style={styles.city}>{weatherData.city || 'Current Location'}</Text>
            <Text style={styles.temp}>{Math.round(weatherData.main?.temp)}°C</Text>
            <Text style={styles.condition}>{weatherData.weather?.[0]?.description}</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{weatherData.main?.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>{weatherData.wind?.speed} m/s</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.infoText}>No weather data available.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  city: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.colors.text.primary,
    marginBottom: 10,
  },
  temp: {
    fontSize: 80,
    fontWeight: '200',
    color: THEME.colors.text.primary,
  },
  condition: {
    fontSize: 24,
    color: THEME.colors.text.secondary,
    textTransform: 'capitalize',
    marginBottom: 40,
  },
  detailsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    padding: 20,
    borderRadius: THEME.borderRadius.lg,
    width: '80%',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text.primary,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  infoText: {
    color: THEME.colors.text.secondary,
    fontSize: 16,
  },
});

export default WeatherScreen;
