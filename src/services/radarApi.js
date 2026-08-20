const RAINVIEWER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json';

const toTileTemplate = (frame) => (
  `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`
);

export const fetchRadarFrames = async () => {
  const response = await fetch(RAINVIEWER_MAPS_URL);

  if (!response.ok) {
    throw new Error(`RainViewer API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const frames = [
    ...(data?.radar?.past ?? []),
    ...(data?.radar?.nowcast ?? []),
  ].filter((frame) => frame?.path && frame?.time);

  if (!frames.length) {
    throw new Error('No radar tile frame is currently available.');
  }

  return frames.slice(-6).map((frame) => ({
    time: frame.time,
    label: new Date(frame.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tileUrl: toTileTemplate(frame),
  }));
};

export const fetchLatestRadarTileTemplate = async () => {
  const frames = await fetchRadarFrames();
  return frames[frames.length - 1].tileUrl;
};
