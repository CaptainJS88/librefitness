import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { USDA, type CleanFoodItem } from '@/lib/usda';
import { mapUSDASearchResponseToCleanFoods } from '@/lib/usda.mapper';
import {
  calculateFavoriteMealTotals,
  type FavoriteMealWithItems,
} from '@/lib/favoriteMeals';
import Icon from '@/components/Shared/Icon';
import QuantityEditor from './QuantityEditor';
import {
  getNextQuantityValue,
  parseQuantityInput,
  QUANTITY_STEP,
} from './quantityEditorUtils';
import MealTypeFilterChips, {
  type MealTypeFilter,
} from '@/components/Favorites/MealTypeFilterChips';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type SearchModalProps = {
  visible: boolean;
  mealLabel: string;
  onClose: () => void;
  onAddFood: (food: CleanFoodItem, quantityMultiplier: number) => Promise<void>;
  pageSize?: number;
  title?: string;
  subtitle?: string;
  showFavoritesTab?: boolean;
  favoriteMeals?: FavoriteMealWithItems[];
  defaultFavoriteFilter?: MealTypeFilter;
  onAddFavoriteMeal?: (favoriteMeal: FavoriteMealWithItems) => Promise<void>;
};

// Small helper so the serving line stays readable in the UI.
function formatServing(food: CleanFoodItem) {
  return `${food.servingSize} ${food.servingSizeUnit}`;
}

