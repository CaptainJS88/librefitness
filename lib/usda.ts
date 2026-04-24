// Serverless backend to prevent USDA api key from being exposed to frontend
import { supabase } from './supabase';

export const USDA = {
  async searchFoods(query: string, pageNumber = 1, pageSize = 15) {
    try {
      const { data, error } = await supabase.functions.invoke('usda-search', {
        body: { query, pageNumber, pageSize },
      });

      if (error) throw new Error(error.message);
      return data;
      
    } catch (error) {
      console.error('Edge Function Error:', error);
      return null;
    }
  },
};