import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton, List, Searchbar, Surface, TouchableRipple, useTheme } from 'react-native-paper';
import hotlines from '../data/hotlines.json';
import philippineLocalities from '../data/philippine-localities.json';
import survivalGuides from '../data/survival_guides.json';

const LOCALITIES = philippineLocalities.localities ?? [];
const LOCAL_HOTLINE_ENTRIES = Object.entries(hotlines.municipalities ?? {});

const normalizeCityName = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\b(city of|municipality of|city|municipality|municipal)\b/g, '').replace(/[^a-z0-9]/g, '').trim();

const getLocalitySubtitle = (locality) => locality?.province || locality?.region || 'Philippines';

const findLocality = (query, provinceHint = '') => {
  const normalizedQuery = normalizeCityName(query);
  if (!normalizedQuery) return null;
  const matches = LOCALITIES.filter(({ name }) => normalizeCityName(name) === normalizedQuery);
  if (matches.length <= 1) return matches[0] ?? null;
  const province = normalizeCityName(provinceHint);
  return matches.find((item) => normalizeCityName(item.province) === province || normalizeCityName(item.region).includes(province)) ?? matches[0];
};

const getSuggestions = (query) => {
  const normalized = normalizeCityName(query);
  if (!normalized) {
    return LOCAL_HOTLINE_ENTRIES.map(([name, data]) => findLocality(name, data.province)).filter(Boolean).slice(0, 6);
  }
  return LOCALITIES.map((locality) => {
    const city = normalizeCityName(locality.name);
    const province = normalizeCityName(locality.province);
    const region = normalizeCityName(locality.region);
    let rank = 4;
    if (city === normalized) rank = 0;
    else if (city.startsWith(normalized)) rank = 1;
    else if (city.includes(normalized)) rank = 2;
    else if (province.includes(normalized) || region.includes(normalized)) rank = 3;
    return { locality, rank };
  }).filter(({ rank }) => rank < 4)
    .sort((a, b) => a.rank - b.rank || a.locality.name.localeCompare(b.locality.name) || a.locality.province.localeCompare(b.locality.province))
    .slice(0, 7).map(({ locality }) => locality);
};

const findLocalHotlines = (locality) => {
  if (!locality) return null;
  const match = LOCAL_HOTLINE_ENTRIES.find(([name, data]) => normalizeCityName(name) === normalizeCityName(locality.name)
    && (!data.province || normalizeCityName(data.province) === normalizeCityName(locality.province)));
  return match?.[1]?.verified === true ? match[1] : null;
};

const getServiceMeta = (key) => {
  if (key.startsWith('pnp')) return { label: 'Police (PNP)', icon: 'shield-checkmark-outline' };
  if (key.startsWith('bfp')) return { label: 'Fire (BFP)', icon: 'flame-outline' };
  if (key.startsWith('mdrrmo')) return { label: 'Disaster office', icon: 'warning-outline' };
  if (key.startsWith('health_office')) return { label: 'Health office / RHU', icon: 'medkit-outline' };
  if (key.startsWith('red_cross')) return { label: 'Philippine Red Cross', icon: 'medical-outline' };
  if (key.startsWith('ndrrmc')) return { label: 'NDRRMC', icon: 'radio-outline' };
  if (key.startsWith('emergency')) return { label: 'National emergency', icon: 'call-outline' };
  return { label: key.replace(/_/g, ' ').toUpperCase(), icon: 'call-outline' };
};

