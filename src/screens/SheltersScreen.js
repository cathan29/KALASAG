import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton, Searchbar, SegmentedButtons, Surface, useTheme } from 'react-native-paper';
import useSheltersStore from '../store/useSheltersStore';
import useWeatherStore from '../store/useWeatherStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { distanceBetweenKm, formatDistance } from '../utils/geo';
import EmptyState from '../components/EmptyState';

const relativeTime = (value) => {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'Not synced yet';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return 'Saved just now';
  if (minutes < 60) return `Saved ${minutes}m ago`;
  return `Saved ${Math.round(minutes / 60)}h ago`;
};

const SheltersScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userLocation, locationLabel } = useWeatherStore();
  const shelterStore = useSheltersStore();
  const isOffline = useNetworkStatus();
  const [query, setQuery] = useState('');

  const refresh = () => {
    if (!isOffline && userLocation) shelterStore.fetchShelters(userLocation);
  };

  useEffect(() => {
    if (userLocation && !isOffline) shelterStore.fetchShelters(userLocation);
  }, [userLocation?.latitude, userLocation?.longitude]);

  const filteredShelters = useMemo(() => {
    const term = query.trim().toLowerCase();
    const sheltersWithCurrentDistance = shelterStore.shelters.map((shelter) => ({
      ...shelter,
      distanceKm: distanceBetweenKm(userLocation, shelter.coordinates) ?? shelter.distanceKm,
    }));
    if (!term) return sheltersWithCurrentDistance;
    return sheltersWithCurrentDistance.filter((shelter) => (
      [shelter.name, shelter.address, shelter.type, shelter.operator]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    ));
  }, [query, shelterStore.shelters, userLocation]);

  const chooseRadius = (value) => {
    const radius = Number(value);
    shelterStore.setRadiusKm(radius);
    if (!isOffline && userLocation) shelterStore.fetchShelters(userLocation, radius);
  };

  const openDirections = ({ coordinates }) => Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`
  );

  const callShelter = (phone) => Linking.openURL(`tel:${phone.replace(/[^+\d]/g, '')}`);

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={navigation.goBack} accessibilityLabel="Back" />
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Evacuation centers</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{locationLabel || 'Current location'}</Text>
        </View>
        <IconButton icon="refresh" onPress={refresh} disabled={isOffline || shelterStore.isLoading || !userLocation} accessibilityLabel="Refresh shelters" />
      </View>

      <Searchbar placeholder="Search shelters" value={query} onChangeText={setQuery} style={styles.search} inputStyle={styles.searchInput} />
      <SegmentedButtons
        value={String(shelterStore.radiusKm)}
        onValueChange={chooseRadius}
        buttons={[
          { value: '10', label: '10 km' },
          { value: '25', label: '25 km' },
          { value: '50', label: '50 km' },
        ]}
      />

      <View style={styles.cacheRow}>
        <Ionicons name={isOffline ? 'cloud-offline-outline' : 'download-outline'} size={16} color={isOffline ? theme.colors.warning : theme.colors.success} />
        <Text style={styles.cacheText}>{isOffline ? 'Offline copy' : relativeTime(shelterStore.lastUpdated)}</Text>
        <Text style={styles.resultCount}>{filteredShelters.length} found</Text>
      </View>
      {shelterStore.error ? <Text style={styles.warning}>{shelterStore.error}</Text> : null}
    </View>
  );

  const renderShelter = ({ item }) => (
    <Surface elevation={1} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconShell}><Ionicons name="business-outline" size={22} color={theme.colors.secondary} /></View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.distance}>{formatDistance(item.distanceKm)} · {item.type}</Text>
        </View>
      </View>
      <Text style={styles.address}>{item.address}</Text>
      {item.operator ? <Text style={styles.meta}>Managed by {item.operator}</Text> : null}
      {item.capacity ? <Text style={styles.meta}>Capacity: {item.capacity}</Text> : null}
      {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
      <View style={styles.actions}>
        <Button icon="directions" mode="contained" compact onPress={() => openDirections(item)} style={styles.directionButton}>Directions</Button>
        {item.phone ? <Button icon="phone-outline" mode="outlined" compact onPress={() => callShelter(item.phone)}>Call</Button> : null}
        <IconButton icon="information-outline" size={19} onPress={() => Linking.openURL(item.sourceUrl)} accessibilityLabel={`Open source for ${item.name}`} />
      </View>
    </Surface>
  );

  return (
    <FlatList
      style={styles.screen}
      data={filteredShelters}
      keyExtractor={(item) => item.id}
      renderItem={renderShelter}
      ListHeaderComponent={header}
      ListEmptyComponent={!shelterStore.isLoading ? (
        <EmptyState
          variant={userLocation ? 'location' : 'offline'}
          title={query ? 'No matching shelters' : 'No evacuation centers found nearby'}
          message={userLocation ? 'Try a wider radius or refresh the OpenStreetMap list.' : 'Enable location to search nearby centers.'}
        />
      ) : null}
      ListFooterComponent={shelterStore.shelters.length ? (
        <Text style={styles.attribution} onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}>
          Shelter data © OpenStreetMap contributors
        </Text>
      ) : null}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={shelterStore.isLoading} onRefresh={refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      showsVerticalScrollIndicator={false}
    />
  );
};

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  headerContent: { gap: 12, marginBottom: 14 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', marginHorizontal: -8 },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: theme.colors.text.primary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: theme.colors.text.muted, fontSize: 12, marginTop: 1 },
  search: { height: 48, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface },
  searchInput: { minHeight: 0, fontSize: 14 },
  cacheRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cacheText: { color: theme.colors.text.muted, fontSize: 12 },
  resultCount: { marginLeft: 'auto', color: theme.colors.text.secondary, fontSize: 12, fontWeight: '700' },
  warning: { color: theme.colors.warning, fontSize: 12, lineHeight: 18 },
  gap: { height: 10 },
  card: { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconShell: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryContainer },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: theme.colors.text.primary, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  distance: { color: theme.colors.secondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  address: { color: theme.colors.text.secondary, fontSize: 13, lineHeight: 19, marginTop: 12 },
  meta: { color: theme.colors.text.muted, fontSize: 12, marginTop: 5 },
  actions: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  directionButton: { backgroundColor: theme.colors.primary },
  attribution: { color: theme.colors.text.muted, fontSize: 11, textAlign: 'center', paddingVertical: 22 },
});

export default SheltersScreen;
