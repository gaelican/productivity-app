export interface GradientTheme {
  id: string;
  name: string;
  colors: string[];
  textColor: string;
  borderColor: string;
}

// All gradients available to all users
export const gradientThemes: GradientTheme[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    colors: ['#2E86AB', '#3B5F8A'],
    textColor: '#FFFFFF',
    borderColor: '#2E86AB',
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: ['#2D6A4F', '#1B4332'],
    textColor: '#FFFFFF',
    borderColor: '#2D6A4F',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: ['#F77F00', '#D62828'],
    textColor: '#FFFFFF',
    borderColor: '#F77F00',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    colors: ['#9381FF', '#7371FC'],
    textColor: '#FFFFFF',
    borderColor: '#9381FF',
  },
  {
    id: 'coral',
    name: 'Coral',
    colors: ['#FF6B6B', '#EE6C4D'],
    textColor: '#FFFFFF',
    borderColor: '#FF6B6B',
  },
  {
    id: 'mint',
    name: 'Mint',
    colors: ['#4ECDC4', '#44A09D'],
    textColor: '#FFFFFF',
    borderColor: '#4ECDC4',
  },
  {
    id: 'sand',
    name: 'Sand',
    colors: ['#F4A261', '#E76F51'],
    textColor: '#FFFFFF',
    borderColor: '#F4A261',
  },
  {
    id: 'sky',
    name: 'Sky',
    colors: ['#87CEEB', '#6BB6D6'],
    textColor: '#1E293B',
    borderColor: '#87CEEB',
  },
  {
    id: 'grape',
    name: 'Grape',
    colors: ['#6C5CE7', '#5F3DC4'],
    textColor: '#FFFFFF',
    borderColor: '#6C5CE7',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    colors: ['#495057', '#343A40'],
    textColor: '#FFFFFF',
    borderColor: '#495057',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    colors: ['#00F5FF', '#05E0FF', '#0AC5FF'],
    textColor: '#1E293B',
    borderColor: '#00F5FF',
  },
  {
    id: 'tropical',
    name: 'Tropical',
    colors: ['#FE6B8B', '#FF8E53'],
    textColor: '#FFFFFF',
    borderColor: '#FE6B8B',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: ['#2C3E50', '#3498DB'],
    textColor: '#FFFFFF',
    borderColor: '#2C3E50',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    colors: ['#11998E', '#38EF7D'],
    textColor: '#FFFFFF',
    borderColor: '#11998E',
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    colors: ['#FFB6C1', '#FFC0CB'],
    textColor: '#5B21B6',
    borderColor: '#FFB6C1',
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    colors: ['#667EEA', '#764BA2'],
    textColor: '#FFFFFF',
    borderColor: '#667EEA',
  },
  {
    id: 'flame',
    name: 'Flame',
    colors: ['#F37335', '#FDC830'],
    textColor: '#1E293B',
    borderColor: '#F37335',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    colors: ['#E0F7FA', '#B2EBF2'],
    textColor: '#006064',
    borderColor: '#B2EBF2',
  },
  {
    id: 'peach',
    name: 'Peach',
    colors: ['#FFB347', '#FFCC99'],
    textColor: '#8B4513',
    borderColor: '#FFB347',
  },
  {
    id: 'violet',
    name: 'Violet',
    colors: ['#8E44AD', '#9B59B6'],
    textColor: '#FFFFFF',
    borderColor: '#8E44AD',
  },
  {
    id: 'marine',
    name: 'Marine',
    colors: ['#006064', '#00838F'],
    textColor: '#FFFFFF',
    borderColor: '#006064',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    colors: ['#FFD700', '#FFA500'],
    textColor: '#1E293B',
    borderColor: '#FFD700',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    colors: ['#E91E63', '#C2185B'],
    textColor: '#FFFFFF',
    borderColor: '#E91E63',
  },
  {
    id: 'jade',
    name: 'Jade',
    colors: ['#00BFA5', '#00897B'],
    textColor: '#FFFFFF',
    borderColor: '#00BFA5',
  },
  {
    id: 'twilight',
    name: 'Twilight',
    colors: ['#5E35B1', '#7E57C2'],
    textColor: '#FFFFFF',
    borderColor: '#5E35B1',
  },
  {
    id: 'copper',
    name: 'Copper',
    colors: ['#B87333', '#CD7F32'],
    textColor: '#FFFFFF',
    borderColor: '#B87333',
  },
  {
    id: 'iris',
    name: 'Iris',
    colors: ['#5B3A89', '#6B46C1'],
    textColor: '#FFFFFF',
    borderColor: '#5B3A89',
  },
  {
    id: 'moss',
    name: 'Moss',
    colors: ['#556B2F', '#6B8E23'],
    textColor: '#FFFFFF',
    borderColor: '#556B2F',
  },
  {
    id: 'slate',
    name: 'Slate',
    colors: ['#708090', '#778899'],
    textColor: '#FFFFFF',
    borderColor: '#708090',
  },
  {
    id: 'blush',
    name: 'Blush',
    colors: ['#F8BBD0', '#F48FB1'],
    textColor: '#880E4F',
    borderColor: '#F8BBD0',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    colors: ['#000428', '#004E92', '#3CD3AD', '#4B86E8'],
    textColor: '#FFFFFF',
    borderColor: '#004E92',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    colors: ['#FC466B', '#3F5EFB', '#42D4F4'],
    textColor: '#FFFFFF',
    borderColor: '#FC466B',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    colors: ['#A8EDEA', '#FED6E3', '#F5D0FE', '#D0D1FF'],
    textColor: '#5B21B6',
    borderColor: '#A8EDEA',
  },
  {
    id: 'prismatic',
    name: 'Prismatic',
    colors: ['#FF0844', '#FFB199', '#FFEB3B', '#00BCD4', '#3F51B5'],
    textColor: '#FFFFFF',
    borderColor: '#FF0844',
  },
  {
    id: 'dreamscape',
    name: 'Dreamscape',
    colors: ['#E8B4F8', '#B4E8F8', '#F8B4E8', '#B4F8E8'],
    textColor: '#5B21B6',
    borderColor: '#E8B4F8',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: ['#FF006E', '#8338EC', '#3A86FF', '#06FFB4'],
    textColor: '#FFFFFF',
    borderColor: '#FF006E',
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    colors: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC'],
    textColor: '#4A148C',
    borderColor: '#CE93D8',
  },
  {
    id: 'quantum',
    name: 'Quantum',
    colors: ['#00D2FF', '#3A7BD5', '#6E45E2', '#FF0080'],
    textColor: '#FFFFFF',
    borderColor: '#00D2FF',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    colors: ['#00C9FF', '#92FE9D', '#FC466B', '#FFE53B'],
    textColor: '#1E293B',
    borderColor: '#00C9FF',
  },
  {
    id: 'crystalline',
    name: 'Crystalline',
    colors: ['#B2FEFA', '#0ED2F7', '#7303C0', '#EC38BC'],
    textColor: '#FFFFFF',
    borderColor: '#0ED2F7',
  },
];

