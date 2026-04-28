import { ScrollView, StyleSheet } from 'react-native';
import DailySummary from '@/components/Tracker/DailySummary';
import MealsRow from '@/components/Tracker/MealsRow';
import FoodEntryItem from '@/components/Tracker/FoodEntryItem';
import CaloriesBurnedCard from '@/components/Tracker/CaloriesBurnedCard';
import { SPACING } from '@/constants/theme';
import { USDA, type CleanFoodItem } from '@/lib/usda';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';
import {
  mapUSDAFoodToCleanFoodItem,
  mapUSDASearchResponseToCleanFoods,
} from '@/lib/usda.mapper';
import { useEffect, useState } from 'react';
import SearchModal from '@/components/Tracker/SearchModal';
import DateSwiper from '@/components/Tracker/DateSwiper';
import { useAuth } from '@/contexts/AuthContext';
import {
  type FoodEntryRow,
  type MealType,
} from '@/lib/foodEntries';
import { useTrackerDay } from '@/hooks/useTrackerDay';

// Formats the selected date for display in the UI.
// Example: "Friday, Apr 25"
function formatSelectedDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// Temporary calorie split for meal rows.
// We can make this user-configurable later if needed.
const MEAL_CALORIE_SPLITS: Record<MealType, number> = {
  Breakfast: 0.3,
  Lunch: 0.4,
  Dinner: 0.2,
  Snacks: 0.1,
};

