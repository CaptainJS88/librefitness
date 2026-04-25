import { supabase } from './supabase';

export interface CleanFoodItem {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize: number;
  servingSizeUnit: string;
  // Macros
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Micros
  micros: {
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol: number;
    calcium: number;
    iron: number;
    vitaminC: number;
  };
}

export const USDA = {
  //  API Call via supabase to USDA
  async searchFoods(query: string, pageNumber = 1, pageSize = 15) {
    try {
      const { data, error } = await supabase.functions.invoke('usda-search', {
        body: { query, pageNumber, pageSize },
      });

      if (error) throw new Error(error.message);
      return data;
      
    } catch (error) {
      console.error('Edge Function Search Error:', error);
      return null;
    }
  },

  // Macro & Micro Extractor helper function
  extractMacros(usdaItem: any): CleanFoodItem {
    const nutrients = usdaItem.foodNutrients || [];

    const getNutrient = (id: number) => {
      const nutrient = nutrients.find((n: any) => n.nutrientId === id);
      return nutrient ? nutrient.value : 0;
    };

    const servingSize = usdaItem.servingSize || 100;
    const servingSizeUnit = usdaItem.servingSizeUnit || 'g';
    const multiplier = servingSize / 100;

    // Helper to calculate and round values
    const calc = (id: number) => Math.round((getNutrient(id) * multiplier) * 10) / 10;

    return {
      fdcId: usdaItem.fdcId,
      description: usdaItem.description,
      brandOwner: usdaItem.brandOwner,
      servingSize,
      servingSizeUnit,
      // Big Four
      calories: Math.round(getNutrient(1008) * multiplier),
      protein: calc(1003),
      carbs: calc(1005),
      fat: calc(1004),
      // Micros
      micros: {
        fiber: calc(1079),
        sugar: calc(2000),
        sodium: calc(1093),
        cholesterol: calc(1253),
        calcium: calc(1087),
        iron: calc(1089),
        vitaminC: calc(1162),
      }
    };
  }
};