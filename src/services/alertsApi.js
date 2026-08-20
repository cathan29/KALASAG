import axios from 'axios';
import { CONFIG } from '../constants/config';

const RELIEFWEB_API_URL = 'https://api.reliefweb.int/v2/reports';

const PHILIPPINES_COORDINATES = {
  philippines: { latitude: 12.8797, longitude: 121.7740 },
  ncr: { latitude: 14.6091, longitude: 121.0223 },
  luzon: { latitude: 16.5662, longitude: 121.2626 },
  visayas: { latitude: 10.3157, longitude: 123.8854 },
  cebu: { latitude: 10.3157, longitude: 123.8854 },
  mindanao: { latitude: 7.1907, longitude: 125.4553 },
  davao: { latitude: 7.1907, longitude: 125.4553 },
  leyte: { latitude: 11.2447, longitude: 124.9617 },
  samar: { latitude: 12.5211, longitude: 124.6560 },
  bicol: { latitude: 13.4200, longitude: 123.4137 },
  albay: { latitude: 13.1775, longitude: 123.5280 },
  cagayan: { latitude: 18.2489, longitude: 121.8788 },
  isabela: { latitude: 16.9754, longitude: 121.8107 },
  palawan: { latitude: 9.8349, longitude: 118.7384 },
};

const asPlainText = (value) => (
  typeof value === 'string'
    ? value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
);

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'Date unavailable';
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

const inferSeverity = (fields) => {
  const text = `${fields?.title ?? ''} ${fields?.body ?? ''}`.toLowerCase();

  if (/(typhoon|earthquake|flash flood|landslide|eruption|tsunami|severe|critical)/.test(text)) {
    return 'High';
  }

  if (/(flood|storm|rain|drought|displacement|emergency|affected)/.test(text)) {
    return 'Medium';
  }

  return 'Low';
};

const inferCoordinates = (fields) => {
  const text = [
    fields?.title,
    fields?.body,
    fields?.primary_country?.name,
    ...(fields?.country ?? []).map((country) => country?.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const locationKey = Object.keys(PHILIPPINES_COORDINATES).find((key) => text.includes(key));
  return locationKey ? PHILIPPINES_COORDINATES[locationKey] : null;
};

const normalizeReport = (report) => {
  const fields = report?.fields ?? {};
  const title = fields?.title ?? 'Untitled ReliefWeb report';
  const description = asPlainText(fields?.body) || 'No report summary available.';
  const createdDate = fields?.date?.created ?? fields?.date?.original ?? fields?.date?.changed;

  return {
    id: String(report?.id ?? title),
    title,
    description,
    timestamp: formatDate(createdDate),
    severity: inferSeverity(fields),
    url: fields?.url ?? report?.href,
    coordinates: inferCoordinates(fields),
  };
};

const isReliefWebAccessError = (error) => {
  const status = error.response?.status;
  return status === 403 || status === 410;
};

export const fetchDisasters = async () => {
  try {
    const response = await axios.get(RELIEFWEB_API_URL, {
      params: {
        appname: CONFIG.api.reliefWebAppName,
        'query[value]': 'country:Philippines',
        profile: 'list',
        preset: 'latest',
        limit: 20,
        'fields[include][]': ['title', 'body', 'date', 'country', 'primary_country', 'url'],
      },
    });

    const reports = Array.isArray(response.data?.data) ? response.data.data : [];
    return reports.map(normalizeReport);
  } catch (error) {
    if (isReliefWebAccessError(error)) {
      return [];
    }

    throw error;
  }
};
