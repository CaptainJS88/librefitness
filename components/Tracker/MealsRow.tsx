import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';
import Icon from '@/components/Shared/Icon';
import { Ionicons } from '@expo/vector-icons';

// Data type for meal row
type MealsRowProps = {
  title: string;
  currentCalories: number;
  maxCalories: number;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onAddPress: () => void;
};

export default function MealsRow({ 
  title, 
  currentCalories, 
  maxCalories, 
  iconName, 
  onAddPress 
}: MealsRowProps) {
  return (
    <View style={styles.container}>
      {/* Left side: Icon and Text */}
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Icon name={iconName} size={24} color={COLORS.primary} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.calorieText}>
            {currentCalories}/{maxCalories} kcal
          </Text>
        </View>
      </View>

      {/* Right side: Action Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
        <Icon name="add" size={24} color={COLORS.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 20,
    marginBottom: SPACING.md,
    // Subtle shadow to match DailySummary
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: SPACING.md,
    backgroundColor: '#F0F4F8', // Light blue background for the icon
    padding: 10,
    borderRadius: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  calorieText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});