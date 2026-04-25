import { View, ViewProps } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

type ThemedViewProps = ViewProps & {
  variant?: 'transparent' | 'background' | 'surface';
};

export function ThemedView({
  style,
  variant = 'transparent',
  ...props
}: ThemedViewProps) {
  const { colors } = useAppTheme();

  const backgroundColor =
    variant === 'transparent' ? 'transparent' : colors[variant];

  return <View {...props} style={[{ backgroundColor }, style]} />;
}