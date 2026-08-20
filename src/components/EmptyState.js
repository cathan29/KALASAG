import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import safeDayAnimation from '../assets/lottie/safe-day.json';

const EmptyState = ({
  title = 'Walang naitalang sakuna ngayon. Ligtas ang araw!',
  message = 'We will keep watching for updates.',
  animationSource = safeDayAnimation,
  icon = 'shield-checkmark',
}) => (
  <View style={styles.card}>
    <View style={styles.animationWrap}>
      <LottieView
        source={animationSource}
        autoPlay
        loop
        resizeMode="contain"
        style={styles.animation}
      />
      <View style={styles.fallbackIcon}>
        <Ionicons name={icon} size={36} color={THEME.colors.success} />
      </View>
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    ...THEME.shadows.subtle,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  animationWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 140,
    height: 140,
  },
  fallbackIcon: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  title: {
    color: THEME.colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: THEME.spacing.md,
    textAlign: 'center',
  },
  message: {
    color: THEME.colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
});

export default EmptyState;
