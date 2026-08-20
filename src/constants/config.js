export const CONFIG = {
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.kalasag.io/v1',
    reliefWebAppName: process.env.EXPO_PUBLIC_RELIEFWEB_APP_NAME || 'kalasag',
    timeout: 10000,
    retryAttempts: 3,
  },
  app: {
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  },
};
