/**
 * @file src/assets/tokens/themes.ts
 * @description Unified theme definitions for the Cape Town GIS platform.
 */

export interface Theme {
  bg: string;
  surface: string;
  cardBg: string;
  shadow: string;
  shadowInset: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentLight: string;
  border: string;
  input: string;
  inputBorder: string;
  // Crayon accents
  pink: string;
  yellow: string;
  blue: string;
}

export const themes: Record<string, Theme> = {
  dark: {
    bg: '#0B0C10',
    surface: '#2d3748',
    cardBg: '#374151',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowInset: 'rgba(255, 255, 255, 0.1)',
    text: '#e2e8f0',
    textSecondary: '#a0aec0',
    accent: '#7dd3c0',
    accentLight: '#a8e6d7',
    border: '#718096',
    input: '#4a5568',
    inputBorder: '#718096',
    pink: '#FF61EF',
    yellow: '#FFD700',
    blue: '#00D1FF',
  },
  light: {
    bg: '#f5f7fa',
    surface: '#ffffff',
    cardBg: '#ffffff',
    shadow: 'rgba(163, 177, 198, 0.15)',
    shadowInset: 'rgba(255, 255, 255, 0.5)',
    text: '#1a202c',
    textSecondary: '#718096',
    accent: '#2d9d7f',
    accentLight: '#7dd3c0',
    border: '#cbd5e0',
    input: '#e2e8f0',
    inputBorder: '#cbd5e0',
    pink: '#FF61EF',
    yellow: '#FFD700',
    blue: '#00D1FF',
  },
  'high-contrast': {
    bg: '#ffffff',
    surface: '#ffffff',
    cardBg: '#ffffff',
    shadow: 'none',
    shadowInset: 'none',
    text: '#000000',
    textSecondary: '#000000',
    accent: '#ff6b35',
    accentLight: '#ff6b35',
    border: '#000000',
    input: '#ffffff',
    inputBorder: '#000000',
    pink: '#FF61EF',
    yellow: '#FFD700',
    blue: '#00D1FF',
  },
};

export type ThemeName = keyof typeof themes;
