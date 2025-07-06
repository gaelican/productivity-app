// No imports needed - design-system should be independent

export interface Gradient {
  id: string;
  name: string;
  from: string;
  to: string;
  angle?: number;
}

// Core gradients (available on all devices)
const CORE_GRADIENTS: Gradient[] = [
  { id: 'blue', name: 'Ocean Blue', from: '#3B82F6', to: '#1E40AF', angle: 135 },
  { id: 'green', name: 'Forest Green', from: '#10B981', to: '#059669', angle: 135 },
  { id: 'red', name: 'Cherry Red', from: '#EF4444', to: '#DC2626', angle: 135 },
  { id: 'purple', name: 'Royal Purple', from: '#A855F7', to: '#7C3AED', angle: 135 },
  { id: 'orange', name: 'Sunset Orange', from: '#FB923C', to: '#EA580C', angle: 135 },
  { id: 'pink', name: 'Bubblegum Pink', from: '#F472B6', to: '#DB2777', angle: 135 },
  { id: 'yellow', name: 'Sunshine Yellow', from: '#FCD34D', to: '#F59E0B', angle: 135 },
  { id: 'teal', name: 'Lagoon Teal', from: '#14B8A6', to: '#0F766E', angle: 135 },
  { id: 'indigo', name: 'Midnight Indigo', from: '#6366F1', to: '#4338CA', angle: 135 },
  { id: 'gray', name: 'Storm Gray', from: '#9CA3AF', to: '#4B5563', angle: 135 },
];

// Extended gradients (standard tier)
const STANDARD_GRADIENTS: Gradient[] = [
  { id: 'ocean', name: 'Ocean Wave', from: '#3B82F6', to: '#14B8A6', angle: 45 },
  { id: 'sunset', name: 'Sunset Sky', from: '#F97316', to: '#EF4444', angle: 90 },
  { id: 'forest', name: 'Forest Mist', from: '#10B981', to: '#14B8A6', angle: 135 },
  { id: 'lavender', name: 'Lavender Dream', from: '#A855F7', to: '#F472B6', angle: 45 },
  { id: 'fire', name: 'Fire Blaze', from: '#EF4444', to: '#F97316', angle: 90 },
  { id: 'mint', name: 'Fresh Mint', from: '#10B981', to: '#6EE7B7', angle: 135 },
  { id: 'berry', name: 'Berry Blast', from: '#DB2777', to: '#A855F7', angle: 45 },
  { id: 'citrus', name: 'Citrus Burst', from: '#FCD34D', to: '#FB923C', angle: 90 },
  { id: 'slate', name: 'Cool Slate', from: '#64748B', to: '#334155', angle: 135 },
  { id: 'rose', name: 'Rose Garden', from: '#FB7185', to: '#E11D48', angle: 45 },
];

// Premium gradients (premium tier only)
const PREMIUM_GRADIENTS: Gradient[] = [
  { id: 'aurora', name: 'Aurora Borealis', from: '#A855F7', to: '#14B8A6', angle: 60 },
  { id: 'cosmic', name: 'Cosmic Dust', from: '#6366F1', to: '#DB2777', angle: 30 },
  { id: 'tropical', name: 'Tropical Paradise', from: '#14B8A6', to: '#FCD34D', angle: 120 },
  { id: 'nebula', name: 'Nebula Cloud', from: '#7C3AED', to: '#EF4444', angle: 75 },
  { id: 'glacier', name: 'Glacier Ice', from: '#60A5FA', to: '#E0E7FF', angle: 180 },
  { id: 'volcano', name: 'Volcano Flow', from: '#DC2626', to: '#F59E0B', angle: 45 },
  { id: 'meadow', name: 'Spring Meadow', from: '#34D399', to: '#FDE047', angle: 110 },
  { id: 'twilight', name: 'Twilight Fade', from: '#4338CA', to: '#1F2937', angle: 270 },
  { id: 'coral', name: 'Coral Reef', from: '#FB923C', to: '#F472B6', angle: 85 },
  { id: 'mystic', name: 'Mystic Haze', from: '#8B5CF6', to: '#06B6D4', angle: 150 },
];

// Export all gradients as a single array (no tier restrictions)
export const gradientThemes: Gradient[] = [
  ...CORE_GRADIENTS,
  ...STANDARD_GRADIENTS,
  ...PREMIUM_GRADIENTS,
];

export class GradientSystem {
  static getAvailableGradients(): Gradient[] {
    // All gradients are available to all users
    return gradientThemes;
  }

  static getGradientById(id: string): Gradient | undefined {
    return gradientThemes.find(g => g.id === id);
  }

  static getDefaultGradient(): Gradient {
    return CORE_GRADIENTS[0]; // Ocean Blue as default
  }

  static getRandomGradient(): Gradient {
    const index = Math.floor(Math.random() * gradientThemes.length);
    return gradientThemes[index];
  }

  static generateLinearGradient(gradient: Gradient): string {
    return `linear-gradient(${gradient.angle || 135}deg, ${gradient.from} 0%, ${gradient.to} 100%)`;
  }

  static getColorsArray(gradient: Gradient): [string, string] {
    return [gradient.from, gradient.to];
  }
}