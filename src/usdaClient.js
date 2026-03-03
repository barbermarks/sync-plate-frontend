const USDA_API_KEY = process.env.REACT_APP_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Common portion size conversions to grams
const PORTION_CONVERSIONS = {
  // Volume
  'cup': 240,
  'cups': 240,
  'tbsp': 15,
  'tablespoon': 15,
  'tablespoons': 15,
  'tsp': 5,
  'teaspoon': 5,
  'teaspoons': 5,
  'ml': 1,
  'l': 1000,
  'liter': 1000,
  'oz': 30, // fluid oz
  
  // Weight
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'lb': 454,
  'pound': 454,
  'pounds': 454,
  'oz': 28, // weight oz (context dependent)
  
  // Common portions
  'small': 100,
  'medium': 150,
  'large': 200,
  'handful': 30,
  'piece': 50,
  'slice': 30,
  'serving': 100
};

export async function searchUSDAFood(query) {
  try {
    const response = await fetch(
      `${USDA_BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${USDA_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('USDA API request failed');
    }
    
    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error('USDA search error:', error);
    return [];
  }
}

export async function getUSDAFoodDetails(fdcId) {
  try {
    const response = await fetch(
      `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('USDA API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('USDA details error:', error);
    return null;
  }
}

export function parsePortionSize(input) {
  // Extract number and unit from input like "2 cups", "100g", "1 large apple"
  const match = input.toLowerCase().match(/(\d+\.?\d*)\s*([a-z]+)/);
  
  if (!match) {
    return { amount: 1, unit: 'serving', grams: 100 };
  }
  
  const amount = parseFloat(match[1]);
  const unit = match[2];
  
  const gramsPerUnit = PORTION_CONVERSIONS[unit] || 100;
  const totalGrams = amount * gramsPerUnit;
  
  return {
    amount,
    unit,
    grams: totalGrams
  };
}

export function extractNutrients(usdaFood, portionGrams = 100) {
  // USDA data is per 100g, so we need to scale
  const scaleFactor = portionGrams / 100;
  
  const nutrients = {};
  
  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const name = nutrient.nutrientName?.toLowerCase();
      const value = nutrient.value || 0;
      
      if (name?.includes('energy') || name?.includes('calorie')) {
        nutrients.calories = Math.round(value * scaleFactor);
      } else if (name?.includes('protein')) {
        nutrients.protein = Math.round(value * scaleFactor * 10) / 10;
      } else if (name?.includes('carbohydrate')) {
        nutrients.carbs = Math.round(value * scaleFactor * 10) / 10;
      } else if (name?.includes('total lipid') || name?.includes('fat')) {
        nutrients.fat = Math.round(value * scaleFactor * 10) / 10;
      } else if (name?.includes('fiber')) {
        nutrients.fiber = Math.round(value * scaleFactor * 10) / 10;
      } else if (name?.includes('sugars')) {
        nutrients.sugar = Math.round(value * scaleFactor * 10) / 10;
      }
    });
  }
  
  // Ensure we have at least calories
  if (!nutrients.calories && usdaFood.calories) {
    nutrients.calories = Math.round(usdaFood.calories * scaleFactor);
  }
  
  return {
    calories: nutrients.calories || 0,
    protein: nutrients.protein || 0,
    carbs: nutrients.carbs || 0,
    fat: nutrients.fat || 0,
    fiber: nutrients.fiber || 0,
    sugar: nutrients.sugar || 0
  };
}

export async function parseNaturalLanguageFoodWithUSDA(userInput) {
  try {
    // Parse portion size from input
    const portion = parsePortionSize(userInput);
    
    // Extract food name (remove numbers and common units)
    const foodName = userInput
      .replace(/\d+\.?\d*/g, '')
      .replace(/\b(cup|cups|tbsp|tsp|g|grams|kg|lb|oz|small|medium|large|handful|piece|slice|serving)\b/gi, '')
      .trim();
    
    // Search USDA database
    const usdaResults = await searchUSDAFood(foodName);
    
    if (usdaResults.length === 0) {
      return {
        success: false,
        error: 'No USDA data found',
        fallbackToAI: true
      };
    }
    
    // Use the first (most relevant) result
    const topResult = usdaResults[0];
    const nutrients = extractNutrients(topResult, portion.grams);
    
    return {
      success: true,
      source: 'USDA',
      data: {
        items: [{
          name: topResult.description || foodName,
          quantity: portion.amount,
          unit: portion.unit,
          grams: portion.grams,
          calories: nutrients.calories,
          protein: nutrients.protein,
          carbs: nutrients.carbs,
          fat: nutrients.fat,
          fiber: nutrients.fiber,
          sugar: nutrients.sugar,
          fdcId: topResult.fdcId
        }],
        total_calories: nutrients.calories
      }
    };
    
  } catch (error) {
    console.error('USDA parsing error:', error);
    return {
      success: false,
      error: error.message,
      fallbackToAI: true
    };
  }
}