import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { THEME } from '../constants/theme';

const MANILA_COORDINATE = {
  latitude: 14.5995,
  longitude: 120.9842,
};

const WINDY_BASE_URL = 'https://embed.windy.com/embed2.html';
const FORECAST_DAY_COUNT = 5;
const FORECAST_HOURS = Array.from({ length: 24 }, (_, index) => index);

const WINDY_LAYERS = [
  { label: 'Weather radar', overlay: 'radar', icon: 'radar' },
  { label: 'Satellite', overlay: 'satellite', icon: 'earth' },
  { label: 'Wind', overlay: 'wind', icon: 'weather-windy' },
  { label: 'Rain, thunder', overlay: 'rain', icon: 'weather-pouring' },
  { label: 'Temperature', overlay: 'temp', icon: 'thermometer' },
  { label: 'Hurricane tracker', overlay: 'hurricanes', icon: 'weather-hurricane' },
  { label: 'Clouds', overlay: 'clouds', icon: 'weather-cloudy' },
  { label: 'Waves', overlay: 'waves', icon: 'waves' },
  { label: 'Rain accumulation', overlay: 'rainAccu', icon: 'weather-rainy' },
  { label: 'Thunderstorms', overlay: 'thunder', icon: 'weather-lightning-rainy' },
  { label: 'Altitude', overlay: 'wind', icon: 'airplane' },
];

const getForecastTimestamp = (dayIndex, hour) => {
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() + dayIndex);
  target.setHours(hour, 0, 0, 0);

  return target.getTime();
};

const buildWindyUrl = ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    detailLat: String(latitude),
    detailLon: String(longitude),
    zoom: '10',
    level: 'surface',
    overlay: 'wind',
    product: 'ecmwf',
    menu: 'true',
    message: 'false',
    marker: 'true',
    calendar: 'now',
    forecast: 'now',
    pressure: 'true',
    type: 'map',
    location: 'coordinates',
    detail: 'false',
    metricWind: 'km/h',
    metricTemp: '\u00B0C',
    radarRange: '-1',
  });

  return `${WINDY_BASE_URL}?${params.toString()}`;
};

const WINDY_BRIDGE_SCRIPT = `
  (() => {
    const styleId = 'kalasag-windy-overrides';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = 'html, body, #map_container, #windy {' +
        'margin:0!important;width:100%!important;height:100%!important;' +
        'overflow:hidden!important;background:#0F172A!important;}' +
        '#detail, #bottom, .detail, .detail-pane, .plugin-detail {' +
        'display:none!important;}';
      document.head.appendChild(style);
    }

    const applyWeatherState = (payload) => {
      const store = window.W && window.W.store;
      if (!store || typeof store.set !== 'function') {
        window.__kalasagPendingWeather = payload;
        return false;
      }

      if (payload.overlay) store.set('overlay', payload.overlay);
      if (Number.isFinite(payload.timestamp)) store.set('timestamp', payload.timestamp);
      window.__kalasagPendingWeather = null;
      return true;
    };

    window.__kalasagSetWeather = applyWeatherState;

    const waitForWindy = setInterval(() => {
      if (window.__kalasagPendingWeather && applyWeatherState(window.__kalasagPendingWeather)) {
        clearInterval(waitForWindy);
      }
    }, 350);
    setTimeout(() => clearInterval(waitForWindy), 30000);
  })();
  true;
`;

const buildForecastDays = () => (
  Array.from({ length: FORECAST_DAY_COUNT }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      id: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString([], { weekday: 'short' }),
      dayNumber: date.getDate(),
    };
  })
);

const formatHour = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

