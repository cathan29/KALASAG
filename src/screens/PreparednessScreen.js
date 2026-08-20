import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';
import usePreparednessStore from '../store/usePreparednessStore';
import useWeatherStore from '../store/useWeatherStore';
import shelters from '../data/shelters.json';
import bulletins from '../data/official_bulletins.json';

const PreparednessScreen = () => {
  const {
    savedLocations,
    kitItems,
    familyPlan,
    addSavedLocation,
    removeSavedLocation,
    toggleKitItem,
    updateFamilyPlan,
  } = usePreparednessStore();
  const { userLocation, locationLabel } = useWeatherStore();
  const completedCount = kitItems.filter((item) => item.done).length;
  const completion = Math.round((completedCount / kitItems.length) * 100);

  const saveCurrentLocation = () => {
    if (!userLocation) return;
    addSavedLocation({
      label: locationLabel || 'Current Location',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={THEME.gradients.calm}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Ready</Text>
          <Text style={styles.heroTitle}>{completion}% Packed</Text>
          <Text style={styles.heroMeta}>{savedLocations.length} places saved</Text>
        </View>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="shield-home" size={42} color={THEME.colors.secondary} />
        </View>
      </LinearGradient>

      <SectionTitle icon="bookmark" title="Saved Places" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.primaryButton} onPress={saveCurrentLocation} activeOpacity={0.84}>
          <Ionicons name="add-circle" size={18} color={THEME.colors.text.primary} />
          <Text style={styles.primaryButtonText}>Save Location</Text>
        </TouchableOpacity>
        {savedLocations.length ? savedLocations.map((location) => (
          <View key={location.id} style={styles.savedRow}>
            <View style={styles.rowIcon}>
              <Ionicons name="location" size={18} color={THEME.colors.secondary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>{location.label}</Text>
              <Text style={styles.rowSubtitle}>{Number(location.latitude).toFixed(3)}, {Number(location.longitude).toFixed(3)}</Text>
            </View>
            <TouchableOpacity onPress={() => removeSavedLocation(location.id)} hitSlop={10}>
              <Ionicons name="close-circle" size={22} color={THEME.colors.text.muted} />
            </TouchableOpacity>
          </View>
        )) : (
          <Text style={styles.emptyHint}>No saved places</Text>
        )}
      </View>

      <SectionTitle icon="bag-check" title={`Go-Bag ${completion}%`} />
      <View style={styles.card}>
        {kitItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => toggleKitItem(item.id)} activeOpacity={0.8}>
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={item.done ? THEME.colors.success : THEME.colors.text.muted}
            />
            <Text style={[styles.checkText, item.done && styles.checkTextDone]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle icon="people" title="Family Plan" />
      <View style={styles.card}>
        <PlanInput label="Meeting place" value={familyPlan.meetingPlace} onChangeText={(value) => updateFamilyPlan('meetingPlace', value)} />
        <PlanInput label="Out-of-town contact" value={familyPlan.outOfTownContact} onChangeText={(value) => updateFamilyPlan('outOfTownContact', value)} />
        <PlanInput label="Medical notes" value={familyPlan.medicalNotes} onChangeText={(value) => updateFamilyPlan('medicalNotes', value)} multiline />
      </View>

      <SectionTitle icon="business" title="Shelters" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {shelters.map((shelter) => (
          <View key={shelter.id} style={styles.shelterCard}>
            <Ionicons name="home" size={22} color={THEME.colors.secondary} />
            <Text style={styles.shelterName}>{shelter.name}</Text>
            <Text style={styles.shelterArea}>{shelter.area}</Text>
            <Text style={styles.shelterMeta}>{shelter.type} · {shelter.capacity}</Text>
          </View>
        ))}
      </ScrollView>

      <SectionTitle icon="newspaper" title="Feeds" />
      <View style={styles.card}>
        {bulletins.map((bulletin) => (
          <View key={bulletin.id} style={styles.bulletinRow}>
            <View style={styles.rowIcon}>
              <Ionicons name="shield-checkmark" size={18} color={THEME.colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{bulletin.source}</Text>
              <Text style={styles.rowSubtitle}>{bulletin.title}</Text>
              <Text style={styles.statusText}>{bulletin.status}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const SectionTitle = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={20} color={THEME.colors.secondary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const PlanInput = ({ label, value, onChangeText, multiline = false }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={`Add ${label.toLowerCase()}`}
      placeholderTextColor={THEME.colors.text.muted}
      style={[styles.input, multiline && styles.multilineInput]}
      multiline={multiline}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 116,
    gap: THEME.spacing.md,
  },
  heroCard: {
    ...THEME.shadows.card,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  heroCopy: {
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
    fontSize: 27,
    fontWeight: '900',
    marginTop: THEME.spacing.xs,
  },
  heroMeta: {
    color: THEME.colors.text.secondary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: THEME.spacing.sm,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  sectionTitle: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  card: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: THEME.spacing.sm,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
  },
  primaryButtonText: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  rowSubtitle: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  emptyHint: {
    color: THEME.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    padding: THEME.spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    minHeight: 44,
  },
  checkText: {
    color: THEME.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  checkTextDone: {
    color: THEME.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  inputWrap: {
    gap: THEME.spacing.xs,
  },
  inputLabel: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surfaceElevated,
    color: THEME.colors.text.primary,
    paddingHorizontal: THEME.spacing.md,
    fontSize: 15,
    fontWeight: '700',
  },
  multilineInput: {
    minHeight: 86,
    paddingTop: THEME.spacing.md,
    textAlignVertical: 'top',
  },
  horizontalList: {
    gap: THEME.spacing.sm,
    paddingRight: THEME.spacing.md,
  },
  shelterCard: {
    ...THEME.shadows.subtle,
    width: 230,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  shelterName: {
    color: THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: THEME.spacing.sm,
  },
  shelterArea: {
    color: THEME.colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  shelterMeta: {
    color: THEME.colors.text.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: THEME.spacing.md,
  },
  bulletinRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.md,
    backgroundColor: THEME.colors.surfaceElevated,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  statusText: {
    color: THEME.colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: THEME.spacing.xs,
  },
});

export default PreparednessScreen;
