import React from 'react';
import { StyleSheet, View } from 'react-native';
import { THEME } from '../constants/theme';

const GlassCard = ({ children, style, intensity = 22 }) => (
  <View style={[styles.card, style]}>
    <View style={styles.sheen} />
    <View style={[styles.tint, { opacity: Math.min(0.28, intensity / 100) }]} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
  },
});

export default GlassCard;
