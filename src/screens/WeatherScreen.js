import React, { useEffect, useMemo } from 'react';
import { AppState, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Surface, useTheme } from 'react-native-paper';
import { RainBackground } from '../components/ui/RainBackground';
import useWeatherStore from '../store/useWeatherStore';
import { useAlertsStore } from '../store/useAlertsStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const WEATHER_MASCOTS = {
  happy: require('../../assets/mascot/kalasag-weather-happy.png'),
  neutral: require('../../assets/mascot/kalasag-weather.png'),
  rain: require('../../assets/mascot/kalasag-weather-rain.png'),
  storm: require('../../assets/mascot/kalasag-weather-storm.png'),
};

const CYCLONE_PATTERN = /(typhoon|tropical cyclone|cyclone|bagyo|tcws|tropical (storm|depression)|storm signal)/i;
const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
const HEAVY_RAIN_CODES = [65, 67, 82];
const STORM_CODES = [95, 96, 99];
const CYCLONE_RELEVANCE_RADIUS_KM = 700;
const ALERT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const WEATHER_ANIMATIONS = {
  clearDay: require('@meteocons/lottie/fill/clear-day.json'),
  clearNight: require('@meteocons/lottie/fill/clear-night.json'),
  partlyCloudyDay: require('@meteocons/lottie/fill/partly-cloudy-day.json'),
  partlyCloudyNight: require('@meteocons/lottie/fill/partly-cloudy-night.json'),
  overcast: require('@meteocons/lottie/fill/overcast.json'),
  fog: require('@meteocons/lottie/fill/fog.json'),
  drizzle: require('@meteocons/lottie/fill/drizzle.json'),
  rain: require('@meteocons/lottie/fill/rain.json'),
  sleet: require('@meteocons/lottie/fill/sleet.json'),
  snow: require('@meteocons/lottie/fill/snow.json'),
  thunderstorms: require('@meteocons/lottie/fill/thunderstorms.json'),
  thunderstormsExtreme: require('@meteocons/lottie/fill/thunderstorms-extreme.json'),
};

const isDaytime = (time) => {
  const hour = new Date(time ?? Date.now()).getHours();
  return hour >= 6 && hour < 18;
};

const weatherAnimationForCode = (code, time) => {
  const daytime = isDaytime(time);
  if (code === 0) return daytime ? WEATHER_ANIMATIONS.clearDay : WEATHER_ANIMATIONS.clearNight;
  if ([1, 2].includes(code)) return daytime ? WEATHER_ANIMATIONS.partlyCloudyDay : WEATHER_ANIMATIONS.partlyCloudyNight;
  if (code === 3) return WEATHER_ANIMATIONS.overcast;
  if ([45, 48].includes(code)) return WEATHER_ANIMATIONS.fog;
  if ([51, 53, 55].includes(code)) return WEATHER_ANIMATIONS.drizzle;
  if ([56, 57, 66, 67].includes(code)) return WEATHER_ANIMATIONS.sleet;
  if ([61, 63, 65, 80, 81, 82].includes(code)) return WEATHER_ANIMATIONS.rain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return WEATHER_ANIMATIONS.snow;
  if ([96, 99].includes(code)) return WEATHER_ANIMATIONS.thunderstormsExtreme;
  if (code === 95) return WEATHER_ANIMATIONS.thunderstorms;
  return daytime ? WEATHER_ANIMATIONS.partlyCloudyDay : WEATHER_ANIMATIONS.partlyCloudyNight;
};

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

