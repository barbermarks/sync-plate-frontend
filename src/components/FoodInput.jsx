import React, { useState } from 'react';
import { parseNaturalLanguageFood } from '../lib/openaiClient';
import { supabase } from '../lib/supabaseClient';
import RebalanceModal from './RebalanceModal';

const FoodInput = ({ activePartner, partnerA, partnerB, householdId, onMealAdded }) => {
  const [input, setInput] = useState('');
  const [mealType, setMealType] = useState('snack');
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);

  const partner = activePartner === 'A' ? partnerA : partnerB;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Step 1: Parse with AI (will try USDA first, then fallback to AI)
    const response = await parseNaturalLanguageFood(input);

    if (!response.success) {
      setError(response.error);
      setLoading(false);
      return;
    }

    // Step 2: Check if it's a shared meal
    if (isShared) {
      await handleSharedMeal(response.data, response.source);
    } else {
      await handleIndividualMeal(response.data, response.source);
    }
  };

  const handleIndividualMeal = async (parsedData, responseSource) => {
    try {
      const mealData = {
        user_id: partner.id,
        meal_date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        meal_time: new Date().toTimeString().split(' ')[0],
        custom_name: parsedData.items.map(item => item.name).join(', '),
        calories: parsedData.total_calories,
        protein_g: parsedData.items.reduce((sum, item) => sum + (item.protein || 0), 0),
        carbs_g: parsedData.items.reduce((sum, item) => sum + (item.carbs || 0), 0),
        fat_g: parsedData.items.reduce((sum, item) => sum + (item.fat || 0), 0),
        is_planned: false,
        is_unplanned: true
      };

      const { error: dbError } = await supabase
        .from('meals')
        .insert([mealData]);

      if (dbError) throw dbError;

      setResult({
        type: 'individual',
        data: parsedData,
        partner: partner.name,
        source: responseSource || 'Unknown'
      });

      setInput('');
      if (onMealAdded) onMealAdded();

      setTimeout(() => setResult(null), 3000);

      // Calculate today's total calories and check for overage
      await checkForOverageAndTriggerModal(parsedData, mealData.custom_name);

    } catch (dbError) {
      console.error('Database error:', dbError);
      setError('Failed to save meal: ' + dbError.message);
    }

    setLoading(false);
  };

  const checkForOverageAndTriggerModal = async (parsedData, itemName) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all meals for today to calculate total
      const { data: todayMeals, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', partner.id)
        .eq('meal_date', today);

      if (mealsError) throw mealsError;

      // Calculate today's total calories
      const todayTotal = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

      // Check if over daily budget
      if (todayTotal > partner.daily_calorie_target) {
        const overage = todayTotal - partner.daily_calorie_target;

        // Calculate remaining meals (4 meal types - number already logged)
        const loggedMealTypes = new Set(todayMeals.map(m => m.meal_type));
        const allMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        const remainingMeals = allMealTypes.filter(type => !loggedMealTypes.has(type)).length;

        // Calculate days left in week
        const today_date = new Date();
        const dayOfWeek = today_date.getDay(); // 0 = Sunday, 6 = Saturday
        const daysLeftInWeek = dayOfWeek === 0 ? 6 : 7 - dayOfWeek;

        setRebalanceData({
          overage,
          remainingMealsToday: remainingMeals,
          daysLeftInWeek: daysLeftInWeek,
          unplannedItem: {
            name: itemName,
            calories: parsedData.total_calories,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }
        });

        // Show modal after success message
        setTimeout(() => {
          setShowRebalanceModal(true);
        }, 3500);
      }
    } catch (error) {
      console.error('Error checking for overage:', error);
      // Don't block the flow if this fails
    }
  };

  const handleSharedMeal = async (parsedData, responseSource) => {
    try {
      const totalCalories = parsedData.total_calories;
      const totalProtein = parsedData.items.reduce((sum, item) => sum + (item.protein || 0), 0);
      const totalCarbs = parsedData.items.reduce((sum, item) => sum + (item.carbs || 0), 0);
      const totalFat = parsedData.items.reduce((sum, item) => sum + (item.fat || 0), 0);

      const totalTarget = partnerA.daily_calorie_target + partnerB.daily_calorie_target;
      const ratioA = partnerA.daily_calorie_target / totalTarget;
      const ratioB = partnerB.daily_calorie_target / totalTarget;

      const portionA = {
        calories: Math.round(totalCalories * ratioA),
        protein: Math.round(totalProtein * ratioA * 10) / 10,
        carbs: Math.round(totalCarbs * ratioA * 10) / 10,
        fat: Math.round(totalFat * ratioA * 10) / 10,
        items: parsedData.items.map(item => ({
          name: item.name,
          amount: `${Math.round(item.quantity * ratioA)}${item.unit}`
        }))
      };

      const portionB = {
        calories: Math.round(totalCalories * ratioB),
        protein: Math.round(totalProtein * ratioB * 10) / 10,
        carbs: Math.round(totalCarbs * ratioB * 10) / 10,
        fat: Math.round(totalFat * ratioB * 10) / 10,
        items: parsedData.items.map(item => ({
          name: item.name,
          amount: `${Math.round(item.quantity * ratioB)}${item.unit}`
        }))
      };

      const portionData = {
        [partnerA.id]: portionA,
        [partnerB.id]: portionB
      };

      const mealData = {
        household_id: householdId,
        meal_date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        meal_time: new Date().toTimeString().split(' ')[0],
        custom_name: parsedData.items.map(item => item.name).join(', '),
        calories: totalCalories,
        protein_g: totalProtein,
        carbs_g: totalCarbs,
        fat_g: totalFat,
        portion_data: portionData,
        is_planned: false
      };

      const { error: dbError } = await supabase
        .from('meals')
        .insert([mealData]);

      if (dbError) throw dbError;

      setResult({
        type: 'shared',
        data: parsedData,
        portionA: portionA,
        portionB: portionB,
        partnerAName: partnerA.name,
        partnerBName: partnerB.name,
        source: responseSource || 'Unknown'
      });

      setInput('');
      if (onMealAdded) onMealAdded();

      setTimeout(() => setResult(null), 4000);

    } catch (dbError) {
      console.error('Database error:', dbError);
      setError('Failed to save shared meal: ' + dbError.message);
    }

    setLoading(false);
  };

  const handleMealTypeChange = (type) => {
    setMealType(type);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">🤖 AI Food Logger</h2>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          activePartner === 'A' 
            ? 'bg-rose-100 text-rose-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {isShared ? 'Shared Meal' : `Logging for ${partner.name}`}
        </span>
      </div>

      {/* Meal Type Selector */}
      <div className="flex gap-2 mb-4">
        {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
          <button
            key={type}
            type="button"
            onClick={() => handleMealTypeChange(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mealType === type
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Shared Meal Checkbox */}
      <div className="mb-4 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="ml-2 text-sm font-medium text-purple-800">
            🍽️ This is a shared meal (both partners eating together)
          </span>
        </label>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isShared
                ? "e.g., 'Grilled salmon with vegetables for 2'"
                : "e.g., 'handful of walnuts' or '100g chicken breast'"
            }
            className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Parsing...' : 'Log Food'}
          </button>
        </div>
      </form>

      {/* Results for Individual Meal */}
      {result && result.type === 'individual' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-green-800">
              ✅ Saved to {result.partner}'s {mealType}!
            </h3>
            {result.source && (
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                result.source.includes('USDA') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {result.source.includes('USDA') ? '📊 USDA Data' : '🤖 AI Estimate'}
              </span>
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            {result.data.items.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-600">
                      {item.quantity}{item.unit} {item.grams && `(${item.grams}g)`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{item.calories}</p>
                    <p className="text-xs text-slate-500">calories</p>
                  </div>
                </div>
                
                {/* Macro Breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Protein</p>
                    <p className="text-sm font-bold text-blue-600">{item.protein}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Carbs</p>
                    <p className="text-sm font-bold text-orange-600">{item.carbs}g</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Fat</p>
                    <p className="text-sm font-bold text-purple-600">{item.fat}g</p>
                  </div>
                </div>
                
                {/* Additional nutrients if available */}
                {(item.fiber > 0 || item.sugar > 0) && (
                  <div className="flex gap-4 mt-2 text-xs text-slate-600">
                    {item.fiber > 0 && <span>Fiber: {item.fiber}g</span>}
                    {item.sugar > 0 && <span>Sugar: {item.sugar}g</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-green-100 rounded-lg p-3 border border-green-300">
            <p className="text-green-800 font-bold">
              Total: {result.data.total_calories} calories
            </p>
          </div>
        </div>
      )}

      {/* Results for Shared Meal */}
      {result && result.type === 'shared' && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-purple-800">
              ✅ Saved as shared {mealType} for both partners!
            </h3>
            {result.source && (
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                result.source.includes('USDA') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {result.source.includes('USDA') ? '📊 USDA Data' : '🤖 AI Estimate'}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Partner A Portion */}
            <div className="bg-white rounded-lg p-3 border-2 border-rose-200">
              <p className="font-bold text-rose-700 mb-2">{result.partnerAName}'s Portion</p>
              <p className="text-2xl font-bold text-slate-800 mb-2">{result.portionA.calories} cal</p>
              <div className="text-xs text-slate-600 mb-2">
                P: {result.portionA.protein}g • C: {result.portionA.carbs}g • F: {result.portionA.fat}g
              </div>
              {result.portionA.items.map((item, idx) => (
                <p key={idx} className="text-sm text-slate-700">
                  {item.name}: <strong>{item.amount}</strong>
                </p>
              ))}
            </div>

            {/* Partner B Portion */}
            <div className="bg-white rounded-lg p-3 border-2 border-blue-200">
              <p className="font-bold text-blue-700 mb-2">{result.partnerBName}'s Portion</p>
              <p className="text-2xl font-bold text-slate-800 mb-2">{result.portionB.calories} cal</p>
              <div className="text-xs text-slate-600 mb-2">
                P: {result.portionB.protein}g • C: {result.portionB.carbs}g • F: {result.portionB.fat}g
              </div>
              {result.portionB.items.map((item, idx) => (
                <p key={idx} className="text-sm text-slate-700">
                  {item.name}: <strong>{item.amount}</strong>
                </p>
              ))}
            </div>
          </div>

          <div className="bg-purple-100 rounded-lg p-3 border border-purple-300">
            <p className="text-purple-800 font-bold">
              💡 Portions calculated based on each person's daily calorie target!
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Rebalance Modal */}
      <RebalanceModal
        isOpen={showRebalanceModal}
        onClose={() => setShowRebalanceModal(false)}
        overage={rebalanceData?.overage || 0}
        user={partner}
        remainingMealsToday={rebalanceData?.remainingMealsToday || 0}
        daysLeftInWeek={rebalanceData?.daysLeftInWeek || 6}
        unplannedItem={rebalanceData?.unplannedItem}
      />
    </div>
  );
};

export default FoodInput;
