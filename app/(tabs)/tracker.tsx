import { Alert, ScrollView, StyleSheet } from 'react-native';
import DailySummary from '@/components/Tracker/DailySummary';
import MealsRow from '@/components/Tracker/MealsRow';
import FoodEntryItem from '@/components/Tracker/FoodEntryItem';
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
  getDailyLogByDate,
  getOrCreateDailyLog,
  getProfileDefaultTargets,
  type DailyLogTargetsInput,
} from '@/lib/dailyLogs';
import {
  addFoodEntry,
  deleteFoodEntry,
  getFoodEntriesForDailyLog,
  type FoodEntryRow,
  type MealType,
  updateFoodEntry,
} from '@/lib/foodEntries';

// Normalizes a Date to local midnight.
// This keeps date comparisons and UI state predictable.
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Formats the selected date for display in the UI.
// Example: "Friday, Apr 25"
function formatSelectedDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// Converts a JS Date into the YYYY-MM-DD format expected by your daily_logs table.
// We build the string from local date parts so timezone offsets do not shift the day.
function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Small helper so all summary totals are rounded consistently.
function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

// Temporary calorie split for meal rows.
// We can make this user-configurable later if needed.
const MEAL_CALORIE_SPLITS: Record<MealType, number> = {
  Breakfast: 0.3,
  Lunch: 0.4,
  Dinner: 0.2,
  Snacks: 0.1,
};

