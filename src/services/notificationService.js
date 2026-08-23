import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'critical-alerts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const prepareNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Nearby critical alerts',
      description: 'High and critical disaster advisories near your location.',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 180, 250],
      lightColor: '#EF4444',
      sound: 'default',
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted ? 'granted' : permissions.status;
};

export const requestNotificationPermission = async () => {
  await prepareNotifications();
  const permissions = await Notifications.requestPermissionsAsync();
  return permissions.granted ? 'granted' : permissions.status;
};

export const showAlertNotification = async ({ alert, distanceKm }) => (
  Notifications.scheduleNotificationAsync({
    content: {
      title: `${alert.severity}: ${alert.title}`,
      body: `${Math.round(distanceKm)} km away · ${alert.source || 'Official advisory'}`,
      data: { alertId: String(alert.id) },
      color: '#EF4444',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      sound: 'default',
    },
    trigger: Platform.OS === 'android' ? {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: CHANNEL_ID,
    } : null,
  })
);

export const subscribeToNotificationResponses = (listener) => (
  Notifications.addNotificationResponseReceivedListener((response) => {
    listener(response.notification.request.content.data?.alertId);
  })
);

export const getLastNotificationAlertId = async () => {
  const response = await Notifications.getLastNotificationResponseAsync();
  const alertId = response?.notification?.request?.content?.data?.alertId ?? null;
  if (response) await Notifications.clearLastNotificationResponseAsync();
  return alertId;
};
