import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAlertsStore } from '../store/useAlertsStore';
import useWeatherStore from '../store/useWeatherStore';
import { fetchRadarFrames } from '../services/radarApi';
import { fetchWeather as fetchPointWeather, WEATHER_DESCRIPTIONS } from '../services/weatherApi';
import GlassCard from '../components/GlassCard';

let MapView;
let Marker;
let PROVIDER_GOOGLE;
let UrlTile;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  UrlTile = Maps.UrlTile;
}

const DEFAULT_REGION_DELTA = {
  latitudeDelta: 2.2,
  longitudeDelta: 2.2,
};

const LAYERS = [
  { id: 'radar', label: 'Radar', icon: 'radar', color: THEME.colors.secondary, source: 'RainViewer' },
  { id: 'rain', label: 'Rain', icon: 'rainy-outline', color: '#38BDF8', source: 'Open-Meteo' },
  { id: 'wind', label: 'Wind', icon: 'navigate-outline', color: '#A7F3D0', source: 'Open-Meteo' },
  { id: 'temp', label: 'Temp', icon: 'thermometer-outline', color: THEME.colors.warning, source: 'Open-Meteo' },
  { id: 'alerts', label: 'Alerts', icon: 'warning-outline', color: THEME.colors.error, source: 'ReliefWeb' },
];

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F172A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#263449' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B3B5A' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#172033' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
];

const isValidCoordinate = (coordinate) => (
  coordinate
  && Number.isFinite(Number(coordinate.latitude))
  && Number.isFinite(Number(coordinate.longitude))
);

const formatHour = (time) => {
  if (!time) return 'Now';
  return new Date(time).toLocaleTimeString([], { hour: 'numeric' });
};

const formatForecastTime = (time) => {
  if (!time) return 'Now';
  return new Date(time).toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
  });
};

const getConditionText = (code) => WEATHER_DESCRIPTIONS[code] ?? 'Forecast';

const getLayerValue = (layer, frame, alertCount) => {
  if (layer === 'rain') return `${Math.round(Number(frame?.rainChance ?? 0))}%`;
  if (layer === 'wind') return `${Math.round(Number(frame?.windSpeed ?? 0))} km/h`;
  if (layer === 'temp') return `${Math.round(Number(frame?.temperature ?? 0))}°`;
  if (layer === 'alerts') return `${alertCount} alerts`;
  return 'Radar';
};

