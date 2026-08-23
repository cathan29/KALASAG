import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from 'react-native-paper';

const EmptyState = ({
  title = 'Walang naitalang sakuna ngayon. Ligtas ang araw!',
  message,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/safe-state.json')}
        autoPlay
        loop
        resizeMode="contain"
        style={styles.animation}
      />
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
  animation: { width: 148, height: 148 },
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
