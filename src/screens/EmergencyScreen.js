import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import hotlines from '../data/hotlines.json';
import philippineLocalities from '../data/philippine-localities.json';
import survivalGuides from '../data/survival_guides.json';
import { THEME } from '../constants/theme';

const LOCALITIES = philippineLocalities.localities ?? [];
const LOCAL_HOTLINE_ENTRIES = Object.entries(hotlines.municipalities ?? {});

const normalizeCityName = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\b(city of|municipality of|city|municipality|municipal)\b/g, '')
  .replace(/[^a-z0-9]/g, '')
  .trim();

const getLocalitySubtitle = (locality) => locality?.province || locality?.region || 'Philippines';

const findLocality = (query, provinceHint = '') => {
  const normalizedQuery = normalizeCityName(query);

  if (!normalizedQuery) return null;

  const matches = LOCALITIES.filter(({ name }) => normalizeCityName(name) === normalizedQuery);
  if (matches.length <= 1) return matches[0] ?? null;

  const normalizedProvince = normalizeCityName(provinceHint);
  return matches.find((locality) => (
    normalizeCityName(locality.province) === normalizedProvince
    || normalizeCityName(locality.region).includes(normalizedProvince)
  )) ?? matches[0];
};

const getMunicipalitySuggestions = (query) => {
  const normalizedQuery = normalizeCityName(query);

  if (!normalizedQuery) {
    return LOCAL_HOTLINE_ENTRIES
      .map(([name, data]) => findLocality(name, data.province))
      .filter(Boolean)
      .slice(0, 6);
  }

  return LOCALITIES
    .map((locality) => {
      const normalizedCity = normalizeCityName(locality.name);
      const normalizedProvince = normalizeCityName(locality.province);
      const normalizedRegion = normalizeCityName(locality.region);
      let rank = 4;

      if (normalizedCity === normalizedQuery) rank = 0;
      else if (normalizedCity.startsWith(normalizedQuery)) rank = 1;
      else if (normalizedCity.includes(normalizedQuery)) rank = 2;
      else if (
        normalizedProvince.includes(normalizedQuery)
        || normalizedRegion.includes(normalizedQuery)
      ) rank = 3;

      return { locality, rank };
    })
    .filter(({ rank }) => rank < 4)
    .sort((left, right) => (
      left.rank - right.rank
      || left.locality.name.localeCompare(right.locality.name)
      || left.locality.province.localeCompare(right.locality.province)
    ))
    .slice(0, 7)
    .map(({ locality }) => locality);
};

const findLocalHotlines = (locality) => {
  if (!locality) return null;

  const match = LOCAL_HOTLINE_ENTRIES.find(([name, data]) => (
    normalizeCityName(name) === normalizeCityName(locality.name)
    && (!data.province || normalizeCityName(data.province) === normalizeCityName(locality.province))
  ));

  return match?.[1]?.verified === true ? match[1] : null;
};

const getServiceMeta = (label) => {
  if (label.startsWith('pnp')) return { label: 'Police (PNP)', icon: 'shield-checkmark' };
  if (label.startsWith('bfp')) return { label: 'Fire (BFP)', icon: 'flame' };
  if (label.startsWith('mdrrmo')) return { label: 'Disaster Office', icon: 'warning' };
  if (label.startsWith('health_office')) return { label: 'Health Office / RHU', icon: 'medkit' };
  if (label.startsWith('red_cross')) return { label: 'Philippine Red Cross', icon: 'medkit' };
  if (label.startsWith('ndrrmc')) return { label: 'NDRRMC', icon: 'radio' };
  if (label.startsWith('emergency')) return { label: 'National Emergency', icon: 'call' };

  return {
    label: label.replace(/_/g, ' ').toUpperCase(),
    icon: 'call',
  };
};

