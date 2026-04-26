import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { FoodEntryRow } from '@/lib/foodEntries';
import Icon from '@/components/Shared/Icon';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type FoodEntryItemProps = {
  entry: FoodEntryRow;
  onPressMore?: (entry: FoodEntryRow) => void;
};

// Small formatter for the serving line.
// Example: "72 kcal, 1 cup"
function formatServing(entry: FoodEntryRow) {
  if (
    entry.serving_size_value == null ||
    entry.serving_size_unit == null ||
    entry.serving_size_unit.trim() === ''
  ) {
    return `${entry.calories} kcal`;
  }

  return `${entry.calories} kcal, ${entry.serving_size_value} ${entry.serving_size_unit}`;
}

export default function FoodEntryItem({
  entry,
  onPressMore,
}: FoodEntryItemProps) {
  const { colors } = useAppTheme();

  return (
    <ThemedView style={styles.container}>
      {/* Circular placeholder for future food images. */}
      <ThemedView
        style={[styles.imagePlaceholder, { backgroundColor: colors.iconSurface }]}
      >
        <Icon name="restaurant-outline" size={18} color={colors.textMuted} />
      </ThemedView>

      <View style={styles.textBlock}>
        <ThemedText style={styles.foodName}>{entry.food_name}</ThemedText>
        <ThemedText variant="textMuted" style={styles.metaText}>
          {formatServing(entry)}
        </ThemedText>
      </View>

      {/* 3-dot action button.
          Keeping this as a stub for now so the UI shape is ready for edit/delete later. */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => onPressMore?.(entry)}
        activeOpacity={0.7}
      >
        <Icon name="ellipsis-horizontal" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  imagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  textBlock: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 13,
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
