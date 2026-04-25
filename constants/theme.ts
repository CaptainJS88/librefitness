// This is the main source of truth when it comes to Libre Fitness's color palates.
export type ThemeMode = 'light' | 'dark';

export const lightTheme = {
  primary: '#4A90E2',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#333333',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  icon: '#333333',
  iconSurface: '#F0F4F8',
  header: '#FFFFFF',
  tabBar: '#FFFFFF',
  danger: '#FF3B30',
  buttonText: '#FFFFFF',
};

export const darkTheme = {
  primary: '#5AA9FF',
  background: '#0B0B0C',
  surface: '#17181A',
  text: '#F5F5F5',
  textMuted: '#A1A1AA',
  border: '#2A2D31',
  icon: '#F5F5F5',
  iconSurface: '#1F2937',
  header: '#111214',
  tabBar: '#111214',
  danger: '#FF453A',
  buttonText: '#FFFFFF',
};

export type AppColors = typeof lightTheme;

export const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function getThemeColors(theme: ThemeMode): AppColors {
  return theme === 'dark' ? darkTheme : lightTheme;
}
