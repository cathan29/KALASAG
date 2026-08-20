import React, { useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlertsStore } from '../store/useAlertsStore';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import GlassCard from '../components/GlassCard';
import bulletins from '../data/official_bulletins.json';

const severityStyle = (severity) => {
  if (severity === 'High' || severity === 'Critical') {
    return { color: THEME.colors.error, icon: 'alert' };
  }

  if (severity === 'Medium') {
    return { color: THEME.colors.warning, icon: 'alert-circle' };
  }

  return { color: THEME.colors.secondary, icon: 'information-circle' };
};

const AlertsScreen = () => {
  const {
    alertsData,
    isLoading,
    error,
    fetchAlerts,
  } = useAlertsStore();
  const isOffline = useNetworkStatus();
  const alerts = Array.isArray(alertsData) ? alertsData : [];
  const activeHazards = alerts.filter((alert) => alert.coordinates).length;

  useEffect(() => {
    fetchAlerts();
  }, []);

  const renderAlert = ({ item }) => {
    const tone = severityStyle(item.severity);

    return (
      <GlassCard style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIcon, { backgroundColor: `${tone.color}22` }]}>
            <Ionicons name={tone.icon} size={22} color={tone.color} />
          </View>
          <View style={styles.alertTitleWrap}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={styles.alertTime}>{item.timestamp}</Text>
          </View>
        </View>

        <Text style={styles.alertDescription} numberOfLines={4}>{item.description}</Text>

        <View style={styles.alertFooter}>
          <View style={[styles.badge, { backgroundColor: `${tone.color}22`, borderColor: tone.color }]}>
            <Text style={[styles.badgeText, { color: tone.color }]}>{item.severity}</Text>
          </View>
          <View style={styles.locationBadge}>
            <Ionicons name={item.coordinates ? 'location' : 'location-outline'} size={14} color={THEME.colors.text.secondary} />
            <Text style={styles.locationBadgeText}>{item.coordinates ? 'Mapped' : 'Unmapped'}</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  if (isLoading && !alertsData) {
    return <SkeletonLoader variant="list" />;
  }

  if (!alertsData && !isLoading && isOffline) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline"
          title="Alerts unavailable offline"
          message="Connect once to sync ReliefWeb reports."
        />
      </View>
    );
  }

  if (error && !alertsData) {
    return (
      <View style={styles.center}>
        <EmptyState icon="alert-circle" title="Alert feed unavailable" message={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id || item.title}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.eyebrow}>Live</Text>
                  <Text style={styles.summaryTitle}>Alerts</Text>
                </View>
                <MaterialCommunityIcons name="shield-alert" size={38} color={THEME.colors.warning} />
              </View>
              <View style={styles.summaryMetrics}>
                <SummaryMetric label="Reports" value={alerts.length} />
                <SummaryMetric label="Mapped" value={activeHazards} />
                <SummaryMetric label="Feed" value="RW" />
              </View>
            </GlassCard>

            <GlassCard style={styles.sourceCard}>
              <View style={styles.sourceHeader}>
                <Ionicons name="newspaper" size={20} color={THEME.colors.secondary} />
                <Text style={styles.sourceTitle}>Official Feeds</Text>
              </View>
              {bulletins.map((bulletin) => (
                <View key={bulletin.id} style={styles.sourceRow}>
                  <Text style={styles.sourceName}>{bulletin.source}</Text>
                  <Text style={styles.sourceCopy}>{bulletin.status}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="Walang naitalang sakuna ngayon. Ligtas ang araw!"
            message="Safe day."
            icon="shield-checkmark"
          />
        }
      />
    </View>
  );
};

const SummaryMetric = ({ label, value }) => (
  <View style={styles.summaryMetric}>
    <Text style={styles.summaryMetricValue}>{value}</Text>
    <Text style={styles.summaryMetricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  listContent: {
    padding: THEME.spacing.md,
    paddingBottom: 116,
    gap: THEME.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.xl,
  },
  summaryCard: {
    ...THEME.shadows.card,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: THEME.colors.text.primary,
    fontSize: 30,
    fontWeight: '900',
    marginTop: THEME.spacing.xs,
  },
  summaryMetrics: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.lg,
  },
  summaryMetric: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSoft,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  summaryMetricValue: {
    color: THEME.colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  summaryMetricLabel: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  sourceCard: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: THEME.spacing.sm,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  sourceTitle: {
    color: THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  sourceRow: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  sourceName: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sourceCopy: {
    color: THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 3,
  },
  alertCard: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  alertIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitleWrap: {
    flex: 1,
  },
  alertTitle: {
    color: THEME.colors.text.primary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  alertTime: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: THEME.spacing.xs,
  },
  alertDescription: {
    color: THEME.colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: THEME.spacing.md,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  badge: {
    borderWidth: 1,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 7,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
  },
  locationBadgeText: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
});

export default AlertsScreen;
