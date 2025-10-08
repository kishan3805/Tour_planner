// components/planFormScreen.jsx - Redesigned with new theme

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ref, get, child, set } from "firebase/database";
import { database } from "./firebase";

// Theme and UI Components
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import ThemedCard from './ui/ThemedCard';
import ThemedButton from './ui/ThemedButton';
import LoadingSpinner from './ui/LoadingSpinner';

const defaultCities = [
  "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar",
  "Botad", "Chhota Udaipur", "Dahod", "Dang", "Dwarka", "Gandhinagar", "Gir Somnath",
  "Jamnagar", "Junagadh", "Katch", "Kheda", "Mahisagar", "Mahsana", "Morbi", "Narmada",
  "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat",
  "Surendranagar", "Tapi", "Vadodara", "Valsad"
];

const PlanFormScreen = ({ navigation, user }) => {
  const phoneNumber = user?.phone ? user.phone.replace(/^\+91/, '') : null;
  const DEFAULT_PLAN_ID = phoneNumber ? `plan${phoneNumber}` : "plan_default";

  const [loading, setLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [cities, setCities] = useState(defaultCities.map(name => ({ id: name, name })));
  const [places, setPlaces] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState([]);

  useEffect(() => {
    if (!selectedCity) return;

    const fetchData = async () => {
      setPlacesLoading(true);
      try {
        // Fetch places
        const placesSnapshot = await get(child(ref(database), "places"));
        let fetchedPlaces = [];
        
        if (placesSnapshot.exists()) {
          const data = placesSnapshot.val();
          Object.entries(data).forEach(([cityKey, cityPlaces]) => {
            Object.entries(cityPlaces).forEach(([placeKey, placeData]) => {
              if (
                cityKey.toLowerCase() === selectedCity.name.toLowerCase() ||
                (placeData.city && placeData.city.toLowerCase() === selectedCity.name.toLowerCase())
              ) {
                fetchedPlaces.push({
                  id: `${cityKey}_${placeKey}`,
                  ...placeData,
                });
              }
            });
          });
        }

        setPlaces(fetchedPlaces);
      } catch (err) {
        console.error("Error fetching data:", err);
        Alert.alert("Error", "Failed to load places");
      } finally {
        setPlacesLoading(false);
      }
    };

    fetchData();
  }, [selectedCity]);

  const togglePlaceSelection = (id) => {
    setSelectedPlaces((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (type === "start") {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setStartDate(selectedDate);
        if (selectedDate > endDate) setEndDate(selectedDate);
      }
    } else {
      setShowEndDatePicker(false);
      if (selectedDate && selectedDate >= startDate) setEndDate(selectedDate);
    }
  };

  const calculateDays = () => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff === 0 ? 1 : daysDiff;
  };

  const handleSubmit = async () => {
    if (!selectedCity) return Alert.alert("Error", "Please select a city");
    if (selectedPlaces.length === 0) return Alert.alert("Error", "Select at least one place");
    if (endDate < startDate) return Alert.alert("Error", "End date cannot be before start date");

    setLoading(true);
    try {
      // Prepare places with proper coordinates
      const placesWithCoords = selectedPlaces.map((id) => {
        const place = places.find((p) => p.id === id);
        return {
          name: place.name,
          latitude: parseFloat(place.latitude || (place.coordinates ? place.coordinates.lat : 0)),
          longitude: parseFloat(place.longitude || (place.coordinates ? place.coordinates.lng : 0)),
          duration: parseInt(place.duration) || 60, // Default 60 minutes
        };
      });

      const planData = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        city: selectedCity.name,
        cityId: selectedCity.id,
        places: placesWithCoords,
        createdAt: new Date().toISOString(),
        status: "draft",
      };

      await set(ref(database, `plans/${DEFAULT_PLAN_ID}`), planData);

      // Navigate to PlanningScreen with planData
      navigation.navigate("Plan", { planData });
    } catch (err) {
      console.error("Error saving plan:", err);
      Alert.alert("Error", "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plan Your Trip</Text>
          <Text style={styles.subtitle}>Create your perfect Gujarat journey</Text>
        </View>

        {/* Date Selection */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>📅 Travel Dates</Text>
          
          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>

            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tripDuration}>
            <Text style={styles.durationText}>
              {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'} trip
            </Text>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(e, date) => handleDateChange(e, date, "start")}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(e, date) => handleDateChange(e, date, "end")}
            />
          )}
        </ThemedCard>

        {/* City Selection */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>🏙️ Select City</Text>
          <Text style={styles.sectionSubtitle}>Choose your destination city</Text>
          
          <FlatList
            data={cities}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.cityButton,
                  selectedCity?.id === item.id && styles.selectedCityButton
                ]}
                onPress={() => setSelectedCity(item)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.cityText,
                  selectedCity?.id === item.id && styles.selectedCityText
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.cityList}
          />
        </ThemedCard>

        {/* Places Selection */}
        {selectedCity && (
          <ThemedCard style={styles.card}>
            <View style={styles.placesHeader}>
              <Text style={styles.sectionTitle}>📍 Select Places</Text>
              <Text style={styles.placesCounter}>
                {selectedPlaces.length} selected
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Choose places to visit in {selectedCity.name}
            </Text>

            {placesLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner />
                <Text style={styles.loadingText}>Loading places...</Text>
              </View>
            ) : places.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏛️</Text>
                <Text style={styles.emptyText}>No places found for {selectedCity.name}</Text>
              </View>
            ) : (
              <View style={styles.placesContainer}>
                {places.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={[
                      styles.placeButton,
                      selectedPlaces.includes(place.id) && styles.selectedPlaceButton
                    ]}
                    onPress={() => togglePlaceSelection(place.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.placeContent}>
                      <View style={styles.placeInfo}>
                        <Text style={[
                          styles.placeName,
                          selectedPlaces.includes(place.id) && styles.selectedPlaceName
                        ]}>
                          {place.name}
                        </Text>
                        {place.duration && (
                          <Text style={[
                            styles.placeDuration,
                            selectedPlaces.includes(place.id) && styles.selectedPlaceDuration
                          ]}>
                            ⏱️ {place.duration} minutes
                          </Text>
                        )}
                      </View>
                      <View style={[
                        styles.checkbox,
                        selectedPlaces.includes(place.id) && styles.checkedCheckbox
                      ]}>
                        {selectedPlaces.includes(place.id) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ThemedCard>
        )}

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <ThemedButton
            title={loading ? 'Creating Plan...' : 'Plan My Trip'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !selectedCity || selectedPlaces.length === 0}
            fullWidth
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  dateButton: {
    backgroundColor: colors.backgroundDefault,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.light,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dateArrow: {
    paddingHorizontal: spacing.md,
  },
  arrowText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  tripDuration: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    alignSelf: 'center',
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.white,
  },
  cityList: {
    paddingLeft: spacing.sm,
  },
  cityButton: {
    backgroundColor: colors.backgroundDefault,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedCityButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  selectedCityText: {
    color: colors.white,
    fontWeight: typography.fontWeight.semiBold,
  },
  placesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  placesCounter: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    backgroundColor: colors.backgroundDefault,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  placesContainer: {
    gap: spacing.sm,
  },
  placeButton: {
    backgroundColor: colors.backgroundDefault,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPlaceButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  placeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedPlaceName: {
    color: colors.white,
  },
  placeDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  selectedPlaceDuration: {
    color: colors.white,
    opacity: 0.9,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  checkmark: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  submitContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});

export default PlanFormScreen;