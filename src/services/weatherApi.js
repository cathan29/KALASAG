const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

const MODEL_SUFFIXES = ['best_match', 'jma_seamless', 'gfs_seamless', 'icon_seamless'];
const MODEL_NAMES = ['Open-Meteo Best Match', 'JMA', 'NOAA GFS', 'DWD ICON'];
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const THUNDER_CODES = new Set([95, 96, 99]);

export const WEATHER_DESCRIPTIONS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle', 56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

const asNumberOrNull = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const median = (values) => {
  const numbers = values.map(asNumberOrNull).filter((value) => value !== null).sort((a, b) => a - b);
  if (!numbers.length) return null;
  const middle = Math.floor(numbers.length / 2);
  return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2;
};

const modelValuesAt = (section, variable, index) => MODEL_SUFFIXES
  .map((suffix) => section?.[`${variable}_${suffix}`]?.[index])
  .map(asNumberOrNull)
  .filter((value) => value !== null);

const weatherCodeFromConsensus = (codes, precipitation, fallbackCode) => {
  const thunderVotes = codes.filter((code) => THUNDER_CODES.has(code)).length;
  const rainVotes = codes.filter((code) => RAIN_CODES.has(code)).length;
  const requiredVotes = Math.max(2, Math.ceil(codes.length / 2));

  if (thunderVotes >= requiredVotes) return 95;
  if (rainVotes >= requiredVotes) {
    if (precipitation >= 7.5) return 65;
    if (precipitation >= 2.5) return 63;
    if (precipitation >= 0.5) return 61;
    return 51;
  }

  return asNumberOrNull(fallbackCode) ?? codes[0] ?? null;
};

const findCurrentHourIndex = (times, currentTime) => {
  if (!Array.isArray(times) || !times.length) return -1;
  const hourKey = String(currentTime ?? '').slice(0, 13);
  const exactIndex = times.findIndex((time) => String(time).startsWith(hourKey));
  if (exactIndex >= 0) return exactIndex;
  return times.reduce((bestIndex, time, index) => {
    const distance = Math.abs(new Date(time).getTime() - Date.now());
    const bestDistance = Math.abs(new Date(times[bestIndex]).getTime() - Date.now());
    return distance < bestDistance ? index : bestIndex;
  }, 0);
};

const normalizeHourly = (hourly = {}) => {
  const times = hourly.time ?? [];
  return {
    time: times,
    temperature_2m: times.map((_, index) => median(modelValuesAt(hourly, 'temperature_2m', index))),
    precipitation: times.map((_, index) => median(modelValuesAt(hourly, 'precipitation', index))),
    precipitation_probability: times.map((_, index) => median(modelValuesAt(hourly, 'precipitation_probability', index))),
    weather_code: times.map((_, index) => {
      const codes = modelValuesAt(hourly, 'weather_code', index);
      const rain = median(modelValuesAt(hourly, 'precipitation', index)) ?? 0;
      return weatherCodeFromConsensus(codes, rain, hourly.weather_code_best_match?.[index]);
    }),
    relative_humidity_2m: hourly.relative_humidity_2m_best_match ?? hourly.relative_humidity_2m ?? [],
    wind_speed_10m: hourly.wind_speed_10m_best_match ?? hourly.wind_speed_10m ?? [],
    wind_direction_10m: hourly.wind_direction_10m_best_match ?? hourly.wind_direction_10m ?? [],
    wind_gusts_10m: hourly.wind_gusts_10m_best_match ?? hourly.wind_gusts_10m ?? [],
  };
};

const normalizeDaily = (daily = {}) => ({
  time: daily.time ?? [],
  weather_code: daily.weather_code_best_match ?? daily.weather_code ?? [],
  temperature_2m_max: daily.temperature_2m_max_best_match ?? daily.temperature_2m_max ?? [],
  temperature_2m_min: daily.temperature_2m_min_best_match ?? daily.temperature_2m_min ?? [],
  precipitation_sum: daily.precipitation_sum_best_match ?? daily.precipitation_sum ?? [],
  wind_speed_10m_max: daily.wind_speed_10m_max_best_match ?? daily.wind_speed_10m_max ?? [],
});

