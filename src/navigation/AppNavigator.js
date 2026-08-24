import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

import WeatherScreen from '../screens/WeatherScreen';
import AlertsScreen from '../screens/AlertsScreen';
import MapScreen from '../screens/MapScreen';
import PreparednessScreen from '../screens/PreparednessScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import SheltersScreen from '../screens/SheltersScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_LABELS = {
  Weather: 'Now',
  Alerts: 'Alerts',
  Radar: 'Radar',
  Ready: 'Ready',
  Emergency: 'SOS',
};

const BASE_HEIGHT = 60;

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

const MainTabs = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
        tabBarStyle: [
          styles.bar,
          {
            height: Platform.OS === 'ios' ? 78 : BASE_HEIGHT + Math.max(insets.bottom, 8),
            paddingBottom: Platform.OS === 'ios' ? 18 : Math.max(insets.bottom, 8)
          }
        ],
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

const AppNavigator = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AlertDetails" component={AlertDetailScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Shelters" component={SheltersScreen} />
    </Stack.Navigator>
  );
};

const createStyles = (theme) => StyleSheet.create({
  bar: {
    paddingTop: 7,
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