const MapScreen = () => {
  const mapRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme !== 'light';
  const isOffline = useNetworkStatus();
  const { alertsData, fetchAlerts } = useAlertsStore();
  const {
    userLocation,
    locationLabel,
    weatherData,
    isLocating,
    fetchWeather,
  } = useWeatherStore();
  const [radarFrames, setRadarFrames] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState('radar');
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [radarStatus, setRadarStatus] = useState('loading');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [inspectedPoint, setInspectedPoint] = useState(null);
  const [isInspectingPoint, setIsInspectingPoint] = useState(false);

  const userCoordinate = isValidCoordinate(userLocation)
    ? {
      latitude: Number(userLocation.latitude),
      longitude: Number(userLocation.longitude),
    }
    : null;
  const region = userCoordinate ? { ...userCoordinate, ...DEFAULT_REGION_DELTA } : null;
  const hourly = weatherData?.hourly ?? {};

  const forecastFrames = useMemo(() => (
    (hourly?.time ?? []).slice(0, 48).map((time, index) => ({
      time,
      label: formatHour(time),
      rainChance: Number(hourly?.precipitation_probability?.[index] ?? 0),
      precipitation: Number(hourly?.precipitation?.[index] ?? 0),
      humidity: Number(hourly?.relative_humidity_2m?.[index] ?? weatherData?.current?.relative_humidity_2m ?? 0),
      windSpeed: Number(hourly?.wind_speed_10m?.[index] ?? weatherData?.current?.wind_speed_10m ?? 0),
      windDirection: Number(hourly?.wind_direction_10m?.[index] ?? weatherData?.current?.wind_direction_10m ?? 35),
      windGust: Number(hourly?.wind_gusts_10m?.[index] ?? hourly?.wind_speed_10m?.[index] ?? 0),
      temperature: Number(hourly?.temperature_2m?.[index] ?? weatherData?.current?.temperature_2m ?? 0),
      weatherCode: hourly?.weather_code?.[index],
    }))
  ), [hourly, weatherData]);

  const activeFrames = selectedLayer === 'radar' && radarFrames.length ? radarFrames : forecastFrames;
  const activeFrame = activeFrames[timelineIndex % Math.max(activeFrames.length, 1)];
  const selectedRadarFrame = selectedLayer === 'radar' ? activeFrame : null;

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

  const layerAvailability = {
    radar: radarFrames.length > 0,
    rain: forecastFrames.some((frame) => Number.isFinite(frame.rainChance)),
    wind: forecastFrames.some((frame) => Number.isFinite(frame.windSpeed)),
    temp: forecastFrames.some((frame) => Number.isFinite(frame.temperature)),
    alerts: true,
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (userCoordinate && !weatherData && !isOffline) {
      fetchWeather(userCoordinate);
    }
  }, [fetchWeather, isOffline, userCoordinate?.latitude, userCoordinate?.longitude, weatherData]);

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
        setTimelineIndex(Math.max(frames.length - 1, 0));
        setRadarStatus('ready');
      } catch {
        setRadarStatus('unavailable');
      }
    };

    loadRadar();
  }, [isOffline]);

  useEffect(() => {
    setTimelineIndex(0);
    setIsPlaying(false);
  }, [selectedLayer]);

  useEffect(() => {
    if (!isPlaying || !activeFrames.length) return undefined;

    const timer = setInterval(() => {
      setTimelineIndex((current) => (current + 1) % activeFrames.length);
    }, selectedLayer === 'radar' ? 1400 : 1800);

    return () => clearInterval(timer);
  }, [activeFrames.length, isPlaying, selectedLayer]);

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

  const activeLayer = LAYERS.find((item) => item.id === selectedLayer) ?? LAYERS[0];
  const sourceStatus = layerAvailability[selectedLayer] ? activeLayer.source : 'Unavailable';
  const layerValue = getLayerValue(selectedLayer, activeFrame, alertMarkers.length);

  const inspectCoordinate = async (coordinate) => {
    if (!isValidCoordinate(coordinate) || isOffline) return;

    const selectedCoordinate = {
      latitude: Number(coordinate.latitude),
      longitude: Number(coordinate.longitude),
    };

    setInspectedPoint({
      coordinate: selectedCoordinate,
      data: null,
      error: null,
    });
    setIsInspectingPoint(true);

    try {
      const response = await fetchPointWeather({
        ...selectedCoordinate,
        label: 'Selected point',
      });
      setInspectedPoint({
        coordinate: selectedCoordinate,
        data: response.data,
        error: null,
      });
    } catch (error) {
      setInspectedPoint({
        coordinate: selectedCoordinate,
        data: null,
        error: error instanceof Error ? error.message : 'Point forecast unavailable.',
      });
    } finally {
      setIsInspectingPoint(false);
    }
  };

  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={styles.container}>
        <ForecastCanvas layer={selectedLayer} frame={activeFrame} alertCount={alertMarkers.length} />
        <MapControls
          activeFrame={activeFrame}
          activeLayer={activeLayer}
          availability={layerAvailability}
          isCollapsed={isPanelCollapsed}
          layer={selectedLayer}
          locationLabel={locationLabel}
          setCollapsed={setIsPanelCollapsed}
          setLayer={setSelectedLayer}
        />
        <LayerInfoCard
          activeFrame={activeFrame}
          activeLayer={activeLayer}
          alertCount={alertMarkers.length}
          inspectedPoint={inspectedPoint}
          isInspectingPoint={isInspectingPoint}
          layer={selectedLayer}
          layerValue={layerValue}
          radarStatus={radarStatus}
          sourceStatus={sourceStatus}
          weatherData={weatherData}
        />
        <TimelineBar
          frameLabel={activeFrame?.label ?? 'Now'}
          isPlaying={isPlaying}
          layerValue={layerValue}
          progress={activeFrames.length > 1 ? timelineIndex / (activeFrames.length - 1) : 0}
          setPlaying={setIsPlaying}
          sourceStatus={sourceStatus}
          timelineIndex={timelineIndex}
          totalFrames={activeFrames.length}
        />
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
        mapType={Platform.OS === 'ios' && isDarkMode ? 'mutedStandard' : 'standard'}
        customMapStyle={isDarkMode ? DARK_MAP_STYLE : []}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
        toolbarEnabled={false}
        onPress={(event) => inspectCoordinate(event.nativeEvent.coordinate)}
      >
        {selectedRadarFrame?.tileUrl ? (
          <UrlTile
            urlTemplate={selectedRadarFrame.tileUrl}
            maximumZ={12}
            flipY={false}
            zIndex={3}
            opacity={0.7}
          />
        ) : null}

        <Marker coordinate={userCoordinate} title="You are here" description={locationLabel}>
          <View style={styles.userMarker}>
            <View style={styles.userMarkerCore} />
          </View>
        </Marker>

        {inspectedPoint?.coordinate ? (
          <Marker
            coordinate={inspectedPoint.coordinate}
            title="Selected point"
            description={inspectedPoint?.data?.condition || inspectedPoint?.error || 'Open-Meteo forecast point'}
          >
            <View style={styles.inspectMarker}>
              <Ionicons name="add" size={18} color={THEME.colors.text.primary} />
            </View>
          </Marker>
        ) : null}

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

      {selectedLayer !== 'radar' ? (
        <ForecastCanvas layer={selectedLayer} frame={activeFrame} alertCount={alertMarkers.length} />
      ) : null}

      <MapControls
        activeFrame={activeFrame}
        activeLayer={activeLayer}
        availability={layerAvailability}
        isCollapsed={isPanelCollapsed}
        layer={selectedLayer}
        locationLabel={locationLabel}
        setCollapsed={setIsPanelCollapsed}
        setLayer={setSelectedLayer}
      />
      <LayerInfoCard
        activeFrame={activeFrame}
        activeLayer={activeLayer}
        alertCount={alertMarkers.length}
        inspectedPoint={inspectedPoint}
        isInspectingPoint={isInspectingPoint}
        layer={selectedLayer}
        layerValue={layerValue}
        radarStatus={radarStatus}
        sourceStatus={sourceStatus}
        weatherData={weatherData}
      />
      <TimelineBar
        frameLabel={activeFrame?.label ?? 'Now'}
        isPlaying={isPlaying}
        layerValue={layerValue}
        progress={activeFrames.length > 1 ? timelineIndex / (activeFrames.length - 1) : 0}
        setPlaying={setIsPlaying}
        sourceStatus={sourceStatus}
        timelineIndex={timelineIndex}
        totalFrames={activeFrames.length}
      />
    </View>
  );
};

