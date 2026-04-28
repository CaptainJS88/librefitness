import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  calculateFavoriteMealTotals,
  type FavoriteMealWithItems,
} from '@/lib/favoriteMeals';
import Icon from '@/components/Shared/Icon';
import MealTypeFilterChips, { type MealTypeFilter } from './MealTypeFilterChips';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type FavoriteMealPickerListProps = {
  favoriteMeals: FavoriteMealWithItems[];
  favoriteFilter: MealTypeFilter;
  onChangeFilter: (nextFilter: MealTypeFilter) => void;
  onAddFavoriteMeal: (favoriteMeal: FavoriteMealWithItems) => Promise<void>;
  isSubmittingFavoriteMealId: string | null;
};

export default function FavoriteMealPickerList({
  favoriteMeals,
  favoriteFilter,
  onChangeFilter,
  onAddFavoriteMeal,
  isSubmittingFavoriteMealId,
}: FavoriteMealPickerListProps) {
  const { colors } = useAppTheme();

  const filteredFavoriteMeals = favoriteMeals.filter((favoriteMeal) => {
    if (favoriteFilter === 'All') {
      return true;
    }

    return favoriteMeal.meal_type === favoriteFilter;
  });

  return (
    <View style={styles.container}>
      <MealTypeFilterChips
        value={favoriteFilter}
        onChange={(nextFilter) => onChangeFilter(nextFilter as MealTypeFilter)}
      />

      {favoriteMeals.length === 0 ? (
        <ThemedView style={styles.stateContainer}>
          <ThemedText variant="textMuted" style={styles.stateText}>
            No favorite meals yet. Create them from the Favorites tab.
          </ThemedText>
        </ThemedView>
      ) : filteredFavoriteMeals.length === 0 ? (
        <ThemedView style={styles.stateContainer}>
          <ThemedText variant="textMuted" style={styles.stateText}>
            No favorite meals for this filter yet.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={filteredFavoriteMeals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const totals = calculateFavoriteMealTotals(item);
            const itemNames = item.items.map((favoriteItem) => favoriteItem.food_name);
            const previewLine =
              itemNames.length <= 2
                ? itemNames.join(', ')
                : `${itemNames.slice(0, 2).join(', ')} +${itemNames.length - 2} more`;

            const isSubmitting = isSubmittingFavoriteMealId === item.id;

            return (
              <ThemedView variant="surface" style={styles.favoriteMealCard}>
                <View style={styles.favoriteMealRow}>
                  <View style={styles.favoriteMealTextBlock}>
                    <View style={styles.favoriteMealTitleRow}>
                      <ThemedText style={styles.foodTitle}>{item.name}</ThemedText>

                      <ThemedView
                        style={[
                          styles.favoriteMealChip,
                          { backgroundColor: colors.iconSurface },
                        ]}
                      >
                        <ThemedText
                          variant="textMuted"
                          style={styles.favoriteMealChipText}
                        >
                          {item.meal_type}
                        </ThemedText>
                      </ThemedView>
                    </View>

                    <ThemedText variant="textMuted" style={styles.metaText}>
                      {previewLine}
                    </ThemedText>

                    <ThemedText variant="textMuted" style={styles.metaText}>
                      {Math.round(totals.calories)} kcal • {Math.round(totals.protein)}P •{' '}
                      {Math.round(totals.carbs)}C • {Math.round(totals.fat)}F
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => onAddFavoriteMeal(item)}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.buttonText} />
                    ) : (
                      <Icon name="add" size={22} color={colors.buttonText} />
                    )}
                  </TouchableOpacity>
                </View>
              </ThemedView>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  favoriteMealCard: {
    borderRadius: 18,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  favoriteMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteMealTextBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  favoriteMealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  favoriteMealChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  favoriteMealChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  foodTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  stateText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