const TrackerScreen = function () {
  const { session } = useAuth();

  // Tracks whether the search modal is open.
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  // Tracks which meal the user is currently adding food to.
  const [activeMeal, setActiveMeal] = useState<MealType>('Breakfast');

  // Only one existing food-entry editor should be open at a time.
  const [expandedFoodEntryId, setExpandedFoodEntryId] = useState<string | null>(null);

  const {
    selectedDate,
    setSelectedDate,
    nutritionTotals,
    mealCalories,
    groupedFoodEntries,
    activeTargets,
    activeTargetCalories,
    selectedDayCaloriesBurned,
    isSavingCaloriesBurned,
    handleAddFood,
    handleUpdateFoodEntry,
    handleDeleteFoodEntry,
    handleSaveCaloriesBurned,
  } = useTrackerDay({
    userId: session?.user?.id,
  });

  function openSearchModal(mealLabel: MealType) {
    setActiveMeal(mealLabel);
    setIsSearchModalVisible(true);
  }

  function closeSearchModal() {
    setIsSearchModalVisible(false);
  }

  // Tapping the same row closes it; tapping a different row switches the open editor.
  function toggleFoodEntryEditor(entryId: string) {
    setExpandedFoodEntryId((currentId) => (currentId === entryId ? null : entryId));
  }

  // The expanded editor belongs to tracker UI state, so we close it here
  // even though the actual update/delete work now lives in the hook.
  async function handleUpdateExistingFoodEntry(
    entry: FoodEntryRow,
    nextServingSizeValue: number
  ) {
    setExpandedFoodEntryId(null);
    await handleUpdateFoodEntry(entry, nextServingSizeValue);
  }

  async function handleDeleteExistingFoodEntry(entry: FoodEntryRow) {
    setExpandedFoodEntryId(null);
    await handleDeleteFoodEntry(entry);
  }

  async function handleAddFoodForActiveMeal(
    food: CleanFoodItem,
    quantityMultiplier: number
  ) {
    await handleAddFood(food, activeMeal, quantityMultiplier);
  }

  useEffect(() => {
    async function testApi() {
      const response = await USDA.searchFoods('bacon');
      console.log('Raw data from USDA', response);

      if (response?.foods?.[0]) {
        const filteredData = mapUSDAFoodToCleanFoodItem(response.foods[0]);
        console.log('filteredData', filteredData);
      }

      const allFoodItems = mapUSDASearchResponseToCleanFoods(response);
      console.log('allFoodItems', allFoodItems);
    }

    testApi();
  }, []);

  // Switching days should collapse any open inline food editor.
  useEffect(() => {
    setExpandedFoodEntryId(null);
  }, [selectedDate]);

  return (
    <ThemedView variant="background" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.headerText}>Tracker Page</ThemedText>

        <ThemedText variant="textMuted" style={styles.dateLabel}>
          {formatSelectedDate(selectedDate)}
        </ThemedText>

        <DateSwiper
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <DailySummary
          dietName="Target Calories"
          targetCalories={activeTargetCalories}
          consumedCalories={nutritionTotals.calories}
          burnedCalories={selectedDayCaloriesBurned}
          carbs={{
            current: nutritionTotals.carbs,
            max: activeTargets?.targetCarbs ?? 0,
          }}
          protein={{
            current: nutritionTotals.protein,
            max: activeTargets?.targetProtein ?? 0,
          }}
          fat={{
            current: nutritionTotals.fat,
            max: activeTargets?.targetFats ?? 0,
          }}
        />

        <ThemedView style={styles.mealsHeader}>
          <ThemedText style={styles.sectionTitle}>Eaten</ThemedText>
        </ThemedView>

        <MealsRow
          title="Breakfast"
          currentCalories={mealCalories.Breakfast}
          maxCalories={Math.round(activeTargetCalories * MEAL_CALORIE_SPLITS.Breakfast)}
          iconName="cafe"
          onAddPress={() => openSearchModal('Breakfast')}
        />
        {groupedFoodEntries.Breakfast.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            isExpanded={expandedFoodEntryId === entry.id}
            onToggleExpanded={() => toggleFoodEntryEditor(entry.id)}
            onUpdateEntry={handleUpdateExistingFoodEntry}
            onDeleteEntry={handleDeleteExistingFoodEntry}
          />
        ))}

        <MealsRow
          title="Lunch"
          currentCalories={mealCalories.Lunch}
          maxCalories={Math.round(activeTargetCalories * MEAL_CALORIE_SPLITS.Lunch)}
          iconName="fast-food"
          onAddPress={() => openSearchModal('Lunch')}
        />
        {groupedFoodEntries.Lunch.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            isExpanded={expandedFoodEntryId === entry.id}
            onToggleExpanded={() => toggleFoodEntryEditor(entry.id)}
            onUpdateEntry={handleUpdateExistingFoodEntry}
            onDeleteEntry={handleDeleteExistingFoodEntry}
          />
        ))}

        <MealsRow
          title="Dinner"
          currentCalories={mealCalories.Dinner}
          maxCalories={Math.round(activeTargetCalories * MEAL_CALORIE_SPLITS.Dinner)}
          iconName="restaurant"
          onAddPress={() => openSearchModal('Dinner')}
        />
        {groupedFoodEntries.Dinner.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            isExpanded={expandedFoodEntryId === entry.id}
            onToggleExpanded={() => toggleFoodEntryEditor(entry.id)}
            onUpdateEntry={handleUpdateExistingFoodEntry}
            onDeleteEntry={handleDeleteExistingFoodEntry}
          />
        ))}

        <MealsRow
          title="Snacks"
          currentCalories={mealCalories.Snacks}
          maxCalories={Math.round(activeTargetCalories * MEAL_CALORIE_SPLITS.Snacks)}
          iconName="fast-food"
          onAddPress={() => openSearchModal('Snacks')}
        />
        {groupedFoodEntries.Snacks.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            isExpanded={expandedFoodEntryId === entry.id}
            onToggleExpanded={() => toggleFoodEntryEditor(entry.id)}
            onUpdateEntry={handleUpdateExistingFoodEntry}
            onDeleteEntry={handleDeleteExistingFoodEntry}
          />
        ))}

        <CaloriesBurnedCard
          caloriesBurned={selectedDayCaloriesBurned}
          isSaving={isSavingCaloriesBurned}
          onSave={handleSaveCaloriesBurned}
        />
      </ScrollView>

      <SearchModal
        visible={isSearchModalVisible}
        mealLabel={activeMeal}
        onClose={closeSearchModal}
        onAddFood={handleAddFoodForActiveMeal}
        pageSize={10}
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  mealsHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
});

export default TrackerScreen;
