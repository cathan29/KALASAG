import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { THEME } from '../constants/theme';

const EmptyState = ({
  title = 'Walang naitalang sakuna ngayon. Ligtas ang araw!',
  message,
}) => (
  <View style={styles.card}>
    <View style={styles.animationWrap}>
      <LottieView
        source={require('../../assets/animations/safe-state.json')}
        autoPlay
        loop
        resizeMode="contain"
        style={styles.animation}
      />
    </View>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
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
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 200,
    height: 200,
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
