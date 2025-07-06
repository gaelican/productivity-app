import { TextStyle } from 'react-native';

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
  
  // Pre-defined text styles
  styles: {
    h1: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 36,
    } as TextStyle,
    
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 30,
    } as TextStyle,
    
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 26,
    } as TextStyle,
    
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    } as TextStyle,
    
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    } as TextStyle,
    
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    } as TextStyle,
    
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0.5,
    } as TextStyle,
    
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.5,
    } as TextStyle,
  },
} as const;