export default function SearchModal({
  visible,
  mealLabel,
  onClose,
  onAddFood,
  pageSize = 10,
  title = 'Add Food',
  subtitle,
  showFavoritesTab = true,
  favoriteMeals = [],
  defaultFavoriteFilter = 'All',
  onAddFavoriteMeal,
}: SearchModalProps) {
  const { colors } = useAppTheme();

  // query = what the user is typing right now
  // debouncedQuery = what we actually search for after a short delay
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // These states drive the search list and the inline quantity editor.
  const [results, setResults] = useState<CleanFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFoodId, setExpandedFoodId] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [isSubmittingFoodId, setIsSubmittingFoodId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');
  const [favoriteFilter, setFavoriteFilter] = useState<MealTypeFilter>(defaultFavoriteFilter);
  const [isSubmittingFavoriteMealId, setIsSubmittingFavoriteMealId] = useState<string | null>(null);

  // When the modal closes, reset its internal state.
  // That keeps each modal session feeling fresh and predictable.
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setDebouncedQuery('');
      setResults([]);
      setError(null);
      setIsSearching(false);
      setExpandedFoodId(null);
      setQuantityInput('1');
      setIsSubmittingFoodId(null);
      setActiveTab('search');
      setFavoriteFilter(defaultFavoriteFilter);
      setIsSubmittingFavoriteMealId(null);
    }
  }, [defaultFavoriteFilter, visible]);

  // Debounce the user's typing so we do not hit the API on every keypress.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Run the USDA search whenever the debounced query changes.
  useEffect(() => {
    if (!visible) {
      return;
    }

    // If the search text is too short, do not search yet.
    // This avoids noisy results for single characters like "p".
    if (debouncedQuery.length < 2) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      try {
        setIsSearching(true);
        setError(null);

        const response = await USDA.searchFoods(debouncedQuery, 1, pageSize);

        // If this effect has already been cleaned up, do nothing.
        if (cancelled) {
          return;
        }

        const cleanFoods = mapUSDASearchResponseToCleanFoods(response);
        setResults(cleanFoods);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setResults([]);
        setError('Unable to search foods right now.');
        console.error('Search modal error:', err);
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, visible, pageSize]);

  // Expands one food row at a time.
  function toggleExpandedFood(foodId: number) {
    if (expandedFoodId === foodId) {
      setExpandedFoodId(null);
      setQuantityInput('1');
      return;
    }

    setExpandedFoodId(foodId);
    setQuantityInput('1');
  }

  // Adjusts the quantity with small stepper buttons.
  // Users can still type any decimal manually in the center input.
  function adjustQuantity(delta: number) {
    setQuantityInput(getNextQuantityValue(quantityInput, delta));
  }

  // Computes the preview values shown before a food is committed.
  function getScaledNutrition(food: CleanFoodItem, quantityMultiplier: number) {
    return {
      calories: Number((food.calories * quantityMultiplier).toFixed(1)),
      protein: Number((food.protein * quantityMultiplier).toFixed(1)),
      carbs: Number((food.carbs * quantityMultiplier).toFixed(1)),
      fat: Number((food.fat * quantityMultiplier).toFixed(1)),
      servingAmount: Number((food.servingSize * quantityMultiplier).toFixed(1)),
    };
  }

  // Adds the selected food with the chosen quantity multiplier.
  // We intentionally keep the modal open afterward so users can keep logging.
  async function handleConfirmAddFood(food: CleanFoodItem) {
    const quantityMultiplier = parseQuantityInput(quantityInput);

    if (quantityMultiplier == null) {
      return;
    }

    try {
      setIsSubmittingFoodId(food.fdcId);
      await onAddFood(food, quantityMultiplier);
      setExpandedFoodId(null);
      setQuantityInput('1');
    } catch (error) {
      console.error('Error confirming food addition:', error);
    } finally {
      setIsSubmittingFoodId(null);
    }
  }
 // This async fucntion needs to move out of here eventually
  async function handleConfirmAddFavoriteMeal(favoriteMeal: FavoriteMealWithItems) {
    if (!onAddFavoriteMeal) {
      return;
    }

    try {
      setIsSubmittingFavoriteMealId(favoriteMeal.id);
      await onAddFavoriteMeal(favoriteMeal);
    } catch (error) {
      console.error('Error confirming favorite meal addition:', error);
    } finally {
      setIsSubmittingFavoriteMealId(null);
    }
  }

  // Renders one normalized food result row.
  function renderFoodItem({ item }: { item: CleanFoodItem }) {
    const isExpanded = expandedFoodId === item.fdcId;
    const parsedQuantity = parseQuantityInput(quantityInput);
    const quantityPreview = parsedQuantity ?? 1;
    const scaledNutrition = getScaledNutrition(item, quantityPreview);

    return (
      <View style={styles.resultCard}>
        <ThemedView variant="surface" style={styles.resultCardInner}>
          <ThemedView style={styles.resultRow}>
            <View style={styles.resultTextBlock}>
              <ThemedText style={styles.foodTitle}>{item.description}</ThemedText>

              {item.brandOwner ? (
                <ThemedText variant="textMuted" style={styles.brandText}>
                  {item.brandOwner}
                </ThemedText>
              ) : null}

              <ThemedText variant="textMuted" style={styles.metaText}>
                {item.calories} kcal • {item.protein}P • {item.carbs}C • {item.fat}F
              </ThemedText>

              <ThemedText variant="textMuted" style={styles.metaText}>
                Serving Size: {formatServing(item)}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => toggleExpandedFood(item.fdcId)}
            >
              <Icon
                name={isExpanded ? 'chevron-down' : 'add'}
                size={22}
                color={colors.buttonText}
              />
            </TouchableOpacity>
          </ThemedView>

          {isExpanded ? (
            <QuantityEditor
              helperText={`Quantity multiplier for ${formatServing(item)}`}
              quantityInput={quantityInput}
              onChangeQuantity={setQuantityInput}
              onDecrement={() => adjustQuantity(-QUANTITY_STEP)}
              onIncrement={() => adjustQuantity(QUANTITY_STEP)}
              previewLineOne={`${scaledNutrition.servingAmount} ${item.servingSizeUnit} • ${scaledNutrition.calories} kcal`}
              previewLineTwo={`${scaledNutrition.protein}P • ${scaledNutrition.carbs}C • ${scaledNutrition.fat}F`}
              primaryButtonLabel="Done"
              onPressPrimary={() => handleConfirmAddFood(item)}
              isPrimaryDisabled={
                parsedQuantity == null || isSubmittingFoodId === item.fdcId
              }
              isPrimaryLoading={isSubmittingFoodId === item.fdcId}
            />
          ) : null}
        </ThemedView>
      </View>
    );
  }
  // This should be another component/moved outta here.
  function renderFavoriteMealsContent() {
    const filteredFavoriteMeals = favoriteMeals.filter((favoriteMeal) => {
      if (favoriteFilter === 'All') {
        return true;
      }

      return favoriteMeal.meal_type === favoriteFilter;
    });

    return (
      <View style={styles.favoriteMealsContainer}>
        <MealTypeFilterChips
          value={favoriteFilter}
          onChange={(nextFilter) => setFavoriteFilter(nextFilter as MealTypeFilter)}
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
                      onPress={() => handleConfirmAddFavoriteMeal(item)}
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

  // Decides what the modal should show below the search bar.
  function renderContent() {
    if (query.trim().length < 2) {
      return (
        <ThemedView style={styles.stateContainer}>
          <ThemedText variant="textMuted" style={styles.stateText}>
            Start typing at least 2 characters to search for food.
          </ThemedText>
        </ThemedView>
      );
    }

    if (isSearching) {
      return (
        <ThemedView style={styles.stateContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText variant="textMuted" style={styles.stateText}>
            Searching USDA foods...
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.stateContainer}>
          <ThemedText style={[styles.stateText, { color: colors.danger }]}>
            {error}
          </ThemedText>
        </ThemedView>
      );
    }

    if (results.length === 0) {
      return (
        <ThemedView style={styles.stateContainer}>
          <ThemedText variant="textMuted" style={styles.stateText}>
            {`No foods found for ${debouncedQuery}.`}
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item) => item.fdcId.toString()}
        renderItem={renderFoodItem}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ThemedView style={styles.backdrop}>
        <ThemedView variant="surface" style={styles.modalCard}>
          {/* Header row with the meal name and close button */}
          <ThemedView style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              <ThemedText variant="textMuted" style={styles.subtitle}>
                {subtitle ?? `Searching for: ${mealLabel}`}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Icon name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </ThemedView>

          {showFavoritesTab ? (
            <ThemedView
              style={[
                styles.segmentedControl,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  activeTab === 'search'
                    ? { backgroundColor: colors.primary }
                    : null,
                ]}
                onPress={() => setActiveTab('search')}
                activeOpacity={0.85}
              >
                <ThemedText
                  style={[
                    styles.segmentButtonText,
                    { color: activeTab === 'search' ? colors.buttonText : colors.text },
                  ]}
                >
                  Search
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  activeTab === 'favorites'
                    ? { backgroundColor: colors.primary }
                    : null,
                ]}
                onPress={() => setActiveTab('favorites')}
                activeOpacity={0.85}
              >
                <ThemedText
                  style={[
                    styles.segmentButtonText,
                    { color: activeTab === 'favorites' ? colors.buttonText : colors.text },
                  ]}
                >
                  Favorites
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : null}

          {activeTab === 'search' || !showFavoritesTab ? (
            <>
              {/* Search bar */}
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search foods like apple, oats, peanut butter..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.searchInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              />

              {/* Search results / loading / empty state */}
              <View style={styles.resultsContainer}>{renderContent()}</View>
            </>
          ) : (
            <View style={styles.resultsContainer}>{renderFavoriteMealsContent()}</View>
          )}
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  segmentedControl: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    marginBottom: SPACING.md,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  resultCard: {
    marginBottom: SPACING.sm,
  },
  resultCardInner: {
    borderRadius: 18,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  resultTextBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  brandText: {
    fontSize: 13,
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    marginTop: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteMealsContainer: {
    flex: 1,
  },
  favoriteMealCard: {
    borderRadius: 18,
    marginBottom: SPACING.sm,
  },
  favoriteMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  favoriteMealTextBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  favoriteMealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
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
  stateContainer: {
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
