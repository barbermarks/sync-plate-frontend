import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function parseNaturalLanguageFood(userInput) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutrition assistant. Convert natural language food descriptions into structured data.

IMPORTANT: User should provide portion sizes for accuracy.

Rules:
- Estimate portion sizes: "handful" = 30g for nuts, "small" = smallest size, "medium" = standard, "large" = 1.5x standard
- Return ONLY valid JSON, no markdown, no backticks, no explanation
- Include macros: protein, carbs, fat (and fiber, sugar if known)
- Include grams when possible

Response format:
{
  "items": [
    {
      "name": "Food name",
      "quantity": 30,
      "unit": "g",
      "grams": 30,
      "calories": 196,
      "protein": 4.5,
      "carbs": 4.1,
      "fat": 19.6,
      "fiber": 2.0,
      "sugar": 1.0
    }
  ],
  "total_calories": 196
}`
        },
        {
          role: "user",
          content: userInput
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return { 
      success: true, 
      data: result,
      source: 'AI Estimate (OpenAI GPT-4o-mini)'
    };
    
  } catch (error) {
    console.error('Food parsing error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to parse food entry' 
    };
  }
}