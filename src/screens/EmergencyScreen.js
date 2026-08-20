import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  FlatList,
} from 'react-native';
import hotlines from '../data/hotlines.json';
import survivalGuides from '../data/survival_guides.json';
import { THEME } from '../constants/theme';

const EmergencyScreen = () => {
  const makeCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const renderHotline = (label, number) => (
    <TouchableOpacity
      style={styles.hotlineCard}
      onPress={() => makeCall(number)}
    >
      <Text style={styles.hotlineLabel}>{label}</Text>
      <Text style={styles.hotlineNumber}>{number}</Text>
    </TouchableOpacity>
  );

  const renderGuideStep = (step, index) => (
    <Text key={index} style={styles.stepText}>
      {index + 1}. {step}
    </Text>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Hotlines</Text>

        <Text style={styles.subTitle}>National</Text>
        {Object.entries(hotlines.national).map(([label, number]) => (
          <View key={label}>
            {renderHotline(label.toUpperCase(), number)}
          </View>
        ))}

        <Text style={styles.subTitle}>Regional</Text>
        {Object.entries(hotlines.regions).map(([region, lines]) => (
          <View key={region} style={styles.regionContainer}>
            <Text style={styles.regionName}>{region}</Text>
            {Object.entries(lines).map(([label, number]) => (
              <View key={label}>
                {renderHotline(label.toUpperCase(), number)}
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Survival Guides</Text>

        <Text style={styles.subTitle}>First Aid</Text>
        {survivalGuides.first_aid.map((guide, index) => (
          <View key={index} style={styles.guideCard}>
            <Text style={styles.guideTitle}>{guide.condition}</Text>
            {guide.steps.map(renderGuideStep)}
          </View>
        ))}

        <Text style={styles.subTitle}>Evacuation Protocol</Text>
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Protocols</Text>
          {survivalGuides.evacuation.protocols.map(renderGuideStep)}

          <Text style={[styles.guideTitle, { marginTop: 20 }]}>Go-Bag Essentials</Text>
          {survivalGuides.evacuation.go_bag_essentials.map(renderGuideStep)}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingBottom: 40,
  },
  section: {
    padding: THEME.spacing.md,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.md,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  hotlineCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  hotlineLabel: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
  },
  hotlineNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text.primary,
  },
  regionContainer: {
    marginBottom: THEME.spacing.md,
  },
  regionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.secondary,
    marginBottom: THEME.spacing.xs,
    marginLeft: 4,
  },
  guideCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
  },
  stepText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default EmergencyScreen;
