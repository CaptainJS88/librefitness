import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  calculateFavoriteMealTotals,
  type FavoriteMealWithItems,
} from '@/lib/favoriteMeals';
import type { MealType } from '@/lib/foodEntries';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';
import Icon from '../Shared/Icon';

type FavoriteMealListItemProps = {
  favoriteMeal: FavoriteMealWithItems;
  isMenuOpen: boolean;
  isAddPickerOpen: boolean;
  isAddingToMealType: MealType | null;
  onPress: () => void;
  onToggleMenu: () => void;
  onToggleAddPicker: () => void;
  onAddToMealType: (mealType: MealType) => void;
  onEdit: () => void;
  onDelete: () => void;
};

const MEAL_TYPE_OPTIONS: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

function buildItemsPreview(favoriteMeal: FavoriteMealWithItems) {
  const itemNames = favoriteMeal.items.map((item) => item.food_name);
  const previewNames = itemNames.slice(0, 2).join(', ');

  if (itemNames.length <= 2) {
    return previewNames;
  }

  return `${previewNames} +${itemNames.length - 2} more`;
}

export default function FavoriteMealListItem({
  favoriteMeal,
  isMenuOpen,
  isAddPickerOpen,
  isAddingToMealType,
  onPress,
  onToggleMenu,
  onToggleAddPicker,
  onAddToMealType,
  onEdit,
  onDelete,
}: FavoriteMealListItemProps) {
  const { colors } = useAppTheme();
  const totals = calculateFavoriteMealTotals(favoriteMeal);
  const isAdding = isAddingToMealType != null;

  return (
    <ThemedView variant="surface" style={styles.card}>
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={styles.textBlock}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <View style={styles.titleRow}>
            <ThemedText style={styles.title}>{favoriteMeal.name}</ThemedText>

            <ThemedView
              style={[
                styles.mealTypeChip,
                { backgroundColor: colors.iconSurface },
              ]}
            >
              <ThemedText variant="textMuted" style={styles.mealTypeChipText}>
                {favoriteMeal.meal_type}
              </ThemedText>
            </ThemedView>
          </View>

          <ThemedText variant="textMuted" style={styles.previewText}>
            {buildItemsPreview(favoriteMeal)}
          </ThemedText>

          <ThemedText variant="textMuted" style={styles.previewText}>
            {Math.round(totals.calories)} kcal • {Math.round(totals.protein)}P •{' '}
            {Math.round(totals.carbs)}C • {Math.round(totals.fat)}F
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={[styles.menuButton, { borderColor: colors.border }]}
            onPress={onToggleMenu}
            activeOpacity={0.85}
            disabled={isAdding}
          >
            <Icon name="create-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={onToggleAddPicker}
            activeOpacity={0.85}
            disabled={isAdding}
          >
            <Icon name="add" size={18} color={colors.buttonText} />
          </TouchableOpacity>
        </View>
      </View>

      {isAddPickerOpen ? (
        <View style={styles.addPickerContainer}>
          <ThemedText variant="textMuted" style={styles.addPickerLabel}>
            Add to
          </ThemedText>

          <View style={styles.addPickerGrid}>
            {MEAL_TYPE_OPTIONS.map((mealType) => {
              const isSubmittingThisMealType = isAddingToMealType === mealType;

              return (
                <TouchableOpacity
                  key={mealType}
                  style={[
                    styles.addPickerButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: isSubmittingThisMealType
                        ? colors.primary
                        : 'transparent',
                    },
                  ]}
                  onPress={() => onAddToMealType(mealType)}
                  disabled={isAdding}
                  activeOpacity={0.85}
                >
                  {isSubmittingThisMealType ? (
                    <ActivityIndicator size="small" color={colors.buttonText} />
                  ) : (
                    <ThemedText style={styles.addPickerButtonText}>
                      {mealType}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {isMenuOpen ? (
        <View style={styles.menuRow}>
          <TouchableOpacity
            style={[styles.menuActionButton, { borderColor: colors.border }]}
            onPress={onEdit}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.menuActionText}>Edit Meal</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuActionButton,
              { borderColor: colors.danger, backgroundColor: colors.danger },
            ]}
            onPress={onDelete}
            activeOpacity={0.85}
          >
            <ThemedText style={[styles.menuActionText, { color: colors.buttonText }]}>
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: SPACING.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
  },
  textBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  mealTypeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mealTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 13,
    marginTop: 2,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsColumn: {
    gap: SPACING.sm,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  addPickerContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  addPickerLabel: {
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  addPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  addPickerButton: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuActionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
