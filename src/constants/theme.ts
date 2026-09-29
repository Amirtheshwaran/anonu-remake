export interface ThemeTokens {
  // Canvas & Surfaces
  bgCanvas: string;
  bgCream: string;
  bgSurface: string;
  bgDark: string;
  bgDarkSurface: string;

  // Outlines & Shadows
  black: string;
  white: string;
  border: string;
  borderMuted: string;

  // Vibrant Pop Accents (Neo-Brutalism Staples)
  popYellow: string;
  popMint: string;
  popPink: string;
  popCyan: string;
  popOrange: string;
  popPurple: string;
  popLavender: string;
  popMaroon: string;

  // Text colors
  textPrimary: string;
  textBlack: string;
  textSecondary: string;
  textMuted: string;
  textMutedDark: string;
  textWhite: string;

  // Vote indicators
  upvoteGreen: string;
  downvoteRed: string;

  // Geometry Tokens
  borderWidth: number;
  borderWidthThin: number;
  radiusSharp: number;
  radiusSm: number;
  radiusMd: number;
  radiusPill: number;

  shadowOffset: { width: number; height: number };
  shadowOffsetSm: { width: number; height: number };
  shadowOffsetLg: { width: number; height: number };
}

export const LightTheme: ThemeTokens = {
  // Canvas & Surfaces
  bgCanvas: '#FBF9F2',
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
  popLavender: '#A388EE',
  popMaroon: '#8B0020',

  // Text colors
  textPrimary: '#000000',
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
};

export const DarkTheme: ThemeTokens = {
  // Canvas & Surfaces
  bgCanvas: '#121212',
  bgCream: '#121212',
  bgSurface: '#1E1E1E',
  bgDark: '#0A0A0A',
  bgDarkSurface: '#161616',

  // Outlines & Shadows
  black: '#FFFFFF',
  white: '#121212',
  border: '#FFFFFF',
  borderMuted: '#3A3A3A',

  // Vibrant Pop Accents (Electric High-Contrast)
  popYellow: '#FFEE00',
  popMint: '#00FF66',
  popPink: '#FF0077',
  popCyan: '#00F0FF',
  popOrange: '#FF6600',
  popPurple: '#B39DDB',
  popLavender: '#B39DDB',
  popMaroon: '#FF4081',

  // Text colors
  textPrimary: '#FFFFFF',
  textBlack: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#9E9E9E',
  textMutedDark: '#666666',
  textWhite: '#121212',

  // Vote indicators
  upvoteGreen: '#00FF7F',
  downvoteRed: '#FF3366',

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
};

export const AnonUTheme = LightTheme;
export type ThemeColors = ThemeTokens;
