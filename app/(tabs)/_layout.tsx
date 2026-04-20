import { Tabs } from 'expo-router';

const TabLayout = function() {
  return (
    <Tabs screenOptions={{ headerShown: true, headerTitle: "LibreFitness" }}>
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Tracker',
        }}
      />
    </Tabs>
  );
}

export default TabLayout;