const EmergencyScreen = () => {
  const [detectedLocality, setDetectedLocality] = useState(null);
  const [selectedLocality, setSelectedLocality] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [locationMessage, setLocationMessage] = useState('Detecting location');

  const detectLocality = useCallback(async () => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    setIsDetecting(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationMessage('Location permission off');
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
      const candidates = [place?.city, place?.district, place?.subregion].filter(Boolean);
      const locality = candidates
        .map((candidate) => findLocality(candidate, place?.subregion || place?.region))
        .find(Boolean) ?? null;
      const detectedLabel = locality?.name || candidates[0] || '';

      setDetectedLocality(locality);
      setSelectedLocality(null);
      setSearchQuery('');
      setLocationMessage(detectedLabel || 'Location unavailable');
    } catch {
      setLocationMessage('Location unavailable');
    } finally {
      setIsDetecting(false);
    }
  }, []);

  useEffect(() => {
    detectLocality();
  }, [detectLocality]);

  const suggestions = useMemo(
    () => (isSearchFocused ? getMunicipalitySuggestions(searchQuery) : []),
    [isSearchFocused, searchQuery]
  );
  const activeLocality = selectedLocality ?? detectedLocality;
  const activeCityData = useMemo(() => findLocalHotlines(activeLocality), [activeLocality]);
  const hasSearchMiss = isSearchFocused && searchQuery.trim().length > 0 && suggestions.length === 0;

  const selectMunicipality = (locality) => {
    setSelectedLocality(locality);
    setSearchQuery(locality.name);
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocality(null);
    setIsSearchFocused(true);
  };

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setSelectedLocality(null);
    setIsSearchFocused(true);
  }, []);

  const makeCall = async (number) => {
    const url = `tel:${number}`;
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) await Linking.openURL(url);
  };

  const renderHotline = (label, number, tone, isLast = false) => {
    const service = getServiceMeta(label);

    return (
      <View key={`${label}-${number}`} style={[styles.hotlineRow, isLast && styles.hotlineRowLast]}>
        <View style={[styles.hotlineIcon, { backgroundColor: `${tone}18` }]}>
          <Ionicons name={service.icon} size={21} color={tone} />
        </View>
        <View style={styles.hotlineContent}>
          <Text style={styles.hotlineLabel} numberOfLines={1}>{service.label}</Text>
          <Text style={styles.hotlineNumber} numberOfLines={1} adjustsFontSizeToFit>{number}</Text>
        </View>
        <TouchableOpacity
          style={[styles.callAction, { backgroundColor: tone }]}
          onPress={() => makeCall(number)}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel={`Call ${service.label}`}
        >
          <Ionicons name="call" size={19} color={THEME.colors.text.primary} />
          <Text style={styles.callActionText}>Call</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHotlineList = (lines, tone) => {
    const entries = Object.entries(lines ?? {});

    return entries.map(([label, number], index) => (
      renderHotline(label, number, tone, index === entries.length - 1)
    ));
  };

  const renderGuideStep = (step, index) => (
    <View key={`${step}-${index}`} style={styles.stepRow}>
      <Text style={styles.stepNumber}>{index + 1}</Text>
      <Text style={styles.stepText}>{step}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={() => setIsSearchFocused(false)}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.appHeader}>
        <View style={styles.headerMark}>
          <MaterialCommunityIcons name="shield-alert" size={25} color={THEME.colors.text.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.screenTitle}>SOS</Text>
          <Text style={styles.screenSubtitle}>Emergency directory</Text>
        </View>
        <TouchableOpacity
          style={[styles.locateButton, isDetecting && styles.locateButtonDisabled]}
          onPress={detectLocality}
          disabled={isDetecting}
          activeOpacity={0.76}
          accessibilityRole="button"
          accessibilityLabel="Detect current municipality"
        >
          <Ionicons name={isDetecting ? 'navigate' : 'locate'} size={21} color={THEME.colors.secondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.emergencyAction}
        activeOpacity={0.82}
        onPress={() => makeCall('911')}
        accessibilityRole="button"
        accessibilityLabel="Call 911"
      >
        <View style={styles.emergencyActionIcon}>
          <Ionicons name="call" size={26} color={THEME.colors.text.primary} />
        </View>
        <View style={styles.emergencyActionCopy}>
          <Text style={styles.emergencyActionTitle}>Call 911</Text>
          <Text style={styles.emergencyActionSubtitle}>National emergency</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="rgba(248,250,252,0.72)" />
      </TouchableOpacity>

      <View style={styles.locationPanel}>
        <View style={styles.detectedRow}>
          <View style={styles.detectedIcon}>
            <Ionicons name={isDetecting ? 'navigate' : 'location'} size={18} color={THEME.colors.secondary} />
          </View>
          <View style={styles.detectedCopy}>
            <Text style={styles.detectedLabel}>Current area</Text>
            <Text style={styles.detectedValue} numberOfLines={1}>{locationMessage}</Text>
          </View>
          {detectedLocality && !selectedLocality ? (
            <View style={styles.nearbyBadge}>
              <Text style={styles.nearbyBadgeText}>Nearby</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.searchBox, isSearchFocused && styles.searchBoxFocused]}>
          <Ionicons name="search" size={20} color={isSearchFocused ? THEME.colors.secondary : THEME.colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or municipality"
            placeholderTextColor={THEME.colors.text.muted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onSubmitEditing={() => {
              if (suggestions[0]) selectMunicipality(suggestions[0]);
            }}
            autoCorrect={false}
            autoCapitalize="words"
            autoComplete="off"
            importantForAutofill="no"
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} hitSlop={10} accessibilityLabel="Clear municipality search">
              <Ionicons name="close-circle" size={21} color={THEME.colors.text.muted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={19} color={THEME.colors.text.muted} />
          )}
        </View>

        {isSearchFocused ? (
          <View style={styles.suggestionMenu}>
            {suggestions.map((locality, index) => (
              <TouchableOpacity
                key={locality.code}
                style={[
                  styles.suggestionRow,
                  index === suggestions.length - 1 && styles.suggestionRowLast,
                ]}
                activeOpacity={0.72}
                onPress={() => selectMunicipality(locality)}
              >
                <View style={styles.suggestionIcon}>
                  <Ionicons name="location-outline" size={18} color={THEME.colors.secondary} />
                </View>
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionCity}>{locality.name}</Text>
                  <Text style={styles.suggestionProvince} numberOfLines={1}>
                    {getLocalitySubtitle(locality)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={THEME.colors.text.disabled} />
              </TouchableOpacity>
            ))}

            {hasSearchMiss ? (
              <View style={styles.searchMiss}>
                <MaterialCommunityIcons name="map-search-outline" size={22} color={THEME.colors.warning} />
                <Text style={styles.searchMissText}>No Philippine LGU found for "{searchQuery.trim()}"</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="shield-home" size={21} color={THEME.colors.error} />
          <Text style={styles.sectionTitle}>Area emergency contacts</Text>
        </View>
        {activeLocality ? (
          <Text style={styles.sectionCount}>
            {activeCityData ? Object.keys(activeCityData.hotlines).length : 1}
          </Text>
        ) : null}
      </View>

      <View style={[styles.directoryCard, styles.localDirectoryCard]}>
        {activeLocality ? (
          <>
            <View style={styles.localHeader}>
              <View style={styles.localHeaderCopy}>
                <Text style={styles.localCity}>{activeLocality.name}</Text>
                <Text style={styles.localProvince}>{getLocalitySubtitle(activeLocality)}</Text>
              </View>
              <View style={styles.localBadge}>
                <Ionicons
                  name={activeCityData ? 'checkmark-circle' : 'git-network'}
                  size={15}
                  color={activeCityData ? THEME.colors.success : THEME.colors.secondary}
                />
                <Text style={[styles.localBadgeText, !activeCityData && styles.localBadgeTextPending]}>
                  {activeCityData?.sourceType === 'official_facebook'
                    ? 'Official post'
                    : activeCityData ? 'Verified LGU' : 'Unified 911'}
                </Text>
              </View>
            </View>
            {activeCityData ? (
              renderHotlineList(activeCityData.hotlines, THEME.colors.error)
            ) : (
              <>
                <View style={styles.unverifiedLocalState}>
                  <MaterialCommunityIcons name="phone-in-talk" size={24} color={THEME.colors.secondary} />
                  <View style={styles.unverifiedLocalCopy}>
                    <Text style={styles.noLocalTitle}>Nationwide emergency routing</Text>
                    <Text style={styles.noLocalText}>911 connects this area to police, fire, medical, and rescue responders.</Text>
                  </View>
                </View>
                {renderHotline('emergency_fallback', '911', THEME.colors.error, true)}
              </>
            )}
          </>
        ) : (
          <View style={styles.noLocalState}>
            <View style={styles.noLocalIcon}>
              <MaterialCommunityIcons name="map-search-outline" size={30} color={THEME.colors.warning} />
            </View>
            <View style={styles.noLocalCopy}>
              <Text style={styles.noLocalTitle}>No local directory selected</Text>
              <Text style={styles.noLocalText}>Choose any city or municipality in the Philippines.</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="flag" size={20} color={THEME.colors.primary} />
          <Text style={styles.sectionTitle}>National hotlines</Text>
        </View>
      </View>

      <View style={styles.directoryCard}>
        {renderHotlineList(hotlines.default?.hotlines ?? hotlines.national, THEME.colors.primary)}
      </View>

      {Object.keys(hotlines.regions ?? {}).length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="travel-explore" size={21} color={THEME.colors.secondary} />
              <Text style={styles.sectionTitle}>Regional hotlines</Text>
            </View>
          </View>

          {Object.entries(hotlines.regions).map(([region, lines]) => (
            <View key={region} style={styles.directoryCard}>
              <View style={styles.regionHeader}>
                <Text style={styles.regionName}>{region}</Text>
                <Text style={styles.sectionCount}>{Object.keys(lines).length}</Text>
              </View>
              {renderHotlineList(lines, THEME.colors.secondary)}
            </View>
          ))}
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="menu-book" size={21} color={THEME.colors.warning} />
          <Text style={styles.sectionTitle}>Emergency guides</Text>
        </View>
      </View>

      {survivalGuides.first_aid.map((guide) => (
        <View key={guide.condition} style={styles.guideCard}>
          <View style={styles.guideTitleRow}>
            <View style={styles.guideIcon}>
              <MaterialCommunityIcons name="medical-bag" size={20} color={THEME.colors.warning} />
            </View>
            <Text style={styles.guideTitle}>{guide.condition}</Text>
          </View>
          {guide.steps.map(renderGuideStep)}
        </View>
      ))}

      <View style={styles.guideCard}>
        <View style={styles.guideTitleRow}>
          <View style={styles.guideIcon}>
            <MaterialIcons name="directions-run" size={21} color={THEME.colors.warning} />
          </View>
          <Text style={styles.guideTitle}>Evacuation protocol</Text>
        </View>
        {survivalGuides.evacuation.protocols.map(renderGuideStep)}
        <Text style={styles.guideSubTitle}>Go-bag essentials</Text>
        {survivalGuides.evacuation.go_bag_essentials.map(renderGuideStep)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 122,
    gap: 14,
  },
  appHeader: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    paddingHorizontal: 12,
  },
  screenTitle: {
    color: THEME.colors.text.primary,
    fontSize: 23,
    fontWeight: '900',
  },
  screenSubtitle: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  locateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateButtonDisabled: {
    opacity: 0.52,
  },
  emergencyAction: {
    ...THEME.shadows.card,
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  emergencyActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyActionCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  emergencyActionTitle: {
    color: THEME.colors.text.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  emergencyActionSubtitle: {
    color: 'rgba(248,250,252,0.78)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  locationPanel: {
    ...THEME.shadows.subtle,
    backgroundColor: '#111C2F',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detectedRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detectedIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(125,211,252,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedCopy: {
    flex: 1,
    paddingHorizontal: 10,
  },
  detectedLabel: {
    color: THEME.colors.text.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detectedValue: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  nearbyBadge: {
    backgroundColor: 'rgba(34,197,94,0.13)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  nearbyBadgeText: {
    color: THEME.colors.success,
    fontSize: 10,
    fontWeight: '900',
  },
  searchBox: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
  },
  searchBoxFocused: {
    borderWidth: 2,
    borderColor: THEME.colors.secondary,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    height: 52,
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 0,
  },
  suggestionMenu: {
    marginTop: 8,
    backgroundColor: '#18263B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    overflow: 'hidden',
  },
  suggestionRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(125,211,252,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionCopy: {
    flex: 1,
    paddingHorizontal: 11,
  },
  suggestionCity: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  suggestionProvince: {
    color: THEME.colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  searchMiss: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchMissText: {
    flex: 1,
    color: THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sectionTitle: {
    color: THEME.colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionCount: {
    minWidth: 28,
    color: THEME.colors.text.secondary,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: THEME.colors.surfaceSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  directoryCard: {
    ...THEME.shadows.subtle,
    backgroundColor: '#111C2F',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  localDirectoryCard: {
    borderColor: 'rgba(239,68,68,0.42)',
    borderLeftWidth: 4,
    paddingLeft: 11,
  },
  localHeader: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  localHeaderCopy: {
    flex: 1,
    paddingRight: 10,
  },
  localCity: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  localProvince: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.13)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  localBadgeText: {
    color: THEME.colors.success,
    fontSize: 10,
    fontWeight: '900',
  },
  localBadgeTextPending: {
    color: THEME.colors.secondary,
  },
  unverifiedLocalState: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  unverifiedLocalCopy: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 4,
  },
  noLocalState: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noLocalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLocalCopy: {
    flex: 1,
    paddingLeft: 13,
  },
  noLocalTitle: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  noLocalText: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 3,
  },
  regionHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  regionName: {
    color: THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  hotlineRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  hotlineRowLast: {
    borderBottomWidth: 0,
  },
  hotlineIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineContent: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 11,
  },
  hotlineLabel: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  hotlineNumber: {
    color: THEME.colors.text.primary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  callAction: {
    minWidth: 72,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 11,
  },
  callActionText: {
    color: THEME.colors.text.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  guideCard: {
    ...THEME.shadows.subtle,
    backgroundColor: '#111C2F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 14,
  },
  guideIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    flex: 1,
    color: THEME.colors.text.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  guideSubTitle: {
    color: THEME.colors.secondary,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 9,
  },
  stepNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceSoft,
    color: THEME.colors.text.primary,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 25,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
    color: THEME.colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
});

export default EmergencyScreen;
