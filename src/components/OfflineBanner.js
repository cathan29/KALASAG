import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const OfflineBanner = () => {
  const isOffline = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline Mode: Showing last updated data.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: THEME.colors.error,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OfflineBanner;
