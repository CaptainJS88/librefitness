import { supabase } from './supabase';

// This should stay aligned with your database enum values.
// Because your enum uses capitalized values, this type does too.
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

// DB row shape mirrors the actual food_entries table.
// That is why these fields use snake_case.
export type FoodEntryRow = {
  id: string;
  daily_log_id: string;
  meal_type: MealType;
  usda_food_id: number | null;
  food_name: string;
  serving_size_value: number | null;
  serving_size_unit: string | null;
  serving_weight_grams: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
};

// App-facing input for creating one food entry.
// This uses camelCase because it is easier to work with in React code.
export type CreateFoodEntryInput = {
  dailyLogId: string;
  mealType: MealType;
  usdaFoodId?: number | null;
  foodName: string;
  servingSizeValue?: number | null;
  servingSizeUnit?: string | null;
  servingWeightGrams?: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// App-facing input for partial food edits.
// All fields are optional because an edit may only change one or two things.
export type UpdateFoodEntryInput = {
  mealType?: MealType;
  foodName?: string;
  servingSizeValue?: number | null;
  servingSizeUnit?: string | null;
  servingWeightGrams?: number | null;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

// Fetches all food entries for one daily log.
// We sort by created_at so entries render in a stable order.
export async function getFoodEntriesForDailyLog(
  dailyLogId: string
): Promise<FoodEntryRow[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('daily_log_id', dailyLogId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch food entries: ${error.message}`);
  }

  return data ?? [];
}

// Adds one food entry under an existing daily log.
// This is the main insert helper your search modal will eventually call.
export async function addFoodEntry(
  input: CreateFoodEntryInput
): Promise<FoodEntryRow> {
  const { data, error } = await supabase
    .from('food_entries')
    .insert({
      daily_log_id: input.dailyLogId,
      meal_type: input.mealType,
      usda_food_id: input.usdaFoodId ?? null,
      food_name: input.foodName,
      serving_size_value: input.servingSizeValue ?? null,
      serving_size_unit: input.servingSizeUnit ?? null,
      serving_weight_grams: input.servingWeightGrams ?? null,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add food entry: ${error.message}`);
  }

  return data;
}

// Updates one existing food entry.
// We pass a partial payload so small edits remain easy.
export async function updateFoodEntry(
  foodEntryId: string,
  input: UpdateFoodEntryInput
): Promise<FoodEntryRow> {
  const { data, error } = await supabase
    .from('food_entries')
    .update({
      meal_type: input.mealType,
      food_name: input.foodName,
      serving_size_value: input.servingSizeValue,
      serving_size_unit: input.servingSizeUnit,
      serving_weight_grams: input.servingWeightGrams,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
    })
    .eq('id', foodEntryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update food entry: ${error.message}`);
  }

  return data;
}

// Deletes a food entry permanently.
// Later, this can be wired to a swipe action or overflow menu.
export async function deleteFoodEntry(foodEntryId: string): Promise<void> {
  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('id', foodEntryId);

  if (error) {
    throw new Error(`Failed to delete food entry: ${error.message}`);
  }
}
