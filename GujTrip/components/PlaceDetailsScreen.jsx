import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme-config';
import { ref, get, child, set, push } from 'firebase/database';
import { database } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.72:5000';

const PlaceDetailsScreen = ({ route, navigation }) => {
  const { place } = route.params;
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(place.likes || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(place.rating || 0);
  const [userRating, setUserRating] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [relatedPlaces, setRelatedPlaces] = useState([]);

  useEffect(() => {
    loadUser();
    fetchPlaceDetails();
    fetchRelatedPlaces();
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

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch social data for this place
      const socialSnapshot = await get(child(ref(database), `social/${place.id}`));
      if (socialSnapshot.exists()) {
        const socialData = socialSnapshot.val();
        setLikesCount(socialData.likes || 0);
        setRating(socialData.rating || 0);
        
        if (socialData.comments) {
          const commentsArray = Object.values(socialData.comments);
          setComments(commentsArray);
        }
        
        // Check if current user liked this place
        if (user && socialData.likedBy) {
          const userKey = user.phone.replace(/[^a-zA-Z0-9]/g, '');
          setLiked(!!socialData.likedBy[userKey]);
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPlaces = async () => {
    try {
      // Fetch places from the same city
      const placesSnapshot = await get(child(ref(database), `places/${place.city}`));
      if (placesSnapshot.exists()) {
        const placesData = placesSnapshot.val();
        const relatedArray = Object.entries(placesData)
          .filter(([name]) => name !== place.name)
          .map(([name, data]) => ({
            id: `${place.city}_${name}`,
            name,
            city: place.city,
            ...data,
          }))
          .slice(0, 5); // Limit to 5 related places
        
        setRelatedPlaces(relatedArray);
      }
    } catch (error) {
      console.error('Error fetching related places:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like places');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/social/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: place.id,
          userId: user.phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikesCount(data.total_likes);
      }
    } catch (error) {
      console.error('Error liking place:', error);
      Alert.alert('Error', 'Failed to like place');
    }
  };

  const handleComment = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/social/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: place.id,
          userId: user.phone,
          userName: user.name || 'Anonymous',
          comment: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setNewComment('');
        Alert.alert('Success', 'Comment added successfully!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleRating = async (newRating) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to rate places');
      return;
    }

    setUserRating(newRating);
    
    try {
      // Update rating in Firebase
      const ratingRef = ref(database, `social/${place.id}/userRatings/${user.phone.replace(/[^a-zA-Z0-9]/g, '')}`);
      await set(ratingRef, newRating);
      
      // Recalculate average rating
      const ratingsSnapshot = await get(child(ref(database), `social/${place.id}/userRatings`));
      if (ratingsSnapshot.exists()) {
        const ratings = Object.values(ratingsSnapshot.val());
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        
        await set(ref(database, `social/${place.id}/rating`), avgRating);
        setRating(avgRating);
      }
    } catch (error) {
      console.error('Error rating place:', error);
      Alert.alert('Error', 'Failed to rate place');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${place.name} in ${place.city}! 📍 ${place.address || ''}`,
        title: place.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDirections = () => {
    if (place.latitude && place.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Location coordinates not available');
    }
  };

  const renderRatingStars = (currentRating, interactive = false) => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && handleRating(star)}
            disabled={!interactive}
          >
            <Text style={[
              styles.star,
              star <= currentRating && styles.starFilled
            ]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentUser}>{item.user_name}</Text>
        <Text style={styles.commentTime}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  const renderRelatedPlace = ({ item }) => (
    <TouchableOpacity
      style={styles.relatedPlaceCard}
      onPress={() => navigation.push('PlaceDetails', { place: item })}
    >
      <Text style={styles.relatedPlaceName}>{item.name}</Text>
      <Text style={styles.relatedPlaceInfo}>{item.city}</Text>
      {item.rating > 0 && (
        <Text style={styles.relatedPlaceRating}>⭐ {item.rating.toFixed(1)}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header Image/Info */}
      <View style={styles.headerSection}>
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeCity}>{place.city}</Text>
          {place.address && <Text style={styles.placeAddress}>{place.address}</Text>}
        </View>
        
        {/* Rating Display */}
        <View style={styles.ratingSection}>
          {renderRatingStars(rating)}
          <Text style={styles.ratingText}>{rating.toFixed(1)} ({likesCount} likes)</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, liked && styles.likedButton]}
          onPress={handleLike}
        >
          <Text style={styles.actionButtonText}>
            {liked ? '❤️' : '🤍'} {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Text style={styles.actionButtonText}>🧭 Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionButtonText}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      {/* User Rating */}
      {user && (
        <View style={styles.userRatingSection}>
          <Text style={styles.sectionTitle}>Rate this place:</Text>
          {renderRatingStars(userRating, true)}
        </View>
      )}

      {/* Place Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        {place.duration && (
          <Text style={styles.detailItem}>⏱️ Suggested Duration: {place.duration} minutes</Text>
        )}
        {place.latitude && place.longitude && (
          <Text style={styles.detailItem}>
            📍 Coordinates: {place.latitude}, {place.longitude}
          </Text>
        )}
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
        
        {user && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity style={styles.commentButton} onPress={handleComment}>
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
          }
        />
      </View>

      {/* Related Places */}
      {relatedPlaces.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.sectionTitle}>Other places in {place.city}</Text>
          <FlatList
            data={relatedPlaces}
            renderItem={renderRelatedPlace}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedPlacesList}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  placeInfo: {
    marginBottom: SPACING.md,
  },
  placeName: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  placeCity: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  placeAddress: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 20,
    color: COLORS.textLight,
    marginRight: SPACING.xs,
  },
  starFilled: {
    color: COLORS.warning,
  },
  ratingText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  likedButton: {
    backgroundColor: '#ffe8e8',
  },
  actionButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  userRatingSection: {
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  detailsSection: {
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  detailItem: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  commentsSection: {
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    maxHeight: 80,
  },
  commentButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
  },
  commentButtonText: {
    color: COLORS.backgroundLight,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  commentItem: {
    padding: SPACING.md,
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
    lineHeight: 20,
  },
  noComments: {
    textAlign: 'center',
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingVertical: SPACING.xl,
  },
  relatedSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  relatedPlacesList: {
    paddingLeft: SPACING.sm,
  },
  relatedPlaceCard: {
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginRight: SPACING.md,
    width: 180,
    ...SHADOWS.light,
  },
  relatedPlaceName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  relatedPlaceInfo: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  relatedPlaceRating: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.warning,
    fontWeight: '500',
  },
});

export default PlaceDetailsScreen;