export class GradientThemeManager {
  private static gradientCache = new Map<string, GradientTheme>();

  static getAllGradients(): GradientTheme[] {
    return gradientThemes;
  }

  static getGradientById(id: string): GradientTheme | undefined {
    // Check cache first
    if (this.gradientCache.has(id)) {
      return this.gradientCache.get(id);
    }

    // Find gradient
    const gradient = gradientThemes.find(g => g.id === id);
    
    if (gradient) {
      // Cache it
      this.gradientCache.set(id, gradient);
      return gradient;
    }
    
    // Return default ocean gradient if not found
    return gradientThemes[0];
  }

  static getGradientsByCategory(): Record<string, GradientTheme[]> {
    return {
      'Cool Tones': gradientThemes.filter(g => 
        ['ocean', 'sky', 'arctic', 'marine', 'twilight', 'midnight', 'cosmic', 'galaxy', 'nebula', 'quantum', 'crystalline'].includes(g.id)
      ),
      'Warm Tones': gradientThemes.filter(g => 
        ['sunset', 'coral', 'sand', 'tropical', 'flame', 'peach', 'golden', 'ruby', 'copper', 'crimson', 'cherry', 'blush'].includes(g.id)
      ),
      'Nature': gradientThemes.filter(g => 
        ['forest', 'mint', 'emerald', 'jade', 'moss', 'lavender', 'grape', 'violet', 'iris'].includes(g.id)
      ),
      'Neutral': gradientThemes.filter(g => 
        ['charcoal', 'slate'].includes(g.id)
      ),
      'Special': gradientThemes.filter(g => 
        ['holographic', 'prismatic', 'dreamscape', 'cyberpunk', 'ethereal', 'aurora-borealis', 'aurora'].includes(g.id)
      ),
    };
  }
}