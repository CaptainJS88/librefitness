import { getThemeColors } from '@/constants/theme';
import { useThemeStore } from '@/store/useThemeStore';

export function useAppTheme() {
  const theme = useThemeStore((state) => state.theme);
  const colors = getThemeColors(theme);

  return { theme, colors };
}