const buildWeatherUrl = ({ latitude, longitude }) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,rain,showers,cloud_cover',
    hourly: 'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    models: MODEL_SUFFIXES.join(','),
    timezone: 'auto',
    forecast_days: '7',
    cell_selection: 'land',
  });
  return `${OPEN_METEO_URL}?${params.toString()}`;
};

const normalizeWeatherData = (data, location) => {
  const rawCurrent = data?.current ?? {};
  const rawHourly = data?.hourly ?? {};
  const hourIndex = findCurrentHourIndex(rawHourly.time, rawCurrent.time);
  const modelRain = hourIndex >= 0 ? modelValuesAt(rawHourly, 'precipitation', hourIndex) : [];
  const modelCodes = hourIndex >= 0 ? modelValuesAt(rawHourly, 'weather_code', hourIndex) : [];
  const rainVotes = modelCodes.filter((code, index) => RAIN_CODES.has(code) || (modelRain[index] ?? 0) >= 0.1).length;
  const requiredVotes = Math.max(2, Math.ceil(Math.max(modelCodes.length, modelRain.length) / 2));
  const consensusPrecipitation = median(modelRain) ?? 0;
  const directPrecipitation = asNumberOrNull(rawCurrent.precipitation) ?? 0;
  const directRain = RAIN_CODES.has(rawCurrent.weather_code) || directPrecipitation >= 0.1;
  const consensusRain = rainVotes >= requiredVotes;
  const shouldOverrideRain = !directRain && consensusRain;
  const weatherCode = shouldOverrideRain
    ? weatherCodeFromConsensus(modelCodes, consensusPrecipitation, rawCurrent.weather_code)
    : asNumberOrNull(rawCurrent.weather_code);
  const precipitation = shouldOverrideRain
    ? Math.max(consensusPrecipitation, directPrecipitation)
    : directPrecipitation;
  const temperature = asNumberOrNull(rawCurrent.temperature_2m);
  const apparentTemperature = asNumberOrNull(rawCurrent.apparent_temperature);
  const humidity = asNumberOrNull(rawCurrent.relative_humidity_2m);
  const windSpeed = asNumberOrNull(rawCurrent.wind_speed_10m);
  const baseDescription = WEATHER_DESCRIPTIONS[weatherCode] ?? 'Current conditions unavailable';
  const condition = shouldOverrideRain ? `${baseDescription} likely now` : baseDescription;

  return {
    ...data,
    location,
    city: location?.label ?? 'Current Location',
    temperature,
    condition,
    current: {
      ...rawCurrent,
      temperature_2m: temperature,
      apparent_temperature: apparentTemperature,
      relative_humidity_2m: humidity,
      wind_speed_10m: windSpeed,
      precipitation,
      weather_code: weatherCode,
    },
    hourly: normalizeHourly(rawHourly),
    daily: normalizeDaily(data?.daily),
    weatherMeta: {
      source: 'Open-Meteo multi-model consensus',
      providers: MODEL_NAMES,
      modelCount: Math.max(modelCodes.length, modelRain.length),
      rainVotes,
      rainConsensusApplied: shouldOverrideRain,
      confidence: rainVotes >= 3 || directRain ? 'High' : rainVotes >= 2 ? 'Moderate' : 'Standard',
      generatedInMs: data?.generationtime_ms ?? null,
    },
    main: { temp: temperature, feels_like: apparentTemperature, humidity },
    weather: [{ id: weatherCode ?? 'unknown', description: condition }],
    wind: { speed: windSpeed, direction: rawCurrent.wind_direction_10m },
  };
};

export const fetchWeather = async ({ latitude, longitude, label }) => {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    throw new Error('Current GPS location is required before fetching weather.');
  }
  const response = await fetch(buildWeatherUrl({ latitude, longitude }));
  if (!response.ok) throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  return { data: normalizeWeatherData(data, { latitude: Number(latitude), longitude: Number(longitude), label }) };
};