const ForecastCanvas = ({ alertCount = 0, frame, layer }) => {
  const rain = Math.min(100, Math.max(0, Number(frame?.rainChance ?? 0)));
  const wind = Math.min(80, Math.max(0, Number(frame?.windSpeed ?? 0)));
  const direction = Number.isFinite(Number(frame?.windDirection)) ? Number(frame.windDirection) : 35;
  const temp = Number(frame?.temperature ?? 0);
  const pucks = getLayerPucks(layer, frame, alertCount);
  const fieldStyle = getLayerFieldStyle(layer, { rain, temp, wind });

  if (layer === 'alerts') {
    return (
      <View pointerEvents="none" style={styles.softwareLayer}>
        <View style={styles.alertTint} />
        <ForecastPucks pucks={pucks} />
      </View>
    );
  }

  if (layer === 'wind') {
    return (
      <View pointerEvents="none" style={styles.softwareLayer}>
        <View style={[styles.layerField, fieldStyle]} />
        <View style={styles.windStreamA} />
        <View style={styles.windStreamB} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
          <View
            key={item}
            style={[
              styles.windArrow,
              {
                left: `${6 + (item % 5) * 19}%`,
                top: `${24 + Math.floor(item / 5) * 26}%`,
                opacity: 0.5 + wind / 170,
                transform: [{ rotate: `${direction + item * 10}deg` }],
              },
            ]}
          >
            <Ionicons name="navigate" size={28} color="#A7F3D0" />
          </View>
        ))}
        <ForecastPucks pucks={pucks} />
      </View>
    );
  }

  if (layer === 'temp') {
    const hot = temp >= 29;
    return (
      <View pointerEvents="none" style={styles.softwareLayer}>
        <View style={[styles.layerField, fieldStyle]} />
        <View style={[styles.tempHalo, hot ? styles.tempHaloHot : styles.tempHaloMild]} />
        <View style={[styles.tempHaloSmall, hot ? styles.tempHaloHot : styles.tempHaloMild]} />
        <ForecastPucks pucks={pucks} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.softwareLayer}>
      <View style={[styles.layerField, fieldStyle]} />
      <View style={[styles.rainBand, styles.rainBandOne, { opacity: 0.18 + rain / 180 }]} />
      <View style={[styles.rainBand, styles.rainBandTwo, { opacity: 0.12 + rain / 220 }]} />
      <View style={[styles.rainBand, styles.rainBandThree, { opacity: 0.1 + rain / 260 }]} />
      <ForecastPucks pucks={pucks} />
    </View>
  );
};

