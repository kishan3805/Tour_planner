import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { database } from "./firebase";
import { ref, get } from "firebase/database";

const { width, height } = Dimensions.get("window");

const PlanDisplayScreen = ({ route, navigation, user }) => {
  const currentUser = user || route.params?.user || {};
  const phoneNumber = currentUser?.phone ? currentUser.phone.replace(/^\+91/, "") : null;
  const DEFAULT_PLAN_ID = phoneNumber ? `plan${phoneNumber}` : "plan_default";

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const webViewRef = useRef(null);

  const API_URL = "http://192.168.1.72:5000/optimize-route";

  useEffect(() => {
    const planId = route.params?.planId || DEFAULT_PLAN_ID;
    fetchPlanData(planId);
  }, []);

  const fetchPlanData = async (planId) => {
    setLoading(true);
    setError(null);
    try {
      const planRef = ref(database, `plans/${planId}`);
      const snapshot = await get(planRef);
      if (!snapshot.exists()) throw new Error("Plan not found in database");
      const data = snapshot.val();
      setPlanData(data);
      fetchOptimizedRoute(data);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes || minutes <= 0) return "0 mins";
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hrs > 0 ? `${hrs} hrs ${mins} mins` : `${mins} mins`;
  };

  const calculateAvailableTime = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff * 1440; // minutes in days
  };

  const fetchOptimizedRoute = async (planData) => {
    setError(null);
    try {
      const availableTime = calculateAvailableTime(planData.startDate, planData.endDate);

      const placesList = planData.places.map((p) => ({
        name: p.name,
        latitude: parseFloat(p.latitude || 0),
        longitude: parseFloat(p.longitude || 0),
        duration: parseInt(p.duration || 30),
      }));

      const initialPoint = {
        name: "start",
        latitude: 22.2824,
        longitude: 70.7678,
        duration: 0,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: placesList, initial_point: initialPoint }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errText}`);
      }

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      if (data.round_trip_time > availableTime) {
        Alert.alert(
          "Insufficient Time",
          `Your trip requires approximately ${formatTime(data.round_trip_time)} but you only have ${Math.ceil(availableTime / 1440)} day(s) available.\n\nPlease reduce places or extend your trip.`,
          [{ text: "Go Back", onPress: () => navigation.goBack(), style: "cancel" }],
          { cancelable: false }
        );
        setLoading(false);
        return;
      }

      setRouteData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    const planId = route.params?.planId || DEFAULT_PLAN_ID;
    fetchPlanData(planId);
  };

  const handleWebViewLoad = () => {
    if (routeData) {
      const jsCode = `window.drawOptimizedRoute(${JSON.stringify(routeData)}); true;`;
      webViewRef.current?.injectJavaScript(jsCode);
    }
  };

  const toggleMapFullScreen = () => setIsMapFullScreen((v) => !v);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; overflow: hidden; }
        .custom-icon {
          background: #FF5A5F;
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
      <div id="map" style="height: 100%; width: 100%;"></div>
      <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
      <script>
        let map, routeLayer, markers = [];
        function initMap() {
          map = L.map('map', { preferCanvas: true, zoomControl: true }).setView([22.8, 71.2], 7);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
        }
        window.drawOptimizedRoute = function(routeData) {
          if (routeLayer) map.removeLayer(routeLayer);
          markers.forEach(m => map.removeLayer(m));
          markers = [];
          if (routeData.waypoints && routeData.waypoints.length) {
            routeData.waypoints.forEach((wp, i) => {
              let marker;
              if (i === 0) {
                marker = L.circleMarker([wp.coordinates[0], wp.coordinates[1]], {
                  radius: 8, fillColor: "#FF5A5F", color: "#D9434E", weight: 2, opacity:1, fillOpacity: 0.9
                }).addTo(map).bindPopup('<b>Start Point</b><br>' + wp.name);
              } else {
                marker = L.marker([wp.coordinates[0], wp.coordinates[1]], {
                  icon: L.divIcon({className: 'custom-icon', html: (i).toString(), iconSize: [30, 30]})
                }).addTo(map).bindPopup('<b>' + wp.name + '</b>');
              }
              markers.push(marker);
            });
          }
          if (routeData.geometry && routeData.geometry.length) {
            const latlngs = routeData.geometry.map(coord => [coord[1], coord[0]]);
            routeLayer = L.polyline(latlngs, {
              color: '#FF5A5F', weight: 5, opacity: 0.8, lineJoin: 'round'
            }).addTo(map);
            map.fitBounds(routeLayer.getBounds(), {padding: [50, 50]});
          }
        };
        document.addEventListener('DOMContentLoaded', initMap);
      </script>
    </body>
    </html>`;

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Loading plan data...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Error loading plan</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );

  if (!planData)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No plan data found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={[styles.mapContainer, isMapFullScreen && styles.mapFullScreen]}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          onLoad={handleWebViewLoad}
          style={styles.webview}
        />
        <TouchableOpacity style={styles.fullScreenBtn} onPress={toggleMapFullScreen}>
          <Image
            source={
              isMapFullScreen
                ? require("./media/shrink.png")
                : require("./media/full.png")
            }
            style={styles.fullScreenIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {!isMapFullScreen && (
        <ScrollView style={styles.detailSection}>
          <Text style={styles.title}>Your Trip Plan - {planData.city || "Unknown City"}</Text>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dates:</Text>
            <Text style={styles.dateValue}>
              {new Date(planData.startDate).toDateString()} - {new Date(planData.endDate).toDateString()}
            </Text>
          </View>

          {routeData && (
            <View style={styles.routeInfo}>
              <Text style={styles.sectionTitle}>Optimized Route</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Distance</Text>
                  <Text style={styles.statValue}>{routeData.round_trip_distance} km</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Estimated Time</Text>
                  <Text style={styles.statValue}>{formatTime(routeData.round_trip_time)}</Text>
                </View>
              </View>

              <Text style={styles.subLabel}>Itinerary:</Text>
              {routeData.waypoints?.slice(1).map((wp, index) => (
                <View key={index} style={styles.waypointRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepText}>{index + 1}</Text>
                  </View>
                  <View style={styles.waypointDetails}>
                    <Text style={styles.waypointName}>{wp.name}</Text>
                    <Text style={styles.waypointDuration}>Visit time: {formatTime(wp.duration)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 20,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#333", textAlign: "center" },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMsg: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: "#FF5A5F",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: "white", fontSize: 16, fontWeight: "600" },

  mapContainer: {
    height: height * 0.5,
    position: "relative",
  },
  mapFullScreen: {
    height: "100%",
    zIndex: 10,
  },
  webview: { flex: 1 },
  fullScreenBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fullScreenIcon: { width: 22, height: 22 },

  detailSection: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF5A5F",
    marginBottom: 14,
    textAlign: "center",
  },

  dateRow: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  dateLabel: { fontWeight: "600", color: "#333", fontSize: 16, marginRight: 8 },
  dateValue: { fontSize: 16, color: "#555" },

  routeInfo: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statBox: { alignItems: "center" },
  statLabel: { fontSize: 14, color: "#777", marginBottom: 4, textAlign: "center" },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#333" },

  subLabel: {
    fontWeight: "600",
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
    marginLeft: 8,
  },

  waypointRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF5A5F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  stepText: { color: "white", fontWeight: "bold", fontSize: 15 },
  waypointDetails: { flex: 1 },
  waypointName: { fontWeight: "600", fontSize: 16, color: "#333", marginBottom: 3 },
  waypointDuration: { color: "#666", fontSize: 14 },
});

export default PlanDisplayScreen;
