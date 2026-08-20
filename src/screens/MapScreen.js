import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

const MapScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello Map</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: THEME.colors.text.primary,
    fontSize: 20,
  },
});

export default MapScreen;
