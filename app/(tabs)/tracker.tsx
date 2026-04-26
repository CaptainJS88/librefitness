import { Alert, ScrollView, StyleSheet } from 'react-native';
import DailySummary from '@/components/Tracker/DailySummary';
import MealsRow from '@/components/Tracker/MealsRow';
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
  getFoodEntriesForDailyLog,
  type FoodEntryRow,
  type MealType,
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

// Computes the current consumed calories and macros from the day's food entries.
// This keeps the DailySummary math in one place and easy to inspect.
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
  // We use these to derive real consumed calories and macros.
  const [foodEntries, setFoodEntries] = useState<FoodEntryRow[]>([]);

  // Tracks whether the selected date is currently loading.
  // Useful now for discipline, even if we are not rendering a loading UI yet.
  const [isDayLoading, setIsDayLoading] = useState(false);

  // Opens the modal and remembers which meal triggered it.
  function openSearchModal(mealLabel: MealType) {
    setActiveMeal(mealLabel);
    setIsSearchModalVisible(true);
  }

  // Closes the modal.
  function closeSearchModal() {
    setIsSearchModalVisible(false);
  }

  // Loads one selected day's log and food entries.
  // Important: viewing a date should not create a daily_log.
  // We only fetch what exists and show an empty day if nothing exists yet.
  async function loadSelectedDayData() {
    try {
      if (!session?.user?.id) {
        setFoodEntries([]);
        return;
      }

      setIsDayLoading(true);

      const selectedDateString = formatDateForDatabase(selectedDate);
      const dailyLog = await getDailyLogByDate(session.user.id, selectedDateString);

      // If no daily log exists yet for this date, that simply means
      // the day has no saved data so far.
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

  // Loads the user's current default targets from profiles.
  // For now, these drive the target values shown in DailySummary.
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

  // Reloads the selected day's existing saved data whenever:
  // - the signed-in user changes
  // - the selected date changes
  useEffect(() => {
    loadSelectedDayData();
  }, [session?.user?.id, selectedDate]);

  // First end-to-end add-food flow:
  // 1. Make sure we have an authenticated user
  // 2. Get or create the selected day's daily_log
  // 3. Insert the food entry under that daily_log
  // 4. Refresh the selected day so the UI updates from real DB data
  // 5. Close the modal if successful
  async function handleAddFood(food: CleanFoodItem) {
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
        servingSizeValue: food.servingSize,
        servingSizeUnit: food.servingSizeUnit,
        servingWeightGrams:
          food.servingSizeUnit.toLowerCase() === 'g' ? food.servingSize : null,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });

      console.log('Inserted food entry:', insertedFoodEntry);

      // Pull fresh data from the database so the summary reflects the new entry.
      await loadSelectedDayData();

      closeSearchModal();
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

  // Derive real summary values from the day's saved food entries.
  const nutritionTotals = calculateNutritionTotals(foodEntries);

  return (
    <ThemedView variant="background" style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.headerText}>Tracker Page</ThemedText>

        {/* This label makes the currently selected day explicit. */}
        <ThemedText variant="textMuted" style={styles.dateLabel}>
          {formatSelectedDate(selectedDate)}
        </ThemedText>

        {/* The date swiper is a dumb UI component.
            It only displays dates and notifies the screen when one is selected. */}
        <DateSwiper
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <DailySummary
          dietName="Mediterranean Diet"
          targetCalories={defaultTargets?.targetCalories ?? 0}
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
          currentCalories={600}
          maxCalories={625}
          iconName="cafe"
          onAddPress={() => openSearchModal('Breakfast')}
        />

        <MealsRow
          title="Lunch"
          currentCalories={640}
          maxCalories={750}
          iconName="fast-food"
          onAddPress={() => openSearchModal('Lunch')}
        />

        <MealsRow
          title="Dinner"
          currentCalories={0}
          maxCalories={725}
          iconName="restaurant"
          onAddPress={() => openSearchModal('Dinner')}
        />

        <MealsRow
          title="Snacks"
          currentCalories={100}
          maxCalories={300}
          iconName="fast-food"
          onAddPress={() => openSearchModal('Snacks')}
        />
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