import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { CONFIG } from '../constants/config';

const GDACS_API_URL = 'https://www.gdacs.org/contentdata/xml/gdacsAPP_Home.geojson';
const USGS_API_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const PAGASA_FEED_URL = 'https://publicalert.pagasa.dost.gov.ph/feeds/';
const EONET_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const PTWC_CAP_URL = 'https://www.tsunami.gov/events/xml/PHEBCAP.xml';
const PAGASA_CANDIDATE_WINDOW_MS = 48 * 60 * 60 * 1000;
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});
const PHILIPPINES_BOUNDS = {
  minLatitude: 4,
  maxLatitude: 22,
  minLongitude: 115,
  maxLongitude: 130,
};

const HAZARD_LABELS = {
  EQ: 'Earthquake',
  TC: 'Tropical Cyclone',
  FL: 'Flood',
  VO: 'Volcanic Activity',
  DR: 'Drought',
  WF: 'Wildfire',
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
};

const cleanAreaList = (values) => ([...new Set(
  asArray(values)
    .flatMap((value) => typeof value === 'string' ? value.split(/[,;|]/) : [])
    .map((value) => value.trim())
    .filter(Boolean)
)]);

const getCapAffectedAreas = (areas) => cleanAreaList(
  asArray(areas).map((area) => firstText(area?.areaDesc, area?.description))
);

const asPlainText = (value) => (
  typeof value === 'string'
    ? value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : ''
);

const firstText = (...values) => {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return value?.trim() ?? '';
};

const asIsoDate = (value) => {
  const normalizedValue = typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(' ', 'T') + 'Z'
    : value;
  const date = normalizedValue instanceof Date ? normalizedValue : new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const getGdacsSourceUrl = (links, eventId, eventType) => {
  const webLink = Array.isArray(links)
    ? links.find((link) => String(link?.Key).toLowerCase() === 'web')?.Value
    : '';
  const directLink = firstText(links, webLink);

  if (directLink) return directLink.replace(/^http:/, 'https:');
  if (eventId) {
    return 'https://www.gdacs.org/report.aspx?eventid=' + eventId + '&eventtype=' + eventType;
  }

  return 'https://www.gdacs.org/';
};

const getPointFromCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates)) return null;

  if (
    coordinates.length >= 2
    && Number.isFinite(Number(coordinates[0]))
    && Number.isFinite(Number(coordinates[1]))
  ) {
    return {
      latitude: Number(coordinates[1]),
      longitude: Number(coordinates[0]),
    };
  }

  for (const nested of coordinates) {
    const point = getPointFromCoordinates(nested);
    if (point) return point;
  }

  return null;
};

const getFlexiblePoint = (coordinates) => {
  if (!Array.isArray(coordinates)) return null;

  if (
    coordinates.length >= 2
    && Number.isFinite(Number(coordinates[0]))
    && Number.isFinite(Number(coordinates[1]))
  ) {
    const first = Number(coordinates[0]);
    const second = Number(coordinates[1]);
    const standard = { latitude: second, longitude: first };
    const reversed = { latitude: first, longitude: second };

    if (isInsidePhilippines(standard)) return standard;
    if (isInsidePhilippines(reversed)) return reversed;
    return standard;
  }

  for (const nested of coordinates) {
    const point = getFlexiblePoint(nested);
    if (isInsidePhilippines(point)) return point;
  }

  return null;
};

const isInsidePhilippines = (coordinates) => (
  coordinates
  && coordinates.latitude >= PHILIPPINES_BOUNDS.minLatitude
  && coordinates.latitude <= PHILIPPINES_BOUNDS.maxLatitude
  && coordinates.longitude >= PHILIPPINES_BOUNDS.minLongitude
  && coordinates.longitude <= PHILIPPINES_BOUNDS.maxLongitude
);

const gdacsSeverity = (alertLevel = '') => {
  const normalized = String(alertLevel).toLowerCase();
  if (normalized === 'red') return 'Critical';
  if (normalized === 'orange') return 'High';
  if (normalized === 'green') return 'Medium';
  return 'Low';
};

