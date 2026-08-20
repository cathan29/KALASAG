import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import hotlines from '../data/hotlines.json';
import survivalGuides from '../data/survival_guides.json';
import { THEME } from '../constants/theme';
import GlassCard from '../components/GlassCard';

const formatLabel = (label) => label.replace(/_/g, ' ').toUpperCase();

const normalizeCityName = (value = '') => value
  .toLowerCase()
  .replace(/\bcity\b/g, '')
  .replace(/[^a-z0-9]/g, '')
  .trim();

const findMunicipality = (query) => {
  const normalizedQuery = normalizeCityName(query);

  if (!normalizedQuery) {
    return null;
  }

  return Object.entries(hotlines.municipalities ?? {}).find(([city]) => (
    normalizeCityName(city) === normalizedQuery
    || normalizeCityName(city).includes(normalizedQuery)
    || normalizedQuery.includes(normalizeCityName(city))
  )) ?? null;
};

const EmergencyScreen = () => {
  const [detectedCity, setDetectedCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(true);
  const [locationMessage, setLocationMessage] = useState('Detecting...');

  useEffect(() => {
    const detectLocality = async () => {
      setIsDetecting(true);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          setLocationMessage('GPS off');
          setIsDetecting(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const place = places?.[0];
        const city = place?.city || place?.subregion || place?.district || place?.region || '';

        setDetectedCity(city);
        setLocationMessage(city || 'Search area');
      } catch {
        setLocationMessage('Search area');
      } finally {
        setIsDetecting(false);
      }
    };

    detectLocality();
  }, []);

  const searchedMunicipality = useMemo(() => findMunicipality(searchQuery), [searchQuery]);
  const detectedMunicipality = useMemo(() => findMunicipality(detectedCity), [detectedCity]);
  const activeMunicipality = searchedMunicipality ?? detectedMunicipality;
  const activeCityName = activeMunicipality?.[0] ?? '';
  const activeCityData = activeMunicipality?.[1] ?? null;

  const makeCall = async (number) => {
    const url = `tel:${number}`;
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      Linking.openURL(url);
    }
  };

  const renderHotline = (label, number, tone = THEME.colors.secondary) => (
    <GlassCard key={`${label}-${number}`} style={styles.hotlineRow}>
      <View style={[styles.hotlineIcon, { backgroundColor: `${tone}22` }]}>
        <Ionicons name="call" size={21} color={tone} />
      </View>
      <View style={styles.hotlineContent}>
        <Text style={styles.hotlineLabel}>{formatLabel(label)}</Text>
        <Text style={styles.hotlineNumber}>{number}</Text>
      </View>
      <TouchableOpacity
        style={[styles.callAction, { backgroundColor: tone }]}
        onPress={() => makeCall(number)}
        activeOpacity={0.82}
      >
        <Text style={styles.callActionText}>Dial</Text>
        <Ionicons name="call" size={16} color={THEME.colors.text.primary} />
      </TouchableOpacity>
    </GlassCard>
  );

  const renderGuideStep = (step, index) => (
    <View key={`${step}-${index}`} style={styles.stepRow}>
      <Text style={styles.stepNumber}>{index + 1}</Text>
      <Text style={styles.stepText}>{step}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={THEME.gradients.calm}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>SOS</Text>
          <Text style={styles.heroTitle}>Emergency</Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark" size={42} color={THEME.colors.secondary} />
        </View>
      </LinearGradient>

      <GlassCard style={styles.searchCard}>
        <View style={styles.detectedRow}>
          <View style={styles.detectedIcon}>
            <Ionicons name={isDetecting ? 'navigate' : 'location'} size={18} color={THEME.colors.secondary} />
          </View>
          <View style={styles.detectedCopy}>
            <Text style={styles.detectedLabel}>Area</Text>
            <Text style={styles.detectedValue}>{locationMessage}</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color={THEME.colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="City or municipality"
            placeholderTextColor={THEME.colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={THEME.colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {searchQuery && !searchedMunicipality ? (
          <Text style={styles.searchMiss}>No match for "{searchQuery}".</Text>
        ) : null}
      </GlassCard>

      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="shield-home" size={22} color={THEME.colors.secondary} />
        <Text style={styles.sectionTitle}>Local</Text>
      </View>

      <LinearGradient
        colors={THEME.gradients.emergency}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.directoryCard, styles.localCard]}
      >
        {activeCityData ? (
          <>
            <View style={styles.localHeader}>
              <View>
                <Text style={styles.localCity}>{activeCityName}</Text>
                <Text style={styles.localProvince}>{activeCityData.province}</Text>
              </View>
              <View style={styles.localBadge}>
                <Ionicons name="checkmark-circle" size={15} color={THEME.colors.success} />
                <Text style={styles.localBadgeText}>Matched</Text>
              </View>
            </View>
            <View style={styles.localHotlineList}>
              {Object.entries(activeCityData.hotlines).map(([label, number]) => renderHotline(label, number, THEME.colors.error))}
            </View>
          </>
        ) : (
          <View style={styles.noLocalState}>
            <MaterialCommunityIcons name="map-search" size={34} color={THEME.colors.warning} />
            <Text style={styles.noLocalTitle}>Search municipality</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Ionicons name="call" size={22} color={THEME.colors.secondary} />
        <Text style={styles.sectionTitle}>National</Text>
      </View>

      <GlassCard style={styles.directoryCard}>
        {Object.entries(hotlines.default?.hotlines ?? hotlines.national).map(([label, number]) => (
          renderHotline(label, number, THEME.colors.primary)
        ))}
      </GlassCard>

      <View style={styles.sectionHeader}>
        <MaterialIcons name="travel-explore" size={23} color={THEME.colors.secondary} />
        <Text style={styles.sectionTitle}>Regional</Text>
      </View>

      {Object.entries(hotlines.regions).map(([region, lines]) => (
        <GlassCard key={region} style={styles.regionCard}>
          <Text style={styles.regionName}>{region}</Text>
          {Object.entries(lines).map(([label, number]) => renderHotline(label, number))}
        </GlassCard>
      ))}

      <View style={styles.sectionHeader}>
        <MaterialIcons name="menu-book" size={23} color={THEME.colors.secondary} />
        <Text style={styles.sectionTitle}>Guides</Text>
      </View>

      {survivalGuides.first_aid.map((guide) => (
        <GlassCard key={guide.condition} style={styles.guideCard}>
          <View style={styles.guideTitleRow}>
            <View style={styles.guideIcon}>
              <MaterialCommunityIcons name="medical-bag" size={21} color={THEME.colors.warning} />
            </View>
            <Text style={styles.guideTitle}>{guide.condition}</Text>
          </View>
          {guide.steps.map(renderGuideStep)}
        </GlassCard>
      ))}

      <GlassCard style={styles.guideCard}>
        <View style={styles.guideTitleRow}>
          <View style={styles.guideIcon}>
            <MaterialIcons name="directions-run" size={22} color={THEME.colors.warning} />
          </View>
          <Text style={styles.guideTitle}>Evacuation Protocol</Text>
        </View>
        {survivalGuides.evacuation.protocols.map(renderGuideStep)}

        <Text style={styles.guideSubTitle}>Go-Bag Essentials</Text>
        {survivalGuides.evacuation.go_bag_essentials.map(renderGuideStep)}
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: THEME.spacing.xxl,
    gap: THEME.spacing.md,
  },
  heroCard: {
    ...THEME.shadows.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  heroText: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  eyebrow: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: THEME.colors.text.primary,
    fontSize: 34,
    fontWeight: '900',
    marginTop: THEME.spacing.xs,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(3, 218, 198, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCard: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: THEME.spacing.md,
  },
  detectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  detectedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(3, 218, 198, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedCopy: {
    flex: 1,
  },
  detectedLabel: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detectedValue: {
    color: THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  searchBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 12,
  },
  searchMiss: {
    color: THEME.colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  sectionTitle: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  directoryCard: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 10,
  },
  localCard: {
    borderColor: 'rgba(255, 90, 106, 0.42)',
    padding: 16,
  },
  localHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
  },
  localCity: {
    color: THEME.colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  localProvince: {
    color: THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: 'rgba(69, 212, 131, 0.14)',
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 7,
  },
  localBadgeText: {
    color: THEME.colors.success,
    fontSize: 12,
    fontWeight: '900',
  },
  localHotlineList: {
    gap: 10,
  },
  noLocalState: {
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  noLocalTitle: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: THEME.spacing.sm,
  },
  regionCard: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 10,
  },
  regionName: {
    color: THEME.colors.text.primary,
    fontSize: 17,
    fontWeight: '900',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.sm,
  },
  hotlineRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 0,
    gap: 12,
  },
  hotlineIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineContent: {
    flex: 1,
    paddingRight: THEME.spacing.sm,
  },
  hotlineLabel: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  hotlineNumber: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  callAction: {
    minWidth: 78,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
  },
  callActionText: {
    color: THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  guideCard: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  guideIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(247, 185, 85, 0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  guideSubTitle: {
    color: THEME.colors.secondary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceSoft,
    color: THEME.colors.text.primary,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 26,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
    color: THEME.colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
});

export default EmergencyScreen;
