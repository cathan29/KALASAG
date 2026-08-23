import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Checkbox, IconButton, ProgressBar, Surface, TextInput, TouchableRipple, useTheme } from 'react-native-paper';
import usePreparednessStore from '../store/usePreparednessStore';
import useWeatherStore from '../store/useWeatherStore';
import useSheltersStore from '../store/useSheltersStore';

const PreparednessScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { savedLocations, kitItems, familyPlan, addSavedLocation, removeSavedLocation, toggleKitItem, updateFamilyPlan } = usePreparednessStore();
  const { userLocation, locationLabel } = useWeatherStore();
  const { shelters, lastUpdated: sheltersLastUpdated } = useSheltersStore();
  const completedCount = kitItems.filter((item) => item.done).length;
  const completion = kitItems.length ? completedCount / kitItems.length : 0;

  const saveCurrentLocation = () => {
    if (!userLocation) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSavedLocation({ label: locationLabel || 'Current location', latitude: userLocation.latitude, longitude: userLocation.longitude });
  };

  const toggleItem = (id) => {
    Haptics.selectionAsync();
    toggleKitItem(id);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.title}>Ready</Text>
        <Text style={styles.subtitle}>Your offline emergency plan</Text>
      </View>

      <Surface elevation={1} style={styles.progressCard}>
        <View style={styles.progressMedia} pointerEvents="none">
          <Image
            source={require('../../assets/mascot/kalasag-ready.png')}
            resizeMode="cover"
            style={styles.progressMascot}
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={styles.progressShade} />
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressLabel}>Go-bag progress</Text>
            <Text style={styles.progressValue}>{Math.round(completion * 100)}%</Text>
          </View>
        </View>
        <ProgressBar progress={completion} color={completion === 1 ? theme.colors.success : theme.colors.primary} style={styles.progress} />
        <Text style={styles.progressMeta}>{completedCount} of {kitItems.length} essentials packed</Text>
      </Surface>

      <SectionTitle title="Saved places" action={`${savedLocations.length}/5`} styles={styles} />
      <Surface elevation={1} style={styles.group}>
        <Button icon="map-marker-plus-outline" mode="contained-tonal" onPress={saveCurrentLocation} disabled={!userLocation} style={styles.saveButton}>Save current location</Button>
        {savedLocations.length ? savedLocations.map((location, index) => (
          <View key={location.id} style={[styles.row, index === 0 && styles.firstRow]}>
            <Ionicons name="location-outline" size={21} color={theme.colors.primary} />
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle} numberOfLines={1}>{location.label}</Text>
              <Text style={styles.rowSubtitle}>{Number(location.latitude).toFixed(3)}, {Number(location.longitude).toFixed(3)}</Text>
            </View>
            <IconButton icon="close" size={19} onPress={() => removeSavedLocation(location.id)} accessibilityLabel={`Remove ${location.label}`} />
          </View>
        )) : <Text style={styles.empty}>No places saved yet.</Text>}
      </Surface>

      <SectionTitle title="Go-bag checklist" action={`${completedCount}/${kitItems.length}`} styles={styles} />
      <Surface elevation={1} style={styles.group}>
        {kitItems.map((item, index) => (
          <TouchableRipple key={item.id} onPress={() => toggleItem(item.id)}>
            <View style={[styles.checkRow, index > 0 && styles.separator]}>
              <Checkbox.Android status={item.done ? 'checked' : 'unchecked'} color={theme.colors.success} />
              <Text style={[styles.checkLabel, item.done && styles.checkedLabel]}>{item.label}</Text>
            </View>
          </TouchableRipple>
        ))}
      </Surface>

      <SectionTitle title="Family plan" styles={styles} />
      <Surface elevation={1} style={styles.form}>
        <TextInput label="Meeting place" value={familyPlan.meetingPlace} onChangeText={(value) => updateFamilyPlan('meetingPlace', value)} mode="outlined" left={<TextInput.Icon icon="map-marker-outline" />} />
        <TextInput label="Out-of-town contact" value={familyPlan.outOfTownContact} onChangeText={(value) => updateFamilyPlan('outOfTownContact', value)} mode="outlined" keyboardType="phone-pad" left={<TextInput.Icon icon="phone-outline" />} />
        <TextInput label="Medical notes" value={familyPlan.medicalNotes} onChangeText={(value) => updateFamilyPlan('medicalNotes', value)} mode="outlined" multiline numberOfLines={3} left={<TextInput.Icon icon="medical-bag" />} />
      </Surface>

      <SectionTitle title="Nearby shelters" styles={styles} />
      <Surface elevation={1} style={styles.shelterFinder}>
        <View style={styles.shelterFinderIcon}>
          <Ionicons name="business-outline" size={25} color={theme.colors.secondary} />
        </View>
        <View style={styles.shelterFinderCopy}>
          <Text style={styles.rowTitle}>Find evacuation centers</Text>
          <Text style={styles.rowSubtitle}>
            {shelters.length
              ? `${shelters.length} saved offline${sheltersLastUpdated ? ' · ready to view' : ''}`
              : 'Search nearby centers and save an offline copy'}
          </Text>
        </View>
        <IconButton icon="chevron-right" onPress={() => navigation.navigate('Shelters')} accessibilityLabel="Open evacuation centers" />
      </Surface>
    </ScrollView>
  );
};

const SectionTitle = ({ title, action, styles }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
  </View>
);

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.md, paddingTop: 18, paddingBottom: theme.spacing.lg, gap: 14 },
  title: { color: theme.colors.text.primary, fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitle: { color: theme.colors.text.secondary, fontSize: 14, marginTop: 2 },
  progressCard: { minHeight: 176, backgroundColor: '#1E293B', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderStrong, overflow: 'hidden', justifyContent: 'flex-end' },
  progressMedia: { ...StyleSheet.absoluteFillObject },
  progressMascot: { width: '100%', height: '100%' },
  progressShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,18,35,0.34)' },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 13 },
  progressValue: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '700', marginTop: 2 },
  progress: { width: '52%', height: 7, borderRadius: 4, marginTop: 13, backgroundColor: 'rgba(255,255,255,0.18)' },
  progressMeta: { width: '54%', color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 8 },
  sectionHeader: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: 19, fontWeight: '700' },
  sectionAction: { color: theme.colors.text.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
  group: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  saveButton: { margin: 12 },
  firstRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: theme.spacing.md },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: theme.colors.text.primary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  rowSubtitle: { color: theme.colors.text.muted, fontSize: 12, lineHeight: 18, marginTop: 1 },
  empty: { color: theme.colors.text.muted, fontSize: 13, textAlign: 'center', padding: theme.spacing.md },
  checkRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingRight: theme.spacing.md },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  checkLabel: { flex: 1, color: theme.colors.text.primary, fontSize: 14 },
  checkedLabel: { color: theme.colors.text.muted, textDecorationLine: 'line-through' },
  form: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: 12, gap: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  shelterFinder: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: theme.spacing.md, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  shelterFinderIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryContainer },
  shelterFinderCopy: { flex: 1, minWidth: 0 },
});

export default PreparednessScreen;
