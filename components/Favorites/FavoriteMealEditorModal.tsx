import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MealType } from '@/lib/foodEntries';
import {
  createFavoriteMeal,
  type CreateFavoriteMealItemInput,
  type FavoriteMealItemRow,
  type FavoriteMealWithItems,
  updateFavoriteMeal,
} from '@/lib/favoriteMeals';
import { type CleanFoodItem } from '@/lib/usda';
import SearchModal from '@/components/Tracker/SearchModal';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';
import Icon from '../Shared/Icon';
import FavoriteMealDraftItemRow, {
  type FavoriteMealDraftItem,
} from './FavoriteMealDraftItemRow';
import MealTypeFilterChips from './MealTypeFilterChips';

type FavoriteMealEditorModalProps = {
  visible: boolean;
  userId: string | null | undefined;
  favoriteMeal?: FavoriteMealWithItems | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

function createDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function mapFavoriteMealItemToDraftItem(
  item: FavoriteMealItemRow
): FavoriteMealDraftItem {
  return {
    id: item.id,
    foodName: item.food_name,
    servingSizeValue: item.serving_size_value,
    servingSizeUnit: item.serving_size_unit,
    servingWeightGrams: item.serving_weight_grams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    source: item.source,
    sourceFoodId: item.source_food_id,
  };
}

function mapDraftItemToCreateInput(
  item: FavoriteMealDraftItem
): CreateFavoriteMealItemInput {
  return {
    foodName: item.foodName,
    servingSizeValue: item.servingSizeValue,
    servingSizeUnit: item.servingSizeUnit,
    servingWeightGrams: item.servingWeightGrams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    source: item.source,
    sourceFoodId: item.sourceFoodId,
  };
}

export default function FavoriteMealEditorModal({
  visible,
  userId,
  favoriteMeal = null,
  onClose,
  onSaved,
}: FavoriteMealEditorModalProps) {
  const { colors } = useAppTheme();
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [draftItems, setDraftItems] = useState<FavoriteMealDraftItem[]>([]);
  const [expandedDraftItemId, setExpandedDraftItemId] = useState<string | null>(null);
  const [isItemSearchVisible, setIsItemSearchVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditingExistingMeal = favoriteMeal != null;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setMealName(favoriteMeal?.name ?? '');
    setMealType(favoriteMeal?.meal_type ?? 'Breakfast');
    setDraftItems(
      favoriteMeal?.items.map(mapFavoriteMealItemToDraftItem) ?? []
    );
    setExpandedDraftItemId(null);
    setIsItemSearchVisible(false);
    setIsSaving(false);
  }, [favoriteMeal, visible]);

  const canSaveMeal = useMemo(() => {
    return mealName.trim().length > 0 && draftItems.length > 0 && !isSaving;
  }, [draftItems.length, isSaving, mealName]);

  function updateDraftItemQuantity(itemId: string, nextServingSizeValue: number) {
    setDraftItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const currentServingSizeValue =
          item.servingSizeValue && item.servingSizeValue > 0
            ? item.servingSizeValue
            : 1;

        const ratio = nextServingSizeValue / currentServingSizeValue;

        return {
          ...item,
          servingSizeValue: roundToOneDecimal(nextServingSizeValue),
          servingWeightGrams:
            item.servingWeightGrams != null
              ? roundToOneDecimal(item.servingWeightGrams * ratio)
              : null,
          calories: roundToOneDecimal(item.calories * ratio),
          protein: roundToOneDecimal(item.protein * ratio),
          carbs: roundToOneDecimal(item.carbs * ratio),
          fat: roundToOneDecimal(item.fat * ratio),
        };
      })
    );

    setExpandedDraftItemId(null);
  }

  async function handleAddDraftItem(
    food: CleanFoodItem,
    quantityMultiplier: number
  ) {
    const nextDraftItem: FavoriteMealDraftItem = {
      id: createDraftId(),
      foodName: food.description,
      servingSizeValue: roundToOneDecimal(food.servingSize * quantityMultiplier),
      servingSizeUnit: food.servingSizeUnit,
      servingWeightGrams:
        food.servingSizeUnit.toLowerCase() === 'g'
          ? roundToOneDecimal(food.servingSize * quantityMultiplier)
          : null,
      calories: roundToOneDecimal(food.calories * quantityMultiplier),
      protein: roundToOneDecimal(food.protein * quantityMultiplier),
      carbs: roundToOneDecimal(food.carbs * quantityMultiplier),
      fat: roundToOneDecimal(food.fat * quantityMultiplier),
      source: 'usda',
      sourceFoodId: food.fdcId.toString(),
    };

    setDraftItems((currentItems) => [...currentItems, nextDraftItem]);
  }

  async function handleSaveMeal() {
    try {
      if (!userId) {
        Alert.alert('Not signed in', 'You must be signed in to save favorite meals.');
        return;
      }

      if (!canSaveMeal) {
        Alert.alert('Incomplete meal', 'Add a name and at least one item before saving.');
        return;
      }

      setIsSaving(true);

      const payload = {
        name: mealName.trim(),
        mealType,
        items: draftItems.map(mapDraftItemToCreateInput),
      };

      if (favoriteMeal) {
        await updateFavoriteMeal({
          favoriteMealId: favoriteMeal.id,
          ...payload,
        });
      } else {
        await createFavoriteMeal({
          userId,
          ...payload,
        });
      }

      await onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving favorite meal:', error);
      Alert.alert('Error', 'Unable to save favorite meal right now.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <ThemedView style={styles.backdrop}>
          <ThemedView variant="surface" style={styles.modalCard}>
            <ThemedView style={styles.headerRow}>
              <View style={styles.headerTextBlock}>
                <ThemedText style={styles.title}>
                  {isEditingExistingMeal ? 'Edit Favorite Meal' : 'Create Favorite Meal'}
                </ThemedText>
                <ThemedText variant="textMuted" style={styles.subtitle}>
                  Build a reusable meal template for faster logging.
                </ThemedText>
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { borderColor: colors.border }]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Icon name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </ThemedView>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Meal Name</ThemedText>
                <TextInput
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="Eg: Oatmeal and Eggs"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Meal Type</ThemedText>
                <MealTypeFilterChips
                  value={mealType}
                  onChange={(nextValue) => setMealType(nextValue as MealType)}
                  includeAll={false}
                />
              </View>

              <View style={styles.itemsHeaderRow}>
                <ThemedText style={styles.sectionTitle}>Meal Items</ThemedText>

                <TouchableOpacity
                  style={[styles.addItemButton, { backgroundColor: colors.primary }]}
                  onPress={() => setIsItemSearchVisible(true)}
                  activeOpacity={0.85}
                >
                  <Icon name="add" size={18} color={colors.buttonText} />
                  <ThemedText style={[styles.addItemButtonText, { color: colors.buttonText }]}>
                    Add Item
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {draftItems.length === 0 ? (
                <ThemedView style={styles.emptyState}>
                  <ThemedText variant="textMuted" style={styles.emptyStateText}>
                    Add foods to build this favorite meal.
                  </ThemedText>
                </ThemedView>
              ) : (
                draftItems.map((item) => (
                  <FavoriteMealDraftItemRow
                    key={item.id}
                    item={item}
                    isExpanded={expandedDraftItemId === item.id}
                    onToggleExpanded={() =>
                      setExpandedDraftItemId((currentId) =>
                        currentId === item.id ? null : item.id
                      )
                    }
                    onDelete={() =>
                      {
                        setExpandedDraftItemId((currentId) =>
                          currentId === item.id ? null : currentId
                        );
                        setDraftItems((currentItems) =>
                          currentItems.filter((currentItem) => currentItem.id !== item.id)
                        );
                      }
                    }
                    onUpdateQuantity={(nextServingSizeValue) =>
                      updateDraftItemQuantity(item.id, nextServingSizeValue)
                    }
                  />
                ))
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={onClose}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: canSaveMeal ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={handleSaveMeal}
                  disabled={!canSaveMeal}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.primaryButtonText, { color: colors.buttonText }]}>
                    {isSaving ? 'Saving...' : 'Save Favorite Meal'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </ThemedView>
        </ThemedView>
      </Modal>

      <SearchModal
        visible={isItemSearchVisible}
        mealLabel={mealType}
        title="Add Meal Item"
        subtitle={`For favorite meal: ${mealType}`}
        onClose={() => setIsItemSearchVisible(false)}
        onAddFood={handleAddDraftItem}
        showFavoritesTab={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    height: '92%',
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
  content: {
    paddingBottom: SPACING.xl,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
