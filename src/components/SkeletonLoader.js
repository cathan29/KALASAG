import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';

const SkeletonBlock = ({ width = '100%', height = 20, borderRadius = 12, style }) => {
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-180, 260],
  });

  return (
    <View style={[styles.block, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmerWrap, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(248,250,252,0.16)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
};

const SkeletonLoader = ({ variant = 'weather' }) => {
  if (variant === 'list') {
    return (
      <View style={styles.stack}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.card}>
            <SkeletonBlock width="62%" height={18} />
            <SkeletonBlock width="100%" height={14} style={styles.gap} />
            <SkeletonBlock width="82%" height={14} style={styles.smallGap} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <SkeletonBlock width="42%" height={18} />
        <SkeletonBlock width="74%" height={34} style={styles.gap} />
        <SkeletonBlock width="58%" height={100} borderRadius={22} style={styles.gap} />
      </View>
      <View style={styles.row}>
        <SkeletonBlock width="31%" height={112} borderRadius={16} />
        <SkeletonBlock width="31%" height={112} borderRadius={16} />
        <SkeletonBlock width="31%" height={112} borderRadius={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    gap: THEME.spacing.md,
    padding: THEME.spacing.md,
    paddingBottom: 116,
  },
  hero: {
    ...THEME.shadows.card,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    overflow: 'hidden',
  },
  card: {
    ...THEME.shadows.subtle,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  block: {
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceSoft,
  },
  shimmerWrap: {
    width: 140,
    height: '100%',
  },
  shimmer: {
    flex: 1,
  },
  gap: {
    marginTop: THEME.spacing.md,
  },
  smallGap: {
    marginTop: THEME.spacing.sm,
  },
});

export default SkeletonLoader;
