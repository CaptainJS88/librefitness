import { StyleSheet, Text, View } from 'react-native';
import DailySummary from '@/components/Tracker/DailySummary';

const TrackerScreen = function() {
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: 60, // Gives some space at the top
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA' // Matches your theme background
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  }
});

export default TrackerScreen;