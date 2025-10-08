// components/HomeScreen.jsx - Redesigned with new theme

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  Modal,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// UI Components
import ThemedCard from './ui/ThemedCard';
import ThemedButton from './ui/ThemedButton';

// Theme
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

const IMAGES = [
  require('./media/home1.jpg'),
  require('./media/home2.jpg'),
  require('./media/home3.jpg'),
  require('./media/home4.webp'),
  require('./media/home5.webp'),
];

const MENU_ITEMS = [
  {
    id: 'history',
    title: 'History',
    subtitle: 'Explore places',
    icon: '🏛️',
    color: colors.primary,
    route: 'History',
  },
  {
    id: 'virtual',
    title: 'Virtual View',
    subtitle: '360° experiences',
    icon: '🥽',
    color: colors.secondary,
    route: 'View',
  },
  {
    id: 'hotels',
    title: 'Hotels',
    subtitle: 'Find accommodations',
    icon: '🏨',
    color: '#4caf50',
    route: 'Hotel',
  },
  {
    id: 'planning',
    title: 'Start Planning',
    subtitle: 'Plan your trip',
    icon: '🗺️',
    color: '#ff9800',
    route: 'Planform',
  },
  {
    id: 'direction',
    title: 'Direction',
    subtitle: 'Get routes',
    icon: '🧭',
    color: '#9c27b0',
    route: 'PlanDisplay',
  },
  {
    id: 'search',
    title: 'Search',
    subtitle: 'Find anything',
    icon: '🔍',
    color: '#607d8b',
    route: 'Search',
  },
];

export default function HomeScreen({ route, user, onLogout }) {
  const navigation = useNavigation();
  const name = user?.name || 'Guest';
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  // Auto-scroll carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % IMAGES.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleProfile = () => {
    setMenuVisible(false);
    navigation.navigate('Profile');
  };

  const handleLogout = () => {
    setMenuVisible(false);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            onLogout();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const renderCarouselItem = ({ item, index }) => (
    <View style={styles.carouselItemContainer}>
      <Image source={item} style={styles.carouselImage} />
      <View style={styles.carouselOverlay}>
        <View style={styles.carouselContent}>
          <Text style={styles.carouselTitle}>Discover Gujarat</Text>
          <Text style={styles.carouselSubtitle}>
            Experience the vibrant culture and heritage
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMenuItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: `${item.color}15` }, // 15% opacity
        index % 2 === 0 ? styles.menuItemLeft : styles.menuItemRight,
      ]}
      onPress={() => navigation.navigate(item.route)}
      activeOpacity={0.8}
    >
      <View style={[styles.menuItemIcon, { backgroundColor: item.color }]}>
        <Text style={styles.menuItemEmoji}>{item.icon}</Text>
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <Text style={styles.searchText}>🔍 Search places, hotels...</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setMenuVisible(true)}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={IMAGES}
            renderItem={renderCarouselItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {IMAGES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Greeting */}
        <ThemedCard style={styles.greetingCard}>
          <Text style={styles.greeting}>Hello {name}!</Text>
          <Text style={styles.subGreeting}>
            Welcome to Smart Gujarat Trip Planner
          </Text>
        </ThemedCard>

        {/* Menu Grid */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Explore Gujarat</Text>
          <FlatList
            data={MENU_ITEMS}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.menuRow}
            scrollEnabled={false}
          />
        </View>

        {/* Quick Stats */}
        <ThemedCard style={styles.statsCard}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>150+</Text>
              <Text style={styles.statLabel}>Places</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>200+</Text>
              <Text style={styles.statLabel}>Hotels</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.statsCard}>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => navigation.navigate('Gujju')}
          >
            <TextInput
              style={styles.textInput}
              placeholder="Ask To Gujji AI ..."
              editable={false}
            />
          </TouchableOpacity>
        </ThemedCard>


      </ScrollView>

      {/* Profile Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.profileMenu}>
            <TouchableOpacity style={styles.menuOption} onPress={handleProfile}>
              <Text style={styles.menuOptionText}>👤 Profile</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuOption} onPress={handleLogout}>
              <Text style={[styles.menuOptionText, styles.logoutText]}>
                🚪 Logout
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },

  scrollView: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },

  searchBar: {
    flex: 1,
    backgroundColor: colors.backgroundPaper,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.large,
    marginRight: spacing.sm,
    ...shadows.small,
  },

  searchText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },

  profileButton: {
    padding: spacing.xs,
  },

  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },

  profileInitial: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },

  carouselContainer: {
    marginBottom: spacing.md,
  },

  carouselItemContainer: {
    width: width,
    height: 200,
    position: 'relative',
  },

  carouselImage: {
    width: '100%',
    height: '100%',
  },

  carouselOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },

  carouselContent: {
    padding: spacing.lg,
  },

  carouselTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },

  carouselSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    opacity: 0.9,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: colors.primary,
    width: 20,
  },

  greetingCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  greeting: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  subGreeting: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },

  menuContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  menuRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  menuItem: {
    width: (width - spacing.md * 3) / 2,
    padding: spacing.md,
    borderRadius: borderRadius.large,
    ...shadows.small,
  },

  menuItemLeft: {
    marginRight: spacing.xs,
  },

  menuItemRight: {
    marginLeft: spacing.xs,
  },

  menuItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  menuItemEmoji: {
    fontSize: 24,
  },

  menuItemContent: {
    flex: 1,
  },

  menuItemTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  menuItemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  statsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },

  statsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },

  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: spacing.md,
  },

  profileMenu: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: borderRadius.medium,
    minWidth: 150,
    ...shadows.large,
  },

  menuOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  menuOptionText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },

  logoutText: {
    color: colors.error,
  },

  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.sm,
  },

  inputContainer: {
    borderRadius: 25,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  
  textInput: {
    color: '#000',
    fontSize: 18,
  },
});
