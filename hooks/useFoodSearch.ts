import { useEffect, useState } from 'react';
import { USDA, type CleanFoodItem } from '@/lib/usda';
import { mapUSDASearchResponseToCleanFoods } from '@/lib/usda.mapper';

export const MIN_FOOD_SEARCH_LENGTH = 3;

type UseFoodSearchArgs = {
  visible: boolean;
  pageSize: number;
  minQueryLength?: number;
};

// Keeps the USDA search request lifecycle outside the modal UI:
// input text, debounce, loading, empty/error reset, and normalized results.
export function useFoodSearch({
  visible,
  pageSize,
  minQueryLength = MIN_FOOD_SEARCH_LENGTH,
}: UseFoodSearchArgs) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<CleanFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setDebouncedQuery('');
      setResults([]);
      setError(null);
      setIsSearching(false);
    }
  }, [visible]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (debouncedQuery.length < minQueryLength) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      try {
        setIsSearching(true);
        setError(null);

        const response = await USDA.searchFoods(debouncedQuery, 1, pageSize);

        if (cancelled) {
          return;
        }

        const cleanFoods = mapUSDASearchResponseToCleanFoods(response);
        setResults(cleanFoods);
      } catch (searchError) {
        if (cancelled) {
          return;
        }

        setResults([]);
        setError('Unable to search foods right now.');
        console.error('Search modal error:', searchError);
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, minQueryLength, pageSize, visible]);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isSearching,
    error,
  };
}
