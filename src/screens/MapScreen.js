import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAlertsStore } from '../store/useAlertsStore';
import useWeatherStore from '../store/useWeatherStore';
import { fetchRadarFrames } from '../services/radarApi';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_REGION_DELTA = {
  latitudeDelta: 2.2,
  longitudeDelta: 2.2,
};

const isValidCoordinate = (coordinate) => (
  coordinate
  && Number.isFinite(Number(coordinate.latitude))
  && Number.isFinite(Number(coordinate.longitude))
);

const MapScreen = () => {
  const mapRef = useRef(null);
  const isOffline = useNetworkStatus();
  const { alertsData, fetchAlerts } = useAlertsStore();
  const { userLocation, locationLabel, weatherData, isLocating } = useWeatherStore();
  const [radarFrames, setRadarFrames] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [radarStatus, setRadarStatus] = useState('loading');

  const userCoordinate = isValidCoordinate(userLocation)
    ? {
      latitude: Number(userLocation.latitude),
      longitude: Number(userLocation.longitude),
    }
    : null;
  const region = userCoordinate ? { ...userCoordinate, ...DEFAULT_REGION_DELTA } : null;
  const selectedFrame = radarFrames[selectedFrameIndex];

  const alertMarkers = useMemo(() => (
    (Array.isArray(alertsData) ? alertsData : [])
      .map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        coordinate: alert.coordinates,
      }))
      .filter((marker) => isValidCoordinate(marker.coordinate))
  ), [alertsData]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    const loadRadar = async () => {
      if (isOffline) {
        setRadarStatus('offline');
        return;
      }

      try {
        setRadarStatus('loading');
        const frames = await fetchRadarFrames();
        setRadarFrames(frames);
        setSelectedFrameIndex(frames.length - 1);
        setRadarStatus('ready');
      } catch {
        setRadarStatus('unavailable');
      }
    };

    loadRadar();
  }, [isOffline]);

  useEffect(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 650);
    }
  }, [userCoordinate?.latitude, userCoordinate?.longitude]);

  if (!region) {
    return (
      <View style={styles.center}>
        {isLocating ? (
          <ActivityIndicator size="large" color={THEME.colors.secondary} />
        ) : (
          <Ionicons name="location-outline" size={42} color={THEME.colors.warning} />
        )}
        <Text style={styles.centerTitle}>Waiting for GPS</Text>
        <Text style={styles.centerCopy}>Enable location to open radar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        mapType="none"
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
        toolbarEnabled={false}
      >
        <UrlTile
          urlTemplate={OSM_TILE_URL}
          maximumZ={19}
          flipY={false}
          zIndex={1}
          opacity={0.72}
        />

        {selectedFrame?.tileUrl ? (
          <UrlTile
            urlTemplate={selectedFrame.tileUrl}
            maximumZ={12}
            flipY={false}
            zIndex={3}
            opacity={0.68}
          />
        ) : null}

        <Marker coordinate={userCoordinate} title="You are here" description={locationLabel}>
          <View style={styles.userMarker}>
            <View style={styles.userMarkerCore} />
          </View>
        </Marker>

        {alertMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: Number(marker.coordinate.latitude),
              longitude: Number(marker.coordinate.longitude),
            }}
            title={marker.title}
            description={marker.description}
          >
            <View style={styles.hazardMarker}>
              <Ionicons name="warning" size={18} color={THEME.colors.text.primary} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.topHud}>
        <View style={styles.hudTitleRow}>
          <MaterialCommunityIcons name="radar" size={24} color={THEME.colors.secondary} />
          <View style={styles.hudTitleText}>
            <Text style={styles.hudTitle}>Radar</Text>
            <Text style={styles.hudSubtitle} numberOfLines={1}>{locationLabel}</Text>
          </View>
        </View>

        <View style={styles.hudMetrics}>
          <View style={styles.hudMetric}>
            <Ionicons name="thermometer-outline" size={16} color={THEME.colors.warning} />
            <Text style={styles.hudMetricText}>
              {Number.isFinite(Number(weatherData?.current?.temperature_2m))
                ? `${Math.round(Number(weatherData.current.temperature_2m))}°`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.hudMetric}>
            <Ionicons name="warning-outline" size={16} color={THEME.colors.error} />
            <Text style={styles.hudMetricText}>{alertMarkers.length}</Text>
          </View>
          <View style={styles.hudMetric}>
            <Ionicons name={radarStatus === 'ready' ? 'radio-outline' : 'cloud-offline-outline'} size={16} color={THEME.colors.secondary} />
            <Text style={styles.hudMetricText}>{radarStatus === 'ready' ? 'Live' : 'Pending'}</Text>
          </View>
        </View>

        {radarFrames.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.frameStrip}>
            {radarFrames.map((frame, index) => {
              const isActive = index === selectedFrameIndex;
              return (
                <TouchableOpacity
                  key={frame.time}
                  style={[styles.frameChip, isActive && styles.frameChipActive]}
                  onPress={() => setSelectedFrameIndex(index)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.frameChipText, isActive && styles.frameChipTextActive]}>{frame.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <Text style={styles.attributionText}>Radar tiles by RainViewer · Base map by OpenStreetMap contributors</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.xl,
  },
  centerTitle: {
    color: THEME.colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: THEME.spacing.md,
    textAlign: 'center',
  },
  centerCopy: {
    color: THEME.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  topHud: {
    ...THEME.shadows.card,
    position: 'absolute',
    top: THEME.spacing.md,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    backgroundColor: THEME.colors.mapOverlay,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: THEME.spacing.md,
  },
  hudTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  hudTitleText: {
    flex: 1,
  },
  hudTitle: {
    color: THEME.colors.text.primary,
    fontSize: 21,
    fontWeight: '900',
  },
  hudSubtitle: {
    color: THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  hudMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  hudMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 8,
  },
  hudMetricText: {
    color: THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  frameStrip: {
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.md,
  },
  frameChip: {
    borderRadius: THEME.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
  },
  frameChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  frameChipText: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '900',
  },
  frameChipTextActive: {
    color: THEME.colors.text.primary,
  },
  attributionText: {
    color: THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: THEME.spacing.sm,
  },
  userMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 2,
    borderColor: THEME.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerCore: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: THEME.colors.secondary,
  },
  hazardMarker: {
    ...THEME.shadows.subtle,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.error,
    borderWidth: 2,
    borderColor: THEME.colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapScreen;