const eventCategory = (eventType = '') => {
  if (eventType === 'EQ') return 'earthquake';
  if (eventType === 'VO') return 'volcano';
  if (eventType === 'WF') return 'wildfire';
  return 'weather';
};

const capSeverity = (severity = '') => {
  const normalized = String(severity).toLowerCase();
  if (normalized === 'extreme') return 'Critical';
  if (normalized === 'severe') return 'High';
  if (normalized === 'moderate') return 'Medium';
  return 'Low';
};

const getCapCoordinates = (areas) => {
  for (const area of asArray(areas)) {
    const polygon = firstText(area?.polygon);
    if (polygon) {
      const points = polygon
        .split(/\s+/)
        .map((pair) => pair.split(',').map(Number))
        .filter(([latitude, longitude]) => (
          Number.isFinite(latitude) && Number.isFinite(longitude)
        ));

      if (points.length > 0) {
        const totals = points.reduce(
          (sum, [latitude, longitude]) => ({
            latitude: sum.latitude + latitude,
            longitude: sum.longitude + longitude,
          }),
          { latitude: 0, longitude: 0 }
        );
        const center = {
          latitude: totals.latitude / points.length,
          longitude: totals.longitude / points.length,
        };
        if (isInsidePhilippines(center)) return center;
      }
    }

    const circle = firstText(area?.circle).split(/\s+/)[0];
    if (circle) {
      const [latitude, longitude] = circle.split(',').map(Number);
      const point = { latitude, longitude };
      if (isInsidePhilippines(point)) return point;
    }
  }

  return null;
};

const isActiveCapAlert = (alert, info) => {
  const expiresAt = new Date(info?.expires).getTime();
  const msgType = String(alert?.msgType ?? '').toLowerCase();
  const status = String(alert?.status ?? '').toLowerCase();

  return status === 'actual'
    && !['cancel', 'error'].includes(msgType)
    && Number.isFinite(expiresAt)
    && expiresAt > Date.now();
};

const normalizeGdacsFeature = (feature) => {
  const properties = feature?.properties ?? feature ?? {};
  const eventType = String(properties.eventtype ?? properties.eventType ?? '').toUpperCase();
  const eventId = properties.eventid ?? properties.eventId ?? properties.id;
  const coordinates = getPointFromCoordinates(
    feature?.geometry?.coordinates
      ?? properties.coordinates
      ?? [properties.longitude, properties.latitude]
  );
  const countryText = firstText(
    properties.country,
    properties.countryname,
    properties.affectedcountries,
    properties.description
  ).toLowerCase();

  if (!countryText.includes('philippine') && !isInsidePhilippines(coordinates)) {
    return null;
  }

  const hazardLabel = HAZARD_LABELS[eventType] ?? 'Disaster Alert';
  const eventName = firstText(properties.eventname, properties.name, properties.title);
  const publishedAt = asIsoDate(
    properties.todate
      ?? properties.fromdate
      ?? properties.datetime
      ?? properties.datemodified
      ?? Date.now()
  );
  const description = asPlainText(firstText(
    properties.htmldescription,
    properties.description,
    properties.severitytext,
    properties.severity
  )) || hazardLabel + ' affecting the Philippines or nearby waters.';
  const sourceUrl = firstText(properties.url)
    || getGdacsSourceUrl(properties.link, eventId, eventType);
  const title = eventName.toLowerCase().startsWith(hazardLabel.toLowerCase())
    ? eventName
    : eventName ? hazardLabel + ': ' + eventName : hazardLabel;

  return {
    id: 'gdacs-' + (eventType || 'event') + '-' + (eventId ?? publishedAt),
    title,
    description,
    publishedAt,
    severity: gdacsSeverity(
      properties.alertlevel
        ?? properties.alertLevel
        ?? properties.episodealertlevel
    ),
    source: 'GDACS',
    sourceUrl,
    category: eventCategory(eventType),
    coordinates: isInsidePhilippines(coordinates) ? coordinates : null,
    affectedAreas: cleanAreaList(firstText(properties.country, properties.countryname, properties.affectedcountries)),
  };
};

