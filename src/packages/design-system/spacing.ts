// 4px grid system for consistent spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

// Common layout measurements
export const Layout = {
  // Screen padding
  screenPadding: 16,
  
  // Card measurements
  cardPadding: 16,
  cardMargin: 8,
  cardBorderRadius: 12,
  
  // Button measurements
  buttonHeight: {
    small: 32,
    medium: 44,
    large: 56,
  },
  buttonPadding: {
    small: 8,
    medium: 12,
    large: 16,
  },
  
  // Input measurements
  inputHeight: 48,
  inputBorderRadius: 8,
  
  // Icon sizes
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
  
  // Touch targets (minimum 44x44 for accessibility)
  minTouchTarget: 44,
} as const;