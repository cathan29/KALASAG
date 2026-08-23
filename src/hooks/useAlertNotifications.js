import { useEffect, useRef } from 'react';
import { useAlertsStore } from '../store/useAlertsStore';
import useNotificationStore from '../store/useNotificationStore';
import useWeatherStore from '../store/useWeatherStore';
import { distanceBetweenKm, isValidCoordinate } from '../utils/geo';
import {
  prepareNotifications,
  requestNotificationPermission,
  showAlertNotification,
} from '../services/notificationService';

const MAX_ALERT_AGE_MS = 24 * 60 * 60 * 1000;

const isQuietHour = (hour, start, end) => (
  start === end ? false : start < end
    ? hour >= start && hour < end
    : hour >= start || hour < end
);

const useAlertNotifications = () => {
  const alerts = useAlertsStore((state) => state.alertsData);
  const userLocation = useWeatherStore((state) => state.userLocation);
  const locationSessionReady = useWeatherStore((state) => state.locationSessionReady);
  const settings = useNotificationStore();
  const processingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (!settings.enabled) return;
      try {
        let status = await prepareNotifications();
        if (status === 'undetermined') status = await requestNotificationPermission();
        if (active) settings.setPermissionStatus(status);
      } catch {
        if (active) settings.setPermissionStatus('unavailable');
      }
    };

    initialize();
    return () => { active = false; };
  }, [settings.enabled]);

  useEffect(() => {
    if (
      processingRef.current
      || !settings.enabled
      || settings.permissionStatus !== 'granted'
      || !locationSessionReady
      || !Array.isArray(alerts)
      || !isValidCoordinate(userLocation)
      || (settings.quietHoursEnabled
        && isQuietHour(new Date().getHours(), settings.quietStart, settings.quietEnd))
    ) return;

    const candidates = alerts
      .map((alert) => ({
        alert,
        distanceKm: distanceBetweenKm(userLocation, alert.coordinates),
      }))
      .filter(({ alert, distanceKm }) => (
        ['High', 'Critical'].includes(alert.severity)
        && Number.isFinite(distanceKm)
        && distanceKm <= settings.radiusKm
        && !settings.notifiedAlertIds.includes(String(alert.id))
        && Date.now() - new Date(alert.publishedAt).getTime() <= MAX_ALERT_AGE_MS
      ))
      .slice(0, 3);

    if (!candidates.length) return;
    processingRef.current = true;

    Promise.allSettled(candidates.map(showAlertNotification))
      .then((results) => {
        const notifiedIds = results
          .map((result, index) => result.status === 'fulfilled'
            ? String(candidates[index].alert.id)
            : null)
          .filter(Boolean);
        if (notifiedIds.length) settings.markAlertsNotified(notifiedIds);
      })
      .finally(() => { processingRef.current = false; });
  }, [
    alerts,
    settings.enabled,
    settings.notifiedAlertIds,
    settings.permissionStatus,
    settings.quietEnd,
    settings.quietHoursEnabled,
    settings.quietStart,
    settings.radiusKm,
    locationSessionReady,
    userLocation,
  ]);
};

export default useAlertNotifications;
