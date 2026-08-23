import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

const GlassCard = ({ children, style }) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Surface elevation={1} style={[styles.surface, style]}>
      {children}
    </Surface>
  );
};

const createStyles = (theme) => StyleSheet.create({
  surface: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
});

export default GlassCard;
