import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { FoodEntryRow } from '@/lib/foodEntries';
import Icon from '@/components/Shared/Icon';
import QuantityEditor from './QuantityEditor';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type FoodEntryItemProps = {
  entry: FoodEntryRow;
  onUpdateEntry: (entry: FoodEntryRow, nextServingSizeValue: number) => Promise<void>;
  onDeleteEntry: (entry: FoodEntryRow) => Promise<void>;
};

const QUANTITY_STEP = 0.5;
const MIN_QUANTITY = 0.1;

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
  onUpdateEntry,
  onDeleteEntry,
}: FoodEntryItemProps) {
  const { colors } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quantityInput, setQuantityInput] = useState(
    entry.serving_size_value?.toString() ?? '1'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Parses the editor input into a valid positive decimal value.
  function parseQuantity(value: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  // Keeps stepper values stable and readable.
  function formatQuantityValue(value: number) {
    return Number(value.toFixed(2)).toString();
  }

  function toggleExpanded() {
    if (isExpanded) {
      setIsExpanded(false);
      setQuantityInput(entry.serving_size_value?.toString() ?? '1');
      return;
    }

    setQuantityInput(entry.serving_size_value?.toString() ?? '1');
    setIsExpanded(true);
  }

  function adjustQuantity(delta: number) {
    const currentQuantity = parseQuantity(quantityInput) ?? 1;
    const nextQuantity = Math.max(MIN_QUANTITY, currentQuantity + delta);
    setQuantityInput(formatQuantityValue(nextQuantity));
  }

  // Builds a preview of the updated calories and macros using a serving ratio.
  function getUpdatedPreview(nextServingSizeValue: number) {
    const currentServingSizeValue =
      entry.serving_size_value && entry.serving_size_value > 0
        ? entry.serving_size_value
        : 1;

    const ratio = nextServingSizeValue / currentServingSizeValue;

    return {
      calories: Number((entry.calories * ratio).toFixed(1)),
      protein: Number((entry.protein * ratio).toFixed(1)),
      carbs: Number((entry.carbs * ratio).toFixed(1)),
      fat: Number((entry.fat * ratio).toFixed(1)),
    };
  }

  async function handleSaveEdit() {
    const nextServingSizeValue = parseQuantity(quantityInput);

    if (nextServingSizeValue == null) {
      return;
    }

    try {
      setIsSaving(true);
      await onUpdateEntry(entry, nextServingSizeValue);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error saving food entry edit:', error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setIsDeleting(true);
      await onDeleteEntry(entry);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error deleting food entry:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const parsedQuantity = parseQuantity(quantityInput);
  const preview = getUpdatedPreview(parsedQuantity ?? (entry.serving_size_value ?? 1));

  return (
    <ThemedView style={styles.card}>
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

        {/* 3-dot action button opens the same quantity editor pattern
            used in the add-food search flow. */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <Icon
            name={isExpanded ? 'chevron-down' : 'ellipsis-horizontal'}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </ThemedView>

      {isExpanded ? (
        <QuantityEditor
          helperText={`Edit amount in ${entry.serving_size_unit ?? 'servings'}`}
          quantityInput={quantityInput}
          onChangeQuantity={setQuantityInput}
          onDecrement={() => adjustQuantity(-QUANTITY_STEP)}
          onIncrement={() => adjustQuantity(QUANTITY_STEP)}
          previewLineOne={`${preview.calories} kcal, ${quantityInput} ${entry.serving_size_unit ?? ''}`.trim()}
          previewLineTwo={`${preview.protein}P • ${preview.carbs}C • ${preview.fat}F`}
          primaryButtonLabel="Save"
          onPressPrimary={handleSaveEdit}
          isPrimaryDisabled={parsedQuantity == null || isSaving || isDeleting}
          isPrimaryLoading={isSaving}
          secondaryButtonLabel="Delete"
          onPressSecondary={handleDelete}
          isSecondaryDisabled={isSaving || isDeleting}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingBottom: SPACING.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
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
