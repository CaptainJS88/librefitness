import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import QuantityEditor from '@/components/Tracker/QuantityEditor';
import {
  getNextQuantityValue,
  parseQuantityInput,
  QUANTITY_STEP,
} from '@/components/Tracker/quantityEditorUtils';
import Icon from '../Shared/Icon';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

export type FavoriteMealDraftItem = {
  id: string;
  foodName: string;
  servingSizeValue: number | null;
  servingSizeUnit: string | null;
  servingWeightGrams: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  sourceFoodId: string | null;
};

type FavoriteMealDraftItemRowProps = {
  item: FavoriteMealDraftItem;
  isExpanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleExpanded: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdateQuantity: (nextServingSizeValue: number) => void;
};

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function formatServing(item: FavoriteMealDraftItem) {
  if (
    item.servingSizeValue == null ||
    item.servingSizeUnit == null ||
    item.servingSizeUnit.trim() === ''
  ) {
    return `${item.calories} kcal`;
  }

  return `${item.calories} kcal, ${item.servingSizeValue} ${item.servingSizeUnit}`;
}

export default function FavoriteMealDraftItemRow({
  item,
  isExpanded,
  canMoveUp,
  canMoveDown,
  onToggleExpanded,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdateQuantity,
}: FavoriteMealDraftItemRowProps) {
  const { colors } = useAppTheme();
  const [quantityInput, setQuantityInput] = useState(
    item.servingSizeValue?.toString() ?? '1'
  );

  useEffect(() => {
    if (!isExpanded) {
      setQuantityInput(item.servingSizeValue?.toString() ?? '1');
    }
  }, [isExpanded, item.id, item.servingSizeValue]);

  function adjustQuantity(delta: number) {
    setQuantityInput(getNextQuantityValue(quantityInput, delta));
  }

  function getUpdatedPreview(nextServingSizeValue: number) {
    const currentServingSizeValue =
      item.servingSizeValue && item.servingSizeValue > 0
        ? item.servingSizeValue
        : 1;

    const ratio = nextServingSizeValue / currentServingSizeValue;

    return {
      calories: roundToOneDecimal(item.calories * ratio),
      protein: roundToOneDecimal(item.protein * ratio),
      carbs: roundToOneDecimal(item.carbs * ratio),
      fat: roundToOneDecimal(item.fat * ratio),
    };
  }

  const parsedQuantity = parseQuantityInput(quantityInput);
  const preview = getUpdatedPreview(parsedQuantity ?? (item.servingSizeValue ?? 1));

  return (
    <ThemedView variant="surface" style={styles.card}>
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={styles.textBlock}
          onPress={onToggleExpanded}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.title}>{item.foodName}</ThemedText>
          <ThemedText variant="textMuted" style={styles.metaText}>
            {formatServing(item)}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: colors.border, opacity: canMoveUp ? 1 : 0.45 }]}
            onPress={onMoveUp}
            disabled={!canMoveUp}
            activeOpacity={0.85}
          >
            <Icon name="chevron-up" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { borderColor: colors.border, opacity: canMoveDown ? 1 : 0.45 }]}
            onPress={onMoveDown}
            disabled={!canMoveDown}
            activeOpacity={0.85}
          >
            <Icon name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { borderColor: colors.border }]}
            onPress={onDelete}
            activeOpacity={0.85}
          >
            <Icon name="trash-outline" size={18} variant="danger" />
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded ? (
        <QuantityEditor
          helperText={`Edit amount in ${item.servingSizeUnit ?? 'servings'}`}
          quantityInput={quantityInput}
          onChangeQuantity={setQuantityInput}
          onDecrement={() => adjustQuantity(-QUANTITY_STEP)}
          onIncrement={() => adjustQuantity(QUANTITY_STEP)}
          previewLineOne={`${preview.calories} kcal, ${quantityInput} ${item.servingSizeUnit ?? ''}`.trim()}
          previewLineTwo={`${preview.protein}P • ${preview.carbs}C • ${preview.fat}F`}
          primaryButtonLabel="Save"
          onPressPrimary={() => parsedQuantity != null && onUpdateQuantity(parsedQuantity)}
          isPrimaryDisabled={parsedQuantity == null}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: SPACING.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  textBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
