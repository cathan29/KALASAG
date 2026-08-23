import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlertsStore } from '../store/useAlertsStore';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const FILTERS = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'weather', label: 'Weather', icon: 'rainy' },
  { id: 'earthquake', label: 'Quakes', icon: 'pulse' },
  { id: 'tsunami', label: 'Tsunami', icon: 'water' },
  { id: 'volcano', label: 'Volcano', icon: 'triangle' },
  { id: 'wildfire', label: 'Fire', icon: 'flame' },
];

const CATEGORY_META = {
  weather: { label: 'Weather', icon: 'rainy' },
  earthquake: { label: 'Earthquake', icon: 'pulse' },
  tsunami: { label: 'Tsunami', icon: 'water' },
  volcano: { label: 'Volcano', icon: 'triangle' },
  wildfire: { label: 'Wildfire', icon: 'flame' },
};

const severityStyle = (severity) => {
  if (severity === 'Critical') {
    return { color: '#FF6B78', background: 'rgba(239,68,68,0.15)', icon: 'alert' };
  }

  if (severity === 'High') {
    return { color: THEME.colors.error, background: 'rgba(239,68,68,0.12)', icon: 'warning' };
  }

  if (severity === 'Medium') {
    return { color: THEME.colors.warning, background: 'rgba(245,158,11,0.13)', icon: 'alert-circle' };
  }

  return { color: THEME.colors.secondary, background: 'rgba(125,211,252,0.12)', icon: 'information-circle' };
};

const validDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const relativeTime = (value) => {
  const date = validDate(value);
  if (!date) return 'Time unavailable';

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return elapsedMinutes + 'm ago';

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return elapsedHours + 'h ago';

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return elapsedDays + 'd ago';
  return date.toLocaleDateString();
};

