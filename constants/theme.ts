export const Palette = {
  // Backgrounds
  background: '#090A0F',
  surface: '#12131C',
  surfaceElevated: '#1A1B29',
  surfaceHover: '#232538',
  surfaceGlass: 'rgba(18, 19, 28, 0.75)',

  // Accents
  primary: '#8B5CF6',         // Violet
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  
  secondary: '#EC4899',       // Magenta / Pink
  secondaryLight: '#F472B6',
  secondaryDark: '#BE185D',

  accentBlue: '#38BDF8',      // Subtle Electric Blue
  accentIndigo: '#6366F1',

  // Status & Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  offlineBadge: '#10B981',

  // Typography Colors
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textMuted: '#475569',
  textAccent: '#C084FC',

  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderActive: 'rgba(139, 92, 246, 0.4)',

  // Overlays & Shadows
  overlayDark: 'rgba(0, 0, 0, 0.65)',
  shadowColor: '#000000',
};

export const Gradients = {
  primary: ['#8B5CF6', '#D946EF'] as const,
  primarySubtle: ['rgba(139, 92, 246, 0.25)', 'rgba(217, 70, 239, 0.1)'] as const,
  surface: ['#181928', '#11121C'] as const,
  surfaceGlass: ['rgba(26, 27, 41, 0.85)', 'rgba(14, 15, 24, 0.95)'] as const,
  cardBackdrop: ['transparent', 'rgba(9, 10, 15, 0.95)'] as const,
  aurora: ['#8B5CF6', '#38BDF8'] as const,
  offlineGold: ['#F59E0B', '#D97706'] as const,
  ambientGlow: ['rgba(139, 92, 246, 0.18)', 'transparent'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 9999,
};

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  titleLarge: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  titleSmall: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
  },
  subhead: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  meta: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const Theme = {
  colors: Palette,
  gradients: Gradients,
  spacing: Spacing,
  radius: Radius,
  typography: Typography,
};

export default Theme;

