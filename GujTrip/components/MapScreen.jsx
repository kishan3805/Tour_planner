import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const MapScreen = ({ route }) => {
  const { from, to } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    if (from && to) fetchRoute();
    else {
      setError('Missing route parameters');
      setLoading(false);
    }
  }, [from, to]);

  const fetchRoute = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use OpenStreetMap Nominatim API to get driving directions
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`
      );

      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error('Failed to fetch route data');
      }

      const routeInfo = data.routes[0];
      const distance = (routeInfo.distance / 1000).toFixed(1); // Convert meters to km
      const duration = Math.round(routeInfo.duration / 60); // Convert seconds to minutes

      const formattedRouteData = {
        path: [from.name, to.name],
        coordinates: [
          [from.latitude, from.longitude],
          [to.latitude, to.longitude]
        ],
        geometry: routeInfo.geometry.coordinates, // This is the detailed route geometry
        round_trip_distance: distance,
        round_trip_time: duration,
        waypoints: [
          { name: from.name, coordinates: [from.latitude, from.longitude] },
          { name: to.name, coordinates: [to.latitude, to.longitude] }
        ]
      };

      setRouteData(formattedRouteData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch driving route');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => fetchRoute();

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        .custom-icon { background: #4285F4; border: 2px solid white; color: white; border-radius: 50%; text-align: center; font-weight: bold; line-height: 30px; width: 30px; height: 30px; }
        #zoomButton { position: absolute; bottom: 50px; right: 20px; z-index: 1000; background-color: white; padding: 8px; border-radius: 50px; cursor: pointer; font-weight: bold; }
        .zoomImg { width: 38px; height: 38px; }
      </style>
    </head>
    <body>
      <div id="zoomButton" onclick="zoomToRoute()">Zoom</div>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
      <script>
        let map; let routeLayer; let markers = [];
        function initMap() {
          map = L.map('map',{ preferCanvas:true, zoomControl:true }).setView([22.8,71.2],7);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom:19, attribution:'&copy; OpenStreetMap contributors' }).addTo(map);
        }
        function zoomToRoute() { if(routeLayer) map.fitBounds(routeLayer.getBounds(),{padding:[50,50]}); }
        window.drawOptimizedRoute = function(routeData) {
          if(routeLayer) map.removeLayer(routeLayer);
          markers.forEach(m=>map.removeLayer(m)); markers=[];
          routeData.waypoints.forEach((wp,i)=>{
            let marker;
            if(i===0){
              marker = L.circleMarker([wp.coordinates[0],wp.coordinates[1]],{radius:8,color:'#2ECC71',fillColor:'#2ECC71',fillOpacity:1}).addTo(map)
                .bindPopup('<b>Start Point</b><br>'+wp.name+'<br>'+wp.coordinates[0].toFixed(6)+', '+wp.coordinates[1].toFixed(6));
            } else {
              marker = L.circleMarker([wp.coordinates[0],wp.coordinates[1]],{radius:8,color:'#FF5A5F',fillColor:'#FF5A5F',fillOpacity:1}).addTo(map)
                .bindPopup('<b>Start Point</b><br>'+wp.name+'<br>'+wp.coordinates[0].toFixed(6)+', '+wp.coordinates[1].toFixed(6));
            }
            markers.push(marker);
          });
          
          // Convert GeoJSON coordinates to LatLng format for Leaflet
          const latlngs = routeData.geometry.map(c => [c[1], c[0]]);
          routeLayer = L.polyline(latlngs,{color:'#4285F4',weight:5,opacity:0.8,lineJoin:'round'}).addTo(map);
          map.fitBounds(routeLayer.getBounds(),{padding:[50,50]});
        };
        document.addEventListener('DOMContentLoaded', initMap);
      </script>
    </body>
  </html>
  `;

  useEffect(() => {
    if (routeData && webViewRef.current) {
      const jsCode = `window.drawOptimizedRoute(${JSON.stringify(routeData)}); true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [routeData]);

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4285F4" />
      <Text style={styles.loadingText}>Calculating driving route...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Error loading route</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => {
          if (routeData) {
            const jsCode = `window.drawOptimizedRoute(${JSON.stringify(routeData)}); true;`;
            webViewRef.current.injectJavaScript(jsCode);
          }
        }}
        style={styles.webview}
      />

      {/* Route info overlay */}
      {routeData && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Route Information</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{routeData.round_trip_distance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Estimated Time</Text>
              <Text style={styles.statValue}>
                {(() => {
                  const adjustedTime = Math.round(routeData.round_trip_time * 1.5);

                  return adjustedTime >= 60
                    ? `${Math.floor(adjustedTime / 60)} hr ${adjustedTime % 60 === 0 ? "" : adjustedTime % 60 + " min"
                    }`
                    : `${adjustedTime} min`;
                })()}
              </Text>


            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#777', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#333', textAlign: 'center' },
  errorText: { color: '#d32f2f', fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  errorMessage: { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  retryButton: { backgroundColor: '#4285F4', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4, alignSelf: 'center' },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' }
});

export default MapScreen;