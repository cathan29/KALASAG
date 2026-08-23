import React, { useEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Surface, useTheme } from 'react-native-paper';
import useWeatherStore from '../store/useWeatherStore';
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

const buildRisk = ({ weatherCode, windSpeed, rain }) => {
  let score = 0;
  if ([95, 96, 99].includes(weatherCode)) score += 3;
  if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) score += 2;
  if (Number(windSpeed) >= 45) score += 2;
  if (Number(rain) >= 8) score += 2;
  if (score >= 5) return { label: 'High risk', colorKey: 'error', icon: 'warning' };
  if (score >= 3) return { label: 'Moderate risk', colorKey: 'warning', icon: 'alert-circle' };
  return { label: 'Low risk today', colorKey: 'success', icon: 'shield-checkmark' };
};

const WeatherScreen = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    weatherData, userLocation, locationLabel, locationPermissionStatus,
    isLoading, isLocating, error, fetchWeather,
  } = useWeatherStore();
  const isOffline = useNetworkStatus();

  useEffect(() => {
    if (userLocation && !weatherData) fetchWeather();
  }, [userLocation, weatherData, fetchWeather]);

  const current = weatherData?.current ?? {};
  const hourly = weatherData?.hourly ?? {};
  const daily = weatherData?.daily ?? {};
  const nextHours = useMemo(() => (
    (hourly.time ?? []).slice(0, 12).map((time, index) => ({
      time,
      rainChance: hourly.precipitation_probability?.[index],
      temp: hourly.temperature_2m?.[index],
      code: hourly.weather_code?.[index],
    }))
  ), [hourly]);

  if ((isLoading || isLocating) && !weatherData) return <SkeletonLoader variant="weather" />;
  if (!weatherData && locationPermissionStatus === 'denied') {
    return <View style={styles.center}><EmptyState title="Location access needed" message="Enable location to see weather where you are." /></View>;
  }
  if (!weatherData && !isLoading && isOffline) {
    return <View style={styles.center}><EmptyState title="Weather is offline" message="Connect once to save your local forecast." /></View>;
  }
  if (error && !weatherData) {
    return <View style={styles.center}><EmptyState title="Weather unavailable" message={error} /></View>;
  }

  const risk = buildRisk({
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    rain: current.precipitation,
  });
  const riskColor = theme.colors[risk.colorKey];
  const updatedAt = current.time
    ? new Date(current.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchWeather} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Weather</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.location} numberOfLines={1}>{locationLabel || 'Current location'}</Text>
        </View>
      </View>

      <LinearGradient colors={theme.gradients.weather} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.now}>NOW</Text>
            <Text style={styles.condition}>{weatherData?.condition ?? 'Local weather'}</Text>
          </View>
          <Ionicons name={weatherIconForCode(current.weather_code)} size={52} color="#FFFFFF" />
        </View>
        <View style={styles.temperatureRow}>
          <Text style={styles.temperature}>{formatValue(current.temperature_2m, '°')}</Text>
          <Text style={styles.feelsLike}>Feels like {formatValue(current.apparent_temperature, '°')}</Text>
        </View>
        <View style={styles.heroBottom}>
          <View style={styles.riskRow}>
            <Ionicons name={risk.icon} size={16} color={riskColor} />
            <Text style={[styles.risk, { color: riskColor }]}>{risk.label}</Text>
          </View>
          <Text style={styles.updated}>{updatedAt ? `Updated ${updatedAt}` : 'Updating'}</Text>
        </View>
      </LinearGradient>

      <Surface elevation={1} style={styles.metrics}>
        <Metric icon="water-outline" label="Humidity" value={formatValue(current.relative_humidity_2m, '%')} theme={theme} styles={styles} />
        <View style={styles.dividerVertical} />
        <Metric icon="navigate-outline" label="Wind" value={formatValue(current.wind_speed_10m, ' km/h')} theme={theme} styles={styles} />
        <View style={styles.dividerVertical} />
        <Metric icon="rainy-outline" label="Rain" value={Number.isFinite(Number(current.precipitation)) ? `${Number(current.precipitation).toFixed(1)} mm` : 'N/A'} theme={theme} styles={styles} />
      </Surface>

      <SectionTitle icon="time-outline" title="Next 12 hours" theme={theme} styles={styles} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyRail}>
        {nextHours.map((item, index) => (
          <View key={item.time} style={[styles.hour, index === 0 && styles.currentHour]}>
            <Text style={styles.hourTime}>{index === 0 ? 'Now' : new Date(item.time).toLocaleTimeString([], { hour: 'numeric' })}</Text>
            <Ionicons name={weatherIconForCode(item.code)} size={24} color={index === 0 ? theme.colors.primary : theme.colors.secondary} />
            <Text style={styles.hourTemp}>{formatValue(item.temp, '°')}</Text>
            <Text style={styles.hourRain}>{formatValue(item.rainChance, '%')}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionTitle icon="calendar-outline" title="3-day outlook" theme={theme} styles={styles} />
      <Surface elevation={1} style={styles.forecast}>
        {(daily.time ?? []).slice(0, 3).map((date, index) => (
          <View key={date} style={[styles.forecastRow, index > 0 && styles.rowDivider]}>
            <View style={styles.dayCell}>
              <Ionicons name={weatherIconForCode(daily.weather_code?.[index])} size={22} color={theme.colors.secondary} />
              <Text style={styles.day}>{new Date(date).toLocaleDateString([], { weekday: 'long' })}</Text>
            </View>
            <Text style={styles.highLow}>{formatValue(daily.temperature_2m_max?.[index], '°')} / {formatValue(daily.temperature_2m_min?.[index], '°')}</Text>
            <Text style={styles.rainTotal}>{formatValue(daily.precipitation_sum?.[index], ' mm')}</Text>
          </View>
        ))}
      </Surface>
    </ScrollView>
  );
};

const Metric = ({ icon, label, value, theme, styles }) => (
  <View style={styles.metric}>
    <Ionicons name={icon} size={20} color={theme.colors.primary} />
    <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const SectionTitle = ({ icon, title, theme, styles }) => (
  <View style={styles.sectionTitleRow}>
    <Ionicons name={icon} size={19} color={theme.colors.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.md, paddingTop: 18, paddingBottom: theme.spacing.lg, gap: theme.spacing.md },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background },
  header: { gap: 5 },
  screenTitle: { color: theme.colors.text.primary, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: 0 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  location: { flex: 1, color: theme.colors.text.secondary, fontSize: 14, lineHeight: 20 },
  hero: { minHeight: 282, borderRadius: theme.borderRadius.lg, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.md },
  heroCopy: { flex: 1 },
  now: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' },
  condition: { color: '#FFFFFF', fontSize: 25, lineHeight: 31, fontWeight: '700', marginTop: 3 },
  temperatureRow: { alignItems: 'center' },
  temperature: { color: '#FFFFFF', fontSize: 88, lineHeight: 98, fontWeight: '600', fontVariant: ['tabular-nums'] },
  feelsLike: { color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: theme.borderRadius.full },
  risk: { fontSize: 12, fontWeight: '700' },
  updated: { flex: 1, color: 'rgba(255,255,255,0.72)', fontSize: 12, textAlign: 'right' },
  metrics: { flexDirection: 'row', minHeight: 104, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  metric: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 5 },
  metricValue: { color: theme.colors.text.primary, fontSize: 16, fontWeight: '700', maxWidth: '100%' },
  metricLabel: { color: theme.colors.text.muted, fontSize: 12 },
  dividerVertical: { width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: 19, lineHeight: 25, fontWeight: '700' },
  hourlyRail: { gap: 6, paddingRight: theme.spacing.md },
  hour: { width: 72, minHeight: 112, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
  currentHour: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  hourTime: { color: theme.colors.text.secondary, fontSize: 12, fontWeight: '600' },
  hourTemp: { color: theme.colors.text.primary, fontSize: 17, fontWeight: '700' },
  hourRain: { color: theme.colors.text.muted, fontSize: 11 },
  forecast: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  forecastRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  dayCell: { width: 122, flexDirection: 'row', alignItems: 'center', gap: 9 },
  day: { flex: 1, color: theme.colors.text.primary, fontSize: 14, fontWeight: '600' },
  highLow: { flex: 1, color: theme.colors.text.secondary, fontSize: 14, textAlign: 'center', fontVariant: ['tabular-nums'] },
  rainTotal: { width: 58, color: theme.colors.text.muted, fontSize: 12, textAlign: 'right' },
});

export default WeatherScreen;
