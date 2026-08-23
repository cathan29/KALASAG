import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';

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

const renderTabIcon = (routeName, focused, color, size) => {
  if (routeName === 'Weather') {
    return <Ionicons name={focused ? 'partly-sunny' : 'partly-sunny-outline'} size={size} color={color} />;
  }
  if (routeName === 'Alerts') {
    return <Ionicons name={focused ? 'warning' : 'warning-outline'} size={size} color={color} />;
  }
  if (routeName === 'Radar') {
    return <MaterialCommunityIcons name="radar" size={size + 1} color={color} />;
  }
  if (routeName === 'Ready') {
    return <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={size} color={color} />;
  }
  return <Ionicons name={focused ? 'call' : 'call-outline'} size={size} color={color} />;
};

const AppNavigator = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => renderTabIcon(route.name, focused, color, size),
        tabBarLabel: TAB_LABELS[route.name] ?? route.name,
        tabBarActiveTintColor: route.name === 'Emergency' ? theme.colors.error : theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
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

const createStyles = (theme) => StyleSheet.create({
  bar: {
    height: Platform.OS === 'ios' ? 78 : 66,
    paddingTop: 7,
    paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: theme.dark ? 0.24 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  item: { paddingVertical: 2 },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
});

export default AppNavigator;
