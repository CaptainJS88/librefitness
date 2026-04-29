import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import FavoriteMealEditorModal from '@/components/Favorites/FavoriteMealEditorModal';
import FavoriteMealListItem from '@/components/Favorites/FavoriteMealListItem';
import MealTypeFilterChips, {
  type MealTypeFilter,
} from '@/components/Favorites/MealTypeFilterChips';
import Icon from '@/components/Shared/Icon';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';
import { SPACING } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoriteMeals } from '@/hooks/useFavoriteMeals';
import { formatDateForDatabase } from '@/lib/dateUtils';
import {
  addFavoriteMealToDate,
  deleteFavoriteMeal,
  type FavoriteMealWithItems,
} from '@/lib/favoriteMeals';
import type { MealType } from '@/lib/foodEntries';

const FavoritesScreen = function () {
  const { session } = useAuth();
  const { favoriteMeals, isLoadingFavoriteMeals, loadFavoriteMeals } = useFavoriteMeals({
    userId: session?.user?.id,
  });

  const [selectedFilter, setSelectedFilter] = useState<MealTypeFilter>('All');
  const [menuOpenMealId, setMenuOpenMealId] = useState<string | null>(null);
  const [addPickerMealId, setAddPickerMealId] = useState<string | null>(null);
  const [addingFavoriteMealId, setAddingFavoriteMealId] = useState<string | null>(null);
  const [addingMealType, setAddingMealType] = useState<MealType | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<FavoriteMealWithItems | null>(null);

  const filteredFavoriteMeals = useMemo(() => {
    if (selectedFilter === 'All') {
      return favoriteMeals;
    }

    return favoriteMeals.filter((favoriteMeal) => favoriteMeal.meal_type === selectedFilter);
  }, [favoriteMeals, selectedFilter]);

  function openCreateEditor() {
    setEditingMeal(null);
    setMenuOpenMealId(null);
    setAddPickerMealId(null);
    setEditorVisible(true);
  }

  function openEditEditor(favoriteMeal: FavoriteMealWithItems) {
    setMenuOpenMealId(null);
    setAddPickerMealId(null);
    setEditingMeal(favoriteMeal);
    setEditorVisible(true);
  }

  async function handleAddFavoriteMealToToday(
    favoriteMeal: FavoriteMealWithItems,
    mealType: MealType
  ) {
    try {
      if (!session?.user?.id) {
        Alert.alert('Not signed in', 'You must be signed in to add favorite meals.');
        return;
      }

      setAddingFavoriteMealId(favoriteMeal.id);
      setAddingMealType(mealType);

      // Adding from the Favorites tab targets today's daily log for now,
      // while still letting the user choose which meal section it belongs to.
      const todayDateString = formatDateForDatabase(new Date());
      await addFavoriteMealToDate({
        userId: session.user.id,
        date: todayDateString,
        mealType,
        favoriteMeal,
      });
      setAddPickerMealId(null);
    } catch (error) {
      console.error('Error adding favorite meal to tracker:', error);
      Alert.alert('Error', 'Unable to add favorite meal right now.');
    } finally {
      setAddingFavoriteMealId(null);
      setAddingMealType(null);
    }
  }

  async function handleDeleteMeal(favoriteMeal: FavoriteMealWithItems) {
    Alert.alert(
      'Delete favorite meal',
      `Delete ${favoriteMeal.name}? This will not affect meals you already logged.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFavoriteMeal(favoriteMeal.id);
              setMenuOpenMealId(null);
              await loadFavoriteMeals();
            } catch (error) {
              console.error('Error deleting favorite meal:', error);
              Alert.alert('Error', 'Unable to delete favorite meal right now.');
            }
          },
        },
      ]
    );
  }

  return (
    <ThemedView variant="background" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <ThemedText style={styles.headerText}>Favorite Meals</ThemedText>
            <ThemedText variant="textMuted" style={styles.subheaderText}>
              Save repeat meals so you can log them in one tap.
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={openCreateEditor}
            activeOpacity={0.85}
          >
            <Icon name="add" size={20} variant="primary" />
          </TouchableOpacity>
        </View>

        <MealTypeFilterChips
          value={selectedFilter}
          onChange={(value) => setSelectedFilter(value as MealTypeFilter)}
        />

        <View style={styles.listContainer}>
          {isLoadingFavoriteMeals ? (
            <ThemedText variant="textMuted" style={styles.stateText}>
              Loading favorite meals...
            </ThemedText>
          ) : filteredFavoriteMeals.length === 0 ? (
            <ThemedView variant="surface" style={styles.emptyCard}>
              <ThemedText style={styles.emptyTitle}>No favorite meals yet</ThemedText>
              <ThemedText variant="textMuted" style={styles.stateText}>
                Create one saved meal here, then add it from the tracker in one tap.
              </ThemedText>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={openCreateEditor}
                activeOpacity={0.85}
              >
                <Icon name="heart-outline" size={16} variant="primary" />
                <ThemedText variant="primary" style={styles.emptyActionText}>
                  Create Favorite Meal
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            filteredFavoriteMeals.map((favoriteMeal) => (
              <FavoriteMealListItem
                key={favoriteMeal.id}
                favoriteMeal={favoriteMeal}
                isMenuOpen={menuOpenMealId === favoriteMeal.id}
                isAddPickerOpen={addPickerMealId === favoriteMeal.id}
                isAddingToMealType={
                  addingFavoriteMealId === favoriteMeal.id ? addingMealType : null
                }
                onPress={() => openEditEditor(favoriteMeal)}
                onToggleMenu={() =>
                  {
                    setAddPickerMealId(null);
                    setMenuOpenMealId((currentId) =>
                      currentId === favoriteMeal.id ? null : favoriteMeal.id
                    );
                  }
                }
                onToggleAddPicker={() => {
                  setMenuOpenMealId(null);
                  setAddPickerMealId((currentId) =>
                    currentId === favoriteMeal.id ? null : favoriteMeal.id
                  );
                }}
                onAddToMealType={(mealType) =>
                  handleAddFavoriteMealToToday(favoriteMeal, mealType)
                }
                onEdit={() => openEditEditor(favoriteMeal)}
                onDelete={() => handleDeleteMeal(favoriteMeal)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <FavoriteMealEditorModal
        visible={editorVisible}
        userId={session?.user?.id}
        favoriteMeal={editingMeal}
        onClose={() => setEditorVisible(false)}
        onSaved={loadFavoriteMeals}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subheaderText: {
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    marginTop: SPACING.md,
  },
  emptyCard: {
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default FavoritesScreen;