const normalizeUsgsFeature = (feature) => {
  const properties = feature?.properties ?? {};
  const coordinates = getPointFromCoordinates(feature?.geometry?.coordinates);
  if (!isInsidePhilippines(coordinates)) return null;

  const magnitude = Number(properties.mag);
  const severity = magnitude >= 6
    ? 'Critical'
    : magnitude >= 5 ? 'High' : magnitude >= 4 ? 'Medium' : 'Low';
  const place = firstText(properties.place) || 'Philippines region';
  const depth = Number(feature?.geometry?.coordinates?.[2]);
  const depthCopy = Number.isFinite(depth) ? ' at a depth of ' + depth.toFixed(1) + ' km' : '';

  return {
    id: 'usgs-' + (feature?.id ?? properties.time),
    title: 'M' + (Number.isFinite(magnitude) ? magnitude.toFixed(1) : '?') + ' Earthquake',
    description: place + depthCopy + '.',
    publishedAt: asIsoDate(properties.updated ?? properties.time ?? Date.now()),
    severity,
    source: 'USGS',
    sourceUrl: firstText(properties.url) || 'https://earthquake.usgs.gov/',
    category: 'earthquake',
    coordinates,
    affectedAreas: [place],
  };
};

const normalizeOfficialAlert = (alert, index) => {
  const title = firstText(alert?.title, alert?.headline);
  if (!title) return null;

  const coordinates = Number.isFinite(Number(alert?.latitude))
    && Number.isFinite(Number(alert?.longitude))
    ? {
        latitude: Number(alert.latitude),
        longitude: Number(alert.longitude),
      }
    : alert?.coordinates ?? null;

  return {
    id: String(alert?.id ?? 'official-' + index + '-' + title),
    title,
    description: asPlainText(firstText(alert?.description, alert?.summary))
      || 'Open the official source for complete advisory details.',
    publishedAt: asIsoDate(alert?.publishedAt ?? alert?.date ?? Date.now()),
    severity: ['Low', 'Medium', 'High', 'Critical'].includes(alert?.severity)
      ? alert.severity
      : 'Medium',
    source: firstText(alert?.source) || 'Official PH Feed',
    sourceUrl: firstText(alert?.sourceUrl, alert?.url),
    category: firstText(alert?.category) || 'weather',
    coordinates,
    affectedAreas: cleanAreaList(alert?.affectedAreas ?? alert?.areas ?? alert?.location),
    instructions: asPlainText(firstText(alert?.instructions, alert?.instruction)),
  };
};

const normalizePagasaCap = (entry, capDocument) => {
  const alert = capDocument?.alert;
  const info = asArray(alert?.info)[0];
  if (!alert || !info || !isActiveCapAlert(alert, info)) return null;

  const entryTitle = firstText(entry?.title, info?.headline, info?.event);
  if (!entryTitle || /\(final\)/i.test(entryTitle)) return null;

  const description = asPlainText(firstText(info?.description, info?.instruction))
    .replace(/\*+/g, '');
  const instruction = asPlainText(firstText(info?.instruction)).replace(/\*+/g, '');
  const combinedDescription = [description, instruction]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(' ');
  const link = asArray(entry?.link).find((item) => item?.['@_href'])?.['@_href'];

  return {
    id: 'pagasa-' + firstText(alert.identifier, entry?.id, entryTitle),
    title: entryTitle,
    description: combinedDescription || 'Open the PAGASA advisory for complete safety details.',
    publishedAt: asIsoDate(alert.sent ?? entry?.updated ?? Date.now()),
    severity: capSeverity(info.severity),
    source: 'PAGASA',
    sourceUrl: firstText(link, info.web, PAGASA_FEED_URL),
    category: /tsunami/i.test(firstText(info.event, info.headline)) ? 'tsunami' : 'weather',
    coordinates: getCapCoordinates(info.area),
    affectedAreas: getCapAffectedAreas(info.area),
    instructions: instruction,
  };
};