const EmergencyScreen = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [detectedLocality, setDetectedLocality] = useState(null);
  const [selectedLocality, setSelectedLocality] = useState(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [detecting, setDetecting] = useState(true);
  const [locationMessage, setLocationMessage] = useState('Detecting location');

  const detectLocality = useCallback(async () => {
    Keyboard.dismiss(); setFocused(false); setDetecting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { setLocationMessage('Location permission off'); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const places = await Location.reverseGeocodeAsync(position.coords);
      const place = places?.[0];
      const candidates = [place?.city, place?.district, place?.subregion].filter(Boolean);
      const locality = candidates.map((candidate) => findLocality(candidate, place?.subregion || place?.region)).find(Boolean) ?? null;
      setDetectedLocality(locality); setSelectedLocality(null); setQuery('');
      setLocationMessage(locality?.name || candidates[0] || 'Location unavailable');
    } catch { setLocationMessage('Location unavailable'); }
    finally { setDetecting(false); }
  }, []);

  useEffect(() => { detectLocality(); }, [detectLocality]);

  const suggestions = useMemo(() => focused ? getSuggestions(query) : [], [focused, query]);
  const activeLocality = selectedLocality ?? detectedLocality;
  const activeCityData = useMemo(() => findLocalHotlines(activeLocality), [activeLocality]);

  const chooseLocality = (locality) => {
    Haptics.selectionAsync(); setSelectedLocality(locality); setQuery(locality.name); setFocused(false); Keyboard.dismiss();
  };

  const call = async (number) => {
    const url = `tel:${number}`;
    if (!(await Linking.canOpenURL(url))) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await Linking.openURL(url);
  };

  const renderHotlines = (lines, tone) => Object.entries(lines ?? {}).map(([key, number], index, entries) => {
    const service = getServiceMeta(key);
    return (
      <View key={`${key}-${number}`} style={[styles.hotlineRow, index > 0 && styles.separator]}>
        <Ionicons name={service.icon} size={21} color={tone} />
        <View style={styles.hotlineCopy}>
          <Text style={styles.hotlineLabel} numberOfLines={1}>{service.label}</Text>
          <Text style={styles.hotlineNumber} numberOfLines={1} adjustsFontSizeToFit>{number}</Text>
        </View>
        <Button mode="contained" compact icon="phone" buttonColor={tone} textColor="#FFFFFF" onPress={() => call(number)} style={styles.dialButton} contentStyle={styles.dialContent}>Dial</Button>
      </View>
    );
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View><Text style={styles.title}>SOS</Text><Text style={styles.subtitle}>Emergency directory</Text></View>
        <IconButton icon={detecting ? 'crosshairs-gps' : 'crosshairs'} size={22} onPress={detectLocality} disabled={detecting} accessibilityLabel="Detect current municipality" />
      </View>

      <TouchableRipple style={styles.emergencyAction} onPress={() => call('911')} accessibilityRole="button">
        <View style={styles.emergencyInner}>
          <View style={styles.emergencyIcon}><Ionicons name="call" size={25} color="#FFFFFF" /></View>
          <View style={styles.emergencyCopy}><Text style={styles.emergencyTitle}>Call 911</Text><Text style={styles.emergencySubtitle}>Police, fire, medical and rescue</Text></View>
          <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
        </View>
      </TouchableRipple>

      <View style={styles.locationRow}>
        <Ionicons name={detecting ? 'navigate-outline' : 'location-outline'} size={18} color={theme.colors.primary} />
        <View style={styles.locationCopy}><Text style={styles.locationLabel}>Current area</Text><Text style={styles.locationValue} numberOfLines={1}>{locationMessage}</Text></View>
      </View>

      <Searchbar
        placeholder="Search city or municipality"
        value={query}
        onChangeText={(value) => { setQuery(value); setSelectedLocality(null); setFocused(true); }}
        onFocus={() => setFocused(true)}
        onClearIconPress={() => { setQuery(''); setSelectedLocality(null); setFocused(true); }}
        onSubmitEditing={() => suggestions[0] && chooseLocality(suggestions[0])}
        style={styles.search}
        inputStyle={styles.searchInput}
        autoCorrect={false}
      />
      {focused ? (
        <Surface elevation={2} style={styles.suggestions}>
          {suggestions.map((locality, index) => (
            <TouchableRipple key={locality.code || `${locality.name}-${locality.province}`} onPress={() => chooseLocality(locality)}>
              <View style={[styles.suggestionRow, index > 0 && styles.separator]}>
                <Ionicons name="location-outline" size={19} color={theme.colors.primary} />
                <View style={styles.suggestionCopy}><Text style={styles.suggestionTitle}>{locality.name}</Text><Text style={styles.suggestionSubtitle}>{getLocalitySubtitle(locality)}</Text></View>
                <Ionicons name="chevron-forward" size={17} color={theme.colors.text.muted} />
              </View>
            </TouchableRipple>
          ))}
          {query.trim() && suggestions.length === 0 ? <Text style={styles.noResult}>No matching Philippine LGU.</Text> : null}
        </Surface>
      ) : null}

      <SectionTitle title="Your local hotlines" styles={styles} />
      <Surface elevation={1} style={[styles.group, styles.localGroup]}>
        {activeLocality ? (
          <>
            <View style={styles.localHeader}>
              <View style={styles.localHeaderCopy}><Text style={styles.locality}>{activeLocality.name}</Text><Text style={styles.province}>{getLocalitySubtitle(activeLocality)}</Text></View>
              <View style={styles.verifiedRow}><Ionicons name={activeCityData ? 'checkmark-circle' : 'git-network-outline'} size={15} color={activeCityData ? theme.colors.success : theme.colors.primary} /><Text style={styles.verified}>{activeCityData ? 'Verified' : '911 routing'}</Text></View>
            </View>
            {activeCityData ? renderHotlines(activeCityData.hotlines, theme.colors.error) : renderHotlines({ emergency_fallback: '911' }, theme.colors.error)}
          </>
        ) : <Text style={styles.emptyLocal}>Select a city or enable location to see nearby contacts.</Text>}
      </Surface>

      <SectionTitle title="National hotlines" styles={styles} />
      <Surface elevation={1} style={styles.group}>{renderHotlines(hotlines.default?.hotlines ?? hotlines.national, theme.colors.primary)}</Surface>

      {Object.entries(hotlines.regions ?? {}).map(([region, lines]) => (
        <React.Fragment key={region}>
          <SectionTitle title={region} styles={styles} />
          <Surface elevation={1} style={styles.group}>{renderHotlines(lines, theme.colors.secondary)}</Surface>
        </React.Fragment>
      ))}

      <SectionTitle title="Emergency guides" styles={styles} />
      <Surface elevation={1} style={styles.guides}>
        {survivalGuides.first_aid.map((guide, index) => (
          <Guide key={guide.condition} title={guide.condition} steps={guide.steps} index={index} theme={theme} styles={styles} />
        ))}
        <Guide title="Evacuation protocol" steps={[...survivalGuides.evacuation.protocols, ...survivalGuides.evacuation.go_bag_essentials]} index={survivalGuides.first_aid.length} theme={theme} styles={styles} />
      </Surface>
    </ScrollView>
  );
};

const Guide = ({ title, steps, index, theme, styles }) => (
  <List.Accordion title={title} titleStyle={styles.guideTitle} left={(props) => <List.Icon {...props} icon="book-open-page-variant-outline" color={theme.colors.warning} />} style={index > 0 ? styles.separator : null}>
    <View style={styles.guideBody}>{steps.map((step, stepIndex) => <View key={`${step}-${stepIndex}`} style={styles.step}><Text style={styles.stepNumber}>{stepIndex + 1}</Text><Text style={styles.stepText}>{step}</Text></View>)}</View>
  </List.Accordion>
);

const SectionTitle = ({ title, styles }) => <Text style={styles.sectionTitle}>{title}</Text>;

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.md, paddingTop: 14, paddingBottom: theme.spacing.lg, gap: 12 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: theme.colors.text.primary, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { color: theme.colors.text.secondary, fontSize: 13, marginTop: 1 },
  emergencyAction: { backgroundColor: theme.colors.error, borderRadius: theme.borderRadius.md, overflow: 'hidden' },
  emergencyInner: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md },
  emergencyIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  emergencyCopy: { flex: 1, paddingHorizontal: 13 },
  emergencyTitle: { color: '#FFFFFF', fontSize: 21, lineHeight: 27, fontWeight: '700' },
  emergencySubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  locationRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  locationCopy: { flex: 1 },
  locationLabel: { color: theme.colors.text.muted, fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  locationValue: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '600', marginTop: 1 },
  search: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  searchInput: { minHeight: 48, fontSize: 14 },
  suggestions: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  suggestionRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: theme.spacing.md },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  suggestionCopy: { flex: 1 },
  suggestionTitle: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '600' },
  suggestionSubtitle: { color: theme.colors.text.muted, fontSize: 12, marginTop: 2 },
  noResult: { color: theme.colors.text.muted, fontSize: 13, textAlign: 'center', padding: theme.spacing.md },
  sectionTitle: { color: theme.colors.text.primary, fontSize: 19, lineHeight: 25, fontWeight: '700', marginTop: 8 },
  group: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  localGroup: { borderLeftWidth: 3, borderLeftColor: theme.colors.error },
  localHeader: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  localHeaderCopy: { flex: 1, minWidth: 0 },
  locality: { color: theme.colors.text.primary, fontSize: 17, fontWeight: '700' },
  province: { color: theme.colors.text.muted, fontSize: 12, marginTop: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verified: { color: theme.colors.text.muted, fontSize: 10, fontWeight: '600' },
  emptyLocal: { color: theme.colors.text.secondary, fontSize: 13, lineHeight: 19, textAlign: 'center', padding: theme.spacing.lg },
  hotlineRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: theme.spacing.md },
  hotlineCopy: { flex: 1, minWidth: 0 },
  hotlineLabel: { color: theme.colors.text.secondary, fontSize: 12 },
  hotlineNumber: { color: theme.colors.text.primary, fontSize: 16, lineHeight: 22, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  dialButton: { width: 84, borderRadius: theme.borderRadius.sm },
  dialContent: { height: 40 },
  guides: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  guideTitle: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '600' },
  guideBody: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md, gap: 9 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  stepNumber: { width: 22, color: theme.colors.primary, fontSize: 12, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  stepText: { flex: 1, color: theme.colors.text.secondary, fontSize: 13, lineHeight: 19 },
});

export default EmergencyScreen;
