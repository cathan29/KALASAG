import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { THEME } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const OfflineBanner = () => {
  const isOffline = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.banner}>
        <Text style={styles.text}>Offline Mode: Showing last updated data.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: THEME.colors.error,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: THEME.colors.error,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: THEME.colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OfflineBanner;
