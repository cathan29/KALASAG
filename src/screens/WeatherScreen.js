import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useWeatherStore from '../store/useWeatherStore';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const weatherIconForCode = (code) => {
  if ([0, 1].includes(code)) return 'sunny';
  if ([2, 3, 45, 48].includes(code)) return 'cloudy';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
  if ([95, 96, 99].includes(code)) return 'thunderstorm';
  return 'partly-sunny';
};

const formatValue = (value, suffix = '') => (
  Number.isFinite(Number(value)) ? `${Math.round(Number(value))}${suffix}` : 'N/A'
);

const buildRisk = ({ weatherCode, windSpeed, rain, alertCount = 0 }) => {
  let score = 0;
  if ([95, 96, 99].includes(weatherCode)) score += 3;
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) score += 2;
  if (Number(windSpeed) >= 45) score += 2;
  if (Number(rain) >= 8) score += 2;
  if (alertCount > 0) score += 1;

  if (score >= 5) {
    return { label: 'High', color: THEME.colors.error, icon: 'warning' };
  }

  if (score >= 3) {
    return { label: 'Moderate', color: THEME.colors.warning, icon: 'alert-circle' };
  }

  return { label: 'Low', color: THEME.colors.success, icon: 'shield-checkmark' };
};

const WeatherScreen = () => {
  const {
    weatherData,
    userLocation,
    locationLabel,
    locationPermissionStatus,
    isLoading,
    isLocating,
    error,
    fetchWeather,
  } = useWeatherStore();
  const isOffline = useNetworkStatus();

  useEffect(() => {
    if (userLocation && !weatherData) {
      fetchWeather();
    }
  }, [userLocation]);

  const current = weatherData?.current ?? {};
  const hourly = weatherData?.hourly ?? {};
  const temperature = formatValue(current.temperature_2m, '°');
  const feelsLike = formatValue(current.apparent_temperature, '°');
  const humidity = formatValue(current.relative_humidity_2m, '%');
  const windSpeed = formatValue(current.wind_speed_10m, ' km/h');
  const rain = Number.isFinite(Number(current.precipitation)) ? `${Number(current.precipitation).toFixed(1)} mm` : 'N/A';
  const condition = weatherData?.condition ?? 'Waiting for local weather';
  const weatherCode = current.weather_code;
  const daily = weatherData?.daily;
  const updatedAt = current?.time
    ? new Date(current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const risk = buildRisk({
    weatherCode,
    windSpeed: current.wind_speed_10m,
    rain: current.precipitation,
  });

  const nextHours = useMemo(() => (
    (hourly?.time ?? []).slice(0, 12).map((time, index) => ({
      time,
      rainChance: hourly?.precipitation_probability?.[index],
      temp: hourly?.temperature_2m?.[index],
      code: hourly?.weather_code?.[index],
    }))
  ), [hourly]);

  if ((isLoading || isLocating) && !weatherData) {
    return <SkeletonLoader variant="weather" />;
  }

  if (!weatherData && locationPermissionStatus === 'denied') {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="location"
          title="Location access needed"
          message="Enable location permission to get weather for where you actually are."
        />
      </View>
    );
  }

  if (!weatherData && !isLoading && isOffline) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline"
          title="Offline weather unavailable"
          message="Connect once to sync live local weather."
        />
      </View>
    );
  }

  if (error && !weatherData) {
    return (
      <View style={styles.center}>
        <EmptyState icon="alert-circle" title="Weather unavailable" message={error} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchWeather} colors={[THEME.colors.primary]} tintColor={THEME.colors.primary} />
      }
    >
      <View style={styles.locationPill}>
        <Ionicons name="location" size={16} color={THEME.colors.secondary} />
        <Text style={styles.locationText} numberOfLines={1}>{locationLabel || 'Current Location'}</Text>
      </View>

      <LinearGradient
        colors={THEME.gradients.weather}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.eyebrow}>Now</Text>
            <Text style={styles.condition}>{condition}</Text>
          </View>
          <View style={styles.weatherIconWrap}>
            <Ionicons name={weatherIconForCode(weatherCode)} size={44} color={THEME.colors.text.primary} />
          </View>
        </View>

        <View style={styles.tempWrap}>
          <Text style={styles.temp}>{temperature}</Text>
          <Text style={styles.feelsLike}>Feels like {feelsLike}</Text>
        </View>

        <View style={styles.heroFooter}>
          <View style={[styles.riskPill, { backgroundColor: `${risk.color}22` }]}>
            <Ionicons name={risk.icon} size={16} color={risk.color} />
            <Text style={[styles.riskText, { color: risk.color }]}>{risk.label} Risk Today</Text>
          </View>
          <Text style={styles.updatedText}>
            {updatedAt ? `Updated ${updatedAt}` : 'Live update pending'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.metricsGrid}>
        <MetricCard icon="water-outline" label="Humidity" value={humidity} tint={THEME.colors.secondary} />
        <MetricCard icon="navigate-outline" label="Wind" value={windSpeed} tint={THEME.colors.primary} />
        <MetricCard icon="rainy-outline" label="Rain" value={rain} tint={THEME.colors.warning} />
      </View>

      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={20} color={THEME.colors.secondary} />
        <Text style={styles.sectionTitle}>Next 12 Hours</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyStrip}>
        {nextHours.map((item) => (
          <View key={item.time} style={styles.hourCard}>
            <Text style={styles.hourTime}>{new Date(item.time).toLocaleTimeString([], { hour: 'numeric' })}</Text>
            <Ionicons name={weatherIconForCode(item.code)} size={22} color={THEME.colors.secondary} />
            <Text style={styles.hourTemp}>{formatValue(item.temp, '°')}</Text>
            <Text style={styles.hourRain}>{formatValue(item.rainChance, '% rain')}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="calendar-clock" size={20} color={THEME.colors.secondary} />
        <Text style={styles.sectionTitle}>3-Day Outlook</Text>
      </View>

      <View style={styles.forecastCard}>
        {(daily?.time ?? []).slice(0, 3).map((date, index) => (
          <View key={date} style={styles.forecastRow}>
            <View style={styles.forecastDay}>
              <Ionicons name={weatherIconForCode(daily?.weather_code?.[index])} size={22} color={THEME.colors.secondary} />
              <Text style={styles.forecastDate}>
                {new Date(date).toLocaleDateString([], { weekday: 'short' })}
              </Text>
            </View>
            <Text style={styles.forecastDetail}>
              {formatValue(daily?.temperature_2m_min?.[index], '°')} / {formatValue(daily?.temperature_2m_max?.[index], '°')}
            </Text>
            <Text style={styles.forecastRain}>{formatValue(daily?.precipitation_sum?.[index], ' mm')}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const MetricCard = ({ icon, label, value, tint }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: `${tint}22` }]}>
      <Ionicons name={icon} size={20} color={tint} />
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 116,
    gap: THEME.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.md,
  },
  locationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    maxWidth: '100%',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
  },
  locationText: {
    color: THEME.colors.text.secondary,
    fontSize: 14,
    fontWeight: '800',
  },
  heroCard: {
    ...THEME.shadows.card,
    minHeight: 350,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.16)',
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: THEME.spacing.md,
  },
  heroTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    color: 'rgba(248,250,252,0.78)',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  condition: {
    color: THEME.colors.text.primary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: THEME.spacing.xs,
  },
  weatherIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(248,250,252,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  temp: {
    color: THEME.colors.text.primary,
    fontSize: 118,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 124,
  },
  feelsLike: {
    color: 'rgba(248,250,252,0.82)',
    fontSize: 18,
    fontWeight: '800',
    marginTop: THEME.spacing.xs,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 9,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '900',
  },
  updatedText: {
    flex: 1,
    color: 'rgba(248,250,252,0.72)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  metricCard: {
    ...THEME.shadows.subtle,
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  metricLabel: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: THEME.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  sectionTitle: {
    color: THEME.colors.text.primary,
    fontSize: 21,
    fontWeight: '900',
  },
  hourlyStrip: {
    gap: THEME.spacing.sm,
    paddingRight: THEME.spacing.md,
  },
  hourCard: {
    ...THEME.shadows.subtle,
    width: 86,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: THEME.spacing.xs,
  },
  hourTime: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  hourTemp: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  hourRain: {
    color: THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  forecastCard: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  forecastRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  forecastDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    width: 96,
  },
  forecastDate: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  forecastDetail: {
    color: THEME.colors.text.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
  forecastRain: {
    color: THEME.colors.text.muted,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 58,
    textAlign: 'right',
  },
});

export default WeatherScreen;
