import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAlertsStore } from '../store/useAlertsStore';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const AlertsScreen = () => {
  const {
    alertsData,
    isLoading,
    error,
    fetchAlerts,
  } = useAlertsStore();
  const isOffline = useNetworkStatus();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const renderAlert = ({ item }) => {
    const isUrgent = item.severity === 'High' || item.severity === 'Critical';
    const borderColor = isUrgent ? THEME.colors.error : THEME.colors.secondary;

    return (
      <View style={[styles.card, { borderColor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: borderColor }]}>
            <Text style={styles.badgeText}>{item.severity}</Text>
          </View>
        </View>
        <Text style={styles.alertDescription}>{item.description}</Text>
        <Text style={styles.alertTime}>{item.timestamp}</Text>
      </View>
    );
  };

  if (isLoading && !alertsData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!alertsData && !isLoading && isOffline) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No data available yet. Please connect to the internet once to sync.</Text>
      </View>
    );
  }

  if (error && !alertsData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alertsData}
        keyExtractor={(item) => item.id || item.title}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No active alerts at this time.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  listContent: {
    padding: THEME.spacing.md,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border, // Default border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text.primary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    marginLeft: 10,
  },
  badgeText: {
    color: THEME.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: THEME.spacing.sm,
  },
  alertTime: {
    fontSize: 12,
    color: THEME.colors.text.disabled,
    textAlign: 'right',
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  emptyText: {
    color: THEME.colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
});

export default AlertsScreen;
