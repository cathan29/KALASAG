import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Chip, IconButton, Surface, useTheme } from 'react-native-paper';
import { useAlertsStore } from '../store/useAlertsStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import AlertCard from '../components/ui/AlertCard';
import LiveIndicator from '../components/ui/LiveIndicator';

const FILTERS = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'weather', label: 'Weather', icon: 'rainy-outline' },
  { id: 'earthquake', label: 'Quakes', icon: 'pulse-outline' },
  { id: 'tsunami', label: 'Tsunami', icon: 'water-outline' },
  { id: 'volcano', label: 'Volcano', icon: 'triangle-outline' },
  { id: 'wildfire', label: 'Fire', icon: 'flame-outline' },
];

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

const AlertsScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { alertsData, lastUpdated, isLoading, error, fetchAlerts } = useAlertsStore();
  const isOffline = useNetworkStatus();
  const [activeFilter, setActiveFilter] = useState('all');
  const alerts = Array.isArray(alertsData) ? alertsData : [];

  const refreshAlerts = useCallback(async () => {
    if (!isOffline) await fetchAlerts();
  }, [fetchAlerts, isOffline]);

  const filteredAlerts = useMemo(() => (
    activeFilter === 'all' ? alerts : alerts.filter((alert) => alert.category === activeFilter)
  ), [activeFilter, alerts]);
  const urgentCount = alerts.filter((alert) => ['Critical', 'High'].includes(alert.severity)).length;

  const chooseFilter = (id) => {
    Haptics.selectionAsync();
    setActiveFilter(id);
  };

  const severityTone = (severity) => {
    if (severity === 'Critical' || severity === 'High') return { color: theme.colors.error, icon: 'warning' };
    if (severity === 'Medium') return { color: theme.colors.warning, icon: 'alert-circle' };
    return { color: theme.colors.secondary, icon: 'information-circle' };
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
            {!isOffline ? <LiveIndicator /> : <View style={[styles.statusDot, styles.offlineDot]} />}
            <Text style={styles.subtitle}>{isOffline ? 'Saved alerts' : `Live · Updated ${relativeTime(lastUpdated)}`}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="bell-cog-outline" size={21} onPress={() => navigation.navigate('NotificationSettings')} accessibilityLabel="Notification settings" />
          <IconButton icon="refresh" size={22} onPress={refreshAlerts} disabled={isLoading || isOffline} accessibilityLabel="Refresh alerts" />
        </View>
      </View>

      {alerts.length ? (
        <View style={styles.mascotSummary}>
          <View style={styles.mascotSummaryMedia} pointerEvents="none">
            <Image
              source={require('../../assets/mascot/kalasag-alert.png')}
              resizeMode="cover"
              style={styles.mascotSummaryImage}
              accessibilityIgnoresInvertColors
            />
          </View>
          <View style={styles.mascotSummaryShade} />
          <View style={styles.mascotSummaryCopy}>
            <Text style={styles.mascotEyebrow}>MONITORING</Text>
            <Text style={styles.mascotSummaryTitle}>{alerts.length} active {alerts.length === 1 ? 'report' : 'reports'}</Text>
            <Text style={styles.mascotSummaryMeta}>{urgentCount ? `${urgentCount} need immediate attention` : 'No high-priority advisory'}</Text>
          </View>
        </View>
      ) : null}
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
        extraData={activeFilter}
        keyExtractor={(item, index) => `${activeFilter}-${item.id || item.title || index}`}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50)}>
            <AlertCard
              item={item}
              navigation={navigation}
              formattedTime={relativeTime(item.publishedAt ?? item.timestamp)}
              onShare={(alert) => console.log('Share alert:', alert.id)}
              onMarkAsRead={(alert) => console.log('Mark as read:', alert.id)}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.itemGap} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAlerts} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
        ListHeaderComponent={header}
        ListEmptyComponent={(
          <EmptyState
            animationSource={activeFilter !== 'all'
              ? require('../../assets/animations/no-advisories.json')
              : undefined}
            title={activeFilter === 'all'
              ? 'Walang naitalang sakuna ngayon. Ligtas ang araw!'
              : 'No advisories in this category.'}
          />
        )}
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
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  screenTitle: { color: theme.colors.text.primary, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.success },
  offlineDot: { backgroundColor: theme.colors.text.disabled },
  subtitle: { color: theme.colors.text.muted, fontSize: 12 },
  mascotSummary: { minHeight: 126, borderRadius: theme.borderRadius.lg, overflow: 'hidden', backgroundColor: '#1E293B', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderStrong, justifyContent: 'center' },
  mascotSummaryMedia: { ...StyleSheet.absoluteFillObject },
  mascotSummaryImage: { width: '100%', height: '100%' },
  mascotSummaryShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,18,35,0.34)' },
  mascotSummaryCopy: { width: '52%', padding: theme.spacing.md },
  mascotEyebrow: { color: theme.colors.secondary, fontSize: 10, fontWeight: '800' },
  mascotSummaryTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '700', marginTop: 3 },
  mascotSummaryMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 11, lineHeight: 16, marginTop: 5 },
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
});

export default AlertsScreen;