const getLayerFieldStyle = (layer, { rain, temp, wind }) => {
  if (layer === 'rain') {
    return {
      backgroundColor: rain > 45 ? 'rgba(14, 165, 233, 0.2)' : 'rgba(56, 189, 248, 0.12)',
      borderColor: 'rgba(125, 211, 252, 0.24)',
    };
  }

  if (layer === 'wind') {
    return {
      backgroundColor: wind > 25 ? 'rgba(16, 185, 129, 0.16)' : 'rgba(167, 243, 208, 0.1)',
      borderColor: 'rgba(167, 243, 208, 0.22)',
    };
  }

  if (layer === 'temp') {
    return {
      backgroundColor: temp >= 29 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.1)',
      borderColor: temp >= 29 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(125, 211, 252, 0.22)',
    };
  }

  return {};
};

const getLayerPucks = (layer, frame, alertCount) => {
  const time = formatForecastTime(frame?.time);

  if (layer === 'rain') {
    const chance = Math.round(Number(frame?.rainChance ?? 0));
    const mm = Number(frame?.precipitation ?? 0).toFixed(1);
    const humidity = Math.round(Number(frame?.humidity ?? 0));
    return [
      { id: 'main', label: 'Rain', value: `${chance}%`, meta: time, color: '#38BDF8', x: '11%', y: '26%' },
      { id: 'amount', label: 'Amount', value: `${mm} mm`, meta: getConditionText(frame?.weatherCode), color: '#7DD3FC', x: '56%', y: '35%' },
      { id: 'humid', label: 'Humidity', value: `${humidity}%`, meta: 'Moisture', color: '#BAE6FD', x: '24%', y: '62%' },
    ];
  }

  if (layer === 'wind') {
    const speed = Math.round(Number(frame?.windSpeed ?? 0));
    const gust = Math.round(Number(frame?.windGust ?? frame?.windSpeed ?? 0));
    const direction = Math.round(Number(frame?.windDirection ?? 0));
    return [
      { id: 'speed', label: 'Wind', value: `${speed}`, unit: 'km/h', meta: time, color: '#A7F3D0', x: '12%', y: '28%' },
      { id: 'gust', label: 'Gust', value: `${gust}`, unit: 'km/h', meta: 'Peak', color: '#6EE7B7', x: '58%', y: '38%' },
      { id: 'dir', label: 'Bearing', value: `${direction}°`, meta: 'Direction', color: '#CCFBF1', x: '30%', y: '66%' },
    ];
  }

  if (layer === 'temp') {
    const temperature = Math.round(Number(frame?.temperature ?? 0));
    const humidity = Math.round(Number(frame?.humidity ?? 0));
    return [
      { id: 'temp', label: 'Temp', value: `${temperature}°`, meta: time, color: temperature >= 29 ? '#FBBF24' : '#7DD3FC', x: '13%', y: '29%' },
      { id: 'sky', label: 'Sky', value: getConditionText(frame?.weatherCode), meta: 'Open-Meteo', color: '#FDE68A', x: '50%', y: '43%' },
      { id: 'humid', label: 'Humidity', value: `${humidity}%`, meta: 'Comfort', color: '#BAE6FD', x: '27%', y: '67%' },
    ];
  }

  return [
    { id: 'alerts', label: 'Mapped alerts', value: String(alertCount), meta: 'ReliefWeb', color: THEME.colors.error, x: '15%', y: '35%' },
  ];
};

