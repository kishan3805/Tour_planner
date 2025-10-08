// components/LoginScreen.jsx - Redesigned with new theme

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// UI Components
import ThemedButton from './ui/ThemedButton';
import ThemedTextInput from './ui/ThemedTextInput';
import ThemedCard from './ui/ThemedCard';

// Theme
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const { height } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.1.72:5000';

const LoginScreen = ({ navigation, onLogin }) => {
  const [phone, setPhone] = useState('+91 ');
  const [loading, setLoading] = useState(false);

  const handleChange = (text) => {
    if (!text.startsWith('+91 ')) return;
    setPhone(text);
  };

  const sendOtp = async (phoneNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();
      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const handleContinue = async () => {
    const numberOnly = phone.replace('+91 ', '').trim();
    if (!/^\d{10}$/.test(numberOnly)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const fullPhone = `+91${numberOnly}`;

    try {
      const result = await sendOtp(fullPhone);
      if (result.success) {
        await AsyncStorage.setItem('userPhone', fullPhone);
        navigation.navigate('OtpVerification', { phone: fullPhone });
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (e) {
      console.error('Error:', e);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>GujTrip</Text>
            </View>
          </View>
          
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to continue your Gujarat journey
          </Text>
        </View>

        {/* Form Section */}
        <ThemedCard style={styles.formCard} padding="large">
          <Text style={styles.formTitle}>Enter Mobile Number</Text>
          <Text style={styles.formSubtitle}>
            We'll send you a verification code
          </Text>

          <ThemedTextInput
            label="Mobile Number"
            value={phone}
            onChangeText={handleChange}
            placeholder="+91 Enter your mobile number"
            keyboardType="phone-pad"
            maxLength={14}
            style={styles.phoneInput}
          />

          <ThemedButton
            title="Continue"
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.continueButton}
          />

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ThemedCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            New to GujTrip? Discover Gujarat's hidden gems!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  
  logoContainer: {
    marginBottom: spacing.lg,
  },
  
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  
  logoText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  
  welcomeTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  
  welcomeSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  formCard: {
    marginBottom: spacing.xl,
  },
  
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  
  formSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  
  phoneInput: {
    marginBottom: spacing.lg,
  },
  
  continueButton: {
    marginBottom: spacing.md,
  },
  
  termsContainer: {
    alignItems: 'center',
  },
  
  termsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  
  termsLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LoginScreen;