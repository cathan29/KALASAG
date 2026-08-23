import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      enabled: true,
      permissionStatus: 'undetermined',
      radiusKm: 100,
      quietHoursEnabled: true,
      quietStart: 22,
      quietEnd: 7,
      notifiedAlertIds: [],

      setEnabled: (enabled) => set({ enabled }),
      setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
      setRadiusKm: (radiusKm) => set({ radiusKm: Number(radiusKm) }),
      setQuietHoursEnabled: (quietHoursEnabled) => set({ quietHoursEnabled }),
      setQuietHours: (quietStart, quietEnd) => set({
        quietStart: Number(quietStart),
        quietEnd: Number(quietEnd),
      }),
      markAlertsNotified: (ids) => set({
        notifiedAlertIds: [...new Set([...ids, ...get().notifiedAlertIds])].slice(0, 200),
      }),
    }),
    {
      name: 'notification-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useNotificationStore;
