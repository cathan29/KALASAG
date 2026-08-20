import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';

export default function App() {
  return (
    <NavigationContainer>
      <OfflineBanner />
      <AppNavigator />
    </NavigationContainer>
  );
}
