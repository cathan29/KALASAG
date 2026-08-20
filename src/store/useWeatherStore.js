import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as weatherApi from '../services/weatherApi';

const useWeatherStore = create(
  persist(
    (set, get) => ({
      weatherData: null,
      lastUpdated: null,
      isLoading: false,
      error: null,

      fetchWeather: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await weatherApi.fetchWeather();
          set({
            weatherData: data,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'An unknown error occurred while fetching weather',
          });
          // Note: weatherData remains as it was (either from previous success or persisted cache)
        }
      },
    }),
    {
      name: 'weather-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useWeatherStore;
