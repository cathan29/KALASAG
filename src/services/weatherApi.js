const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export const WEATHER_DESCRIPTIONS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

const asNumberOrNull = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const buildWeatherUrl = ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation',
    hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '3',
  });

  return `${OPEN_METEO_URL}?${params.toString()}`;
};

const normalizeWeatherData = (data, location) => {
  const current = data?.current ?? {};
  const weatherCode = current?.weather_code;
  const temperature = asNumberOrNull(current?.temperature_2m);
  const apparentTemperature = asNumberOrNull(current?.apparent_temperature);
  const humidity = asNumberOrNull(current?.relative_humidity_2m);
  const windSpeed = asNumberOrNull(current?.wind_speed_10m);
  const precipitation = asNumberOrNull(current?.precipitation);

  return {
    ...data,
    location,
    city: location?.label ?? 'Current Location',
    temperature,
    condition: WEATHER_DESCRIPTIONS[weatherCode] ?? 'Current conditions unavailable',
    current: {
      ...current,
      temperature_2m: temperature,
      apparent_temperature: apparentTemperature,
      relative_humidity_2m: humidity,
      wind_speed_10m: windSpeed,
      precipitation,
    },
    main: {
      temp: temperature,
      feels_like: apparentTemperature,
      humidity,
    },
    weather: [
      {
        id: weatherCode ?? 'unknown',
        description: WEATHER_DESCRIPTIONS[weatherCode] ?? 'Current conditions unavailable',
      },
    ],
    wind: {
      speed: windSpeed,
      direction: current?.wind_direction_10m,
    },
  };
};

export const fetchWeather = async ({ latitude, longitude, label }) => {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    throw new Error('Current GPS location is required before fetching weather.');
  }

  const response = await fetch(buildWeatherUrl({ latitude, longitude }));

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    data: normalizeWeatherData(data, {
      latitude: Number(latitude),
      longitude: Number(longitude),
      label,
    }),
  };
};
