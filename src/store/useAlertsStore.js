import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDisasters } from '../services/alertsApi';

export const useAlertsStore = create(
  persist(
    (set, get) => ({
      alertsData: null,
      lastUpdated: null,
      isLoading: false,
      error: null,

      fetchAlerts: async () => {
        if (get().isLoading) return false;

        set({ isLoading: true, error: null });
        try {
          const disasters = await fetchDisasters();
          set({
            alertsData: disasters,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message || 'Unable to refresh live alerts.',
          });
          return false;
        }
      },
    }),
    {
      name: 'alerts-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        alertsData: state.alertsData,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
