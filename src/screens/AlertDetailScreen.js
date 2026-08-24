import React, { useMemo } from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Chip, IconButton, Surface, useTheme } from 'react-native-paper';
import { useAlertsStore } from '../store/useAlertsStore';

const formatPublishedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const cleanAndFormatText = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&#xD;|&#xA;/g, '\n')
    .replace(/&#x201C;|&#x201D;/g, '"')
    .replace(/\n{3,}/g, '\n\n');
};

const AlertDetailScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const alerts = useAlertsStore((state) => state.alertsData);
  const alert = alerts?.find((item) => String(item.id) === String(route.params?.alertId))
    ?? route.params?.alert;

  if (!alert) {
    return (
      <View style={styles.missing}>
        <Ionicons name="alert-circle-outline" size={42} color={theme.colors.text.muted} />
        <Text style={styles.missingTitle}>Advisory no longer available</Text>
        <Button onPress={navigation.goBack}>Go back</Button>
      </View>
    );
  }

  const isUrgent = ['High', 'Critical'].includes(alert.severity);
  const affectedAreas = Array.isArray(alert.affectedAreas) && alert.affectedAreas.length
    ? alert.affectedAreas
    : ['Location shown in the official advisory'];

  const actions = alert.instructions
    ? (Array.isArray(alert.instructions) ? alert.instructions : [alert.instructions])
    : ['Follow official guidance from local authorities.'];

  const renderDynamicDetails = () => {
    const props = alert.properties || {};
    const details = [];

    if (alert.category === 'weather') {
      if (props.windSpeed) details.push({ label: 'Wind Speed', value: props.windSpeed, icon: 'wind-outline' });
      if (props.direction) details.push({ label: 'Direction', value: props.direction, icon: 'compass-outline' });
      if (props.forecastTrack) details.push({ label: 'Forecast Track', value: props.forecastTrack, icon: 'map-outline' });
    } else if (alert.category === 'earthquake') {
      if (props.magnitude) details.push({ label: 'Magnitude', value: `M ${props.magnitude}`, icon: 'pulse-outline' });
      if (props.depth) details.push({ label: 'Depth', value: `${props.depth} km`, icon: 'arrow-down-outline' });
      if (props.epicenter) details.push({ label: 'Epicenter', value: props.epicenter, icon: 'map-marker-outline' });
    } else if (alert.category === 'tsunami') {
      if (props.waveHeight) details.push({ label: 'Wave Height', value: props.waveHeight, icon: 'water-outline' });
      if (props.estimatedArrival) details.push({ label: 'Est. Arrival', value: props.estimatedArrival, icon: 'clock-outline' });
    }

    // Fallback: Add any properties that weren't explicitly mapped
    const mappedKeys = ['windSpeed', 'direction', 'forecastTrack', 'magnitude', 'depth', 'epicenter', 'waveHeight', 'estimatedArrival'];
    Object.entries(props).forEach(([key, value]) => {
      if (!mappedKeys.includes(key) && typeof value === 'string' && value.trim()) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        details.push({ label, value, icon: 'information-outline' });
      }
    });

    return details.map((detail, index) => (
      <DetailRow
        key={index}
        icon={detail.icon}
        label={detail.label}
        value={detail.value}
        theme={theme}
        styles={styles}
        last={index === details.length - 1}
      />
    ));
  };

  const openSource = async () => {
    if (alert.sourceUrl && await Linking.canOpenURL(alert.sourceUrl)) Linking.openURL(alert.sourceUrl);
  };

  const shareAlert = () => Share.share({
    title: alert.title,
    message: `${alert.title}\n${alert.description}\nSource: ${alert.source}${alert.sourceUrl ? `\n${alert.sourceUrl}` : ''}`,
  });

  const openRadar = () => navigation.navigate('MainTabs', {
    screen: 'Radar',
    params: { focusCoordinates: alert.coordinates, alertTitle: alert.title },
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={navigation.goBack} accessibilityLabel="Back" />
        <Text style={styles.headerTitle}>Advisory</Text>
        <IconButton icon="share-variant-outline" onPress={shareAlert} accessibilityLabel="Share advisory" />
      </View>

      <Surface elevation={1} style={[styles.hero, isUrgent && styles.urgentHero]}>
        <View style={[styles.alertIcon, isUrgent && styles.urgentIcon]}>
          <Ionicons name={isUrgent ? 'warning' : 'information-circle'} size={28} color={isUrgent ? theme.colors.error : theme.colors.primary} />
        </View>
        {((alert.title || '').toLowerCase().includes('lpa') || (alert.description || '').toLowerCase().includes('low pressure area')) && (
          <Chip compact style={styles.lpaBadge} textStyle={styles.lpaText}>Low Pressure Area</Chip>
        )}
        <Chip compact style={styles.severityChip} textStyle={[styles.severityText, isUrgent && { color: theme.colors.error }]}>{alert.severity}</Chip>
        <Text style={styles.title}>{alert.title}</Text>
        {cleanAndFormatText(alert.description)
          .split('\n')
          .filter((p) => p.trim() !== '')
          .map((paragraph, index) => {
            const letters = paragraph.replace(/[^a-zA-Z]/g, '');
            const isUppercase = letters.length > 0 && letters === letters.toUpperCase();
            return (
              <Text
                key={index}
                style={[
                  styles.descriptionParagraph,
                  index === 0 && { marginTop: 10 },
                  isUppercase && { fontWeight: '700' },
                ]}
              >
                {paragraph}
              </Text>
            );
          })}
      </Surface>

      <Surface elevation={1} style={styles.infoCard}>
        {renderDynamicDetails()}
        {/* If no dynamic details, show basic info */}
        {Object.keys(alert.properties || {}).length === 0 && (
          <>
            <DetailRow icon="location-outline" label="Affected locations" value={affectedAreas.join(', ')} theme={theme} styles={styles} />
            <DetailRow icon="time-outline" label="Published" value={formatPublishedAt(alert.publishedAt)} theme={theme} styles={styles} />
            <DetailRow icon="shield-checkmark-outline" label="Official source" value={alert.source || 'Official advisory'} theme={theme} styles={styles} last />
          </>
        )}
      </Surface>

      <Text style={styles.sectionTitle}>Recommended actions</Text>
      <Surface elevation={1} style={styles.actionCard}>
        {actions.map((action, index) => (
          <View key={action} style={[styles.actionRow, index > 0 && styles.separator]}>
            <View style={styles.step}><Text style={styles.stepText}>{index + 1}</Text></View>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </Surface>

      <View style={styles.buttons}>
        <Button icon="radar" mode="contained" onPress={openRadar} disabled={!alert.coordinates} style={styles.primaryButton}>Open on Radar</Button>
        <Button icon="open-in-new" mode="outlined" onPress={openSource} disabled={!alert.sourceUrl}>Official source</Button>
      </View>
      <Text style={styles.disclaimer}>Follow instructions from PAGASA, PHIVOLCS, NDRRMC, and your local government.</Text>
    </ScrollView>
  );
};

const DetailRow = ({ icon, label, value, theme, styles, last }) => (
  <View style={[styles.detailRow, !last && styles.separator]}>
    <Ionicons name={icon} size={21} color={theme.colors.secondary} />
    <View style={styles.detailCopy}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', marginHorizontal: -8 },
  headerTitle: { flex: 1, color: theme.colors.text.primary, fontSize: 20, fontWeight: '700' },
  hero: { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  urgentHero: { borderColor: `${theme.colors.error}66` },
  alertIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryContainer },
  urgentIcon: { backgroundColor: `${theme.colors.error}18` },
  severityChip: { alignSelf: 'flex-start', marginTop: 14, backgroundColor: theme.colors.surfaceSoft },
  severityText: { color: theme.colors.primary, fontSize: 11, fontWeight: '800' },
  lpaBadge: { alignSelf: 'flex-start', marginTop: 14, backgroundColor: theme.colors.secondaryContainer, marginRight: 8 },
  lpaText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '800' },
  title: { color: theme.colors.text.primary, fontSize: 26, lineHeight: 33, fontWeight: '800', marginTop: 12 },
  descriptionParagraph: { color: theme.colors.text.secondary, fontSize: 15, lineHeight: 24, marginBottom: 12 },
  infoCard: { marginTop: 14, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  detailRow: { minHeight: 74, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: theme.spacing.md },
  detailCopy: { flex: 1 },
  detailLabel: { color: theme.colors.text.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: theme.colors.text.primary, fontSize: 14, lineHeight: 20, marginTop: 3 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: 19, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  actionCard: { borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, overflow: 'hidden' },
  actionRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, padding: theme.spacing.md },
  step: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryContainer },
  stepText: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
  actionText: { flex: 1, color: theme.colors.text.secondary, fontSize: 14, lineHeight: 20 },
  separator: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  buttons: { gap: 10, marginTop: 20 },
  primaryButton: { backgroundColor: theme.colors.primary },
  disclaimer: { color: theme.colors.text.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 14 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: theme.spacing.lg, backgroundColor: theme.colors.background },
  missingTitle: { color: theme.colors.text.primary, fontSize: 18, fontWeight: '700' },
});

export default AlertDetailScreen;