const MapScreen = () => {
  const webViewRef = useRef(null);
  const [coordinate, setCoordinate] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [hasLoadedWebView, setHasLoadedWebView] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOverlay, setSelectedOverlay] = useState('wind');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);

  const forecastDays = useMemo(() => buildForecastDays(), []);
  const windyUrl = useMemo(() => (
    coordinate ? buildWindyUrl(coordinate) : null
  ), [coordinate]);
  const isLoading = isLocating || (!hasLoadedWebView && isWebViewLoading) || !windyUrl;

  const applyWindyState = useCallback(() => {
    if (!hasLoadedWebView || !webViewRef.current) return;

    const weatherState = JSON.stringify({
      overlay: selectedOverlay,
      timestamp: getForecastTimestamp(selectedDayIndex, selectedHour),
    });

    webViewRef.current.injectJavaScript(`
      if (window.__kalasagSetWeather) {
        window.__kalasagSetWeather(${weatherState});
      } else {
        window.__kalasagPendingWeather = ${weatherState};
      }
      true;
    `);
  }, [hasLoadedWebView, selectedDayIndex, selectedHour, selectedOverlay]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentLocation = async () => {
      setIsLocating(true);
      setError(null);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          throw new Error('Location permission denied. Showing Manila as the default weather map.');
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setCoordinate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch (locationError) {
        if (isMounted) {
          setCoordinate(MANILA_COORDINATE);
          setError(locationError instanceof Error ? locationError.message : 'Unable to read device location. Showing Manila by default.');
        }
      } finally {
        if (isMounted) {
          setIsLocating(false);
        }
      }
    };

    loadCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isTimelinePlaying || isLoading) return undefined;

    const timer = setInterval(() => {
      setSelectedHour((currentHour) => {
        if (currentHour < 23) return currentHour + 1;

        setSelectedDayIndex((currentDay) => {
          return currentDay >= FORECAST_DAY_COUNT - 1 ? 0 : currentDay + 1;
        });

        return 0;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isLoading, isTimelinePlaying]);

  useEffect(() => {
    applyWindyState();
  }, [applyWindyState]);

  return (
    <View style={styles.container}>
      {windyUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: windyUrl }}
          style={styles.webView}
          containerStyle={styles.webViewContainer}
          originWhitelist={['https://*']}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScript={WINDY_BRIDGE_SCRIPT}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          setSupportMultipleWindows={false}
          startInLoadingState={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          onLoadStart={() => setIsWebViewLoading(true)}
          onLoadEnd={() => {
            setHasLoadedWebView(true);
            setIsWebViewLoading(false);
          }}
          onError={() => {
            setIsWebViewLoading(false);
            setError('Windy map is temporarily unavailable.');
          }}
          onHttpError={() => {
            setIsWebViewLoading(false);
            setError('Windy map returned an error.');
          }}
        />
      ) : null}

      {!isLoading ? (
        <WindyLayerSidebar
          isOpen={isSidebarOpen}
          layers={WINDY_LAYERS}
          selectedOverlay={selectedOverlay}
          setIsOpen={setIsSidebarOpen}
          setSelectedOverlay={setSelectedOverlay}
        />
      ) : null}

      {!isLoading ? (
        <ForecastTimeline
          days={forecastDays}
          isPlaying={isTimelinePlaying}
          selectedDayIndex={selectedDayIndex}
          selectedHour={selectedHour}
          setIsPlaying={setIsTimelinePlaying}
          setSelectedDayIndex={setSelectedDayIndex}
          setSelectedHour={setSelectedHour}
        />
      ) : null}

      {error && !isLoading ? (
        <View style={styles.notice}>
          <Ionicons name="warning-outline" size={16} color={THEME.colors.warning} />
          <Text style={styles.noticeText} numberOfLines={2}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? <WindyLoadingState /> : null}
    </View>
  );
};

const ForecastTimeline = ({
  days,
  isPlaying,
  selectedDayIndex,
  selectedHour,
  setIsPlaying,
  setSelectedDayIndex,
  setSelectedHour,
}) => {
  const hourScrollRef = useRef(null);
  const currentHour = new Date().getHours();
  const elapsedHours = selectedDayIndex * 24 + selectedHour - currentHour;
  const availableHours = FORECAST_DAY_COUNT * 24 - currentHour - 1;
  const progress = Math.max(0, elapsedHours / availableHours);

  useEffect(() => {
    hourScrollRef.current?.scrollTo({
      x: Math.max(0, selectedHour * 65 - 120),
      animated: true,
    });
  }, [selectedHour]);

  const selectDay = (index) => {
    setSelectedDayIndex(index);
    setIsPlaying(false);
    if (index === 0 && selectedHour < currentHour) {
      setSelectedHour(currentHour);
    }
  };

  return (
    <View style={styles.forecastTimeline}>
      <View style={styles.timelineControls}>
        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.timelinePlayButton}
          onPress={() => setIsPlaying((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause forecast animation' : 'Play forecast animation'}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={THEME.colors.text.primary}
            style={!isPlaying ? styles.playIcon : null}
          />
        </TouchableOpacity>

        <View style={styles.selectedTimeBadge}>
          <Ionicons name="time-outline" size={18} color={THEME.colors.text.primary} />
          <Text style={styles.selectedTimeText}>{formatHour(selectedHour)}</Text>
        </View>

        <View style={styles.timelineControlSpacer} />
      </View>

      <View style={styles.timelineProgressTrack}>
        <View style={[styles.timelineProgressFill, { width: `${Math.max(3, progress * 100)}%` }]} />
      </View>

      <View style={styles.dayTabs}>
        {days.map((day, index) => {
          const isActive = index === selectedDayIndex;

          return (
            <TouchableOpacity
              key={day.id}
              activeOpacity={0.86}
              style={[styles.dayTab, isActive && styles.dayTabActive]}
              onPress={() => selectDay(index)}
            >
              <Text style={[styles.dayTabLabel, isActive && styles.dayTabTextActive]}>
                {day.label}
              </Text>
              <Text style={[styles.dayTabDate, isActive && styles.dayTabTextActive]}>
                {day.dayNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={hourScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hourList}
      >
        {FORECAST_HOURS.map((hour) => {
          const isActive = hour === selectedHour;
          const isPast = selectedDayIndex === 0 && hour < currentHour;

          return (
            <TouchableOpacity
              key={hour}
              activeOpacity={0.86}
              disabled={isPast}
              style={[
                styles.hourChip,
                isActive && styles.hourChipActive,
                isPast && styles.hourChipDisabled,
              ]}
              onPress={() => {
                setIsPlaying(false);
                setSelectedHour(hour);
              }}
            >
              <Text
                style={[
                  styles.hourText,
                  isActive && styles.hourTextActive,
                  isPast && styles.hourTextDisabled,
                ]}
              >
                {formatHour(hour)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const WindyLayerSidebar = ({
  isOpen,
  layers,
  selectedOverlay,
  setIsOpen,
  setSelectedOverlay,
}) => {
  const slide = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: isOpen ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isOpen, slide]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [158, 0],
  });
  const panelOpacity = slide.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.6, 1],
  });

  return (
    <View style={styles.layerSidebar} pointerEvents="box-none">
      {!isOpen ? (
        <TouchableOpacity
          activeOpacity={0.84}
          style={styles.collapsedMenuButton}
          onPress={() => setIsOpen(true)}
        >
          <Ionicons name="chevron-back" size={24} color={THEME.colors.text.primary} />
          <Ionicons name="layers-outline" size={20} color={THEME.colors.secondary} />
        </TouchableOpacity>
      ) : null}

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.sidebarPanel,
          {
            opacity: panelOpacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.menuRow}>
          <Text style={styles.menuText}>Layers</Text>
          <TouchableOpacity
            activeOpacity={0.84}
            style={styles.menuButton}
            onPress={() => setIsOpen(false)}
          >
            <Ionicons name="chevron-forward" size={22} color={THEME.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.layerList}
        >
          {layers.map((layer) => {
            const isActive = layer.overlay === selectedOverlay;

            return (
              <TouchableOpacity
                key={`${layer.label}-${layer.overlay}`}
                activeOpacity={0.86}
                style={styles.layerRow}
                onPress={() => setSelectedOverlay(layer.overlay)}
              >
                <Text style={[styles.layerLabel, isActive && styles.layerLabelActive]} numberOfLines={1}>
                  {layer.label}
                </Text>
                <View style={[styles.layerOrb, isActive && styles.layerOrbActive]}>
                  <MaterialCommunityIcons
                    name={layer.icon}
                    size={19}
                    color={isActive ? THEME.colors.text.primary : THEME.colors.secondary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const WindyLoadingState = () => {
  const shimmer = useRef(new Animated.Value(-1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    shimmerLoop.start();
    pulseLoop.start();

    return () => {
      shimmerLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-220, 360],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  return (
    <View style={styles.loadingOverlay}>
      <LinearGradient
        colors={['#0F172A', '#0F1B2E', '#08111F']}
        style={styles.loadingPanel}
      >
        <Animated.View style={[styles.radarPulse, { transform: [{ scale }] }]}>
          <View style={styles.radarRing}>
            <MaterialCommunityIcons name="weather-windy" size={42} color={THEME.colors.secondary} />
          </View>
        </Animated.View>

        <Text style={styles.loadingTitle}>Opening Live Weather Map</Text>
        <Text style={styles.loadingSubtitle}>Loading Windy wind particles, sidebar menu, and forecast timeline.</Text>

        <View style={styles.skeletonStack}>
          <SkeletonLine width="72%" translateX={translateX} />
          <SkeletonLine width="96%" translateX={translateX} />
          <SkeletonLine width="54%" translateX={translateX} />
        </View>
      </LinearGradient>
    </View>
  );
};

const SkeletonLine = ({ translateX, width }) => (
  <View style={[styles.skeletonLine, { width }]}>
    <Animated.View style={[styles.shimmerWrap, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={['transparent', 'rgba(248,250,252,0.18)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.shimmer}
      />
    </Animated.View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  webView: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  layerSidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 286,
    width: 184,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sidebarPanel: {
    ...THEME.shadows.card,
    maxHeight: '78%',
    width: 172,
    paddingVertical: 8,
    paddingLeft: 7,
    paddingRight: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: THEME.colors.borderStrong,
    backgroundColor: 'rgba(15, 23, 42, 0.74)',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingBottom: 5,
  },
  menuText: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedMenuButton: {
    ...THEME.shadows.card,
    position: 'absolute',
    right: 8,
    width: 46,
    height: 56,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: THEME.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  layerList: {
    alignItems: 'flex-end',
    gap: 4,
    paddingTop: 2,
    paddingBottom: 2,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 36,
  },
  layerLabel: {
    maxWidth: 112,
    color: THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  layerLabelActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.54)',
    color: THEME.colors.text.primary,
  },
  layerOrb: {
    ...THEME.shadows.subtle,
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerOrbActive: {
    borderWidth: 2,
    borderColor: THEME.colors.secondary,
    backgroundColor: THEME.colors.primary,
    transform: [{ scale: 1.06 }],
  },
  forecastTimeline: {
    ...THEME.shadows.card,
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 92,
    paddingTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    backgroundColor: '#111827',
    overflow: 'hidden',
    zIndex: 20,
  },
  timelineControls: {
    height: 50,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTimeBadge: {
    ...THEME.shadows.subtle,
    minWidth: 118,
    height: 42,
    borderRadius: 14,
    backgroundColor: THEME.colors.warning,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  timelinePlayButton: {
    ...THEME.shadows.subtle,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: THEME.colors.primary,
    borderWidth: 1,
    borderColor: THEME.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },
  timelineControlSpacer: {
    width: 46,
    height: 46,
  },
  selectedTimeText: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  timelineProgressTrack: {
    height: 4,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  timelineProgressFill: {
    height: 4,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.secondary,
  },
  dayTabs: {
    height: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  dayTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
  },
  dayTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: THEME.colors.secondary,
    backgroundColor: 'transparent',
  },
  dayTabLabel: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '900',
  },
  dayTabDate: {
    color: THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  dayTabTextActive: {
    color: THEME.colors.text.primary,
  },
  hourList: {
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  hourChip: {
    minWidth: 58,
    height: 34,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  hourChipActive: {
    borderColor: THEME.colors.secondary,
    backgroundColor: THEME.colors.primary,
  },
  hourChipDisabled: {
    opacity: 0.36,
  },
  hourText: {
    color: THEME.colors.text.secondary,
    fontSize: 11,
    fontWeight: '900',
  },
  hourTextActive: {
    color: THEME.colors.text.primary,
  },
  hourTextDisabled: {
    color: THEME.colors.text.disabled,
  },
  notice: {
    ...THEME.shadows.subtle,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 34,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.32)',
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    padding: THEME.spacing.md,
  },
  noticeText: {
    flex: 1,
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
  },
  loadingPanel: {
    ...THEME.shadows.card,
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  radarPulse: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  radarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    backgroundColor: 'rgba(125, 211, 252, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    color: THEME.colors.text.primary,
    fontSize: 21,
    fontWeight: '900',
    marginTop: THEME.spacing.lg,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  skeletonStack: {
    width: '100%',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.lg,
  },
  skeletonLine: {
    height: 14,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceSoft,
    overflow: 'hidden',
  },
  shimmerWrap: {
    width: 160,
    height: '100%',
  },
  shimmer: {
    flex: 1,
  },
});

export default MapScreen;
