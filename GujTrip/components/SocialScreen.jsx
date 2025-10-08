import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme-config';
import { ref, get, child, set, push, update } from 'firebase/database';
import { database } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.1.72:5000';

const SocialScreen = ({ navigation, route }) => {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [user, setUser] = useState(null);
  const [suggestedPlaces, setSuggestedPlaces] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
    fetchPlaces();
    fetchSuggestedPlaces();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchPlaces = async () => {
    try {
      // Fetch places data
      const placesSnapshot = await get(child(ref(database), 'places'));
      if (placesSnapshot.exists()) {
        const placesData = placesSnapshot.val();
        const placesArray = [];
        
        Object.entries(placesData).forEach(([city, cityPlaces]) => {
          Object.entries(cityPlaces).forEach(([placeName, placeData]) => {
            placesArray.push({
              id: `${city}_${placeName}`,
              name: placeName,
              city,
              ...placeData,
              likes: 0,
              comments: [],
              rating: 0,
              reviews: 0,
            });
          });
        });
        
        // Fetch social data (likes, comments, ratings)
        const socialSnapshot = await get(child(ref(database), 'social'));
        if (socialSnapshot.exists()) {
          const socialData = socialSnapshot.val();
          placesArray.forEach(place => {
            if (socialData[place.id]) {
              place.likes = socialData[place.id].likes || 0;
              place.comments = Object.values(socialData[place.id].comments || {});
              place.rating = socialData[place.id].rating || 0;
              place.reviews = socialData[place.id].reviews || 0;
            }
          });
        }
        
        setPlaces(placesArray);
        setFilteredPlaces(placesArray);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  const fetchSuggestedPlaces = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/suggest-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.phone,
          preferences: userPreferences,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedPlaces(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredPlaces(places);
    } else {
      const filtered = places.filter(place =>
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.city.toLowerCase().includes(query.toLowerCase()) ||
        (place.address && place.address.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredPlaces(filtered);
    }
  };

  const handleLike = async (placeId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like places');
      return;
    }

    try {
      const likesRef = ref(database, `social/${placeId}/likes`);
      const userLikesRef = ref(database, `social/${placeId}/likedBy/${user.phone.replace(/[^a-zA-Z0-9]/g, '')}`);
      
      // Check if user already liked
      const userLikeSnapshot = await get(userLikesRef);
      const likesSnapshot = await get(likesRef);
      
      const currentLikes = likesSnapshot.exists() ? likesSnapshot.val() : 0;
      const hasLiked = userLikeSnapshot.exists();
      
      if (hasLiked) {
        // Unlike
        await set(likesRef, Math.max(0, currentLikes - 1));
        await set(userLikesRef, null);
      } else {
        // Like
        await set(likesRef, currentLikes + 1);
        await set(userLikesRef, true);
      }
      
      // Update local state
      setPlaces(places.map(place => 
        place.id === placeId 
          ? { ...place, likes: hasLiked ? Math.max(0, place.likes - 1) : place.likes + 1 }
          : place
      ));
      setFilteredPlaces(filteredPlaces.map(place => 
        place.id === placeId 
          ? { ...place, likes: hasLiked ? Math.max(0, place.likes - 1) : place.likes + 1 }
          : place
      ));
    } catch (error) {
      console.error('Error liking place:', error);
      Alert.alert('Error', 'Failed to like place');
    }
  };

  const openCommentModal = async (place) => {
    setSelectedPlace(place);
    
    try {
      const commentsSnapshot = await get(child(ref(database), `social/${place.id}/comments`));
      if (commentsSnapshot.exists()) {
        const commentsData = Object.values(commentsSnapshot.val());
        setComments(commentsData);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
    
    setShowCommentModal(true);
  };

  const addComment = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }
    
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      const commentData = {
        text: newComment.trim(),
        userName: user.name || 'Anonymous',
        userPhone: user.phone,
        timestamp: Date.now(),
        likes: 0,
        replies: [],
      };

      const commentsRef = ref(database, `social/${selectedPlace.id}/comments`);
      await push(commentsRef, commentData);
      
      setComments([...comments, commentData]);
      setNewComment('');
      
      Alert.alert('Success', 'Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const renderPlaceItem = ({ item }) => (
    <View style={styles.placeCard}>
      <View style={styles.placeHeader}>
        <Text style={styles.placeName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>
      </View>
      
      <Text style={styles.placeCity}>{item.city}</Text>
      {item.address && <Text style={styles.placeAddress}>{item.address}</Text>}
      
      <View style={styles.placeActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Text style={styles.actionText}>👍 {item.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openCommentModal(item)}
        >
          <Text style={styles.actionText}>💬 {item.comments.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('PlaceDetails', { place: item })}
        >
          <Text style={styles.actionText}>📍 View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuggestedPlace = ({ item }) => (
    <View style={styles.suggestionCard}>
      <Text style={styles.suggestionName}>{item.name}</Text>
      <Text style={styles.suggestionReason}>{item.reason}</Text>
      <Text style={styles.suggestionScore}>Match: {item.matchScore}%</Text>
      
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('PlaceDetails', { place: item })}
      >
        <Text style={styles.exploreButtonText}>Explore</Text>
      </TouchableOpacity>
    </View>
  );

  const CommentModal = () => (
    <Modal visible={showCommentModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{selectedPlace?.name} - Comments</Text>
          <TouchableOpacity onPress={() => setShowCommentModal(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={comments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>{item.userName}</Text>
                <Text style={styles.commentTime}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.commentText}>{item.text}</Text>
              <TouchableOpacity style={styles.commentLike}>
                <Text style={styles.commentLikeText}>👍 {item.likes || 0}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
          }
        />
        
        {user && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity style={styles.commentSubmit} onPress={addComment}>
              <Text style={styles.commentSubmitText}>Post</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explore & Share</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Suggested Places Section */}
      {suggestedPlaces.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>🌟 Recommended for You</Text>
          <FlatList
            data={suggestedPlaces}
            renderItem={renderSuggestedPlace}
            keyExtractor={(item, index) => `suggestion_${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </View>
      )}

      {/* Places List */}
      <Text style={styles.sectionTitle}>All Places</Text>
      <FlatList
        data={filteredPlaces}
        renderItem={renderPlaceItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.placesList}
      />

      <CommentModal />
    </View>
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
  searchContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  searchInput: {
    fontSize: FONTS.sizes.md,
    paddingVertical: SPACING.lg,
    color: COLORS.textPrimary,
  },
  suggestionsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  suggestionsList: {
    paddingLeft: SPACING.sm,
  },
  suggestionCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginRight: SPACING.md,
    width: width * 0.8,
    ...SHADOWS.light,
  },
  suggestionName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  suggestionReason: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  suggestionScore: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: COLORS.backgroundLight,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  placesList: {
    paddingBottom: SPACING.xxl,
  },
  placeCard: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  placeName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },
  reviews: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  placeCity: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  placeAddress: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  placeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
    flex: 1,
  },
  closeButton: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.backgroundLight,
    fontWeight: 'bold',
  },
  commentItem: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  commentUser: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  commentTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  commentText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  commentLike: {
    alignSelf: 'flex-start',
  },
  commentLikeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  noComments: {
    textAlign: 'center',
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    padding: SPACING.xxl,
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.backgroundDark,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    maxHeight: 100,
    backgroundColor: COLORS.backgroundLight,
  },
  commentSubmit: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
  },
  commentSubmitText: {
    color: COLORS.backgroundLight,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
});

export default SocialScreen;