const AlertsScreen = () => {
  const {
    alertsData,
    lastUpdated,
    isLoading,
    error,
    fetchAlerts,
  } = useAlertsStore();
  const isOffline = useNetworkStatus();
  const [activeFilter, setActiveFilter] = useState('all');
  const alerts = Array.isArray(alertsData) ? alertsData : [];

  const refreshAlerts = useCallback(() => {
    if (!isOffline) fetchAlerts();
  }, [fetchAlerts, isOffline]);

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAlerts();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshAlerts]);

  const filteredAlerts = useMemo(
    () => (
      activeFilter === 'all'
        ? alerts
        : alerts.filter((alert) => alert.category === activeFilter)
    ),
    [activeFilter, alerts]
  );
  const urgentCount = alerts.filter(
    (alert) => alert.severity === 'Critical' || alert.severity === 'High'
  ).length;
  const sourceCount = new Set(alerts.map((alert) => alert.source).filter(Boolean)).size;

  const openSource = async (url) => {
    if (!url) return;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
  };

  const renderFilter = (filter) => {
    const isActive = filter.id === activeFilter;

    return (
      <TouchableOpacity
        key={filter.id}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(filter.id)}
        activeOpacity={0.76}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Ionicons
          name={filter.icon}
          size={17}
          color={isActive ? THEME.colors.text.primary : THEME.colors.text.muted}
        />
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAlert = ({ item }) => {
    const tone = severityStyle(item.severity);
    const category = CATEGORY_META[item.category] ?? {
      label: 'Advisory',
      icon: 'notifications',
    };
    const publishedAt = item.publishedAt ?? item.timestamp;

    return (
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => openSource(item.sourceUrl ?? item.url)}
        disabled={!item.sourceUrl && !item.url}
        activeOpacity={0.82}
        accessibilityRole={item.sourceUrl || item.url ? 'link' : undefined}
        accessibilityLabel={'Open ' + item.title}
      >
        <View style={[styles.severityBar, { backgroundColor: tone.color }]} />
        <View style={styles.alertBody}>
          <View style={styles.alertMetaRow}>
            <View style={styles.sourceBadge}>
              <Ionicons name={category.icon} size={14} color={THEME.colors.secondary} />
              <Text style={styles.sourceBadgeText}>{item.source || category.label}</Text>
            </View>
            <Text style={styles.alertTime}>{relativeTime(publishedAt)}</Text>
          </View>

          <View style={styles.alertTitleRow}>
            <View style={[styles.alertIcon, { backgroundColor: tone.background }]}>
              <Ionicons name={tone.icon} size={22} color={tone.color} />
            </View>
            <Text style={styles.alertTitle}>{item.title}</Text>
          </View>

          <Text style={styles.alertDescription} numberOfLines={4}>
            {item.description}
          </Text>

          <View style={styles.alertFooter}>
            <View style={[styles.severityBadge, { backgroundColor: tone.background }]}>
              <Text style={[styles.severityText, { color: tone.color }]}>{item.severity}</Text>
            </View>
            <View style={styles.footerAction}>
              {item.coordinates ? (
                <Ionicons name="location" size={15} color={THEME.colors.text.muted} />
              ) : null}
              <Text style={styles.footerActionText}>
                {item.sourceUrl || item.url ? 'View source' : category.label}
              </Text>
              {item.sourceUrl || item.url ? (
                <Ionicons name="chevron-forward" size={16} color={THEME.colors.text.muted} />
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && alertsData === null) {
    return <SkeletonLoader variant="list" />;
  }

  if (alertsData === null && !isLoading && isOffline) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline"
          title="Alerts unavailable offline"
          message="Connect once to save the latest alerts on this device."
        />
      </View>
    );
  }

  if (alertsData === null && error) {
    return (
      <View style={styles.center}>
        <EmptyState icon="alert-circle" title="Alert feed unavailable" message={error} />
        <TouchableOpacity style={styles.retryButton} onPress={refreshAlerts}>
          <Ionicons name="refresh" size={19} color={THEME.colors.text.primary} />
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id || item.title}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshAlerts}
            tintColor={THEME.colors.secondary}
            colors={[THEME.colors.primary]}
            progressBackgroundColor={THEME.colors.surfaceElevated}
          />
        )}
        ListHeaderComponent={(
          <View style={styles.headerContent}>
            <View style={styles.appHeader}>
              <View>
                <Text style={styles.screenTitle}>Alerts</Text>
                <View style={styles.liveRow}>
                  <View style={[styles.liveDot, isOffline && styles.offlineDot]} />
                  <Text style={styles.screenSubtitle}>
                    {isOffline ? 'Offline cache' : 'Live'} | Updated {relativeTime(lastUpdated)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
                onPress={refreshAlerts}
                disabled={isLoading || isOffline}
                accessibilityRole="button"
                accessibilityLabel="Refresh alerts"
              >
                <Ionicons name="refresh" size={21} color={THEME.colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.overviewLead}>
                <View style={styles.overviewIcon}>
                  <MaterialCommunityIcons
                    name={urgentCount > 0 ? 'shield-alert' : 'shield-check'}
                    size={30}
                    color={urgentCount > 0 ? THEME.colors.error : THEME.colors.success}
                  />
                </View>
                <View style={styles.overviewCopy}>
                  <Text style={styles.overviewTitle}>
                    {urgentCount > 0 ? urgentCount + ' urgent alert' + (urgentCount > 1 ? 's' : '') : 'No urgent alerts'}
                  </Text>
                  <Text style={styles.overviewSubtitle}>
                    {alerts.length + ' recent reports from ' + sourceCount + ' live source' + (sourceCount === 1 ? '' : 's')}
                  </Text>
                </View>
              </View>
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{alerts.length}</Text>
                  <Text style={styles.metricLabel}>Reports</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{urgentCount}</Text>
                  <Text style={styles.metricLabel}>Urgent</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{sourceCount}</Text>
                  <Text style={styles.metricLabel}>Sources</Text>
                </View>
              </View>
            </View>

            {error && alerts.length > 0 ? (
              <View style={styles.syncWarning}>
                <Ionicons name="cloud-offline-outline" size={18} color={THEME.colors.warning} />
                <Text style={styles.syncWarningText}>Showing saved alerts. Refresh will retry automatically.</Text>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {FILTERS.map(renderFilter)}
            </ScrollView>

            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>Latest advisories</Text>
              <Text style={styles.listCount}>{filteredAlerts.length}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <EmptyState
            title={activeFilter === 'all'
              ? 'Walang naitalang sakuna ngayon. Ligtas ang araw!'
              : 'No recent ' + (FILTERS.find((filter) => filter.id === activeFilter)?.label ?? 'filtered') + ' alerts.'}
            icon="shield-checkmark"
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 12,
  },
  headerContent: {
    gap: 14,
    marginBottom: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    padding: 24,
  },
  appHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    color: THEME.colors.text.primary,
    fontSize: 27,
    fontWeight: '900',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.success,
  },
  offlineDot: {
    backgroundColor: THEME.colors.text.disabled,
  },
  screenSubtitle: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  refreshButtonDisabled: {
    opacity: 0.48,
  },
  overviewCard: {
    backgroundColor: '#17243A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    ...THEME.shadows.card,
  },
  overviewLead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceSoft,
  },
  overviewCopy: {
    flex: 1,
    paddingLeft: 13,
  },
  overviewTitle: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  overviewSubtitle: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3,
  },
  metricRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 12,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    color: THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: THEME.colors.border,
  },
  syncWarning: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 12,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
  },
  syncWarningText: {
    flex: 1,
    color: THEME.colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  filterContent: {
    gap: 8,
    paddingRight: 4,
  },
  filterChip: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterText: {
    color: THEME.colors.text.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: THEME.colors.text.primary,
  },
  listHeading: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  listTitle: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  listCount: {
    minWidth: 28,
    color: THEME.colors.text.secondary,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: THEME.colors.surfaceSoft,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  alertCard: {
    minHeight: 190,
    flexDirection: 'row',
    backgroundColor: '#17243A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
    ...THEME.shadows.subtle,
  },
  severityBar: {
    width: 4,
  },
  alertBody: {
    flex: 1,
    padding: 15,
  },
  alertMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sourceBadge: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceBadgeText: {
    flexShrink: 1,
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  alertTime: {
    color: THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 13,
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    flex: 1,
    color: THEME.colors.text.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  alertDescription: {
    color: THEME.colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  severityBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerActionText: {
    color: THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  retryButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
  },
  retryText: {
    color: THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '900',
  },
});

export default AlertsScreen;
