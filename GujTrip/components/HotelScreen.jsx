// components/HotelScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { ref, get, child } from "firebase/database";
import { database } from "./firebase";

// Theme and UI Components
import { colors, typography, spacing, borderRadius, shadows, dimensions } from '../theme';
import ThemedTextInput from './ui/ThemedTextInput';
import ThemedCard from './ui/ThemedCard';

const SERVER_URL = "http://192.168.1.72:5000";

const HotelsScreen = () => {
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const snapshot = await get(child(ref(database), "hotels"));
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val());
          setHotels(data);
          setFilteredHotels([]);
        }
      } catch (error) {
        console.error("Error fetching hotels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredHotels([]);
      setSuggestions([]);
      return;
    }

    const results = hotels.filter((hotel) =>
      hotel.name.toLowerCase().includes(text.toLowerCase()) ||
      hotel.address.toLowerCase().includes(text.toLowerCase())
    );
    setSuggestions(results.slice(0, 5));
    setFilteredHotels(results);
  };

  const handleSelectSuggestion = (hotel) => {
    setSearchText(hotel.name);
    setSuggestions([]);
    setFilteredHotels([hotel]);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setSuggestions([]);
    setFilteredHotels([]);
  };

  const renderHotel = ({ item }) => (
    <ThemedCard style={styles.card} padding="medium">
      {/* Hotel Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Hotel Name</Text>
        <Text style={styles.hotelName}>{item.name}</Text>
      </View>

      {/* Hotel Address */}
      <View style={styles.section}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>

      {/* Food Details */}
      <View style={styles.section}>
        <Text style={styles.label}>Food Details</Text>
        <Text style={styles.foodDetails}>
          {item.foodDetails || "No food details available"}
        </Text>
      </View>

      {/* Food Type */}
      <View style={styles.section}>
        <Text style={styles.label}>Food Type</Text>
        <Text style={styles.foodType}>
          {item.foodType === "veg"
            ? "Vegetarian"
            : item.foodType === "non-veg"
            ? "Non-Vegetarian"
            : "Both"}
        </Text>
      </View>

      {/* Timings */}
      <View style={styles.section}>
        <Text style={styles.label}>Timings</Text>
        <Text style={styles.timings}>
          {item.openingTime} - {item.closingTime}
        </Text>
      </View>

      {/* Hotel Images */}
      {item.images && item.images.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.label}>Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {item.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: `${SERVER_URL}${img.content}` }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.noImages}>No images available</Text>
        </View>
      )}
    </ThemedCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>Hotels & Restaurants</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <ThemedTextInput
          placeholder="Search hotels and restaurants..."
          value={searchText}
          onChangeText={handleSearch}
          showClearButton={searchText.length > 0}
          onClear={handleClearSearch}
          style={styles.searchInput}
        />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <ThemedCard style={styles.suggestionsBox} padding="none">
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text style={styles.suggestionText}>
                    {item.name} - {item.address}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </ThemedCard>
        )}
      </View>

      {/* Hotels List */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : searchText.trim() !== "" && filteredHotels.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noData}>No hotels found</Text>
          </View>
        ) : (
          <FlatList
            data={searchText.trim() !== "" ? filteredHotels : []}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={renderHotel}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.noDataContainer}>
                <Text style={styles.noData}>
                  Search for hotels and restaurants to view details
                </Text>
              </View>
            )}
          />
        )}
      </View>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  noData: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hotelName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  address: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.md,
  },
  foodDetails: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.md,
  },
  foodType: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  timings: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  imageScroll: {
    marginTop: spacing.sm,
  },
  image: {
    width: dimensions.screenWidth - 120,
    height: 180,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  noImages: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    fontStyle: 'italic',
  },
});

export default HotelsScreen;
