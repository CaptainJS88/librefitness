import type { CleanFoodItem } from './usda';

type NutritionFields = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type ServingSnapshot = NutritionFields & {
  servingSizeValue?: number | null;
  servingWeightGrams?: number | null;
};

type FoodScalingInput = Pick<
  CleanFoodItem,
  'servingSize' | 'servingSizeUnit' | 'calories' | 'protein' | 'carbs' | 'fat'
>;

// Tracker nutrition is intentionally displayed and stored with one decimal place.
export function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function getSafeServingSizeValue(servingSizeValue?: number | null) {
  if (servingSizeValue == null || servingSizeValue <= 0) {
    return 1;
  }

  return servingSizeValue;
}

export function scaleNutritionValues(
  nutrition: NutritionFields,
  multiplier: number
): NutritionFields {
  return {
    calories: roundToOneDecimal(nutrition.calories * multiplier),
    protein: roundToOneDecimal(nutrition.protein * multiplier),
    carbs: roundToOneDecimal(nutrition.carbs * multiplier),
    fat: roundToOneDecimal(nutrition.fat * multiplier),
  };
}

// Scales a USDA search result by a user-entered quantity multiplier.
export function scaleFoodForQuantity(
  food: FoodScalingInput,
  quantityMultiplier: number
) {
  const nutrition = scaleNutritionValues(food, quantityMultiplier);
  const servingSizeValue = roundToOneDecimal(food.servingSize * quantityMultiplier);

  return {
    servingSizeValue,
    servingWeightGrams:
      food.servingSizeUnit.toLowerCase() === 'g' ? servingSizeValue : null,
    ...nutrition,
  };
}

// Scales an already-saved serving snapshot to a newly requested serving amount.
export function scaleServingSnapshot(
  snapshot: ServingSnapshot,
  nextServingSizeValue: number
) {
  const currentServingSizeValue = getSafeServingSizeValue(snapshot.servingSizeValue);
  const ratio = nextServingSizeValue / currentServingSizeValue;
  const nutrition = scaleNutritionValues(snapshot, ratio);

  return {
    servingSizeValue: roundToOneDecimal(nextServingSizeValue),
    servingWeightGrams:
      snapshot.servingWeightGrams != null
        ? roundToOneDecimal(snapshot.servingWeightGrams * ratio)
        : null,
    ...nutrition,
  };
}
