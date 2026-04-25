import { ScrollView, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import DailySummary from '@/components/Tracker/DailySummary';
import MealsRow from '@/components/Tracker/MealsRow';
import { SPACING } from '@/constants/theme';
import { USDA } from '@/lib/usda';
import { ThemedText } from '@/components/Shared/ThemedText';
import { ThemedView } from '@/components/Shared/ThemedView';

const TrackerScreen = function () {
  useEffect(() => {
    async function testApi() {
      const response = await USDA.searchFoods('apple');
      console.log(response);
    }

    testApi();
  }, []);

  return (
    <ThemedView variant="background" style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.headerText}>Tracker Page</ThemedText>

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

        <MealsRow title="Breakfast" currentCalories={600} maxCalories={625} iconName="cafe" onAddPress={() => console.log('Add Breakfast')} />
        <MealsRow title="Lunch" currentCalories={640} maxCalories={750} iconName="fast-food" onAddPress={() => console.log('Add Lunch')} />
        <MealsRow title="Dinner" currentCalories={0} maxCalories={725} iconName="restaurant" onAddPress={() => console.log('Add Dinner')} />
        <MealsRow title="Snacks" currentCalories={100} maxCalories={300} iconName="fast-food" onAddPress={() => console.log('Add Snacks')} />
      </ScrollView>
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  mealsHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
});

export default TrackerScreen;