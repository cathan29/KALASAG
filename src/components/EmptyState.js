import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useTheme } from 'react-native-paper';

const STATE_ICONS = {
  offline: 'cloud-offline-outline',
  location: 'location-outline',
  error: 'alert-circle-outline',
};

const EmptyState = ({
  title = 'Walang naitalang sakuna ngayon. Ligtas ang araw!',
  message,
  variant = 'safe',
  animationSource,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {variant === 'safe' ? (
        animationSource ? (
          <LottieView
            source={animationSource}
            autoPlay
            loop
            resizeMode="contain"
            style={styles.animation}
          />
        ) : (
          <View style={styles.mascotFrame}>
            <Image
              source={require('../../assets/mascot/kalasag-safe.png')}
              resizeMode="cover"
              style={styles.mascot}
              accessibilityIgnoresInvertColors
            />
          </View>
        )
      ) : (
        <View style={[styles.iconShell, variant === 'error' && styles.errorShell]}>
          <Ionicons
            name={STATE_ICONS[variant] ?? 'information-circle-outline'}
            size={34}
            color={variant === 'error' ? theme.colors.error : theme.colors.primary}
          />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  mascotFrame: {
    width: 168,
    height: 168,
    borderRadius: 84,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
  },
  mascot: { width: '100%', height: '100%' },
  animation: { width: 176, height: 176 },
  iconShell: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  errorShell: { backgroundColor: theme.colors.errorContainer },
  title: {
    color: theme.colors.text.primary,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    letterSpacing: 0,
  },
  message: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: theme.spacing.sm,
    maxWidth: 310,
    textAlign: 'center',
  },
});

export default EmptyState;
