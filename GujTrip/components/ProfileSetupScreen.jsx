// components/ProfileSetupScreen.jsx - New screen for profile setup

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
import { colors, typography, spacing, borderRadius } from '../theme';

const ProfileSetupScreen = ({ navigation, user, onProfileUpdate }) => {
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !age.trim() || !gender.trim()) {
      Alert.alert('Required Fields', 'Please fill in all fields to continue.');
      return;
    }

    if (isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120.');
      return;
    }

    setLoading(true);

    try {
      const updatedUser = {
        ...user,
        name: name.trim(),
        age: parseInt(age),
        gender: gender.toLowerCase(),
      };

      await onProfileUpdate(updatedUser);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.progressText}>Step 2 of 2</Text>
            </View>
            
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Help us personalize your Gujarat experience
            </Text>
          </View>

          {/* Form */}
          <ThemedCard style={styles.formCard} padding="large">
            <ThemedTextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <ThemedTextInput
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="numeric"
              maxLength={3}
            />

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

            <ThemedButton
              title="Complete Setup"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              fullWidth
              style={styles.submitButton}
            />
          </ThemedCard>

          {/* Skip Option */}
          <View style={styles.skipContainer}>
            <Text style={styles.skipText}>
              You can always update this information later in your profile settings.
            </Text>
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  formCard: {
    marginBottom: spacing.lg,
  },
  
  genderContainer: {
    marginVertical: spacing.sm,
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
    marginBottom: spacing.md,
  },
  
  genderButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  
  submitButton: {
    marginTop: spacing.md,
  },
  
  skipContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  
  skipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default ProfileSetupScreen;