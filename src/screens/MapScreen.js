import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { THEME } from '../constants/theme';

const DEFAULT_COORDINATE = {
  latitude: 15.970,
  longitude: 120.575,
};

const WINDY_BASE_URL = 'https://embed.windy.com/embed.html';

const buildWindyUrl = ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    type: 'map',
    location: 'coordinates',
    metricWind: 'km/h',
    metricTemp: '°C',
    overlay: 'wind',
    level: 'surface',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '9',
  });

  return `${WINDY_BASE_URL}?${params.toString()}`;
};

const MapScreen = () => {
  const [coordinate, setCoordinate] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Locating...');
  const [isLocating, setIsLocating] = useState(true);
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [error, setError] = useState(null);

  const windyUrl = useMemo(() => (
    coordinate ? buildWindyUrl(coordinate) : null
  ), [coordinate]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentLocation = async () => {
      setIsLocating(true);
      setError(null);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          throw new Error('Location permission is required to center Windy radar on your area.');
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nextCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        let nextLabel = 'Current location';
        try {
          const places = await Location.reverseGeocodeAsync(nextCoordinate);
          const place = places?.[0];
          nextLabel = [place?.city, place?.subregion, place?.region, place?.country]
            .filter(Boolean)
            .join(', ') || nextLabel;
        } catch {
          nextLabel = 'Current location';
        }

        if (isMounted) {
          setCoordinate(nextCoordinate);
          setLocationLabel(nextLabel);
        }
      } catch (locationError) {
        if (isMounted) {
          setCoordinate(DEFAULT_COORDINATE);
          setLocationLabel('Pangasinan, Philippines');
          setError(locationError instanceof Error ? locationError.message : 'Unable to read device location.');
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

  const isLoading = isLocating || isWebViewLoading || !windyUrl;

  return (
    <View style={styles.container}>
      {windyUrl ? (
        <WebView
          source={{ uri: windyUrl }}
          style={styles.webView}
          containerStyle={styles.webViewContainer}
          originWhitelist={['https://*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          setSupportMultipleWindows={false}
          startInLoadingState={false}
          onLoadStart={() => setIsWebViewLoading(true)}
          onLoadEnd={() => setIsWebViewLoading(false)}
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

      <LinearGradient
        colors={['rgba(8, 17, 31, 0.96)', 'rgba(8, 17, 31, 0.42)', 'transparent']}
        style={styles.topScrim}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="weather-hurricane" size={22} color={THEME.colors.secondary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Wind Radar</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{locationLabel}</Text>
        </View>
      </View>

      <View style={styles.sourceBadge} pointerEvents="none">
        <Ionicons name="navigate" size={14} color={THEME.colors.secondary} />
        <Text style={styles.sourceText}>Windy · km/h · °C</Text>
      </View>

      {error ? (
        <View style={styles.notice}>
          <Ionicons name="warning-outline" size={16} color={THEME.colors.warning} />
          <Text style={styles.noticeText} numberOfLines={2}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? <WindyLoadingState /> : null}
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
        colors={['#08111F', '#0F1B2E', '#08111F']}
        style={styles.loadingPanel}
      >
        <Animated.View style={[styles.radarPulse, { transform: [{ scale }] }]}>
          <View style={styles.radarRing}>
            <MaterialCommunityIcons name="weather-windy" size={42} color={THEME.colors.secondary} />
          </View>
        </Animated.View>

        <Text style={styles.loadingTitle}>Opening Live Wind Map</Text>
        <Text style={styles.loadingSubtitle}>Centering Windy on your current GPS location.</Text>

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
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 138,
  },
  header: {
    ...THEME.shadows.subtle,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 34,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    minHeight: 64,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    backgroundColor: 'rgba(8, 17, 31, 0.74)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(125, 211, 252, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  sourceBadge: {
    position: 'absolute',
    left: THEME.spacing.md,
    bottom: 104,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: 'rgba(8, 17, 31, 0.76)',
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sourceText: {
    color: THEME.colors.text.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  notice: {
    ...THEME.shadows.subtle,
    position: 'absolute',
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    bottom: 152,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.32)',
    backgroundColor: 'rgba(8, 17, 31, 0.82)',
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
    backgroundColor: 'rgba(8, 17, 31, 0.96)',
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
