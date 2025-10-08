import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const MapScreen = () => {
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  const API_URL = 'http://192.168.1.72:5000/optimize-route';
  const PLACES_LIST = ['Gandhi Ashram', 'Kankaria Lake', 'Atmiya'];
  const INITIAL_POINT = 'Gandhi Ashram';

  const fetchRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          places: PLACES_LIST,
          initial_point: INITIAL_POINT
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const transformedData = {
        ...data,
        waypoints: data.path.map((place, index) => ({
          name: place,
          coordinates: data.coordinates[index]
        }))
      };

      setRouteData(transformedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, []);

  const handleRetry = () => {
    fetchRoute();
  };

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
      <style>
        html, body, #map { 
          height: 100%; 
          margin: 0; 
          padding: 0; 
          overflow: hidden;
        }
        #zoomButton {
          position: absolute;
          align-content: center;
          bottom: 50px;
          right: 20px;
          z-index: 1000;
          background-color: white;
          padding: 8px;
          border: 0px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: bold;
        }
        .zoomImg {
          width: 38px;
          height: 38px;
        }
        .custom-icon {
          background: #4285F4;
          border: 2px solid white;
          color: white;
          border-radius: 50%;
          text-align: center;
          font-weight: bold;
          line-height: 30px;
          width: 30px;
          height: 30px;
        }
      </style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
    </head>
    <body>
      <div id="zoomButton" onclick="zoomToRoute()"></div>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
      <script>
        let map;
        let routeLayer;
        let markers = [];
        
        function initMap() {
          map = L.map('map', {
            preferCanvas: true,
            zoomControl: true
          }).setView([22.8, 71.2], 7);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
        }
        
        function zoomToRoute() {
          if (routeLayer) {
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
          }
        }
        
        window.drawOptimizedRoute = function(routeData) {
          if (routeLayer) map.removeLayer(routeLayer);
          markers.forEach(m => map.removeLayer(m));
          markers = [];
          
          // Add all markers
          routeData.waypoints.forEach((wp, i) => {
            const marker = L.marker([wp.coordinates[0], wp.coordinates[1]], {
              icon: L.divIcon({
                className: 'custom-icon',
                html: (i+1).toString(),
                iconSize: [30, 30]
              })
            }).addTo(map)
              .bindPopup('<b>' + wp.name + '</b><br>' + 
                         wp.coordinates[0].toFixed(6) + ', ' + 
                         wp.coordinates[1].toFixed(6));
            markers.push(marker);
          });
          
          // Draw only outward route
          if (routeData.geometry && routeData.geometry.length > 0) {
            const latlngs = routeData.geometry.map(coord => [coord[1], coord[0]]);
            routeLayer = L.polyline(latlngs, {
              color: '#4285F4',
              weight: 5,
              opacity: 0.8,
              lineJoin: 'round'
            }).addTo(map);
            
            // Add start and end markers
            if (latlngs.length > 0) {
              // Start marker (green)
              L.circleMarker(latlngs[0], {
                radius: 8,
                fillColor: "#4CAF50",
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              }).addTo(map).bindPopup("Start: " + routeData.path[0]);
              
              // End marker (red)
              if (latlngs.length > 1) {
                L.circleMarker(latlngs[latlngs.length-1], {
                  radius: 8,
                  fillColor: "#F44336",
                  color: "#fff",
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.8
                }).addTo(map).bindPopup("End: " + routeData.path[routeData.path.length-1]);
              }
            }
            
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
          }
        };
        
        document.addEventListener('DOMContentLoaded', initMap);
      </script>
    </body>
  </html>
  `;

  const handleWebViewLoad = () => {
    if (routeData) {
      const jsCode = `window.drawOptimizedRoute(${JSON.stringify(routeData)}); true;`;
      webViewRef.current?.injectJavaScript(jsCode);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Calculating optimal route...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading route</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoad={handleWebViewLoad}
        style={styles.webview}
      />
      
      {routeData && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Optimal Route</Text>
          <View style={styles.routeSteps}>
            {routeData.path.map((place, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{place}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Round Trip Distance</Text>
              <Text style={styles.statValue}>{routeData.round_trip_distance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Round Trip Time</Text>
              <Text style={styles.statValue}>{routeData.round_trip_time} mins</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  webview: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  routeSteps: {
    marginBottom: 12,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  zoomButton: {
    position: 'absolute',
    height: 25,
    width: 25,
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 30,
    elevation: 5
  },
  zoomImg: {
    height: 25,
    width: 25,
  }
});

export default MapScreen;