import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { FoodEntryRow } from '@/lib/foodEntries';
import Icon from '@/components/Shared/Icon';
import QuantityEditor from './QuantityEditor';
import {
  getNextQuantityValue,
  parseQuantityInput,
  QUANTITY_STEP,
} from './quantityEditorUtils';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type FoodEntryItemProps = {
  entry: FoodEntryRow;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdateEntry: (entry: FoodEntryRow, nextServingSizeValue: number) => Promise<void>;
  onDeleteEntry: (entry: FoodEntryRow) => Promise<void>;
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
  isExpanded,
  onToggleExpanded,
  onUpdateEntry,
  onDeleteEntry,
}: FoodEntryItemProps) {
  const { colors } = useAppTheme();
  const [quantityInput, setQuantityInput] = useState(
    entry.serving_size_value?.toString() ?? '1'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Whenever this editor closes, reset back to the saved serving value.
  // That way reopening the row always starts from the current database state.
  useEffect(() => {
    if (!isExpanded) {
      setQuantityInput(entry.serving_size_value?.toString() ?? '1');
    }
  }, [entry.id, entry.serving_size_value, isExpanded]);

  function handleToggleExpanded() {
    setQuantityInput(entry.serving_size_value?.toString() ?? '1');
    onToggleExpanded();
  }

  function adjustQuantity(delta: number) {
    setQuantityInput(getNextQuantityValue(quantityInput, delta));
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
    const nextServingSizeValue = parseQuantityInput(quantityInput);

    if (nextServingSizeValue == null) {
      return;
    }

    try {
      setIsSaving(true);
      await onUpdateEntry(entry, nextServingSizeValue);
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
    } catch (error) {
      console.error('Error deleting food entry:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const parsedQuantity = parseQuantityInput(quantityInput);
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
          onPress={handleToggleExpanded}
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
          secondaryButtonVariant="danger"
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
