import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';

import WeatherScreen from '../screens/WeatherScreen';
import AlertsScreen from '../screens/AlertsScreen';
import MapScreen from '../screens/MapScreen';
import PreparednessScreen from '../screens/PreparednessScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

const Tab = createBottomTabNavigator();

const TAB_LABELS = {
  Weather: 'Now',
  Alerts: 'Alerts',
  Radar: 'Radar',
  Ready: 'Ready',
  Emergency: 'SOS',
};

const getTabIcon = (routeName, focused, color, size) => {
  const iconSize = focused ? size + 2 : size;
  const iconColor = routeName === 'Emergency' && focused ? THEME.colors.error : color;
  const wrapStyle = [
    styles.iconPill,
    focused && styles.iconPillActive,
    routeName === 'Emergency' && focused && styles.iconPillEmergency,
  ];

  const renderIcon = () => {
  if (routeName === 'Weather') {
      return <Ionicons name={focused ? 'partly-sunny' : 'partly-sunny-outline'} size={iconSize} color={iconColor} />;
  }

  if (routeName === 'Alerts') {
      return <Ionicons name={focused ? 'warning' : 'warning-outline'} size={iconSize} color={iconColor} />;
  }

  if (routeName === 'Radar') {
      return <MaterialCommunityIcons name="radar" size={iconSize + 1} color={iconColor} />;
  }

  if (routeName === 'Ready') {
      return <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={iconSize} color={iconColor} />;
  }

    return <Ionicons name={focused ? 'call' : 'call-outline'} size={iconSize} color={iconColor} />;
  };

  return (
    <View style={wrapStyle}>
      {renderIcon()}
    </View>
  );
};

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabIcon(route.name, focused, color, size),
        tabBarLabel: TAB_LABELS[route.name] ?? route.name,
        tabBarActiveTintColor: THEME.colors.secondary,
        tabBarInactiveTintColor: THEME.colors.text.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 12,
          fontWeight: '900',
          marginTop: Platform.OS === 'android' ? -2 : -1,
          paddingBottom: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Platform.OS === 'ios' ? 20 : 14,
          height: 76,
          paddingTop: 7,
          paddingBottom: Platform.OS === 'ios' ? 9 : 8,
          paddingHorizontal: 6,
          backgroundColor: 'rgba(8, 17, 31, 0.94)',
          borderWidth: 1,
          borderColor: THEME.colors.borderStrong,
          borderRadius: 28,
          overflow: 'hidden',
          ...THEME.shadows.card,
        },
        tabBarItemStyle: {
          height: 58,
          borderRadius: 22,
          marginHorizontal: 1,
          paddingVertical: 3,
        },
        tabBarIconStyle: {
          marginBottom: 0,
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

const styles = StyleSheet.create({
  iconPill: {
    width: 40,
    height: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(125, 211, 252, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.24)',
  },
  iconPillEmergency: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
});

export default AppNavigator;
