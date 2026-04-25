import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import Icon from '@/components/Shared/Icon';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type MealsRowProps = {
  title: string;
  currentCalories: number;
  maxCalories: number;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onAddPress: () => void;
};

export default function MealsRow({
  title,
  currentCalories,
  maxCalories,
  iconName,
  onAddPress,
}: MealsRowProps) {
  const { colors } = useAppTheme();

  return (
    <ThemedView variant="surface" style={styles.container}>
      <ThemedView style={styles.leftContent}>
        <ThemedView style={[styles.iconContainer, { backgroundColor: colors.iconSurface }]}>
          <Icon name={iconName} size={24} variant="primary" />
        </ThemedView>

        <ThemedView style={styles.textContainer}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText variant="textMuted" style={styles.calorieText}>
            {currentCalories}/{maxCalories} kcal
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={onAddPress}
      >
        <Icon name="add" size={24} color={colors.buttonText} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: 20,
    marginBottom: SPACING.md,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.md,
    padding: 10,
    borderRadius: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  calorieText: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});