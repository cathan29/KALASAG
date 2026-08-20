import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { THEME } from '../constants/theme';

const MapScreen = () => {
  const initialRegion = {
    latitude: 12.8797,
    longitude: 121.7740,
    latitudeDelta: 15,
    longitudeDelta: 15,
  };

  // Dark map style for Google Maps
  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "administrative.country",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#808080" }]
    },
    {
      "featureType": "administrative.land_area",
      "elementType": "geometry",
      "stylers": [{ "color": "#444444" }]
    },
    {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "color": "#1b3617" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#2c2825" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{ "color": "#2c2825" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [{ "color": "#2c2825" }]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [{ "color": "#2c2825" }]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [{ "color": "#2f3948" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#000000" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    }
  ];

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={mapStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapScreen;
