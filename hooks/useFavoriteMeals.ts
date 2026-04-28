import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  getFavoriteMeals,
  type FavoriteMealWithItems,
} from '@/lib/favoriteMeals';

type UseFavoriteMealsArgs = {
  userId: string | null | undefined;
};

export function useFavoriteMeals({ userId }: UseFavoriteMealsArgs) {
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMealWithItems[]>([]);
  const [isLoadingFavoriteMeals, setIsLoadingFavoriteMeals] = useState(false);

  const loadFavoriteMeals = useCallback(async () => {
    try {
      if (!userId) {
        setFavoriteMeals([]);
        return;
      }

      setIsLoadingFavoriteMeals(true);
      const meals = await getFavoriteMeals(userId);
      setFavoriteMeals(meals);
    } catch (error) {
      console.error('Error loading favorite meals:', error);
      Alert.alert('Error', 'Unable to load favorite meals right now.');
    } finally {
      setIsLoadingFavoriteMeals(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadFavoriteMeals();
  }, [loadFavoriteMeals]);

  return {
    favoriteMeals,
    isLoadingFavoriteMeals,
    loadFavoriteMeals,
  };
}
