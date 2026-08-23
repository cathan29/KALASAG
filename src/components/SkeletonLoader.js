import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

const SkeletonBlock = ({ styles, width = '100%', height = 20, radius = 8, style }) => {
  const shimmer = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const translateX = shimmer.interpolate({ inputRange: [-1, 1], outputRange: [-180, 280] });
  return (
    <View style={[styles.block, { width, height, borderRadius: radius }, style]}>
      <Animated.View style={[styles.shimmerWrap, { transform: [{ translateX }] }]}>
        <LinearGradient colors={['transparent', 'rgba(255,255,255,0.16)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.shimmer} />
      </Animated.View>
    </View>
  );
};

const SkeletonLoader = ({ variant = 'weather' }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (variant === 'list') {
    return <View style={styles.screen}><SkeletonBlock styles={styles} width="42%" height={34} />{[0, 1, 2, 3].map((item) => <View key={item} style={styles.listItem}><SkeletonBlock styles={styles} width="35%" height={12} /><SkeletonBlock styles={styles} width="88%" height={20} style={styles.gap} /><SkeletonBlock styles={styles} width="100%" height={12} style={styles.gapSmall} /><SkeletonBlock styles={styles} width="68%" height={12} style={styles.gapSmall} /></View>)}</View>;
  }
  return <View style={styles.screen}><SkeletonBlock styles={styles} width="46%" height={34} /><View style={styles.hero}><SkeletonBlock styles={styles} width="45%" height={20} /><SkeletonBlock styles={styles} width="58%" height={86} radius={14} style={styles.gapLarge} /><SkeletonBlock styles={styles} width="70%" height={18} style={styles.gap} /></View><View style={styles.metrics}>{[0, 1, 2].map((item) => <SkeletonBlock key={item} styles={styles} width="29%" height={72} radius={10} />)}</View></View>;
};

const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md, gap: theme.spacing.md },
  hero: { minHeight: 282, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20, alignItems: 'center' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md },
  listItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
  block: { overflow: 'hidden', backgroundColor: theme.colors.surfaceSoft },
  shimmerWrap: { width: 150, height: '100%' },
  shimmer: { flex: 1 },
  gap: { marginTop: theme.spacing.md },
  gapLarge: { marginTop: theme.spacing.lg },
  gapSmall: { marginTop: theme.spacing.sm },
});

export default SkeletonLoader;
