export const AnonUTheme = {
  // Canvas & Surfaces
  bgCream: '#FBF9F2',
  bgSurface: '#FFFFFF',
  bgDark: '#121212',
  bgDarkSurface: '#1E1E1E',

  // Outlines & Shadows
  black: '#000000',
  white: '#FFFFFF',
  border: '#000000',
  borderMuted: '#E0E0E0',

  // Vibrant Pop Accents (Neo-Brutalism Staples)
  popYellow: '#FFE600',
  popMint: '#00F090',
  popPink: '#FF5C93',
  popCyan: '#00E5FF',
  popOrange: '#FF5A1F',
  popPurple: '#A388EE',
  popMaroon: '#8B0020',

  // Text colors
  textBlack: '#000000',
  textSecondary: '#4A4A4A',
  textMuted: '#5E5E5E',
  textMutedDark: '#9E9E9E',
  textWhite: '#FFFFFF',

  // Vote indicators
  upvoteGreen: '#00D26A',
  downvoteRed: '#FF334B',

  // Geometry Tokens
  borderWidth: 3,
  borderWidthThin: 2,
  radiusSharp: 0,
  radiusSm: 6,
  radiusMd: 10,
  radiusPill: 999,

  shadowOffset: { width: 4, height: 4 },
  shadowOffsetSm: { width: 2.5, height: 2.5 },
  shadowOffsetLg: { width: 6, height: 6 },
} as const;

export type ThemeColors = typeof AnonUTheme;
