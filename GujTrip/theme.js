// theme.js
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  // Primary Colors
  primary: '#FF5A5F',
  primaryLight: '#FF7B7F',
  primaryDark: '#E6474C',
  
  // Background Colors
  backgroundDefault: '#F7F7F7',
  backgroundPaper: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundOverlay: 'rgba(0,0,0,0.2)',
  inputBackground: '#f8f8f8',
  
  // Text Colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#484848',
  textLight: '#888888',
  textPlaceholder: '#999999',
  
  // UI Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  border: '#f2f2f2',
  borderDark: '#000000',
  shadow: '#000000',
  
  // Status Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Button States
  buttonDisabled: '#cccccc',
  buttonActive: '#f0f0f0',
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 22,
    xxxl: 24,
    xxxxl: 28,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  lineHeight: {
    sm: 18,
    md: 22,
    lg: 26,
    xl: 30,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  xxxl: 20,
  round: 50,
};

export const shadows = {
  light: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  heavy: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const dimensions = {
  screenWidth: width,
  screenHeight: height,
  headerHeight: height * 0.25,
};
