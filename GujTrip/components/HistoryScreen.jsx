// components/HistoryScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ref, get, child } from "firebase/database";
import { database } from "./firebase";
import { useNavigation } from "@react-navigation/native";

// Theme and UI Components
import { colors, typography, spacing, borderRadius, shadows, dimensions } from '../theme';
import ThemedTextInput from './ui/ThemedTextInput';
import ThemedButton from './ui/ThemedButton';
import ThemedCard from './ui/ThemedCard';

const SERVER_URL = "http://192.168.1.72:5000";

const HistoryScreen = () => {
  const [placesData, setPlacesData] = useState({});
  const [allPlaces, setAllPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [historyItems, setHistoryItems] = useState([]);
  const [imageHeights, setImageHeights] = useState({});
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const snapshot = await get(child(ref(database), "places"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPlacesData(data);
          const placesList = [];
          Object.keys(data).forEach((city) => {
            Object.keys(data[city]).forEach((place) => {
              placesList.push({ city, place });
            });
          });
          setAllPlaces(placesList);
        }
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    };
    fetchPlaces();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredPlaces([]);
      return;
    }

    const filtered = allPlaces.filter(
      (item) =>
        item.city.toLowerCase().includes(text.toLowerCase()) ||
        item.place.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredPlaces(filtered.slice(0, 5));
  };

  const fetchHistory = async (city, place) => {
    setLoading(true);
    try {
      const snapshot = await get(
        child(ref(database), `history/${city}/${place}`)
      );
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyArray = Object.keys(data)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => ({
            id: key,
            ...data[key],
          }));
        setHistoryItems(historyArray);
        calculateImageHeights(historyArray);
      } else {
        setHistoryItems([]);
        setImageHeights({});
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
    setLoading(false);
  };

  const calculateImageHeights = (items) => {
    items.forEach((item) => {
      if (item.type === "image" && item.content) {
        const imageUrl = `${SERVER_URL}${item.content.startsWith("/media") ? item.content : `/media/${item.content}`}`;
        Image.getSize(
          imageUrl,
          (width, height) => {
            const calculatedHeight = (dimensions.screenWidth * height) / width;
            setImageHeights((prev) => ({
              ...prev,
              [item.id]: calculatedHeight,
            }));
          },
          () => {
            setImageHeights((prev) => ({
              ...prev,
              [item.id]: 250,
            }));
          }
        );
      }
    });
  };

  const handleSelectPlace = (city, place) => {
    setSearchText(`${place} (${city})`);
    setFilteredPlaces([]);
    setSelectedCity(city);
    setSelectedPlace(place);
    fetchHistory(city, place);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setFilteredPlaces([]);
  };

  const handleVirtualView = () => {
    if (!selectedPlace) {
      alert("Please select a place first!");
      return;
    }
    navigation.navigate("View", {
      placeName: selectedPlace,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.header}>Place History</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <ThemedTextInput
            placeholder="Search places and cities..."
            value={searchText}
            onChangeText={handleSearch}
            showClearButton={searchText.length > 0}
            onClear={handleClearSearch}
            style={styles.searchInput}
          />

          {/* Suggestions */}
          {filteredPlaces.length > 0 && (
            <ThemedCard style={styles.suggestionsBox} padding="none">
              <FlatList
                data={filteredPlaces}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectPlace(item.city, item.place)}
                  >
                    <Text style={styles.suggestionText}>
                      {item.place} ({item.city})
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </ThemedCard>
          )}
        </View>

        {/* Selected Place */}
        {selectedPlace && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedPlaceText}>{selectedPlace}</Text>
          </View>
        )}

        {/* History Content */}
        <View style={styles.historyContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : historyItems.length === 0 ? (
            <View style={styles.noHistoryContainer}>
              <Text style={styles.noHistory}>
                {selectedPlace ? "No history available" : "Search and select a place to view history"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={historyItems}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ThemedCard style={styles.historyBlock} padding="medium">
                  {item.type === "paragraph" ? (
                    <Text style={styles.paragraph}>{item.content}</Text>
                  ) : item.type === "image" ? (
                    <Image
                      source={{
                        uri: `${SERVER_URL}${item.content.startsWith("/media") ? item.content : `/media/${item.content}`}`,
                      }}
                      style={[
                        styles.historyImage,
                        { height: imageHeights[item.id] || 250 },
                      ]}
                      resizeMode="cover"
                    />
                  ) : null}
                </ThemedCard>
              )}
            />
          )}
        </View>

        {/* Virtual View Button */}
        {historyItems.length > 0 && (
          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Watch Virtual View"
              onPress={handleVirtualView}
              fullWidth
              style={styles.virtualButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  header: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  suggestionsBox: {
    marginTop: spacing.sm,
    maxHeight: 220,
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  selectedSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  selectedPlaceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noHistory: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
  },
  historyBlock: {
    marginBottom: spacing.md,
  },
  paragraph: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.md,
  },
  historyImage: {
    width: "100%",
    borderRadius: borderRadius.md,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundPaper,
    ...shadows.light,
  },
  virtualButton: {
    marginBottom: spacing.sm,
  },
});

export default HistoryScreen;
