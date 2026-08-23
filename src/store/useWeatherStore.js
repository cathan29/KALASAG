import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as weatherApi from '../services/weatherApi';

const useWeatherStore = create(
  persist(
    (set, get) => ({
      weatherData: null,
      userLocation: null,
      locationLabel: 'Locating...',
      locationPermissionStatus: 'undetermined',
      locationSessionReady: false,
      lastUpdated: null,
      isLoading: false,
      isLocating: false,
      error: null,

      setLocationLoading: (isLocating) => set({ isLocating }),
      setLocationPermissionStatus: (locationPermissionStatus) => set({ locationPermissionStatus }),
      setUserLocation: ({ latitude, longitude, label = 'Current Location' }) => set({
        userLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        locationLabel: label,
        locationSessionReady: true,
      }),
      setLocationError: (message) => set({
        isLocating: false,
        locationPermissionStatus: 'denied',
        locationSessionReady: true,
        locationLabel: 'Location unavailable',
        error: message,
      }),

      fetchWeather: async (locationOverride) => {
        if (get().isLoading) return false;

        const location = locationOverride ?? get().userLocation;

        if (!location) {
          set({
            isLoading: false,
            error: 'Allow location access to load local weather.',
          });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await weatherApi.fetchWeather({
            ...location,
            label: get().locationLabel,
          });
          const rawTemp = response.data?.current?.temperature_2m;
          const temperature = Number.isFinite(Number(rawTemp)) ? Math.round(Number(rawTemp)) : 'N/A';

          set({
            weatherData: {
              ...response.data,
              temperature,
            },
            lastUpdated: new Date().toISOString(),
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'An unknown error occurred while fetching weather',
          });
          return false;
        }
      },
    }),
    {
      name: 'weather-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        weatherData: state.weatherData,
        userLocation: state.userLocation,
        locationLabel: state.locationLabel,
        locationPermissionStatus: state.locationPermissionStatus,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

export default useWeatherStore;
