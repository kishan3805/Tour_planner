// components/OtpScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme and UI Components
import { colors, typography, spacing, borderRadius, shadows, dimensions } from '../theme';
import ThemedButton from './ui/ThemedButton';
import ThemedCard from './ui/ThemedCard';

const API_BASE_URL = 'http://192.168.1.72:5000';

const OtpScreen = ({ navigation, route, onLogin }) => {
  const [phone, setPhone] = useState(route.params?.phone || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (!phone) {
      (async () => {
        const savedPhone = await AsyncStorage.getItem('userPhone');
        if (savedPhone) setPhone(savedPhone);
      })();
    }
  }, []);

  const handleOtpChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index === otp.length - 1) {
      handleVerifyOtp();
    } else if (text && index < otp.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const verifyOtpWithServer = async (phoneNumber, otpCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp: otpCode }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { error: 'Network error. Please try again.' };
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== otp.length) return;

    setVerifying(true);
    try {
      const result = await verifyOtpWithServer(phone, otpCode);
      if (result.success) {
        Alert.alert('Success', 'OTP verified successfully!');
        const userData = { phone, name: 'User' };
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        const usersRaw = await AsyncStorage.getItem('users');
        let usersArray = usersRaw ? JSON.parse(usersRaw) : [];
        const existingUserIndex = usersArray.findIndex((u) => u.phone === phone);

        if (existingUserIndex === -1) {
          usersArray.push(userData);
          await AsyncStorage.setItem('users', JSON.stringify(usersArray));
          navigation.navigate('Home');
        } else {
          onLogin(usersArray[existingUserIndex]);
          navigation.navigate('Home');
        }
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const sendOtp = async (phoneNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { error: 'Network error. Please try again.' };
    }
  };

  const handleResendOtp = async () => {
    if (!isButtonEnabled) return;
    setResending(true);
    try {
      const result = await sendOtp(phone);
      if (result.success) {
        Alert.alert('Success', 'OTP sent successfully!');
        setTimer(30);
        setIsButtonEnabled(false);
        setOtp(Array(6).fill(''));
        inputs.current[0]?.focus();
      } else {
        Alert.alert('Error', result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setIsButtonEnabled(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image 
            source={require('./media/cover4.webp')} 
            style={styles.coverImage} 
            resizeMode="cover" 
          />
        </View>

        {/* Main Content */}
        <View style={styles.bottomContainer}>
          <View style={styles.contentSection}>
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>
                Code sent to {phone}
              </Text>
            </View>

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (
                      nativeEvent.key === 'Backspace' &&
                      otp[index] === '' &&
                      index > 0
                    ) {
                      const newOtp = [...otp];
                      newOtp[index - 1] = '';
                      setOtp(newOtp);
                      inputs.current[index - 1]?.focus();
                    }
                  }}
                  returnKeyType="done"
                  textContentType="oneTimeCode"
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {/* Resend Button */}
            <TouchableOpacity
              style={[
                styles.resendButton,
                isButtonEnabled ? styles.activeButton : styles.disabledButton,
              ]}
              onPress={handleResendOtp}
              disabled={!isButtonEnabled || resending}
            >
              {resending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.resendButtonText}>
                  {isButtonEnabled ? 'Resend OTP' : `Resend in ${timer}s`}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <ThemedButton
            title="Verify OTP"
            onPress={handleVerifyOtp}
            loading={verifying}
            disabled={verifying}
            fullWidth
            style={styles.verifyButton}
          />
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
  },
  coverContainer: {
    height: dimensions.headerHeight,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPaper,
    marginTop: -spacing.sm,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
    padding: spacing.xl,
    ...shadows.heavy,
    justifyContent: 'space-between',
  },
  contentSection: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  otpInput: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.lg,
    height: 60,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.white,
    ...shadows.light,
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderColor: colors.borderDark,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.transparent,
  },
  activeButton: {
    backgroundColor: colors.buttonActive,
  },
  disabledButton: {
    backgroundColor: colors.backgroundDefault,
    opacity: 0.7,
  },
  resendButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textPrimary,
  },
  verifyButton: {
    marginTop: spacing.lg,
  },
});

export default OtpScreen;
