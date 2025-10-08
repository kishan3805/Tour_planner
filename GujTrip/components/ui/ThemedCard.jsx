// components/ui/ThemedCard.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const ThemedCard = ({ 
  children, 
  style, 
  padding = 'medium',
  shadow = 'medium',
  ...props 
}) => {
  const cardStyles = [
    styles.base,
    styles[`padding_${padding}`],
    styles[`shadow_${shadow}`],
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.xl,
  },
  
  // Padding variants
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: spacing.sm,
  },
  padding_medium: {
    padding: spacing.md,
  },
  padding_large: {
    padding: spacing.lg,
  },
  padding_xlarge: {
    padding: spacing.xl,
  },
  
  // Shadow variants
  shadow_none: {},
  shadow_light: shadows.light,
  shadow_medium: shadows.medium,
  shadow_heavy: shadows.heavy,
});

export default ThemedCard;
