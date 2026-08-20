import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';

import WeatherScreen from '../screens/WeatherScreen';
import AlertsScreen from '../screens/AlertsScreen';
import MapScreen from '../screens/MapScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.text.secondary,
        tabBarBackgroundColor: THEME.colors.surface,
        headerStyle: {
          backgroundColor: THEME.colors.surface,
        },
        headerTintColor: THEME.colors.text.primary,
      }}
    >
      <Tab.Screen name="Weather" component={WeatherScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