// Computes the current consumed calories and macros from the day's food entries.
function calculateNutritionTotals(entries: FoodEntryRow[]) {
  return entries.reduce(
    (totals, entry) => {
      totals.calories += entry.calories;
      totals.protein += entry.protein;
      totals.carbs += entry.carbs;
      totals.fat += entry.fat;
      return totals;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );
}

// Computes the current calories per meal from the selected day's food entries.
function calculateMealCalories(entries: FoodEntryRow[]) {
  return entries.reduce(
    (totals, entry) => {
      totals[entry.meal_type] += entry.calories;
      return totals;
    },
    {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snacks: 0,
    } as Record<MealType, number>
  );
}

// Groups food entries by meal type so the UI can render them under each meal section.
// Because the DB query already sorts by created_at ascending, this preserves that order.
function groupFoodEntriesByMeal(entries: FoodEntryRow[]) {
  return entries.reduce(
    (groups, entry) => {
      groups[entry.meal_type].push(entry);
      return groups;
    },
    {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: [],
    } as Record<MealType, FoodEntryRow[]>
  );
}

const TrackerScreen = function () {
  const { session } = useAuth();

  // Tracks which day the user is currently viewing.
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  // Tracks whether the search modal is open.
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  // Tracks which meal the user is currently adding food to.
  const [activeMeal, setActiveMeal] = useState<MealType>('Breakfast');

  // Stores the user's current default calorie/macro targets from profiles.
  const [defaultTargets, setDefaultTargets] = useState<DailyLogTargetsInput | null>(null);

  // Stores the selected day's current food entries.
  const [foodEntries, setFoodEntries] = useState<FoodEntryRow[]>([]);

  // Tracks whether the selected date is currently loading.
  const [isDayLoading, setIsDayLoading] = useState(false);

  function openSearchModal(mealLabel: MealType) {
    setActiveMeal(mealLabel);
    setIsSearchModalVisible(true);
  }

  function closeSearchModal() {
    setIsSearchModalVisible(false);
  }

  // Updates one existing food entry by scaling calories/macros to match
  // the new serving amount entered by the user.
  async function handleUpdateFoodEntry(
    entry: FoodEntryRow,
    nextServingSizeValue: number
  ) {
    const currentServingSizeValue =
      entry.serving_size_value && entry.serving_size_value > 0
        ? entry.serving_size_value
        : 1;

    const ratio = nextServingSizeValue / currentServingSizeValue;

    await updateFoodEntry(entry.id, {
      servingSizeValue: roundToOneDecimal(nextServingSizeValue),
      servingWeightGrams:
        entry.serving_weight_grams != null
          ? roundToOneDecimal(entry.serving_weight_grams * ratio)
          : null,
      calories: roundToOneDecimal(entry.calories * ratio),
      protein: roundToOneDecimal(entry.protein * ratio),
      carbs: roundToOneDecimal(entry.carbs * ratio),
      fat: roundToOneDecimal(entry.fat * ratio),
    });

    await loadSelectedDayData();
  }

  // Deletes one existing food entry, then refreshes the selected day.
  async function handleDeleteFoodEntry(entry: FoodEntryRow) {
    await deleteFoodEntry(entry.id);
    await loadSelectedDayData();
  }

  async function loadSelectedDayData() {
    try {
      if (!session?.user?.id) {
        setFoodEntries([]);
        return;
      }

      setIsDayLoading(true);

      const selectedDateString = formatDateForDatabase(selectedDate);
      const dailyLog = await getDailyLogByDate(session.user.id, selectedDateString);

      if (!dailyLog) {
        setFoodEntries([]);
        return;
      }

      const entries = await getFoodEntriesForDailyLog(dailyLog.id);
      setFoodEntries(entries);
    } catch (error) {
      console.error('Error loading selected day data:', error);
      Alert.alert('Error', 'Unable to load food logs for this date.');
    } finally {
      setIsDayLoading(false);
    }
  }

  useEffect(() => {
    async function loadDefaultTargets() {
      try {
        if (!session?.user?.id) {
          return;
        }

        const targets = await getProfileDefaultTargets(session.user.id);
        setDefaultTargets(targets);
      } catch (error) {
        console.error('Error loading default targets:', error);
      }
    }

    loadDefaultTargets();
  }, [session?.user?.id]);

  useEffect(() => {
    loadSelectedDayData();
  }, [session?.user?.id, selectedDate]);

  async function handleAddFood(
    food: CleanFoodItem,
    quantityMultiplier: number
  ) {
    try {
      if (!session?.user?.id) {
        Alert.alert('Not signed in', 'You must be signed in to add food.');
        return;
      }

      const selectedDateString = formatDateForDatabase(selectedDate);

      const dailyLog = await getOrCreateDailyLog(
        session.user.id,
        selectedDateString
      );

      const insertedFoodEntry = await addFoodEntry({
        dailyLogId: dailyLog.id,
        mealType: activeMeal,
        usdaFoodId: food.fdcId,
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
      });

      console.log('Inserted food entry:', insertedFoodEntry);

      await loadSelectedDayData();
    } catch (error) {
      console.error('Error adding food:', error);
      Alert.alert('Error', 'Unable to add food right now.');
    }
  }

  useEffect(() => {
    async function testApi() {
      const response = await USDA.searchFoods('apple');
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

  const nutritionTotals = calculateNutritionTotals(foodEntries);
  const mealCalories = calculateMealCalories(foodEntries);
  const groupedFoodEntries = groupFoodEntriesByMeal(foodEntries);
  const defaultTargetCalories = defaultTargets?.targetCalories ?? 0;

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
          dietName="Mediterranean Diet"
          targetCalories={defaultTargetCalories}
          consumedCalories={roundToOneDecimal(nutritionTotals.calories)}
          burnedCalories={0}
          carbs={{
            current: roundToOneDecimal(nutritionTotals.carbs),
            max: defaultTargets?.targetCarbs ?? 0,
          }}
          protein={{
            current: roundToOneDecimal(nutritionTotals.protein),
            max: defaultTargets?.targetProtein ?? 0,
          }}
          fat={{
            current: roundToOneDecimal(nutritionTotals.fat),
            max: defaultTargets?.targetFats ?? 0,
          }}
        />

        <ThemedView style={styles.mealsHeader}>
          <ThemedText style={styles.sectionTitle}>Eaten</ThemedText>
        </ThemedView>

        <MealsRow
          title="Breakfast"
          currentCalories={roundToOneDecimal(mealCalories.Breakfast)}
          maxCalories={Math.round(defaultTargetCalories * MEAL_CALORIE_SPLITS.Breakfast)}
          iconName="cafe"
          onAddPress={() => openSearchModal('Breakfast')}
        />
        {groupedFoodEntries.Breakfast.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            onUpdateEntry={handleUpdateFoodEntry}
            onDeleteEntry={handleDeleteFoodEntry}
          />
        ))}

        <MealsRow
          title="Lunch"
          currentCalories={roundToOneDecimal(mealCalories.Lunch)}
          maxCalories={Math.round(defaultTargetCalories * MEAL_CALORIE_SPLITS.Lunch)}
          iconName="fast-food"
          onAddPress={() => openSearchModal('Lunch')}
        />
        {groupedFoodEntries.Lunch.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            onUpdateEntry={handleUpdateFoodEntry}
            onDeleteEntry={handleDeleteFoodEntry}
          />
        ))}

        <MealsRow
          title="Dinner"
          currentCalories={roundToOneDecimal(mealCalories.Dinner)}
          maxCalories={Math.round(defaultTargetCalories * MEAL_CALORIE_SPLITS.Dinner)}
          iconName="restaurant"
          onAddPress={() => openSearchModal('Dinner')}
        />
        {groupedFoodEntries.Dinner.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            onUpdateEntry={handleUpdateFoodEntry}
            onDeleteEntry={handleDeleteFoodEntry}
          />
        ))}

        <MealsRow
          title="Snacks"
          currentCalories={roundToOneDecimal(mealCalories.Snacks)}
          maxCalories={Math.round(defaultTargetCalories * MEAL_CALORIE_SPLITS.Snacks)}
          iconName="fast-food"
          onAddPress={() => openSearchModal('Snacks')}
        />
        {groupedFoodEntries.Snacks.map((entry) => (
          <FoodEntryItem
            key={entry.id}
            entry={entry}
            onUpdateEntry={handleUpdateFoodEntry}
            onDeleteEntry={handleDeleteFoodEntry}
          />
        ))}
      </ScrollView>

      <SearchModal
        visible={isSearchModalVisible}
        mealLabel={activeMeal}
        onClose={closeSearchModal}
        onAddFood={handleAddFood}
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
