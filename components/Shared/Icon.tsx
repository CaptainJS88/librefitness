import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

type IconVariant = 'default' | 'muted' | 'primary' | 'danger';

type IconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  variant?: IconVariant;
};

export default function Icon({
  name,
  size = 24,
  color,
  variant = 'default',
}: IconProps) {
  const { colors } = useAppTheme();

  const resolvedColor =
    color ??
    {
      default: colors.icon,
      muted: colors.textMuted,
      primary: colors.primary,
      danger: colors.danger,
    }[variant];

  return <Ionicons name={name} size={size} color={resolvedColor} />;
}