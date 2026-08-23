import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNearbyShelters } from '../services/sheltersApi';

const useSheltersStore = create(
  persist(
    (set, get) => ({
      shelters: [],
      lastUpdated: null,
      cachedOrigin: null,
      radiusKm: 50,
      isLoading: false,
      error: null,

      setRadiusKm: (radiusKm) => set({ radiusKm: Number(radiusKm) }),
      fetchShelters: async (origin, radiusOverride) => {
        if (get().isLoading || !origin) return false;
        set({ isLoading: true, error: null });
        try {
          const shelters = await fetchNearbyShelters({
            ...origin,
            radiusKm: radiusOverride ?? get().radiusKm,
          });
          set({
            shelters,
            cachedOrigin: origin,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error) {
          set({ isLoading: false, error: error.message || 'Unable to refresh shelters.' });
          return false;
        }
      },
    }),
    {
      name: 'shelters-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        shelters: state.shelters,
        lastUpdated: state.lastUpdated,
        cachedOrigin: state.cachedOrigin,
        radiusKm: state.radiusKm,
      }),
    }
  )
);

export default useSheltersStore;
