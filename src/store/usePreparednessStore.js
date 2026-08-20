import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_KIT = [
  { id: 'water', label: 'Water for 3 days' },
  { id: 'food', label: 'Ready-to-eat food' },
  { id: 'first_aid', label: 'First aid kit' },
  { id: 'flashlight', label: 'Flashlight and batteries' },
  { id: 'radio', label: 'Battery-powered radio' },
  { id: 'documents', label: 'IDs and waterproof documents' },
  { id: 'meds', label: 'Prescription medicines' },
  { id: 'powerbank', label: 'Charged power bank' },
];

const usePreparednessStore = create(
  persist(
    (set, get) => ({
      savedLocations: [],
      kitItems: DEFAULT_KIT.map((item) => ({ ...item, done: false })),
      familyPlan: {
        meetingPlace: '',
        outOfTownContact: '',
        medicalNotes: '',
      },

      addSavedLocation: (location) => {
        const current = get().savedLocations;
        const id = `${location.label}-${location.latitude}-${location.longitude}`;

        if (current.some((item) => item.id === id)) {
          return;
        }

        set({
          savedLocations: [
            {
              id,
              label: location.label,
              latitude: location.latitude,
              longitude: location.longitude,
            },
            ...current,
          ].slice(0, 5),
        });
      },
      removeSavedLocation: (id) => set({
        savedLocations: get().savedLocations.filter((location) => location.id !== id),
      }),
      toggleKitItem: (id) => set({
        kitItems: get().kitItems.map((item) => (
          item.id === id ? { ...item, done: !item.done } : item
        )),
      }),
      updateFamilyPlan: (key, value) => set({
        familyPlan: {
          ...get().familyPlan,
          [key]: value,
        },
      }),
    }),
    {
      name: 'preparedness-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default usePreparednessStore;
