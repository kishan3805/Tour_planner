import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Dashboard</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Login')}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: 'red', padding: 10, borderRadius: 5, marginTop: 10 },
  buttonText: { color: 'white', fontSize: 16 },
});










import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';

export default function LiveLocationScreen() {
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await axios.get('http://192.168.1.72:5000/location'); // Replace with your IP
        const { latitude, longitude } = res.data;
        setLocation({ latitude, longitude });
      } catch (error) {
        console.error('Location fetch failed:', error.message);
      }
    };

    fetchLocation(); // First fetch
    const interval = setInterval(fetchLocation, 5000); // Update every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Live Location (via Python):</Text>
      <Text style={styles.text}>Latitude: {location.latitude || 'Loading...'}</Text>
      <Text style={styles.text}>Longitude: {location.longitude || 'Loading...'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  text: {
    fontSize: 18, marginVertical: 8
  }
});
