// components/ProfileScreen.jsx - Redesigned with new theme

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';

// UI Components
import ThemedCard from './ui/ThemedCard';
import ThemedButton from './ui/ThemedButton';
import ThemedTextInput from './ui/ThemedTextInput';

// Theme
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const ProfileScreen = ({ navigation, user, onProfileUpdate, onLogout }) => {
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age ? user.age.toString() : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !age.trim() || !gender.trim()) {
      Alert.alert('Incomplete Information', 'Please fill all fields');
      return;
    }

    if (isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = {
        ...user,
        name: name.trim(),
        age: parseInt(age),
        gender: gender.toLowerCase()
      };

      await onProfileUpdate(updatedUser);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.log('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onLogout
        }
      ]
    );
  };

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name.charAt(0).toUpperCase() || user?.phone?.charAt(-2) || 'U'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.title}>Your Profile</Text>
            <Text style={styles.subtitle}>Update your personal information</Text>
          </View>

          {/* Profile Form */}
          <ThemedCard style={styles.formCard}>
            {/* Phone Number (Read-only) */}
            <View style={styles.phoneSection}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <View style={styles.phoneContainer}>
                <Text style={styles.phoneNumber}>{user?.phone}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              </View>
            </View>

            {/* Name Input */}
            <ThemedTextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              style={styles.input}
            />

            {/* Age Input */}
            <ThemedTextInput
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="numeric"
              maxLength={3}
              style={styles.input}
            />

            {/* Gender Selection */}
            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {genderOptions.map((option) => (
                  <ThemedButton
                    key={option.value}
                    title={option.label}
                    variant={gender === option.value ? 'primary' : 'outline'}
                    size="small"
                    onPress={() => setGender(option.value)}
                    style={styles.genderButton}
                  />
                ))}
              </View>
            </View>

            {/* Save Button */}
            <ThemedButton
              title={loading ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              loading={loading}
              disabled={loading || !name.trim() || !age.trim() || !gender.trim()}
              style={styles.saveButton}
            />
          </ThemedCard>

          {/* Account Actions */}
          <ThemedCard style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Account</Text>
            
            <ThemedButton
              title="Logout"
              variant="outline"
              onPress={handleLogout}
              style={styles.logoutButton}
              textStyle={styles.logoutButtonText}
            />
          </ThemedCard>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>GujTrip v1.0</Text>
            <Text style={styles.appInfoText}>Discover Gujarat's hidden gems</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  avatarText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  phoneSection: {
    marginBottom: spacing.lg,
  },
  phoneLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneNumber: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  verifiedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.white,
  },
  input: {
    marginBottom: spacing.md,
  },
  genderContainer: {
    marginBottom: spacing.lg,
  },
  genderLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.md,
  },
  actionsCard: {
    marginBottom: spacing.lg,
  },
  actionsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  logoutButton: {
    borderColor: colors.error,
  },
  logoutButtonText: {
    color: colors.error,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  appInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfileScreen;