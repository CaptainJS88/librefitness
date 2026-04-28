import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { MealType } from '@/lib/foodEntries';
import { ThemedText } from '../Shared/ThemedText';

export type MealTypeFilter = 'All' | MealType;

type MealTypeFilterChipsProps = {
  value: MealTypeFilter | MealType;
  onChange: (value: MealTypeFilter | MealType) => void;
  includeAll?: boolean;
};

const MEAL_TYPE_OPTIONS: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
];

export default function MealTypeFilterChips({
  value,
  onChange,
  includeAll = true,
}: MealTypeFilterChipsProps) {
  const { colors } = useAppTheme();
  const options = includeAll
    ? (['All', ...MEAL_TYPE_OPTIONS] as (MealTypeFilter | MealType)[])
    : MEAL_TYPE_OPTIONS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.content}
    >
      {options.map((option) => {
        const isSelected = option === value;

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onChange(option)}
            activeOpacity={0.85}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: isSelected ? colors.buttonText : colors.text },
              ]}
            >
              {option}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  content: {
    paddingVertical: 4,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
