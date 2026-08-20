import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDisasters } from '../services/alertsApi';

export const useAlertsStore = create(
  persist(
    (set) => ({
      alertsData: null,
      lastUpdated: null,
      isLoading: false,
      error: null,

      fetchAlerts: async () => {
        set({ isLoading: true, error: null });
        try {
          const disasters = await fetchDisasters();
          set({
            alertsData: disasters,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch alerts',
          });
          // The persist middleware automatically maintains the existing alertsData in the state
        }
      },
    }),
    {
      name: 'alerts-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
