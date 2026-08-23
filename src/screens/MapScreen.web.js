import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import useWeatherStore from '../store/useWeatherStore';
import GlassCard from '../components/GlassCard';

const MapScreen = ({ route }) => {
  const { locationLabel, weatherData } = useWeatherStore();
  const focusedAlertTitle = route?.params?.alertTitle;
  const temperature = Number.isFinite(Number(weatherData?.current?.temperature_2m))
    ? `${Math.round(Number(weatherData.current.temperature_2m))}°`
    : 'N/A';

  return (
    <View style={styles.container}>
      <View style={styles.radarFallback}>
        <View style={styles.radarRingOuter}>
          <View style={styles.radarRingMiddle}>
            <View style={styles.radarRingInner}>
              <MaterialCommunityIcons name="radar" size={44} color={THEME.colors.secondary} />
            </View>
          </View>
        </View>
      </View>

      <GlassCard style={styles.topHud}>
        <View style={styles.hudTitleRow}>
          <MaterialCommunityIcons name="radar" size={24} color={THEME.colors.secondary} />
          <View style={styles.hudTitleText}>
            <Text style={styles.hudTitle}>Radar</Text>
            <Text style={styles.hudSubtitle} numberOfLines={1}>{focusedAlertTitle || locationLabel || 'Browser preview'}</Text>
          </View>
        </View>

        <View style={styles.hudMetrics}>
          <View style={styles.hudMetric}>
            <Ionicons name="thermometer-outline" size={16} color={THEME.colors.warning} />
            <Text style={styles.hudMetricText}>{temperature}</Text>
          </View>
          <View style={styles.hudMetric}>
            <Ionicons name="phone-portrait-outline" size={16} color={THEME.colors.secondary} />
            <Text style={styles.hudMetricText}>Mobile radar</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.frameStrip}>
          {['Now', '-10m', '-20m', '-30m'].map((label, index) => (
            <View key={label} style={[styles.frameChip, index === 0 && styles.frameChipActive]}>
              <Text style={[styles.frameChipText, index === 0 && styles.frameChipTextActive]}>{label}</Text>
            </View>
          ))}
        </ScrollView>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  radarFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  radarRingMiddle: {
    width: 174,
    height: 174,
    borderRadius: 87,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.glass,
  },
  topHud: {
    ...THEME.shadows.card,
    position: 'absolute',
    top: THEME.spacing.md,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    backgroundColor: THEME.colors.mapOverlay,
    borderRadius: THEME.borderRadius.xl,
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
});

export default MapScreen;
