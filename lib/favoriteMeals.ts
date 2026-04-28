import { supabase } from './supabase';
import type { MealType } from './foodEntries';

export type FavoriteMealRow = {
  id: string;
  user_id: string;
  name: string;
  meal_type: MealType;
  created_at: string;
};

export type FavoriteMealItemRow = {
  id: string;
  favorite_meal_id: string;
  sort_order: number;
  food_name: string;
  serving_size_value: number | null;
  serving_size_unit: string | null;
  serving_weight_grams: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  source_food_id: string | null;
  created_at: string;
};

export type FavoriteMealWithItems = FavoriteMealRow & {
  items: FavoriteMealItemRow[];
};

export type CreateFavoriteMealItemInput = {
  foodName: string;
  servingSizeValue?: number | null;
  servingSizeUnit?: string | null;
  servingWeightGrams?: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: string;
  sourceFoodId?: string | null;
};

export type CreateFavoriteMealInput = {
  userId: string;
  name: string;
  mealType: MealType;
  items: CreateFavoriteMealItemInput[];
};

export type UpdateFavoriteMealInput = {
  favoriteMealId: string;
  name: string;
  mealType: MealType;
  items: CreateFavoriteMealItemInput[];
};

type RawFavoriteMealWithItems = FavoriteMealRow & {
  favorite_meal_items: FavoriteMealItemRow[] | null;
};

// Sort child items client-side so list rendering stays stable
// even if the nested query does not preserve the DB sort for us.
function mapFavoriteMeal(rawMeal: RawFavoriteMealWithItems): FavoriteMealWithItems {
  const items = [...(rawMeal.favorite_meal_items ?? [])].sort(
    (leftItem, rightItem) => leftItem.sort_order - rightItem.sort_order
  );

  return {
    id: rawMeal.id,
    user_id: rawMeal.user_id,
    name: rawMeal.name,
    meal_type: rawMeal.meal_type,
    created_at: rawMeal.created_at,
    items,
  };
}

function buildFavoriteMealItemsPayload(
  favoriteMealId: string,
  items: CreateFavoriteMealItemInput[]
) {
  return items.map((item, index) => ({
    favorite_meal_id: favoriteMealId,
    sort_order: index + 1,
    food_name: item.foodName,
    serving_size_value: item.servingSizeValue ?? null,
    serving_size_unit: item.servingSizeUnit ?? null,
    serving_weight_grams: item.servingWeightGrams ?? null,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    source: item.source ?? 'usda',
    source_food_id: item.sourceFoodId ?? null,
  }));
}

// Favorites are user-owned templates, so the main screen usually needs
// the meal row plus its child items for previews and one-tap logging.
export async function getFavoriteMeals(
  userId: string
): Promise<FavoriteMealWithItems[]> {
  const { data, error } = await supabase
    .from('favorite_meals')
    .select(
      `
        id,
        user_id,
        name,
        meal_type,
        created_at,
        favorite_meal_items (
          id,
          favorite_meal_id,
          sort_order,
          food_name,
          serving_size_value,
          serving_size_unit,
          serving_weight_grams,
          calories,
          protein,
          carbs,
          fat,
          source,
          source_food_id,
          created_at
        )
      `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch favorite meals: ${error.message}`);
  }

  const rawMeals = (data ?? []) as RawFavoriteMealWithItems[];
  return rawMeals.map(mapFavoriteMeal);
}

export async function getFavoriteMealById(
  userId: string,
  favoriteMealId: string
): Promise<FavoriteMealWithItems | null> {
  const { data, error } = await supabase
    .from('favorite_meals')
    .select(
      `
        id,
        user_id,
        name,
        meal_type,
        created_at,
        favorite_meal_items (
          id,
          favorite_meal_id,
          sort_order,
          food_name,
          serving_size_value,
          serving_size_unit,
          serving_weight_grams,
          calories,
          protein,
          carbs,
          fat,
          source,
          source_food_id,
          created_at
        )
      `
    )
    .eq('id', favoriteMealId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch favorite meal: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapFavoriteMeal(data as RawFavoriteMealWithItems);
}

export async function createFavoriteMeal(
  input: CreateFavoriteMealInput
): Promise<FavoriteMealWithItems> {
  const { data: mealData, error: mealError } = await supabase
    .from('favorite_meals')
    .insert({
      user_id: input.userId,
      name: input.name,
      meal_type: input.mealType,
    })
    .select()
    .single();

  if (mealError) {
    throw new Error(`Failed to create favorite meal: ${mealError.message}`);
  }

  const itemsPayload = buildFavoriteMealItemsPayload(mealData.id, input.items);

  const { data: itemRows, error: itemError } = await supabase
    .from('favorite_meal_items')
    .insert(itemsPayload)
    .select();

  if (itemError) {
    throw new Error(`Failed to create favorite meal items: ${itemError.message}`);
  }

  return {
    ...(mealData as FavoriteMealRow),
    items: (itemRows ?? []) as FavoriteMealItemRow[],
  };
}

// The editor saves the favorite meal as one coherent snapshot,
// so replacing child items is simpler and safer than trying to diff drafts.
export async function updateFavoriteMeal(
  input: UpdateFavoriteMealInput
): Promise<FavoriteMealWithItems> {
  const { data: updatedMeal, error: mealError } = await supabase
    .from('favorite_meals')
    .update({
      name: input.name,
      meal_type: input.mealType,
    })
    .eq('id', input.favoriteMealId)
    .select()
    .single();

  if (mealError) {
    throw new Error(`Failed to update favorite meal: ${mealError.message}`);
  }

  const { error: deleteItemsError } = await supabase
    .from('favorite_meal_items')
    .delete()
    .eq('favorite_meal_id', input.favoriteMealId);

  if (deleteItemsError) {
    throw new Error(`Failed to replace favorite meal items: ${deleteItemsError.message}`);
  }

  const itemsPayload = buildFavoriteMealItemsPayload(input.favoriteMealId, input.items);

  const { data: insertedItems, error: insertItemsError } = await supabase
    .from('favorite_meal_items')
    .insert(itemsPayload)
    .select();

  if (insertItemsError) {
    throw new Error(`Failed to save favorite meal items: ${insertItemsError.message}`);
  }

  return {
    ...(updatedMeal as FavoriteMealRow),
    items: (insertedItems ?? []) as FavoriteMealItemRow[],
  };
}

export async function deleteFavoriteMeal(favoriteMealId: string): Promise<void> {
  const { error } = await supabase
    .from('favorite_meals')
    .delete()
    .eq('id', favoriteMealId);

  if (error) {
    throw new Error(`Failed to delete favorite meal: ${error.message}`);
  }
}

export async function createFavoriteMealItem(
  favoriteMealId: string,
  sortOrder: number,
  item: CreateFavoriteMealItemInput
): Promise<FavoriteMealItemRow> {
  const { data, error } = await supabase
    .from('favorite_meal_items')
    .insert({
      favorite_meal_id: favoriteMealId,
      sort_order: sortOrder,
      food_name: item.foodName,
      serving_size_value: item.servingSizeValue ?? null,
      serving_size_unit: item.servingSizeUnit ?? null,
      serving_weight_grams: item.servingWeightGrams ?? null,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      source: item.source ?? 'usda',
      source_food_id: item.sourceFoodId ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create favorite meal item: ${error.message}`);
  }

  return data as FavoriteMealItemRow;
}

export async function updateFavoriteMealItem(
  favoriteMealItemId: string,
  item: CreateFavoriteMealItemInput,
  sortOrder?: number
): Promise<FavoriteMealItemRow> {
  const { data, error } = await supabase
    .from('favorite_meal_items')
    .update({
      sort_order: sortOrder,
      food_name: item.foodName,
      serving_size_value: item.servingSizeValue ?? null,
      serving_size_unit: item.servingSizeUnit ?? null,
      serving_weight_grams: item.servingWeightGrams ?? null,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      source: item.source ?? 'usda',
      source_food_id: item.sourceFoodId ?? null,
    })
    .eq('id', favoriteMealItemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update favorite meal item: ${error.message}`);
  }

  return data as FavoriteMealItemRow;
}

export async function deleteFavoriteMealItem(favoriteMealItemId: string): Promise<void> {
  const { error } = await supabase
    .from('favorite_meal_items')
    .delete()
    .eq('id', favoriteMealItemId);

  if (error) {
    throw new Error(`Failed to delete favorite meal item: ${error.message}`);
  }
}

// Favorite meals are templates, so logging them means copying their snapshots
// into real food_entries under the current day and current tracker meal context.
export async function addFavoriteMealToDailyLog(
  dailyLogId: string,
  mealType: MealType,
  favoriteMeal: FavoriteMealWithItems
): Promise<void> {
  const { error } = await supabase.from('food_entries').insert(
    favoriteMeal.items.map((item) => ({
      daily_log_id: dailyLogId,
      meal_type: mealType,
      usda_food_id:
        item.source === 'usda' && item.source_food_id
          ? Number(item.source_food_id)
          : null,
      food_name: item.food_name,
      serving_size_value: item.serving_size_value,
      serving_size_unit: item.serving_size_unit,
      serving_weight_grams: item.serving_weight_grams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }))
  );

  if (error) {
    throw new Error(`Failed to add favorite meal to daily log: ${error.message}`);
  }
}

export function calculateFavoriteMealTotals(favoriteMeal: FavoriteMealWithItems) {
  return favoriteMeal.items.reduce(
    (totals, item) => {
      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.carbs += item.carbs;
      totals.fat += item.fat;
      return totals;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );
}
