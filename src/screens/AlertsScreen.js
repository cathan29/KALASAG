import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, FlatList, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Chip, IconButton, Surface, useTheme } from 'react-native-paper';
import { useAlertsStore } from '../store/useAlertsStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const FILTERS = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'weather', label: 'Weather', icon: 'rainy-outline' },
  { id: 'earthquake', label: 'Quakes', icon: 'pulse-outline' },
  { id: 'tsunami', label: 'Tsunami', icon: 'water-outline' },
  { id: 'volcano', label: 'Volcano', icon: 'triangle-outline' },
  { id: 'wildfire', label: 'Fire', icon: 'flame-outline' },
];
const CATEGORY_ICONS = { weather: 'rainy-outline', earthquake: 'pulse-outline', tsunami: 'water-outline', volcano: 'triangle-outline', wildfire: 'flame-outline' };

const validDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const relativeTime = (value) => {
  const date = validDate(value);
  if (!date) return 'Time unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : date.toLocaleDateString();
};

const AlertsScreen = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { alertsData, lastUpdated, isLoading, error, fetchAlerts } = useAlertsStore();
  const isOffline = useNetworkStatus();
  const [activeFilter, setActiveFilter] = useState('all');
  const alerts = Array.isArray(alertsData) ? alertsData : [];

  const refreshAlerts = useCallback(async () => {
    if (!isOffline) await fetchAlerts();
  }, [fetchAlerts, isOffline]);

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && refreshAlerts());
    return () => { clearInterval(interval); subscription.remove(); };
  }, [refreshAlerts]);

  const filteredAlerts = useMemo(() => (
    activeFilter === 'all' ? alerts : alerts.filter((alert) => alert.category === activeFilter)
  ), [activeFilter, alerts]);
  const urgentCount = alerts.filter((alert) => ['Critical', 'High'].includes(alert.severity)).length;

  const chooseFilter = (id) => {
    Haptics.selectionAsync();
    setActiveFilter(id);
  };

  const openSource = async (url) => {
    if (!url || !(await Linking.canOpenURL(url))) return;
    Haptics.selectionAsync();
    await Linking.openURL(url);
  };

  const severityTone = (severity) => {
    if (severity === 'Critical' || severity === 'High') return { color: theme.colors.error, icon: 'warning' };
    if (severity === 'Medium') return { color: theme.colors.warning, icon: 'alert-circle' };
    return { color: theme.colors.secondary, icon: 'information-circle' };
  };

  const renderAlert = ({ item }) => {
    const tone = severityTone(item.severity);
    const url = item.sourceUrl ?? item.url;
    return (
      <Surface elevation={1} style={styles.alertCard}>
        <View style={[styles.severityBar, { backgroundColor: tone.color }]} />
        <View style={styles.alertBody}>
          <View style={styles.metaRow}>
            <View style={styles.sourceRow}>
              <Ionicons name={CATEGORY_ICONS[item.category] ?? 'notifications-outline'} size={15} color={theme.colors.secondary} />
              <Text style={styles.source} numberOfLines={1}>{item.source || 'Advisory'}</Text>
            </View>
            <Text style={styles.time}>{relativeTime(item.publishedAt ?? item.timestamp)}</Text>
          </View>
          <View style={styles.titleRow}>
            <Ionicons name={tone.icon} size={21} color={tone.color} />
            <Text style={styles.alertTitle}>{item.title || 'Untitled advisory'}</Text>
          </View>
          {item.description ? <Text style={styles.description} numberOfLines={4}>{item.description}</Text> : null}
          <View style={styles.footer}>
            <Text style={[styles.severity, { color: tone.color }]}>{item.severity || 'Advisory'}</Text>
            {url ? (
              <Chip compact icon="open-in-new" onPress={() => openSource(url)} style={styles.sourceButton} textStyle={styles.sourceButtonText}>Source</Chip>
            ) : null}
          </View>
        </View>
      </Surface>
    );
  };

  if (isLoading && alertsData === null) return <SkeletonLoader variant="list" />;
  if (alertsData === null && !isLoading && isOffline) {
    return <View style={styles.center}><EmptyState variant="offline" title="Alerts unavailable offline" message="Connect once to save the latest advisories." /></View>;
  }
  if (alertsData === null && error) {
    return <View style={styles.center}><EmptyState variant="error" title="Alert feed unavailable" message={error} /><Chip icon="refresh" onPress={refreshAlerts}>Try again</Chip></View>;
  }

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.screenTitle}>Alerts</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isOffline && styles.offlineDot]} />
            <Text style={styles.subtitle}>{isOffline ? 'Saved alerts' : `Live · Updated ${relativeTime(lastUpdated)}`}</Text>
          </View>
        </View>
        <IconButton icon="refresh" size={22} onPress={refreshAlerts} disabled={isLoading || isOffline} accessibilityLabel="Refresh alerts" />
      </View>

      <Text style={styles.summary}>{alerts.length} active {alerts.length === 1 ? 'report' : 'reports'}{urgentCount ? ` · ${urgentCount} urgent` : ''}</Text>
      {error && alerts.length > 0 ? <Text style={styles.warning}>Saved alerts shown. Refresh will retry automatically.</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((filter) => {
          const selected = filter.id === activeFilter;
          return (
            <Chip
              key={filter.id}
              selected={selected}
              icon={() => <Ionicons name={filter.icon} size={16} color={selected ? theme.colors.onPrimary : theme.colors.text.muted} />}
              onPress={() => chooseFilter(filter.id)}
              style={[styles.filter, selected && styles.filterSelected]}
              textStyle={[styles.filterText, selected && styles.filterTextSelected]}
              showSelectedCheck={false}
            >{filter.label}</Chip>
          );
        })}
      </ScrollView>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Latest advisories</Text><Text style={styles.count}>{filteredAlerts.length}</Text></View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item, index) => String(item.id || item.title || index)}
        renderItem={renderAlert}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.itemGap} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAlerts} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState title={activeFilter === 'all' ? 'Walang naitalang sakuna ngayon. Ligtas ang araw!' : 'No advisories in this category.'} />}
      />
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  list: { paddingHorizontal: theme.spacing.md, paddingTop: 14, paddingBottom: theme.spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  headerContent: { gap: 14, marginBottom: 12 },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { flex: 1 },
  screenTitle: { color: theme.colors.text.primary, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.success },
  offlineDot: { backgroundColor: theme.colors.text.disabled },
  subtitle: { color: theme.colors.text.muted, fontSize: 12 },
  summary: { color: theme.colors.text.secondary, fontSize: 15, fontWeight: '600' },
  warning: { color: theme.colors.warning, fontSize: 12, lineHeight: 18 },
  filters: { gap: 7, paddingRight: theme.spacing.md },
  filter: { backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  filterSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { color: theme.colors.text.secondary, fontSize: 12 },
  filterTextSelected: { color: theme.colors.onPrimary },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: 19, fontWeight: '700' },
  count: { color: theme.colors.text.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
  itemGap: { height: 10 },
  alertCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  severityBar: { width: 4 },
  alertBody: { flex: 1, padding: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sourceRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  source: { flex: 1, color: theme.colors.secondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  time: { color: theme.colors.text.muted, fontSize: 11 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 12 },
  alertTitle: { flex: 1, color: theme.colors.text.primary, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  description: { color: theme.colors.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  footer: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  severity: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  sourceButton: { backgroundColor: theme.colors.surfaceSoft },
  sourceButtonText: { fontSize: 11 },
});

export default AlertsScreen;
