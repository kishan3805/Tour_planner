import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme-config';
import { ref, get, child } from 'firebase/database';
import { database } from './firebase';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.1.72:5000';

const TripPlannerScreen = ({ navigation }) => {
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [tripDuration, setTripDuration] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preferences, setPreferences] = useState({
    budget: 'medium',
    travelStyle: 'leisure',
    groupSize: '2-4',
  });
  const [placesData, setPlacesData] = useState({});
  const [hotelsData, setHotelsData] = useState({});
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch places
      const placesSnapshot = await get(child(ref(database), 'places'));
      if (placesSnapshot.exists()) {
        setPlacesData(placesSnapshot.val());
      }

      // Fetch hotels
      const hotelsSnapshot = await get(child(ref(database), 'hotels'));
      if (hotelsSnapshot.exists()) {
        setHotelsData(hotelsSnapshot.val());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addPlace = (city, place, placeData) => {
    const newPlace = {
      id: `${city}_${place}`,
      city,
      name: place,
      ...placeData,
      selectedTime: '09:00',
      visitDuration: placeData.duration || 60,
    };
    setSelectedPlaces([...selectedPlaces, newPlace]);
    setShowPlaceModal(false);
  };

  const addHotel = (hotelData) => {
    const newHotel = {
      id: hotelData.name,
      ...hotelData,
      checkIn: '15:00',
      checkOut: '11:00',
    };
    setSelectedHotels([...selectedHotels, newHotel]);
    setShowHotelModal(false);
  };

  const removePlace = (placeId) => {
    setSelectedPlaces(selectedPlaces.filter(place => place.id !== placeId));
  };

  const removeHotel = (hotelId) => {
    setSelectedHotels(selectedHotels.filter(hotel => hotel.id !== hotelId));
  };

  const generateOptimizedPlan = async () => {
    if (selectedPlaces.length === 0) {
      Alert.alert('Error', 'Please select at least one place to visit');
      return;
    }

    setLoading(true);
    try {
      const planData = {
        places: selectedPlaces.map(place => ({
          name: place.name,
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude),
          duration: place.visitDuration,
          preferredTime: place.selectedTime,
        })),
        hotels: selectedHotels,
        tripDuration: parseInt(tripDuration),
        startDate,
        endDate,
        preferences,
      };

      const response = await fetch(`${API_BASE_URL}/generate-trip-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      const result = await response.json();
      
      if (response.ok) {
        navigation.navigate('PlanDisplay', { 
          planData: result,
          originalData: planData 
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to generate plan');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert('Error', 'Failed to generate trip plan');
    } finally {
      setLoading(false);
    }
  };

  const PlaceModal = () => (
    <Modal visible={showPlaceModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Places</Text>
          <TouchableOpacity onPress={() => setShowPlaceModal(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={Object.entries(placesData)}
          keyExtractor={([city]) => city}
          renderItem={({ item: [city, places] }) => (
            <View style={styles.citySection}>
              <Text style={styles.cityTitle}>{city}</Text>
              {Object.entries(places).map(([placeName, placeData]) => (
                <TouchableOpacity
                  key={placeName}
                  style={styles.placeItem}
                  onPress={() => addPlace(city, placeName, placeData)}
                >
                  <Text style={styles.placeName}>{placeName}</Text>
                  <Text style={styles.placeAddress}>{placeData.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      </View>
    </Modal>
  );

  const HotelModal = () => (
    <Modal visible={showHotelModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Hotels</Text>
          <TouchableOpacity onPress={() => setShowHotelModal(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={Object.values(hotelsData)}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.hotelItem}
              onPress={() => addHotel(item)}
            >
              <Text style={styles.hotelName}>{item.name}</Text>
              <Text style={styles.hotelAddress}>{item.address}</Text>
              <Text style={styles.hotelType}>
                {item.type === 'living' ? 'Hotel' : 'Restaurant'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Plan Your Perfect Trip</Text>

      {/* Trip Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Duration (Days)</Text>
        <Picker
          selectedValue={tripDuration}
          style={styles.picker}
          onValueChange={setTripDuration}
        >
          {[1,2,3,4,5,6,7,8,9,10].map(day => (
            <Picker.Item key={day} label={`${day} Day${day > 1 ? 's' : ''}`} value={day.toString()} />
          ))}
        </Picker>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Travel Preferences</Text>
        
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Budget:</Text>
          <Picker
            selectedValue={preferences.budget}
            style={styles.smallPicker}
            onValueChange={(value) => setPreferences({...preferences, budget: value})}
          >
            <Picker.Item label="Budget" value="budget" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="Luxury" value="luxury" />
          </Picker>
        </View>

        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Travel Style:</Text>
          <Picker
            selectedValue={preferences.travelStyle}
            style={styles.smallPicker}
            onValueChange={(value) => setPreferences({...preferences, travelStyle: value})}
          >
            <Picker.Item label="Leisure" value="leisure" />
            <Picker.Item label="Adventure" value="adventure" />
            <Picker.Item label="Cultural" value="cultural" />
            <Picker.Item label="Business" value="business" />
          </Picker>
        </View>
      </View>

      {/* Selected Places */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Selected Places ({selectedPlaces.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowPlaceModal(true)}>
            <Text style={styles.addButtonText}>+ Add Place</Text>
          </TouchableOpacity>
        </View>
        
        {selectedPlaces.map((place) => (
          <View key={place.id} style={styles.selectedItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{place.name}</Text>
              <Text style={styles.itemLocation}>{place.city}</Text>
              <Text style={styles.itemDuration}>Duration: {place.visitDuration} min</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removePlace(place.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Selected Hotels */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Selected Hotels ({selectedHotels.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowHotelModal(true)}>
            <Text style={styles.addButtonText}>+ Add Hotel</Text>
          </TouchableOpacity>
        </View>
        
        {selectedHotels.map((hotel) => (
          <View key={hotel.id} style={styles.selectedItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{hotel.name}</Text>
              <Text style={styles.itemLocation}>{hotel.address}</Text>
              <Text style={styles.itemType}>{hotel.foodType} • {hotel.openingTime}-{hotel.closingTime}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeHotel(hotel.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Generate Plan Button */}
      <TouchableOpacity 
        style={[styles.generateButton, loading && styles.disabledButton]}
        onPress={generateOptimizedPlan}
        disabled={loading}
      >
        <Text style={styles.generateButtonText}>
          {loading ? 'Generating Plan...' : 'Generate Optimized Plan'}
        </Text>
      </TouchableOpacity>

      <PlaceModal />
      <HotelModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  picker: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
  },
  smallPicker: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  preferenceLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    width: 100,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.backgroundLight,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemLocation: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  itemDuration: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  itemType: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  removeButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  removeButtonText: {
    color: COLORS.backgroundLight,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: COLORS.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.medium,
  },
  generateButtonText: {
    color: COLORS.backgroundLight,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.primary,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  closeButton: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.backgroundLight,
    fontWeight: 'bold',
  },
  citySection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cityTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  placeItem: {
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  placeName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeAddress: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  hotelItem: {
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  hotelName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  hotelAddress: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  hotelType: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
});

export default TripPlannerScreen;