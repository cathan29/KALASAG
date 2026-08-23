import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const OfflineBanner = () => {
  const isOffline = useNetworkStatus();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.text.inverse} />
      <Text style={styles.text}>Offline · Showing saved data</Text>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  banner: {
    minHeight: 32,
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: theme.colors.text.inverse,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OfflineBanner;
