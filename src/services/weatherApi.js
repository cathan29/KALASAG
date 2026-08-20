const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_LAT = 14.5995;
const DEFAULT_LON = 120.9842;

/**
 * Fetches current weather and daily precipitation sum for default PH coordinates.
 * @returns {Promise<Object>} The weather data.
 * @throws {Error} If the fetch fails.
 */
export const fetchWeather = async () => {
  const url = `${BASE_URL}?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&current_weather=true&daily=precipitation_sum`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};
