import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton, SegmentedButtons, Surface, Switch, useTheme } from 'react-native-paper';
import useNotificationStore from '../store/useNotificationStore';
import { requestNotificationPermission } from '../services/notificationService';

const QUIET_PRESETS = [
  { value: '22-7', label: '10 PM–7 AM', start: 22, end: 7 },
  { value: '23-6', label: '11 PM–6 AM', start: 23, end: 6 },
  { value: '0-6', label: '12 AM–6 AM', start: 0, end: 6 },
];

const NotificationSettingsScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const settings = useNotificationStore();
  const [requesting, setRequesting] = useState(false);
  const quietValue = `${settings.quietStart}-${settings.quietEnd}`;

  const enableNotifications = async (enabled) => {
    settings.setEnabled(enabled);
    if (!enabled) return;

    setRequesting(true);
    try {
      settings.setPermissionStatus(await requestNotificationPermission());
    } finally {
      setRequesting(false);
    }
  };

  const chooseQuietHours = (value) => {
    const preset = QUIET_PRESETS.find((item) => item.value === value);
    if (preset) settings.setQuietHours(preset.start, preset.end);
  };

  const permissionLabel = settings.permissionStatus === 'granted'
    ? 'Allowed'
    : settings.permissionStatus === 'unsupported' ? 'Mobile only' : 'Permission needed';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={navigation.goBack} accessibilityLabel="Back" />
        <Text style={styles.title}>Alert notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Surface elevation={1} style={styles.group}>
        <View style={styles.settingRow}>
          <View style={styles.iconShell}>
            <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Nearby critical alerts</Text>
            <Text style={styles.settingMeta}>{permissionLabel}</Text>
          </View>
          <Switch value={settings.enabled} onValueChange={enableNotifications} disabled={requesting} />
        </View>
        {settings.enabled && settings.permissionStatus !== 'granted' ? (
          <Button
            icon="cog-outline"
            mode="contained-tonal"
            loading={requesting}
            onPress={settings.permissionStatus === 'denied' ? Linking.openSettings : () => enableNotifications(true)}
            style={styles.permissionButton}
          >Allow notifications</Button>
        ) : null}
      </Surface>

      <Text style={styles.sectionTitle}>Alert radius</Text>
      <Surface elevation={1} style={styles.sectionCard}>
        <SegmentedButtons
          value={String(settings.radiusKm)}
          onValueChange={(value) => settings.setRadiusKm(Number(value))}
          buttons={[
            { value: '50', label: '50 km' },
            { value: '100', label: '100 km' },
            { value: '250', label: '250 km' },
          ]}
        />
        <Text style={styles.helper}>Only High and Critical advisories with mapped coordinates are notified.</Text>
      </Surface>

      <Text style={styles.sectionTitle}>Quiet hours</Text>
      <Surface elevation={1} style={styles.sectionCard}>
        <View style={styles.quietRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Mute alerts overnight</Text>
            <Text style={styles.settingMeta}>Alerts remain visible inside Kalasag</Text>
          </View>
          <Switch value={settings.quietHoursEnabled} onValueChange={settings.setQuietHoursEnabled} />
        </View>
        {settings.quietHoursEnabled ? (
          <SegmentedButtons
            value={quietValue}
            onValueChange={chooseQuietHours}
            buttons={QUIET_PRESETS.map(({ value, label }) => ({ value, label }))}
            style={styles.quietPresets}
          />
        ) : null}
      </Surface>

      <View style={styles.privacyRow}>
        <Ionicons name="lock-closed-outline" size={18} color={theme.colors.success} />
        <Text style={styles.privacyText}>Settings and notified alert IDs stay on this device.</Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl, gap: 12 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', marginHorizontal: -8 },
  title: { flex: 1, color: theme.colors.text.primary, fontSize: 22, fontWeight: '700' },
  headerSpacer: { width: 48 },
  group: { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconShell: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryContainer },
  settingCopy: { flex: 1, minWidth: 0 },
  settingTitle: { color: theme.colors.text.primary, fontSize: 15, fontWeight: '700' },
  settingMeta: { color: theme.colors.text.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  permissionButton: { marginTop: 14 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: 17, fontWeight: '700', marginTop: 8 },
  sectionCard: { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  helper: { color: theme.colors.text.muted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  quietRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quietPresets: { marginTop: 14 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  privacyText: { color: theme.colors.text.muted, fontSize: 12 },
});

export default NotificationSettingsScreen;
