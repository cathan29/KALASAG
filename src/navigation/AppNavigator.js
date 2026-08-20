import React from 'react';
import { Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';

import WeatherScreen from '../screens/WeatherScreen';
import AlertsScreen from '../screens/AlertsScreen';
import MapScreen from '../screens/MapScreen';
import PreparednessScreen from '../screens/PreparednessScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

const Tab = createBottomTabNavigator();

const getTabIcon = (routeName, focused, color, size) => {
  if (routeName === 'Weather') {
    return <Ionicons name={focused ? 'partly-sunny' : 'partly-sunny-outline'} size={size} color={color} />;
  }

  if (routeName === 'Alerts') {
    return <Ionicons name={focused ? 'warning' : 'warning-outline'} size={size} color={color} />;
  }

  if (routeName === 'Radar') {
    return <MaterialCommunityIcons name={focused ? 'radar' : 'radar'} size={size + 1} color={color} />;
  }

  if (routeName === 'Ready') {
    return <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={size} color={color} />;
  }

  return <Ionicons name={focused ? 'call' : 'call-outline'} size={size} color={color} />;
};

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabIcon(route.name, focused, color, size),
        tabBarLabel: route.name === 'Emergency' ? 'SOS' : route.name,
        tabBarActiveTintColor: THEME.colors.secondary,
        tabBarInactiveTintColor: THEME.colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          paddingBottom: Platform.OS === 'android' ? 5 : 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 22 : 16,
          height: 70,
          paddingTop: 9,
          paddingHorizontal: 8,
          backgroundColor: THEME.colors.surface,
          borderWidth: 1,
          borderColor: THEME.colors.border,
          borderRadius: 24,
          ...THEME.shadows.card,
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Weather" component={WeatherScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Radar" component={MapScreen} />
      <Tab.Screen name="Ready" component={PreparednessScreen} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
