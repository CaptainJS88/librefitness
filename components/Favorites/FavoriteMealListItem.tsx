import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  calculateFavoriteMealTotals,
  type FavoriteMealWithItems,
} from '@/lib/favoriteMeals';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';
import Icon from '../Shared/Icon';

type FavoriteMealListItemProps = {
  favoriteMeal: FavoriteMealWithItems;
  isMenuOpen: boolean;
  onPress: () => void;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

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
  onPress,
  onToggleMenu,
  onEdit,
  onDelete,
}: FavoriteMealListItemProps) {
  const { colors } = useAppTheme();
  const totals = calculateFavoriteMealTotals(favoriteMeal);

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

        <TouchableOpacity
          style={[styles.menuButton, { borderColor: colors.border }]}
          onPress={onToggleMenu}
          activeOpacity={0.85}
        >
          <Icon name="create-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {isMenuOpen ? (
        <View style={[styles.menuRow, { borderTopColor: colors.border }]}>
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
  menuRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
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