const EONET_CATEGORY_MAP = {
  floods: 'weather',
  severeStorms: 'weather',
  landslides: 'weather',
  seaLakeIce: 'weather',
  volcanoes: 'volcano',
  wildfires: 'wildfire',
};

const normalizeEonetEvent = (event) => {
  const categoryId = firstText(event?.categories?.[0]?.id);
  const category = EONET_CATEGORY_MAP[categoryId];
  if (!category || event?.closed) return null;

  const geometry = asArray(event?.geometry)
    .slice()
    .reverse()
    .find((item) => isInsidePhilippines(getFlexiblePoint(item?.coordinates)));
  const coordinates = getFlexiblePoint(geometry?.coordinates);
  if (!coordinates) return null;

  const categoryLabel = firstText(event?.categories?.[0]?.title) || 'Natural event';
  const source = event?.sources?.[0];
  const severity = ['severeStorms', 'volcanoes'].includes(categoryId) ? 'High' : 'Medium';

  return {
    id: 'eonet-' + event.id,
    title: firstText(event.title) || categoryLabel,
    description: asPlainText(firstText(event.description))
      || categoryLabel + ' currently tracked within the Philippine area of responsibility.',
    publishedAt: asIsoDate(geometry?.date ?? Date.now()),
    severity,
    source: 'NASA EONET',
    sourceUrl: firstText(source?.url, event.link, 'https://eonet.gsfc.nasa.gov/'),
    category,
    coordinates,
    affectedAreas: cleanAreaList(firstText(event?.title, event?.categories?.[0]?.title)),
  };
};

const normalizePtwcCap = (capDocument) => {
  const alert = capDocument?.alert;
  const info = asArray(alert?.info)[0];
  if (!alert || !info || !isActiveCapAlert(alert, info)) return null;

  const copy = [info.headline, info.description, info.instruction, info?.area?.areaDesc]
    .map(asPlainText)
    .filter(Boolean)
    .join(' ');
  const isActionable = /(warning|threat|advisory)/i.test(firstText(info.event, info.headline))
    && !/no tsunami (warning|advisory|watch|threat)/i.test(copy);
  const isPhilippinesRelevant = /philippin/i.test(copy)
    || isInsidePhilippines(getCapCoordinates(info.area));

  if (!isActionable || !isPhilippinesRelevant) return null;

  return {
    id: 'ptwc-' + firstText(alert.identifier, alert.sent),
    title: firstText(info.headline, info.event) || 'Tsunami Advisory',
    description: firstText(info.description, info.instruction)
      || 'Open the PTWC bulletin for complete threat information.',
    publishedAt: asIsoDate(alert.sent ?? Date.now()),
    severity: capSeverity(info.severity),
    source: 'NOAA PTWC',
    sourceUrl: firstText(info.web, 'https://www.tsunami.gov/'),
    category: 'tsunami',
    coordinates: getCapCoordinates(info.area),
    affectedAreas: getCapAffectedAreas(info.area),
    instructions: asPlainText(firstText(info.instruction)),
  };
};

const fetchGdacsAlerts = async () => {
  const response = await axios.get(GDACS_API_URL, {
    timeout: CONFIG.api.timeout,
    headers: { Accept: 'application/geo+json, application/json' },
  });
  const features = Array.isArray(response.data?.features)
    ? response.data.features
    : Array.isArray(response.data) ? response.data : [];

  return features.map(normalizeGdacsFeature).filter(Boolean);
};

