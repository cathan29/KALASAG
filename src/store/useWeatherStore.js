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
      }),
      setLocationError: (message) => set({
        isLocating: false,
        locationPermissionStatus: 'denied',
        locationLabel: 'Location unavailable',
        error: message,
      }),

      fetchWeather: async (locationOverride) => {
        const location = locationOverride ?? get().userLocation;

        if (!location) {
          set({
            isLoading: false,
            error: 'Allow location access to load local weather.',
          });
          return;
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
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'An unknown error occurred while fetching weather',
          });
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
