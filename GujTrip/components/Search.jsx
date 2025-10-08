import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator
} from "react-native";
import { database } from "./firebase"; // Adjust path as needed
import { ref, onValue } from "firebase/database";
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import ThemedTextInput from './ui/ThemedTextInput';
import ThemedButton from './ui/ThemedButton';
import ThemedCard from './ui/ThemedCard';
import LoadingSpinner from './ui/LoadingSpinner';

const Search = ({ navigation }) => {
  // Default "current location" as Rajkot
  const defaultCurrentLocation = { latitude: 22.2824, longitude: 70.7678, name: "Your Location" };

  const [from, setFrom] = useState(defaultCurrentLocation.name);
  const [to, setTo] = useState("");
  const [fromLatLng, setFromLatLng] = useState({ latitude: defaultCurrentLocation.latitude, longitude: defaultCurrentLocation.longitude });
  const [toLatLng, setToLatLng] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState({});
  const [places, setPlaces] = useState({});

  const toInputRef = useRef(null);

  // Fetch hotels and places data from Firebase
  useEffect(() => {
    setLoading(true);

    const hotelsRef = ref(database, 'hotels');
    onValue(hotelsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setHotels(data);
    });

    const placesRef = ref(database, 'places');
    onValue(placesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allPlaces = {};
        Object.values(data).forEach(cityPlaces => {
          Object.entries(cityPlaces).forEach(([key, place]) => {
            allPlaces[key] = place;
          });
        });
        setPlaces(allPlaces);
      }
    });

    setLoading(false);
  }, []);

  // Auto focus on "To" field when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (toInputRef.current) toInputRef.current.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Generate suggestions based on input
  const generateSuggestions = (query, field) => {
    if (!query) return [];

    const suggestions = [];

    // Add default "current location"
    if ("your location".includes(query.toLowerCase()) || "current location".includes(query.toLowerCase()) || query.toLowerCase().trim() === "") {
      suggestions.push({
        id: 'current-location',
        name: defaultCurrentLocation.name,
        type: 'location',
        latitude: defaultCurrentLocation.latitude,
        longitude: defaultCurrentLocation.longitude,
        city: "Rajkot",
        address: defaultCurrentLocation.name
      });
    }

    // Search hotels
    Object.entries(hotels).forEach(([id, hotel]) => {
      if (hotel.name && hotel.name.toLowerCase().includes(query.toLowerCase()) &&
        hotel.latitude && hotel.longitude) {
        suggestions.push({
          id: id,
          name: hotel.name,
          type: 'hotel',
          latitude: parseFloat(hotel.latitude),
          longitude: parseFloat(hotel.longitude),
          city: hotel.city || "",
          address: hotel.address || ""
        });
      }
    });

    // Search places
    Object.entries(places).forEach(([id, place]) => {
      if (place.name && place.name.toLowerCase().includes(query.toLowerCase()) &&
        place.latitude && place.longitude) {
        suggestions.push({
          id: id,
          name: place.name,
          type: 'place',
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude),
          city: place.city || "",
          address: place.address || ""
        });
      }
    });

    return suggestions;
  };

  const handleFromChange = (text) => {
    setFrom(text);
    if (text.length > 0) {
      setFromSuggestions(generateSuggestions(text, 'from'));
      setShowFromSuggestions(true);
    } else {
      setShowFromSuggestions(false);
    }
  };

  const handleToChange = (text) => {
    setTo(text);
    if (text.length > 0) {
      setToSuggestions(generateSuggestions(text, 'to'));
      setShowToSuggestions(true);
    } else {
      setShowToSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion, field) => {
    if (field === 'from') {
      setFrom(suggestion.name);
      setFromLatLng({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      });
      setShowFromSuggestions(false);
    } else {
      setTo(suggestion.name);
      setToLatLng({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      });
      setShowToSuggestions(false);
    }
  };

  const handleSearch = () => {
    if (!toLatLng) {
      alert("Please select a valid destination");
      return;
    }

    navigation.navigate('Map', {
      from: {
        name: from,
        latitude: fromLatLng.latitude,
        longitude: fromLatLng.longitude
      },
      to: {
        name: to,
        latitude: toLatLng.latitude,
        longitude: toLatLng.longitude
      }
    });
  };

  const renderSuggestionItem = ({ item }, field) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item, field)}
    >
      <Text style={styles.suggestionText}>
        {item.type === 'hotel' ? '' :
          item.type === 'place' ? '' :
            item.type === 'location' ? '' : ''}
        {item.name}
      </Text>
      {(item.city || item.address) && (
        <Text style={styles.suggestionSubtext}>
          {item.city ? item.city : ''}{item.city && item.address ? ', ' : ''}{item.address ? item.address : ''}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.form}>
            {/* From Field */}
            <Text style={styles.label}>From : </Text>
            <View>
              <TextInput
                style={styles.input}
                value={from}
                onChangeText={handleFromChange}
                placeholder="Enter starting point"
                placeholderTextColor="#999"
                onFocus={() => {
                  if (from.length > 0) {
                    setFromSuggestions(generateSuggestions(from, 'from'));
                    setShowFromSuggestions(true);
                  }
                }}
              />
              {showFromSuggestions && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={fromSuggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={(item) => renderSuggestionItem(item, 'from')}
                    keyboardShouldPersistTaps="always"
                  />
                </View>
              )}
            </View>

            {/* To Field */}
            <Text style={styles.label}>To : </Text>
            <View>
              <TextInput
                style={styles.input}
                ref={toInputRef}
                value={to}
                onChangeText={handleToChange}
                placeholder="Enter destination"
                placeholderTextColor="#999"
                onFocus={() => {
                  if (to.length > 0) {
                    setToSuggestions(generateSuggestions(to, 'to'));
                    setShowToSuggestions(true);
                  }
                }}
              />
              {showToSuggestions && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={toSuggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={(item) => renderSuggestionItem(item, 'to')}
                    keyboardShouldPersistTaps="always"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Search Button at Bottom */}
          <View style={styles.bottomButtonWrapper}>
            {loading ? (
              <ActivityIndicator size="large" color="#007BFF" />
            ) : (
              <ThemedButton
                title="Find Route"
                onPress={handleSearch}
                disabled={!toLatLng}
                fullWidth
                size="large"
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  inner: { flex: 1, justifyContent: "space-between", padding: 20 },
  form: { width: "100%", backgroundColor: "#fff" },
  label: { fontSize: 16, color: "#555", marginBottom: 5, marginTop: 10, fontWeight: "500" },
  input: { width: "100%", paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, fontSize: 16, color: "#000", backgroundColor: "#fff" },
  suggestionsContainer: { maxHeight: 150, borderWidth: 1, borderColor: "#ddd", borderRadius: 5, backgroundColor: "#fff", marginTop: 5 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  suggestionText: { fontSize: 16, color: "#333" },
  suggestionSubtext: { fontSize: 12, color: "#777", marginTop: 2 },
  bottomButtonWrapper: { width: "100%", paddingBottom: 10 },
  button: { backgroundColor: "#007BFF", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default Search;