const fetchUsgsAlerts = async () => {
  const startTime = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString();
  const response = await axios.get(USGS_API_URL, {
    timeout: CONFIG.api.timeout,
    params: {
      format: 'geojson',
      starttime: startTime,
      minlatitude: PHILIPPINES_BOUNDS.minLatitude,
      maxlatitude: PHILIPPINES_BOUNDS.maxLatitude,
      minlongitude: PHILIPPINES_BOUNDS.minLongitude,
      maxlongitude: PHILIPPINES_BOUNDS.maxLongitude,
      minmagnitude: 3.5,
      orderby: 'time',
    },
  });
  const features = Array.isArray(response.data?.features) ? response.data.features : [];
  return features.map(normalizeUsgsFeature).filter(Boolean);
};

const fetchPagasaAlerts = async () => {
  const response = await axios.get(PAGASA_FEED_URL, {
    timeout: CONFIG.api.timeout,
    responseType: 'text',
    headers: { Accept: 'application/atom+xml, application/xml, text/xml' },
  });
  const feed = xmlParser.parse(response.data)?.feed;
  const candidates = asArray(feed?.entry)
    .filter((entry) => {
      const updatedAt = new Date(entry?.updated).getTime();
      return Number.isFinite(updatedAt)
        && Date.now() - updatedAt <= PAGASA_CANDIDATE_WINDOW_MS;
    })
    .slice(0, 16);

  const capResults = await Promise.allSettled(candidates.map(async (entry) => {
    const capUrl = asArray(entry?.link).find((item) => item?.['@_href'])?.['@_href'];
    if (!capUrl) return null;

    const capResponse = await axios.get(capUrl, {
      timeout: CONFIG.api.timeout,
      responseType: 'text',
      headers: { Accept: 'application/cap+xml, application/xml, text/xml' },
    });
    return normalizePagasaCap(entry, xmlParser.parse(capResponse.data));
  }));

  return capResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .filter(Boolean);
};

const fetchEonetAlerts = async () => {
  const response = await axios.get(EONET_API_URL, {
    timeout: CONFIG.api.timeout,
    params: {
      bbox: [
        PHILIPPINES_BOUNDS.minLongitude,
        PHILIPPINES_BOUNDS.maxLatitude,
        PHILIPPINES_BOUNDS.maxLongitude,
        PHILIPPINES_BOUNDS.minLatitude,
      ].join(','),
      days: 30,
      status: 'open',
      limit: 100,
    },
  });
  const events = Array.isArray(response.data?.events) ? response.data.events : [];
  return events.map(normalizeEonetEvent).filter(Boolean);
};

const fetchPtwcAlerts = async () => {
  const response = await axios.get(PTWC_CAP_URL, {
    timeout: CONFIG.api.timeout,
    responseType: 'text',
    headers: { Accept: 'application/cap+xml, application/xml, text/xml' },
  });
  const alert = normalizePtwcCap(xmlParser.parse(response.data));
  return alert ? [alert] : [];
};

const fetchOfficialAlerts = async () => {
  if (!CONFIG.api.officialAlertsUrl) return [];

  const response = await axios.get(CONFIG.api.officialAlertsUrl, {
    timeout: CONFIG.api.timeout,
    headers: { Accept: 'application/json' },
  });
  const alerts = Array.isArray(response.data?.alerts)
    ? response.data.alerts
    : Array.isArray(response.data) ? response.data : [];

  return alerts.map(normalizeOfficialAlert).filter(Boolean);
};

const deduplicateAlerts = (alerts) => {
  const seen = new Set();

  return alerts
    .filter((alert) => {
      const key = (alert.category + ':' + alert.title)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => new Date(right.publishedAt) - new Date(left.publishedAt));
};

export const fetchDisasters = async () => {
  const requests = [
    fetchPagasaAlerts(),
    fetchGdacsAlerts(),
    fetchUsgsAlerts(),
    fetchEonetAlerts(),
    fetchPtwcAlerts(),
  ];
  if (CONFIG.api.officialAlertsUrl) requests.push(fetchOfficialAlerts());

  const results = await Promise.allSettled(requests);
  const successful = results.filter((result) => result.status === 'fulfilled');

  if (successful.length === 0) {
    throw new Error('Live alert providers are temporarily unavailable.');
  }

  return deduplicateAlerts(successful.flatMap((result) => result.value));
};
