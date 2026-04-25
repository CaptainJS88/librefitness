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
  }
};