import { Platform } from 'react-native';

/**
 * 차분하고 따뜻한 저채도 녹색·베이지 팔레트. 라이트/다크 모두 지원.
 */
const light = {
    background: '#F6F2E9',
    surface: '#FDFBF6',
    surfaceAlt: '#EEE8DB',
    border: '#E0D8C8',
    text: '#2E3A33',
    textSecondary: '#6B7570',
    primary: '#6E8F7A',
    primaryStrong: '#587A64',
    onPrimary: '#FBFAF5',
    accent: '#C9A66B',
    danger: '#B5654F',
    breathCircle: '#A9C4B2',
    breathCircleOuter: '#D6E3DA',
    tabInactive: '#8E968F',
} as const;

export type ThemeColors = { [K in keyof typeof light]: string };

const dark: ThemeColors = {
    background: '#1B201D',
    surface: '#252C27',
    surfaceAlt: '#2E3731',
    border: '#3A443D',
    text: '#ECE7DD',
    textSecondary: '#A9B2AB',
    primary: '#8FB09B',
    primaryStrong: '#A7C4B1',
    onPrimary: '#1B201D',
    accent: '#D4B57C',
    danger: '#D08870',
    breathCircle: '#5F8A70',
    breathCircleOuter: '#34493D',
    tabInactive: '#7C877F',
};

export const Colors: Record<'light' | 'dark', ThemeColors> = { light, dark };
export type ThemeColor = keyof ThemeColors;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** 최소 터치 영역 48dp */
export const MinTouch = 48;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  default: { sans: 'normal', rounded: 'normal' },
});

export const TextSizes = {
  caption: { fontSize: 14, lineHeight: 20 },
  body: { fontSize: 18, lineHeight: 27 },
  bodyStrong: { fontSize: 18, lineHeight: 27, fontWeight: '600' as const },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700' as const },
  display: { fontSize: 34, lineHeight: 42, fontWeight: '700' as const },
  phase: { fontSize: 30, lineHeight: 38, fontWeight: '600' as const },
} as const;

export const MaxContentWidth = 560;
