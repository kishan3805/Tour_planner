import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Alert, Image } from "react-native";
import { WebView } from "react-native-webview";

const PlanningScreen = ({ route, navigation }) => {
    const { planData } = route.params;
    const [loading, setLoading] = useState(true);
    const [routeData, setRouteData] = useState(null);
    const [error, setError] = useState(null);
    const [isMapFullScreen, setIsMapFullScreen] = useState(false);
    const webViewRef = React.useRef(null);

    // Update this IP to match your Flask server's IP
    const API_URL = "http://192.168.1.72:5000/optimize-route";

    useEffect(() => {
        fetchOptimizedRoute();
    }, []);

    // Function to format minutes into hours + minutes
    const formatTime = (minutes) => {
        if (!minutes || minutes <= 0) return "0 mins";
        const hrs = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return hrs > 0 ? `${hrs} hrs ${mins} mins` : `${mins} mins`;
    };

    // Function to calculate available time in minutes between dates
    const calculateAvailableTime = () => {
        const startDate = new Date(planData.startDate);
        const endDate = new Date(planData.endDate);

        // Calculate difference in milliseconds
        const timeDiff = endDate.getTime() - startDate.getTime();

        // Convert to minutes (1 day = 1440 minutes)
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const availableMinutes = daysDiff * 1440; // 24 hours * 60 minutes

        console.log(`Available time: ${daysDiff} days = ${availableMinutes} minutes`);
        return availableMinutes;
    };

    const fetchOptimizedRoute = async () => {
        setLoading(true);
        setError(null);

        try {
            // Calculate available time first
            const availableTime = calculateAvailableTime();

            // Prepare places list with proper coordinates
            const placesList = planData.places.map((place) => ({
                name: place.name,
                latitude: parseFloat(place.latitude || 0),
                longitude: parseFloat(place.longitude || 0),
                duration: parseInt(place.duration || 30), // Default 30 mins if missing
            }));

            // ✅ Fixed start point and end point
            const initialPoint = {
                name: "start",
                latitude: 22.2824,
                longitude: 70.7678,
                duration: 0,
            };

            console.log("Sending data to backend:", {
                places: placesList,
                initial_point: initialPoint,
            });

            // Send request to Flask API
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    places: placesList,
                    initial_point: initialPoint,
                }),
            });

            console.log("Raw response:", response);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server returned error:", errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("Optimized route response:", data);

            // Check if the response contains an error
            if (data.error) {
                throw new Error(data.error);
            }

            // ✅ Check if estimated time exceeds available time
            const totalEstimatedTime = data.round_trip_time;
            console.log(`Estimated time: ${totalEstimatedTime} mins, Available time: ${availableTime} mins`);

            if (totalEstimatedTime > availableTime) {
                const estimatedHours = Math.ceil(totalEstimatedTime / 60);
                const availableDays = Math.ceil(availableTime / 1440);

                Alert.alert(
                    "Insufficient Time",
                    `Your trip requires approximately ${formatTime(totalEstimatedTime)} but you only have ${availableDays} day(s) available.\n\nPlease reduce the number of places or extend your trip duration.`,
                    [
                        {
                            text: "Go Back",
                            onPress: () => navigation.goBack(),
                            style: "cancel"
                        }
                    ],
                    { cancelable: false }
                );
                setLoading(false);
                return;
            }

            setRouteData(data);
        } catch (err) {
            setError(err.message);
            console.error("Route optimization error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        fetchOptimizedRoute();
    };

    const handleWebViewLoad = () => {
        if (routeData) {
            const jsCode = `window.drawOptimizedRoute(${JSON.stringify(routeData)}); true;`;
            webViewRef.current?.injectJavaScript(jsCode);
        }
    };

    const toggleMapFullScreen = () => {
        setIsMapFullScreen(!isMapFullScreen);
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; overflow: hidden; }
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
          </style>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
        </head>
        <body>
        <div id="zoomButton" onclick="zoomToRoute()"><img class="zoomImg" src="data:image/png;base64,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" alt="Zoom" /></div>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
<script>
  let map;
  let routeLayer;
  let markers = [];

  function initMap() {
    map = L.map('map', { preferCanvas: true, zoomControl: true }).setView([22.8, 71.2], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }

  function zoomToRoute() {
    const initialLat = 22.2824;
    const initialLng = 70.7678;
    map.setView([initialLat, initialLng], 20);
  }

  window.drawOptimizedRoute = function(routeData) {
    if (routeLayer) map.removeLayer(routeLayer);
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    if (routeData.waypoints) {
      routeData.waypoints.forEach((wp, i) => {
        let marker;

        if (i === 0) {
          // Green dot for initial point
          marker = L.circleMarker([wp.coordinates[0], wp.coordinates[1]], {
            radius: 8,
            color: '#2ECC71', // Border color
            fillColor: '#2ECC71', // Fill color
            fillOpacity: 1
          }).addTo(map)
          .bindPopup('<b>Start Point</b><br>' + wp.name + '<br>' +
                     wp.coordinates[0].toFixed(6) + ', ' +
                     wp.coordinates[1].toFixed(6));
        } else {
          // Numbered markers for other points
          marker = L.marker([wp.coordinates[0], wp.coordinates[1]], {
            icon: L.divIcon({
              className: 'custom-icon',
              html: i.toString(),
              iconSize: [30, 30]
            })
          }).addTo(map)
          .bindPopup('<b>' + wp.name + '</b><br>' +
                     wp.coordinates[0].toFixed(6) + ', ' +
                     wp.coordinates[1].toFixed(6));
        }

        markers.push(marker);
      });
    }

    if (routeData.geometry && routeData.geometry.length > 0) {
      const latlngs = routeData.geometry.map(coord => [coord[1], coord[0]]);
      routeLayer = L.polyline(latlngs, {
        color: '#4285F4',
        weight: 5,
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
    }
  };

  document.addEventListener('DOMContentLoaded', initMap);
</script>

        </body>
      </html>
    `;

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
            <View style={[styles.mapContainer, isMapFullScreen && styles.fullScreenMap]}>
                <WebView
                    ref={webViewRef}
                    originWhitelist={["*"]}
                    source={{ html: htmlContent }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    onLoad={handleWebViewLoad}
                    style={styles.webview}
                />
                <TouchableOpacity
                    style={styles.fullScreenButton}
                    onPress={toggleMapFullScreen}
                >
                    <Image
                        source={
                            isMapFullScreen
                                ? require("./media/shrink.png") // For full-screen close
                                : require("./media/full.png")   // For expand mode
                        }
                        style={styles.fullScreenIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

            </View>

            {!isMapFullScreen && (
                <ScrollView style={styles.detailsContainer}>
                    <Text style={styles.title}>Your Trip Plan - {planData.city}</Text>

                    <View style={styles.dateSection}>
                        <Text style={styles.label}>Dates:</Text>
                        <Text style={styles.value}>
                            {new Date(planData.startDate).toDateString()} - {new Date(planData.endDate).toDateString()}
                        </Text>
                    </View>

                    {routeData && (
                        <View style={styles.routeSection}>
                            <Text style={styles.sectionTitle}>Optimized Route</Text>

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Total Distance</Text>
                                    <Text style={styles.statValue}>{routeData.round_trip_distance} km</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Estimated Time</Text>
                                    <Text style={styles.statValue}>
                                        {formatTime(routeData.round_trip_time)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.label}>Itinerary:</Text>
                            {routeData.waypoints &&
                                routeData.waypoints.slice(1).map((waypoint, index) => (
                                    <View key={index} style={styles.waypointContainer}>
                                        <View style={styles.stepNumber}>
                                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.waypointDetails}>
                                            <Text style={styles.waypointName}>{waypoint.name}</Text>
                                            <Text style={styles.waypointDuration}>
                                                Visit time: {formatTime(waypoint.duration)}
                                            </Text>
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
    mapContainer: {
        height: Dimensions.get("window").height * 0.4,
        position: 'relative',
    },
    fullScreenMap: {
        height: '100%',
        zIndex: 10,
    },
    webview: { flex: 1 },
    detailsContainer: { flex: 1, padding: 20 },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 15,
        color: "#FF5A5F",
        textAlign: "center",
    },
    fullScreenIcon: {
        width: 24,
        height: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 15,
        color: "#333",
    },
    dateSection: { marginBottom: 20 },
    routeSection: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 5 },
    value: { fontSize: 16, color: "#555", marginBottom: 5 },
    timeInfo: { fontSize: 14, color: "#666", fontStyle: "italic", marginBottom: 10 },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        marginBottom: 15,
        backgroundColor: "#f8f9fa",
        padding: 15,
        borderRadius: 8,
    },
    statItem: { alignItems: "center", minWidth: 100, marginVertical: 5 },
    statLabel: { fontSize: 14, color: "#777", marginBottom: 4, textAlign: "center" },
    statValue: { fontSize: 16, fontWeight: "bold", color: "#333", textAlign: "center" },
    waypointContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "#f8f9fa",
        padding: 12,
        borderRadius: 8,
    },
    stepNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#FF5A5F",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    stepNumberText: { color: "white", fontWeight: "bold", fontSize: 14 },
    waypointDetails: { flex: 1 },
    waypointName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    waypointDuration: { fontSize: 14, color: "#666" },
    loadingText: { marginTop: 16, fontSize: 16, color: "#333", textAlign: "center" },
    errorText: {
        color: "#d32f2f",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    errorMessage: {
        color: "#666",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: "#FF5A5F",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        alignSelf: "center",
    },
    retryButtonText: { color: "white", fontSize: 16, fontWeight: "500" },
    fullScreenButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
});

export default PlanningScreen;