const ForecastPucks = ({ pucks }) => (
  <>
    {pucks.map((puck) => (
      <View
        key={puck.id}
        style={[
          styles.forecastPuck,
          {
            borderColor: `${puck.color}66`,
            left: puck.x,
            top: puck.y,
          },
        ]}
      >
        <Text style={[styles.forecastPuckLabel, { color: puck.color }]}>{puck.label}</Text>
        <View style={styles.forecastPuckValueRow}>
          <Text style={styles.forecastPuckValue} numberOfLines={1}>{puck.value}</Text>
          {puck.unit ? <Text style={styles.forecastPuckUnit}>{puck.unit}</Text> : null}
        </View>
        <Text style={styles.forecastPuckMeta} numberOfLines={1}>{puck.meta}</Text>
      </View>
    ))}
  </>
);

const MapControls = ({
  activeLayer,
  availability,
  isCollapsed,
  layer,
  locationLabel,
  setCollapsed,
  setLayer,
}) => {
  if (isCollapsed) {
    return (
      <TouchableOpacity
        style={styles.panelHandle}
        onPress={() => setCollapsed(false)}
        activeOpacity={0.84}
      >
        {activeLayer.id === 'radar' ? (
          <MaterialCommunityIcons name={activeLayer.icon} size={22} color={activeLayer.color} />
        ) : (
          <Ionicons name={activeLayer.icon} size={22} color={activeLayer.color} />
        )}
        <Ionicons name="chevron-back" size={18} color={THEME.colors.text.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <GlassCard style={styles.sidePanel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleWrap}>
          <Text style={styles.panelTitle}>{activeLayer.label}</Text>
          <Text style={styles.panelSubtitle} numberOfLines={1}>{locationLabel || 'Current location'}</Text>
        </View>
        <TouchableOpacity style={styles.panelIconButton} onPress={() => setCollapsed(true)} activeOpacity={0.82}>
          <Ionicons name="chevron-forward" size={18} color={THEME.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.layerGrid}>
        {LAYERS.map((item) => {
          const isActive = item.id === layer;
          const isAvailable = availability?.[item.id] ?? true;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.layerButton,
                !isAvailable && styles.layerButtonDisabled,
                isActive && { borderColor: item.color, backgroundColor: `${item.color}22` },
              ]}
              onPress={() => {
                if (isAvailable) setLayer(item.id);
              }}
              activeOpacity={0.84}
              disabled={!isAvailable}
            >
              {item.id === 'radar' ? (
                <MaterialCommunityIcons name={item.icon} size={20} color={isActive ? item.color : THEME.colors.text.secondary} />
              ) : (
                <Ionicons name={item.icon} size={20} color={isActive ? item.color : THEME.colors.text.secondary} />
              )}
              <View style={styles.layerCopy}>
                <Text style={[styles.layerText, isActive && { color: item.color }]}>{item.label}</Text>
                <Text style={styles.layerSource}>{isAvailable ? item.source : 'No data'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassCard>
  );
};

const LayerInfoCard = ({
  activeFrame,
  activeLayer,
  alertCount,
  inspectedPoint,
  isInspectingPoint,
  layer,
  layerValue,
  radarStatus,
  sourceStatus,
  weatherData,
}) => {
  const current = weatherData?.current ?? {};
  const point = inspectedPoint?.data;
  const pointCurrent = point?.current ?? {};
  const pointCondition = WEATHER_DESCRIPTIONS[pointCurrent?.weather_code] ?? point?.condition;
  const rows = buildLayerRows({ activeFrame, alertCount, current, layer, radarStatus });

  return (
    <GlassCard style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={[styles.infoIcon, { backgroundColor: `${activeLayer.color}22` }]}>
          {activeLayer.id === 'radar' ? (
            <MaterialCommunityIcons name={activeLayer.icon} size={20} color={activeLayer.color} />
          ) : (
            <Ionicons name={activeLayer.icon} size={20} color={activeLayer.color} />
          )}
        </View>
        <View style={styles.infoTitleWrap}>
          <Text style={styles.infoTitle}>{activeLayer.label}</Text>
          <Text style={styles.infoSource}>{sourceStatus}</Text>
        </View>
        <Text style={styles.infoValue}>{layerValue}</Text>
      </View>

      <View style={styles.infoRows}>
        {rows.map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>{row.label}</Text>
            <Text style={styles.infoRowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.pointPanel}>
        <Ionicons name="pin-outline" size={15} color={THEME.colors.secondary} />
        <View style={styles.pointCopy}>
          <Text style={styles.pointTitle}>
            {isInspectingPoint ? 'Inspecting...' : inspectedPoint ? 'Selected point' : 'Tap map'}
          </Text>
          <Text style={styles.pointMeta} numberOfLines={2}>
            {isInspectingPoint
              ? 'Fetching Open-Meteo forecast'
              : getPointSummary({ inspectedPoint, pointCondition, pointCurrent })}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const buildLayerRows = ({ activeFrame, alertCount, current, layer, radarStatus }) => {
  if (layer === 'rain') {
    return [
      { label: 'Chance', value: `${Math.round(Number(activeFrame?.rainChance ?? 0))}%` },
      { label: 'Amount', value: `${Number(activeFrame?.precipitation ?? current?.precipitation ?? 0).toFixed(1)} mm` },
    ];
  }

  if (layer === 'wind') {
    return [
      { label: 'Speed', value: `${Math.round(Number(activeFrame?.windSpeed ?? 0))} km/h` },
      { label: 'Gust', value: `${Math.round(Number(activeFrame?.windGust ?? activeFrame?.windSpeed ?? 0))} km/h` },
    ];
  }

  if (layer === 'temp') {
    return [
      { label: 'Forecast', value: `${Math.round(Number(activeFrame?.temperature ?? 0))}°` },
      { label: 'Sky', value: getConditionText(activeFrame?.weatherCode).replace(' showers', '') },
    ];
  }

  if (layer === 'alerts') {
    return [
      { label: 'Mapped', value: String(alertCount) },
      { label: 'Feed', value: 'ReliefWeb' },
    ];
  }

  return [
    { label: 'Status', value: radarStatus === 'ready' ? 'Live' : radarStatus },
    { label: 'Frame', value: activeFrame?.label ?? 'Pending' },
  ];
};

const getPointSummary = ({ inspectedPoint, pointCondition, pointCurrent }) => {
  if (!inspectedPoint) return 'Drop a pin for local temp, rain, and wind.';
  if (inspectedPoint.error) return inspectedPoint.error;
  if (!pointCurrent || !Object.keys(pointCurrent).length) return 'No point data yet.';

  return `${Math.round(Number(pointCurrent.temperature_2m ?? 0))}° · ${pointCondition || 'Weather'} · ${Math.round(Number(pointCurrent.wind_speed_10m ?? 0))} km/h`;
};

const TimelineBar = ({
  frameLabel,
  isPlaying,
  layerValue,
  progress,
  setPlaying,
  sourceStatus,
  timelineIndex,
  totalFrames,
}) => (
  <GlassCard style={styles.bottomTimeline}>
    <TouchableOpacity style={styles.playButton} onPress={() => setPlaying(!isPlaying)} activeOpacity={0.84}>
      <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={THEME.colors.text.primary} />
    </TouchableOpacity>
    <View style={styles.timelineTextWrap}>
      <View style={styles.timelineTopRow}>
        <Text style={styles.timelineLabel}>{frameLabel}</Text>
        <Text style={styles.timelineValue}>{layerValue}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(4, Math.min(100, progress * 100))}%` }]} />
      </View>
      <Text style={styles.timelineMeta}>
        {totalFrames ? `${timelineIndex + 1}/${totalFrames}` : 'No frames'} · {sourceStatus}
      </Text>
    </View>
  </GlassCard>
);

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
  softwareLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  alertTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  layerField: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: '17%',
    bottom: '19%',
    borderRadius: 42,
    borderWidth: 1,
    opacity: 0.94,
  },
  forecastPuck: {
    ...THEME.shadows.subtle,
    position: 'absolute',
    width: 118,
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(8, 17, 31, 0.78)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  forecastPuckLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  forecastPuckValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  forecastPuckValue: {
    flexShrink: 1,
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  forecastPuckUnit: {
    color: THEME.colors.text.secondary,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 2,
  },
  forecastPuckMeta: {
    color: THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  rainBand: {
    position: 'absolute',
    width: '74%',
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(56, 189, 248, 0.5)',
    transform: [{ rotate: '-28deg' }],
  },
  rainBandOne: {
    left: '-16%',
    top: '18%',
  },
  rainBandTwo: {
    right: '-18%',
    top: '38%',
  },
  rainBandThree: {
    left: '4%',
    bottom: '16%',
  },
  windArrow: {
    position: 'absolute',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  windStreamA: {
    position: 'absolute',
    left: '-10%',
    top: '33%',
    width: '118%',
    height: 76,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.28)',
    transform: [{ rotate: '-18deg' }],
  },
  windStreamB: {
    position: 'absolute',
    left: '-14%',
    top: '52%',
    width: '124%',
    height: 98,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.18)',
    transform: [{ rotate: '-18deg' }],
  },
  tempHalo: {
    position: 'absolute',
    left: '8%',
    top: '20%',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  tempHaloSmall: {
    position: 'absolute',
    right: '-10%',
    bottom: '12%',
    width: 230,
    height: 230,
    borderRadius: 115,
  },
  tempHaloHot: {
    backgroundColor: 'rgba(245, 158, 11, 0.28)',
  },
  tempHaloMild: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  sidePanel: {
    ...THEME.shadows.card,
    position: 'absolute',
    top: '50%',
    right: THEME.spacing.md,
    width: 188,
    backgroundColor: THEME.colors.mapOverlay,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    padding: 12,
    transform: [{ translateY: -172 }],
  },
  panelHandle: {
    ...THEME.shadows.card,
    position: 'absolute',
    top: '50%',
    right: THEME.spacing.md,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: THEME.colors.mapOverlay,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    transform: [{ translateY: -27 }],
  },
  infoCard: {
    ...THEME.shadows.card,
    position: 'absolute',
    top: 46,
    left: THEME.spacing.md,
    width: 206,
    backgroundColor: THEME.colors.mapOverlay,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    padding: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitleWrap: {
    flex: 1,
  },
  infoTitle: {
    color: THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  infoSource: {
    color: THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  infoValue: {
    color: THEME.colors.secondary,
    fontSize: 15,
    fontWeight: '900',
  },
  infoRows: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  infoRow: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: THEME.borderRadius.md,
    padding: 8,
  },
  infoRowLabel: {
    color: THEME.colors.text.muted,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoRowValue: {
    color: THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  pointPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  pointCopy: {
    flex: 1,
  },
  pointTitle: {
    color: THEME.colors.text.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  pointMeta: {
    color: THEME.colors.text.secondary,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  panelTitleWrap: {
    flex: 1,
  },
  panelTitle: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  panelSubtitle: {
    color: THEME.colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  panelIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerGrid: {
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  layerButton: {
    minHeight: 48,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.sm,
  },
  layerButtonDisabled: {
    opacity: 0.44,
  },
  layerCopy: {
    flex: 1,
  },
  layerText: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '900',
  },
  layerSource: {
    color: THEME.colors.text.muted,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  bottomTimeline: {
    ...THEME.shadows.card,
    position: 'absolute',
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    bottom: 96,
    minHeight: 72,
    backgroundColor: THEME.colors.mapOverlay,
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    padding: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.sm,
  },
  timelineLabel: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  timelineValue: {
    color: THEME.colors.secondary,
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginTop: 7,
  },
  progressFill: {
    height: 5,
    borderRadius: 999,
    backgroundColor: THEME.colors.secondary,
  },
  timelineMeta: {
    color: THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
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
  inspectMarker: {
    ...THEME.shadows.subtle,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.primary,
    borderWidth: 2,
    borderColor: THEME.colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
