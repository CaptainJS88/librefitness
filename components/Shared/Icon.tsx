import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

type IconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
};

export default function Icon({ name, size = 24, color = COLORS.text }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}