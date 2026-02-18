// Professional Islamic Green Theme
export const palette = {
  // Backgrounds - Clean white/cream
  bg: '#FAFAFA',
  bgGradientStart: '#FFFFFF',
  bgGradientEnd: '#F5F5F5',

  // Card backgrounds
  card: '#FFFFFF',
  cardLight: '#FAFAFA',

  // Borders
  border: '#E0E0E0',
  borderLight: '#EEEEEE',

  // Text colors
  text: '#212121',
  textSecondary: '#424242',
  muted: '#757575',

  // Accent colors - Islamic green
  accent: '#2E7D32',
  accentLight: '#4CAF50',
  accentDark: '#1B5E20',
  accentText: '#FFFFFF',

  // Special colors
  gold: '#FFC107',
  goldDark: '#FFA000',

  // Status colors
  danger: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',

  // Gradient presets
  gradients: {
    primary: ['#1B5E20', '#2E7D32', '#43A047'] as const,
    card: ['#2E7D32', '#388E3C', '#2E7D32'] as const,
    header: ['#1B5E20', '#2E7D32'] as const,
    calendar: ['#1B5E20', '#2E7D32', '#1B5E20'] as const,
  },
};
