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
  getOrCreateDailyLog,
  getProfileDefaultTargets,
  type DailyLogTargetsInput,
} from '@/lib/dailyLogs';
import { addFoodEntry, type MealType } from '@/lib/foodEntries';

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

const TrackerScreen = function () {
  const { session } = useAuth();

  // Tracks which day the user is currently viewing.
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  // Tracks whether the search modal is open.
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  // Tracks which meal the user is currently adding food to.
  const [activeMeal, setActiveMeal] = useState<MealType>('Breakfast');

  // Stores the user's current default calorie/macro targets from profiles.
  // These are used to replace the hardcoded target values in DailySummary.
  const [defaultTargets, setDefaultTargets] = useState<DailyLogTargetsInput | null>(null);

  // Opens the modal and remembers which meal triggered it.
  function openSearchModal(mealLabel: MealType) {
    setActiveMeal(mealLabel);
    setIsSearchModalVisible(true);
  }

  // Closes the modal.
  function closeSearchModal() {
    setIsSearchModalVisible(false);
  }

  // Loads the user's default targets from profiles.
  // For now, this drives only the target values shown in DailySummary.
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

  // First end-to-end add-food flow:
  // 1. Make sure we have an authenticated user
  // 2. Get or create the selected day's daily_log
  // 3. Insert the food entry under that daily_log
  // 4. Close the modal if successful
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
          consumedCalories={1240}
          burnedCalories={300}
          carbs={{ current: 150, max: defaultTargets?.targetCarbs ?? 0 }}
          protein={{ current: 80, max: defaultTargets?.targetProtein ?? 0 }}
          fat={{ current: 35, max: defaultTargets?.targetFats ?? 0 }}
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