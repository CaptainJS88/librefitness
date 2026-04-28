import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { CleanFoodItem } from '@/lib/usda';
import {
  getDailyLogByDate,
  getOrCreateDailyLog,
  getProfileDefaultTargets,
  type DailyLogTargetsInput,
  updateDailyLogCaloriesBurned,
} from '@/lib/dailyLogs';
import {
  addFoodEntry,
  deleteFoodEntry,
  getFoodEntriesForDailyLog,
  type FoodEntryRow,
  type MealType,
  updateFoodEntry,
} from '@/lib/foodEntries';

type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type UseTrackerDayArgs = {
  userId: string | null | undefined;
};

// Tracker day state only cares about local calendar days, not timestamps.
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Daily-log queries expect YYYY-MM-DD so timezone offsets do not shift the day.
function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Nutrition values are intentionally rounded to a single decimal place
// so the tracker UI and saved food-entry math stay consistent.
function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function calculateNutritionTotals(entries: FoodEntryRow[]): NutritionTotals {
  const totals = entries.reduce(
    (currentTotals, entry) => {
      currentTotals.calories += entry.calories;
      currentTotals.protein += entry.protein;
      currentTotals.carbs += entry.carbs;
      currentTotals.fat += entry.fat;
      return currentTotals;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );

  return {
    calories: roundToOneDecimal(totals.calories),
    protein: roundToOneDecimal(totals.protein),
    carbs: roundToOneDecimal(totals.carbs),
    fat: roundToOneDecimal(totals.fat),
  };
}

function calculateMealCalories(entries: FoodEntryRow[]) {
  const caloriesByMeal = entries.reduce(
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

  return {
    Breakfast: roundToOneDecimal(caloriesByMeal.Breakfast),
    Lunch: roundToOneDecimal(caloriesByMeal.Lunch),
    Dinner: roundToOneDecimal(caloriesByMeal.Dinner),
    Snacks: roundToOneDecimal(caloriesByMeal.Snacks),
  };
}

// The query already sorts by created_at ascending, so pushing into meal groups
// preserves the expected within-meal order automatically.
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

export function useTrackerDay({ userId }: UseTrackerDayArgs) {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [defaultTargets, setDefaultTargets] = useState<DailyLogTargetsInput | null>(null);
  const [selectedDayTargets, setSelectedDayTargets] = useState<DailyLogTargetsInput | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntryRow[]>([]);
  const [selectedDayCaloriesBurned, setSelectedDayCaloriesBurned] = useState(0);
  const [selectedDayLogId, setSelectedDayLogId] = useState<string | null>(null);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [isSavingCaloriesBurned, setIsSavingCaloriesBurned] = useState(false);

  // This is the hook's core synchronizer:
  // whenever the user or selected date changes, we reload that day's state.
  const loadSelectedDayData = useCallback(async () => {
    try {
      if (!userId) {
        setSelectedDayLogId(null);
        setSelectedDayTargets(null);
        setSelectedDayCaloriesBurned(0);
        setFoodEntries([]);
        return;
      }

      setIsDayLoading(true);

      const selectedDateString = formatDateForDatabase(selectedDate);
      const dailyLog = await getDailyLogByDate(userId, selectedDateString);

      if (!dailyLog) {
        setSelectedDayLogId(null);
        setSelectedDayTargets(null);
        setSelectedDayCaloriesBurned(0);
        setFoodEntries([]);
        return;
      }

      setSelectedDayLogId(dailyLog.id);
      setSelectedDayCaloriesBurned(dailyLog.calories_burned ?? 0);
      setSelectedDayTargets({
        targetCalories: dailyLog.target_calories,
        targetProtein: dailyLog.target_protein,
        targetCarbs: dailyLog.target_carbs,
        targetFats: dailyLog.target_fats,
      });

      const entries = await getFoodEntriesForDailyLog(dailyLog.id);
      setFoodEntries(entries);
    } catch (error) {
      console.error('Error loading selected day data:', error);
      Alert.alert('Error', 'Unable to load food logs for this date.');
    } finally {
      setIsDayLoading(false);
    }
  }, [selectedDate, userId]);

  useEffect(() => {
    async function loadDefaultTargets() {
      try {
        if (!userId) {
          setDefaultTargets(null);
          return;
        }

        const targets = await getProfileDefaultTargets(userId);
        setDefaultTargets(targets);
      } catch (error) {
        console.error('Error loading default targets:', error);
      }
    }

    loadDefaultTargets();
  }, [userId]);

  useEffect(() => {
    void loadSelectedDayData();
  }, [loadSelectedDayData]);

  // Adds a food entry to the selected day and refreshes the day afterward.
  async function handleAddFood(
    food: CleanFoodItem,
    mealType: MealType,
    quantityMultiplier: number
  ) {
    try {
      if (!userId) {
        Alert.alert('Not signed in', 'You must be signed in to add food.');
        return;
      }

      const selectedDateString = formatDateForDatabase(selectedDate);
      const dailyLog = await getOrCreateDailyLog(userId, selectedDateString);

      await addFoodEntry({
        dailyLogId: dailyLog.id,
        mealType,
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

      await loadSelectedDayData();
    } catch (error) {
      console.error('Error adding food:', error);
      Alert.alert('Error', 'Unable to add food right now.');
    }
  }

  // Updates an existing entry by scaling its saved values to the new serving amount.
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

  async function handleDeleteFoodEntry(entry: FoodEntryRow) {
    await deleteFoodEntry(entry.id);
    await loadSelectedDayData();
  }

  // Burned calories stay as a simple day-level manual adjustment for now.
  async function handleSaveCaloriesBurned(caloriesBurned: number) {
    try {
      if (!userId) {
        Alert.alert('Not signed in', 'You must be signed in to save burned calories.');
        return;
      }

      setIsSavingCaloriesBurned(true);

      if (selectedDayLogId) {
        await updateDailyLogCaloriesBurned(selectedDayLogId, caloriesBurned);
        await loadSelectedDayData();
        return;
      }

      // A zero value on a day with no existing daily log should not create empty data.
      if (caloriesBurned === 0) {
        return;
      }

      const selectedDateString = formatDateForDatabase(selectedDate);
      const dailyLog = await getOrCreateDailyLog(userId, selectedDateString);

      await updateDailyLogCaloriesBurned(dailyLog.id, caloriesBurned);
      await loadSelectedDayData();
    } catch (error) {
      console.error('Error saving burned calories:', error);
      Alert.alert('Error', 'Unable to save burned calories right now.');
    } finally {
      setIsSavingCaloriesBurned(false);
    }
  }

  const nutritionTotals = calculateNutritionTotals(foodEntries);
  const mealCalories = calculateMealCalories(foodEntries);
  const groupedFoodEntries = groupFoodEntriesByMeal(foodEntries);
  const activeTargets = selectedDayTargets ?? defaultTargets;
  const activeTargetCalories = activeTargets?.targetCalories ?? 0;

  return {
    selectedDate,
    setSelectedDate,
    foodEntries,
    nutritionTotals,
    mealCalories,
    groupedFoodEntries,
    activeTargets,
    activeTargetCalories,
    selectedDayCaloriesBurned,
    isDayLoading,
    isSavingCaloriesBurned,
    handleAddFood,
    handleUpdateFoodEntry,
    handleDeleteFoodEntry,
    handleSaveCaloriesBurned,
  };
}
