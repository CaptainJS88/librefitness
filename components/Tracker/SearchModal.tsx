import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SPACING } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { USDA, type CleanFoodItem } from '@/lib/usda';
import { mapUSDASearchResponseToCleanFoods } from '@/lib/usda.mapper';
import Icon from '@/components/Shared/Icon';
import { ThemedText } from '../Shared/ThemedText';
import { ThemedView } from '../Shared/ThemedView';

type SearchModalProps = {
  visible: boolean;
  mealLabel: string;
  onClose: () => void;
  onAddFood: (food: CleanFoodItem) => void;
  pageSize?: number;
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
}: SearchModalProps) {
  const { colors } = useAppTheme();

  // query = what the user is typing right now
  // debouncedQuery = what we actually search for after a short delay
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // These states drive the modal UI.
  const [results, setResults] = useState<CleanFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the modal closes, reset its internal state.
  // That keeps each modal session feeling fresh and predictable.
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setDebouncedQuery('');
      setResults([]);
      setError(null);
      setIsSearching(false);
    }
  }, [visible]);

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

  // Renders one normalized food result row.
  function renderFoodItem({ item }: { item: CleanFoodItem }) {
    return (
      <ThemedView variant="surface" style={styles.resultRow}>
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
            Serving: {formatServing(item)}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => onAddFood(item)}
        >
          <Icon name="add" size={22} color={colors.buttonText} />
        </TouchableOpacity>
      </ThemedView>
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
            No foods found for "{debouncedQuery}".
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item) => item.fdcId.toString()}
        renderItem={renderFoodItem}
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
              <ThemedText style={styles.title}>Add Food</ThemedText>
              <ThemedText variant="textMuted" style={styles.subtitle}>
                Searching for: {mealLabel}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Icon name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </ThemedView>

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
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 18,
    marginBottom: SPACING.sm,
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
