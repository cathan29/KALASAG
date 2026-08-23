const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const isValidCoordinate = (coordinate) => (
  Number.isFinite(Number(coordinate?.latitude))
  && Number.isFinite(Number(coordinate?.longitude))
);

export const distanceBetweenKm = (from, to) => {
  if (!isValidCoordinate(from) || !isValidCoordinate(to)) return null;

  const latitudeDelta = toRadians(Number(to.latitude) - Number(from.latitude));
  const longitudeDelta = toRadians(Number(to.longitude) - Number(from.longitude));
  const fromLatitude = toRadians(Number(from.latitude));
  const toLatitude = toRadians(Number(to.latitude));
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const formatDistance = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) return 'Distance unavailable';
  if (distanceKm < 1) return `${Math.max(1, Math.round(distanceKm * 1000))} m away`;
  return `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km away`;
};
