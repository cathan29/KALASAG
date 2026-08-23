import axios from 'axios';
import { distanceBetweenKm, isValidCoordinate } from '../utils/geo';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const MAX_RADIUS_METERS = 50000;

const buildQuery = ({ latitude, longitude, radiusKm }) => {
  const radius = Math.min(MAX_RADIUS_METERS, Math.max(1000, Number(radiusKm) * 1000));
  const around = `(around:${Math.round(radius)},${latitude},${longitude})`;

  return `[out:json][timeout:25];(`
    + `nwr["emergency"="assembly_point"]${around};`
    + `nwr["amenity"="shelter"]["shelter_type"="emergency"]${around};`
    + `nwr["evacuation_center"="yes"]${around};`
    + `nwr["social_facility"="shelter"]["social_facility:for"~"displaced|disaster"]${around};`
    + ');out center tags;';
};

const locationCopy = (tags) => ([
  tags['addr:street'],
  tags['addr:place'] ?? tags['addr:quarter'],
  tags['addr:city'] ?? tags['addr:municipality'],
  tags['addr:province'],
].filter(Boolean).join(', '));

const shelterType = (tags) => {
  if (tags.emergency === 'assembly_point') return 'Emergency assembly point';
  if (tags.evacuation_center === 'yes') return 'Evacuation center';
  return 'Emergency shelter';
};

const normalizeShelter = (element, origin) => {
  const tags = element.tags ?? {};
  const coordinates = {
    latitude: Number(element.lat ?? element.center?.lat),
    longitude: Number(element.lon ?? element.center?.lon),
  };
  if (!isValidCoordinate(coordinates)) return null;

  const type = shelterType(tags);
  const name = tags.name ?? tags['name:en'] ?? type;
  const distanceKm = distanceBetweenKm(origin, coordinates);

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    type,
    address: locationCopy(tags) || tags.operator || 'Location available on map',
    phone: tags['contact:phone'] ?? tags.phone ?? null,
    capacity: tags.capacity ?? null,
    operator: tags.operator ?? null,
    coordinates,
    distanceKm,
    source: 'OpenStreetMap contributors',
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
};

export const fetchNearbyShelters = async ({ latitude, longitude, radiusKm = 50 }) => {
  const origin = { latitude: Number(latitude), longitude: Number(longitude) };
  if (!isValidCoordinate(origin)) throw new Error('A valid location is required to find shelters.');

  const query = buildQuery({ ...origin, radiusKm });
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.post(endpoint, `data=${encodeURIComponent(query)}`, {
        timeout: 30000,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const elements = Array.isArray(response.data?.elements) ? response.data.elements : [];
      const seen = new Set();

      return elements
        .map((element) => normalizeShelter(element, origin))
        .filter((shelter) => {
          if (!shelter) return false;
          const key = `${shelter.name.toLowerCase()}:${shelter.coordinates.latitude.toFixed(4)}:${shelter.coordinates.longitude.toFixed(4)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((left, right) => left.distanceKm - right.distanceKm);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.response?.status === 429
    ? 'Shelter service is busy. Your saved offline list is still available.'
    : 'Unable to refresh nearby shelters. Your saved offline list is still available.');
};
