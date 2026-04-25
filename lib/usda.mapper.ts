import type { CleanFoodItem } from './usda';

// A single nutrient entry inside USDA's foodNutrients array.
// We only care about the nutrient ID and its numeric value.
type USDAFoodNutrient = {
  nutrientId: number;
  value?: number;
};

// This is the subset of the USDA food item shape that our mapper needs.
// We do not need the entire USDA response object here.
type USDAFoodItem = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: USDAFoodNutrient[];
};

// This represents the top-level USDA search response.
// We only care about the foods array for mapping search results.
type USDASearchResponse = {
  foods?: USDAFoodItem[];
};

// This gives us flexibility in how we want to output nutrients.
// For now, defaulting to 'perServing' is probably the most useful for UI.
type MapOptions = {
  outputBasis?: 'per100g' | 'perServing';
};

// Centralized nutrient IDs.
// Using IDs instead of names is safer because names can vary slightly,
// while nutrient IDs are much more stable.
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
  cholesterol: 1253,
  calcium: 1087,
  iron: 1089,
  vitaminC: 1162,
} as const;

// Small rounding helper so our UI does not get flooded with long decimals.
// By default, we round to 1 decimal place unless overridden.
function roundTo(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Looks up a nutrient by USDA nutrientId and returns its numeric value.
// If the nutrient is missing, we return 0 instead of undefined so the UI
// always gets a clean numeric shape.
function getNutrientValue(
  nutrients: USDAFoodNutrient[],
  nutrientId: number
): number {
  const match = nutrients.find((nutrient) => nutrient.nutrientId === nutrientId);
  return typeof match?.value === 'number' ? match.value : 0;
}

// Maps one raw USDA food item into your app's normalized CleanFoodItem shape.
//
// Important assumption:
// We are treating the USDA nutrient values as being on a 100-unit basis,
// then converting to per-serving when requested using servingSize / 100.
// That assumption is reasonable, but it is still something you should verify
// with a few representative foods.
export function mapUSDAFoodToCleanFoodItem(
  usdaItem: USDAFoodItem,
  options: MapOptions = {}
): CleanFoodItem {
  const { outputBasis = 'perServing' } = options;

  // USDA sometimes omits fields, so we protect against that here.
  const nutrients = usdaItem.foodNutrients ?? [];
  const servingSize = usdaItem.servingSize ?? 100;
  const servingSizeUnit = usdaItem.servingSizeUnit ?? 'g';

  // If we want per-serving values, scale from the assumed 100-unit basis.
  // If we want per100g output, leave the values as-is.
  const multiplier = outputBasis === 'perServing' ? servingSize / 100 : 1;

  // Convenience helper so each nutrient line stays readable below.
  const valueFor = (nutrientId: number, decimals = 1) =>
    roundTo(getNutrientValue(nutrients, nutrientId) * multiplier, decimals);

  return {
    fdcId: usdaItem.fdcId,
    description: usdaItem.description,
    brandOwner: usdaItem.brandOwner,
    servingSize,
    servingSizeUnit,

    // Big Four macros
    calories: valueFor(NUTRIENT_IDS.calories, 0),
    protein: valueFor(NUTRIENT_IDS.protein),
    carbs: valueFor(NUTRIENT_IDS.carbs),
    fat: valueFor(NUTRIENT_IDS.fat),

    // Selected micros
    micros: {
      fiber: valueFor(NUTRIENT_IDS.fiber),
      sugar: valueFor(NUTRIENT_IDS.sugar),
      sodium: valueFor(NUTRIENT_IDS.sodium),
      cholesterol: valueFor(NUTRIENT_IDS.cholesterol),
      calcium: valueFor(NUTRIENT_IDS.calcium),
      iron: valueFor(NUTRIENT_IDS.iron),
      vitaminC: valueFor(NUTRIENT_IDS.vitaminC),
    },
  };
}

// Maps the full USDA search response into an array of normalized food items.
//
// This is useful because your UI should not need to know USDA's raw response shape.
// Ideally, your modal or store consumes CleanFoodItem[] and nothing more.
export function mapUSDASearchResponseToCleanFoods(
  response: USDASearchResponse | null | undefined,
  options: MapOptions = {}
): CleanFoodItem[] {
  // If the response is missing or contains no foods, return an empty array.
  // This keeps your consuming code simple and predictable.
  if (!response?.foods?.length) {
    return [];
  }

  return response.foods.map((food) => mapUSDAFoodToCleanFoodItem(food, options));
}