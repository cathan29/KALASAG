import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { sanitizePreviewText } from '../../services/textUtils';

const CATEGORY_ICONS = {
  weather: 'rainy-outline',
  earthquake: 'pulse-outline',
  tsunami: 'water-outline',
  volcano: 'triangle-outline',
  wildfire: 'flame-outline'
};

const AlertCard = ({ item, navigation, onShare, onMarkAsRead, formattedTime }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const severityTone = (severity) => {
    if (severity === 'Critical' || severity === 'High') return { color: theme.colors.error, icon: 'warning' };
    if (severity === 'Medium') return { color: theme.colors.warning, icon: 'alert-circle' };
    return { color: theme.colors.secondary, icon: 'information-circle' };
  };

  const tone = severityTone(item.severity);

  const renderRightActions = (progress, dragX) => {
    return (
      <View style={styles.rightActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onShare?.(item)}
        >
          <Ionicons name="share-social-outline" size={20} color="white" />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
          onPress={() => onMarkAsRead?.(item)}
        >
          <Ionicons name="checkmark-done-outline" size={20} color="white" />
          <Text style={styles.actionText}>Read</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <Pressable
        onPress={() => navigation.navigate('AlertDetails', { alertId: String(item.id), alert: item })}
        accessibilityRole="button"
        accessibilityLabel={`Open advisory: ${item.title}`}
      >
        <Surface elevation={1} style={styles.alertCard}>
          <View style={[styles.severityBar, { backgroundColor: tone.color }]} />
          <View style={styles.alertBody}>
            <View style={styles.metaRow}>
              <View style={styles.sourceRow}>
                <Ionicons name={CATEGORY_ICONS[item.category] ?? 'notifications-outline'} size={15} color={theme.colors.secondary} />
                <Text style={styles.source} numberOfLines={1}>{item.source || 'Advisory'}</Text>
              </View>
              <Text style={styles.time}>{formattedTime}</Text>
            </View>
            <View style={styles.titleRow}>
              <Ionicons name={tone.icon} size={21} color={tone.color} />
              <Text style={styles.alertTitle}>{sanitizePreviewText(item.title || 'Untitled advisory')}</Text>
            </View>
            {item.description ? <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">{sanitizePreviewText(item.description)}</Text> : null}
            <View style={styles.footer}>
              <Text style={[styles.severity, { color: tone.color }]}>{item.severity || 'Advisory'}</Text>
              <View style={styles.detailLink}>
                <Text style={styles.detailLinkText}>View details</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </View>
            </View>
          </View>
        </Surface>
      </Pressable>
    </Swipeable>
  );
};

const createStyles = (theme) => {
  return StyleSheet.create({
    alertCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden'
    },
    severityBar: { width: 4 },
    alertBody: { flex: 1, padding: 15 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    sourceRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    source: { flex: 1, color: theme.colors.secondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    time: { color: theme.colors.text.muted, fontSize: 11 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 12 },
    alertTitle: { flex: 1, color: theme.colors.text.primary, fontSize: 17, lineHeight: 23, fontWeight: '700' },
    description: { color: theme.colors.text.secondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
    footer: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    severity: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    detailLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    detailLinkText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
    rightActions: {
      flexDirection: 'row',
      width: 150,
      height: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 10,
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      padding: 8,
      borderRadius: 6,
      minWidth: 60,
      height: 36,
    },
    actionText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
  });
};

export default AlertCard;
