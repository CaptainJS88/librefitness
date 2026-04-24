const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY;

// Fail quick if no API key present. 
if (API_KEY) {
    console.error("USDA Api key error, food search will fail");
}

export const USDA = {
    //  query to search food 
    async searchFoods(query: string, pageNumber = 1) {
        try {
            const response = await fetch(
                `${BASE_URL}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}&pageNumber=${pageNumber}`
            )
            if (!response.ok) throw new Error('USDA Network response was not ok');

        } catch (error) {
            console.error('USDA Search Error:', error);
            return null;
        }
    },

    // query to get food details such as macros 
    async getFoodDetails(fdcId: string | number) {
        try {
            const response = await fetch(
                `${BASE_URL}/food/${fdcId}?api_key=${API_KEY}`
            );

            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();

        } catch (error) {
            console.error('USDA Details Error:', error);
            return null;
        }
    }
}

