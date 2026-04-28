import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type CaloriesBurnedCardProps = {
  caloriesBurned: number;
  isSaving?: boolean;
  onSave: (caloriesBurned: number) => Promise<void> | void;
};

// Burned calories are kept intentionally simple for v1:
// a non-negative whole number that applies to the selected day.
function parseCaloriesBurnedInput(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return 0;
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

export default function CaloriesBurnedCard({
  caloriesBurned,
  isSaving = false,
  onSave,
}: CaloriesBurnedCardProps) {
  const { colors } = useAppTheme();
  const [inputValue, setInputValue] = useState(caloriesBurned.toString());

  // Keep the input aligned with the selected day's saved value.
  useEffect(() => {
    setInputValue(caloriesBurned.toString());
  }, [caloriesBurned]);

  const parsedCaloriesBurned = useMemo(
    () => parseCaloriesBurnedInput(inputValue),
    [inputValue]
  );

  const hasChanged =
    parsedCaloriesBurned != null && parsedCaloriesBurned !== caloriesBurned;

  const canSave = !isSaving && hasChanged;
  const hasInvalidInput = inputValue.trim() !== '' && parsedCaloriesBurned == null;

  async function handleSave() {
    if (parsedCaloriesBurned == null) {
      return;
    }

    await onSave(parsedCaloriesBurned);
  }

  return (
    <ThemedView variant="surface" style={styles.card}>
      <ThemedText style={styles.title}>Calories Burned</ThemedText>

      <ThemedText variant="textMuted" style={styles.helperText}>
        Adds to this day&apos;s calorie allowance.
      </ThemedText>

      <View style={styles.controlsRow}>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.background,
              borderColor: hasInvalidInput ? colors.danger : colors.border,
            },
          ]}
        >
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
          />

          <ThemedText variant="textMuted" style={styles.unitText}>
            kcal
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: canSave ? colors.primary : colors.border },
          ]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <ThemedText style={[styles.saveButtonText, { color: colors.buttonText }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {hasInvalidInput ? (
        <ThemedText style={[styles.validationText, { color: colors.danger }]}>
          Enter a whole number of calories.
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  saveButton: {
    minWidth: 96,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  validationText: {
    fontSize: 13,
    marginTop: SPACING.sm,
  },
});
