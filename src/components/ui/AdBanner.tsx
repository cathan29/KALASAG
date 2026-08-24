import React, { useState } from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

/**
 * AdBanner Component
 *
 * A reusable component that displays a Google Mobile Ad banner.
 * It uses anchored adaptive banner size and test unit IDs for development.
 * Returns null if the ad fails to load to avoid leaving empty gaps in the UI.
 */
const AdBanner: React.FC = () => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <BannerAd
      unitId={TestIds.BANNER}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
      onAdFailedToLoad={(error) => {
        console.error('AdBanner failed to load: ', error);
        setHasError(true);
      }}
    />
  );
};

export default AdBanner;
