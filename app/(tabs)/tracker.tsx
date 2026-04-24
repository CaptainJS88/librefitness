import { StyleSheet, Text, View } from 'react-native';
import DailySummary from '@/components/Tracker/DailySummary';
import MealsRow from '@/components/Tracker/MealsRow';
import { COLORS, SPACING } from '@/constants/theme';
import { USDA } from '@/lib/usda';
import { useEffect } from 'react'

const TrackerScreen = function() {
  useEffect(() => {
    async function testApi () {
      const response = await USDA.searchFoods('apple');
      if(response) {
        console.log(response, "API Fired?")
      } else {
        console.error(response)
      }
    }
    testApi();
  }, [])
 


  
  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Tracker Page</Text>
      
      {/* Passing in the required dummy data so the component can render */}
      <DailySummary 
        dietName="Mediterranean Diet"
        targetCalories={2500}
        consumedCalories={1240}
        burnedCalories={300}
        carbs={{ current: 150, max: 344 }}
        protein={{ current: 80, max: 125 }}
        fat={{ current: 35, max: 69 }}
      />

      <View style={styles.mealsHeader}>
        <Text style={styles.sectionTitle}>Eaten</Text>
      </View>
      <MealsRow 
        title="Breakfast" 
        currentCalories={600} 
        maxCalories={625} 
        iconName="cafe" 
        onAddPress={() => console.log('Add Breakfast')} 
      />
      
      <MealsRow 
        title="Lunch" 
        currentCalories={640} 
        maxCalories={750} 
        iconName="fast-food" 
        onAddPress={() => console.log('Add Lunch')} 
      />

      <MealsRow 
        title="Dinner" 
        currentCalories={0} 
        maxCalories={725} 
        iconName="restaurant" 
        onAddPress={() => console.log('Add Dinner')} 
      />
      <MealsRow 
        title="Snacks" 
        currentCalories={100} 
        maxCalories={300} 
        iconName="fast-food" 
        onAddPress={() => console.log('Add Snacks')} 
      />
      {/* Adding a bottom spacer so the last item isn't hidden by the tab bar */}
      <View style={{ height: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 60, // Gives some space at the top
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA', // Matches your theme background
    overflow: "scroll"
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  mealsHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  }
});

export default TrackerScreen;