const WEATHER_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const distanceInKm = (from, to) => {
  if (!from || !to) return null;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const findRelevantCycloneAlert = (alerts, userLocation) => {
  const severityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  return alerts
    .filter((alert) => {
      if (alert?.category !== 'weather') return false;
      const alertCopy = `${alert.title ?? ''} ${alert.description ?? ''}`;
      return CYCLONE_PATTERN.test(alertCopy);
    })
    .map((alert) => {
      const distance = distanceInKm(userLocation, alert.coordinates);
      return {
        alert,
        distance,
        isNearby: distance !== null && distance <= CYCLONE_RELEVANCE_RADIUS_KM,
      };
    })
    .sort((left, right) => (
      Number(right.isNearby) - Number(left.isNearby)
      || (severityRank[right.alert.severity] ?? 0) - (severityRank[left.alert.severity] ?? 0)
    ))[0] ?? null;
};

const weatherMascotMood = ({ weatherCode, windSpeed, rain, cycloneContext }) => {
  if (
    cycloneContext
    || STORM_CODES.includes(weatherCode)
    || HEAVY_RAIN_CODES.includes(weatherCode)
    || Number(windSpeed) >= 45
    || Number(rain) >= 7.5
  ) return 'storm';
  if (RAIN_CODES.includes(weatherCode) || Number(rain) >= 0.1) return 'rain';
  if ([0, 1].includes(weatherCode)) return 'happy';
  return 'neutral';
};

const buildRisk = ({ weatherCode, windSpeed, rain, cycloneContext }) => {
  if (cycloneContext) {
    const isUrgent = ['Critical', 'High'].includes(cycloneContext.alert.severity);
    return {
      label: cycloneContext.isNearby ? 'Typhoon advisory nearby' : 'Typhoon advisory active',
      colorKey: isUrgent ? 'error' : 'warning',
      icon: 'warning',
    };
  }

  let score = 0;
  if (STORM_CODES.includes(weatherCode)) score += 5;
  if (HEAVY_RAIN_CODES.includes(weatherCode)) score += 3;
  else if ([61, 63, 80, 81].includes(weatherCode)) score += 2;
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
    lastUpdated, isLoading, isLocating, error, fetchWeather,
  } = useWeatherStore();
  const { alertsData, fetchAlerts } = useAlertsStore();
  const isOffline = useNetworkStatus();

  useEffect(() => {
    if (!userLocation) return undefined;
    fetchWeather();

    const interval = setInterval(fetchWeather, WEATHER_REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchWeather();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [userLocation, fetchWeather]);

  useEffect(() => {
    if (isOffline) return undefined;

    fetchAlerts();
    const interval = setInterval(fetchAlerts, ALERT_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAlerts, isOffline]);

  const current = weatherData?.current ?? {};
  const hourly = weatherData?.hourly ?? {};
  const daily = weatherData?.daily ?? {};
  const weatherMeta = weatherData?.weatherMeta ?? {};
  const cycloneContext = useMemo(() => (
    findRelevantCycloneAlert(Array.isArray(alertsData) ? alertsData : [], userLocation)
  ), [alertsData, userLocation]);
  const shouldShowRain = useMemo(() => {
    const code = current.weather_code;
    const precipitation = Number(current.precipitation);
    return RAIN_CODES.includes(code) || STORM_CODES.includes(code) || precipitation >= 0.1;
  }, [current.weather_code, current.precipitation]);
  const nextHours = useMemo(() => (
    (() => {
      const times = hourly.time ?? [];
      const currentHour = String(current.time ?? '').slice(0, 13);
      const currentIndex = Math.max(0, times.findIndex((time) => String(time).startsWith(currentHour)));
      return times.slice(currentIndex, currentIndex + 12).map((time, offset) => {
        const index = currentIndex + offset;
        return {
      time,
      rainChance: hourly.precipitation_probability?.[index],
      temp: offset === 0 ? current.temperature_2m : hourly.temperature_2m?.[index],
      code: offset === 0 ? current.weather_code : hourly.weather_code?.[index],
        };
      });
    })()
  ), [current.temperature_2m, current.time, current.weather_code, hourly]);

  if ((isLoading || isLocating) && !weatherData) return <SkeletonLoader variant="weather" />;
  if (!weatherData && locationPermissionStatus === 'denied') {
    return <View style={styles.center}><EmptyState variant="location" title="Location access needed" message="Enable location to see weather where you are." /></View>;
  }
  if (!weatherData && !isLoading && isOffline) {
    return <View style={styles.center}><EmptyState variant="offline" title="Weather is offline" message="Connect once to save your local forecast." /></View>;
  }
  if (error && !weatherData) {
    return <View style={styles.center}><EmptyState variant="error" title="Weather unavailable" message={error} /></View>;
  }

  const risk = buildRisk({
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    rain: current.precipitation,
    cycloneContext,
  });
  const mascotMood = weatherMascotMood({
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    rain: current.precipitation,
    cycloneContext,
  });
  const riskColor = theme.colors[risk.colorKey];
  const updatedAt = (lastUpdated || current.time)
    ? new Date(lastUpdated ?? current.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const refreshAll = () => {
    fetchWeather();
    if (!isOffline) fetchAlerts();
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAll} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Weather</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.location} numberOfLines={1}>{locationLabel || 'Current location'}</Text>
          </View>
        </View>
        <LinearGradient colors={theme.gradients.weather} style={styles.hero}>
          <View style={styles.heroMedia} pointerEvents="none">
            <Image
              source={WEATHER_MASCOTS[mascotMood]}
              resizeMode="cover"
              style={styles.heroMascot}
              fadeDuration={180}
              accessibilityIgnoresInvertColors
            />
          </View>
          <LinearGradient
            colors={['rgba(7,18,35,0.92)', 'rgba(7,18,35,0.58)', 'rgba(7,18,35,0.06)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.heroShade}
          />
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <View style={styles.nowRow}>
                <Text style={styles.now}>NOW</Text>
                <LottieView
                  source={weatherAnimationForCode(current.weather_code, current.time)}
                  autoPlay
                  loop
                  speed={0.75}
                  resizeMode="contain"
                  style={styles.weatherAnimation}
                />
              </View>
              <Text style={styles.condition} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
                {weatherData?.condition ?? 'Local weather'}
              </Text>
            </View>
          </View>
          <View style={styles.temperatureRow}>
            <Text style={styles.temperature} numberOfLines={1} adjustsFontSizeToFit>{formatValue(current.temperature_2m, '°')}</Text>
            <Text style={styles.feelsLike} numberOfLines={1}>Feels like {formatValue(current.apparent_temperature, '°')}</Text>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.riskRow}>
              <Ionicons name={risk.icon} size={16} color={riskColor} />
              <Text style={[styles.risk, { color: riskColor }]}>{risk.label}</Text>
            </View>
            <Text style={styles.updated}>{updatedAt ? `Checked ${updatedAt}` : 'Updating'}</Text>
          </View>
        </LinearGradient>
        <View style={styles.sourceRow}>
          <Ionicons name="git-compare-outline" size={16} color={theme.colors.secondary} />
          <Text style={styles.sourceText} numberOfLines={1}>
            {weatherMeta.modelCount
              ? `Open-Meteo · ${weatherMeta.modelCount} models · ${weatherMeta.rainVotes}/${weatherMeta.modelCount} detect rain`
              : 'Open-Meteo live forecast'}
          </Text>
          <Text style={styles.confidence}>{weatherMeta.confidence ?? 'Live'}</Text>
        </View>
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
      {shouldShowRain && (
        <RainBackground
          intensity={150}
          speed={1}
          color="rgba(174, 194, 224, 0.6)"
          angle={10}
          dropSize={{ min: 1, max: 2 }}
        />
      )}
    </View>
  );
}

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
  screenContainer: { flex: 1, backgroundColor: theme.colors.background },
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: theme.spacing.md, paddingTop: 18, paddingBottom: theme.spacing.lg, gap: theme.spacing.md },
  center: { flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background },
  header: { gap: 5 },
  screenTitle: { color: theme.colors.text.primary, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: 0 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  location: { flex: 1, color: theme.colors.text.secondary, fontSize: 14, lineHeight: 20 },
  hero: { minHeight: 282, borderRadius: theme.borderRadius.lg, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  heroMedia: { position: 'absolute', top: 0, bottom: 0, left: 0, right: -28 },
  heroMascot: { width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFillObject },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  heroCopy: { width: '54%', minWidth: 0 },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weatherAnimation: { width: 34, height: 34, marginVertical: -9 },
  now: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700' },
  condition: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '700', marginTop: 3, minHeight: 58 },
  temperatureRow: { width: '52%', minWidth: 0, alignItems: 'flex-start' },
  temperature: { color: '#FFFFFF', fontSize: 76, lineHeight: 86, fontWeight: '600', fontVariant: ['tabular-nums'] },
  feelsLike: { color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: theme.borderRadius.full },
  risk: { fontSize: 12, fontWeight: '700' },
  updated: { flex: 1, color: 'rgba(255,255,255,0.72)', fontSize: 12, textAlign: 'right' },
  sourceRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 3 },
  sourceText: { flex: 1, color: theme.colors.text.secondary, fontSize: 12 },
  confidence: { color: theme.colors.secondary, fontSize: 11, fontWeight: '700' },
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
