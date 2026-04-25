import { Text, TextProps } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

type ThemedTextProps = TextProps & {
  variant?: 'text' | 'textMuted' | 'primary';
};

export function ThemedText({
  style,
  variant = 'text',
  ...props
}: ThemedTextProps) {
  const { colors } = useAppTheme();

  return <Text {...props} style={[{ color: colors[variant] }, style]} />;
}