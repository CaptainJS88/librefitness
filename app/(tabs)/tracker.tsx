import { ScrollView, StyleSheet } from 'react-native';
import DailySummary from '@/components/Tracker/DailySummary';
import MealsRow from '@/components/Tracker/MealsRow';
import { SPACING } from '@/constants/theme';
import { USDA, type CleanFoodItem } from '@/lib/usda';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';
import { mapUSDAFoodToCleanFoodItem, mapUSDASearchResponseToCleanFoods } from '@/lib/usda.mapper';
import { useEffect, useState } from 'react';
import SearchModal from '@/components/Tracker/SearchModal';
import DateSwiper from '@/components/Tracker/DateSwiper';

// Normalizes a Date to local midnight.
// This keeps date comparisons and UI state predictable.
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Small display helper for the label above the pills.
// Example: "Friday, Apr 25"
function formatSelectedDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

const TrackerScreen = function () {
  // Tracks which day the user is currently viewing.
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  // Tracks whether the search modal is open.
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  // Tracks which meal the user is currently adding food to.
  const [activeMeal, setActiveMeal] = useState<string>('Meal');

  // Opens the modal and remembers which meal triggered it.
  function openSearchModal(mealLabel: string) {
    setActiveMeal(mealLabel);
    setIsSearchModalVisible(true);
  }

    // Closes the modal and resets the active meal label.
    function closeSearchModal() {
      setIsSearchModalVisible(false);
      setActiveMeal('Meal');
    }

  // TODO: Implement handle food addition
  function handleAddFood(food: CleanFoodItem) {
    console.log(`Selected food for ${activeMeal} on ${selectedDate.toISOString()}:`, food);
    closeSearchModal();
  }

  useEffect(() => {
    async function testApi() {
      const response = await USDA.searchFoods('apple');
      console.log("Raw data from USDA", response);
      const filteredData = mapUSDAFoodToCleanFoodItem(response.foods[0]);
      console.log("filteredData", filteredData);
      const allFoodItems = mapUSDASearchResponseToCleanFoods(response);
      console.log("allFoodItems", allFoodItems);
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
          targetCalories={2500}
          consumedCalories={1240}
          burnedCalories={300}
          carbs={{ current: 150, max: 344 }}
          protein={{ current: 80, max: 125 }}
          fat={{ current: 35, max: 69 }}
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