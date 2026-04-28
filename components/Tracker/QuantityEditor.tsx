import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import Icon from '@/components/Shared/Icon';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type QuantityEditorProps = {
  helperText: string;
  quantityInput: string;
  onChangeQuantity: (value: string) => void;
  onDecrement: () => void;
  onIncrement: () => void;
  previewLineOne: string;
  previewLineTwo?: string;
  primaryButtonLabel: string;
  onPressPrimary: () => void;
  isPrimaryDisabled?: boolean;
  isPrimaryLoading?: boolean;
  secondaryButtonLabel?: string;
  onPressSecondary?: () => void;
  isSecondaryDisabled?: boolean;
  secondaryButtonVariant?: 'default' | 'danger';
};

// Reusable quantity editor for both:
// 1. adding a searched food
// 2. editing an existing logged food entry
export default function QuantityEditor({
  helperText,
  quantityInput,
  onChangeQuantity,
  onDecrement,
  onIncrement,
  previewLineOne,
  previewLineTwo,
  primaryButtonLabel,
  onPressPrimary,
  isPrimaryDisabled = false,
  isPrimaryLoading = false,
  secondaryButtonLabel,
  onPressSecondary,
  isSecondaryDisabled = false,
  secondaryButtonVariant = 'default',
}: QuantityEditorProps) {
  const { colors } = useAppTheme();

  return (
    <ThemedView style={[styles.container, { borderTopColor: colors.border }]}>
      <ThemedText variant="textMuted" style={styles.helperText}>
        {helperText}
      </ThemedText>

      <ThemedView style={styles.quantityRow}>
        <TouchableOpacity
          style={[styles.stepButton, { borderColor: colors.border }]}
          onPress={onDecrement}
        >
          <Icon name="remove" size={18} color={colors.text} />
        </TouchableOpacity>

        <TextInput
          value={quantityInput}
          onChangeText={onChangeQuantity}
          keyboardType="decimal-pad"
          style={[
            styles.quantityInput,
            {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        />

        <TouchableOpacity
          style={[styles.stepButton, { borderColor: colors.border }]}
          onPress={onIncrement}
        >
          <Icon name="add" size={18} color={colors.text} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedText variant="textMuted" style={styles.previewText}>
        {previewLineOne}
      </ThemedText>

      {previewLineTwo ? (
        <ThemedText variant="textMuted" style={styles.previewText}>
          {previewLineTwo}
        </ThemedText>
      ) : null}

      <ThemedView style={styles.buttonRow}>
        {secondaryButtonLabel && onPressSecondary ? (
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor:
                  secondaryButtonVariant === 'danger' ? colors.danger : colors.border,
                backgroundColor:
                  secondaryButtonVariant === 'danger' ? colors.danger : 'transparent',
                opacity: isSecondaryDisabled ? 0.5 : 1,
              },
            ]}
            onPress={onPressSecondary}
            disabled={isSecondaryDisabled}
          >
            <ThemedText
              style={[
                styles.secondaryButtonText,
                {
                  color:
                    secondaryButtonVariant === 'danger'
                      ? colors.buttonText
                      : colors.text,
                },
              ]}
            >
              {secondaryButtonLabel}
            </ThemedText>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: isPrimaryDisabled ? colors.border : colors.primary,
            },
          ]}
          onPress={onPressPrimary}
          disabled={isPrimaryDisabled}
        >
          {isPrimaryLoading ? (
            <ActivityIndicator size="small" color={colors.buttonText} />
          ) : (
            <ThemedText style={[styles.primaryButtonText, { color: colors.buttonText }]}>
              {primaryButtonLabel}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  helperText: {
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: SPACING.sm,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 13,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  secondaryButton: {
    minWidth: 88,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
