import React, { useState, useEffect } from 'react';
import { Users, Utensils, Apple, Coffee, Moon, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import FoodInput from './FoodInput';
import WeeklyView from './WeeklyView';
import GroceryList from './GroceryList';

const Dashboard = () => {
  const [activePartner, setActivePartner] = useState('A');
  const [users, setUsers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length >= 2) {
      fetchMeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, activePartner]);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }

    setLoading(false);
  }

  async function fetchMeals() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const partner = activePartner === 'A' ? users[0] : users[1];

      // Fetch individual meals for this user
      const { data: individualMeals, error: individualError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', partner.id)
        .eq('meal_date', today);

      if (individualError) throw individualError;

      // Fetch shared meals for household
      const { data: sharedMeals, error: sharedError } = await supabase
        .from('meals')
        .select('*')
        .eq('household_id', users[0].household_id)
        .eq('meal_date', today);

      if (sharedError) throw sharedError;

      // Filter shared meals to only include those where this user has a portion
      const filteredSharedMeals = sharedMeals.filter(meal =>
        meal.portion_data && meal.portion_data[partner.id]
      );

      setMeals([...individualMeals, ...filteredSharedMeals]);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  }

  async function handleDeleteMeal(mealId, isShared) {
    if (!window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      const partner = activePartner === 'A' ? users[0] : users[1];

      if (isShared) {
        // For shared meals, remove only this user's portion
        const { data: meal, error: fetchError } = await supabase
          .from('meals')
          .select('portion_data')
          .eq('id', mealId)
          .single();

        if (fetchError) throw fetchError;

        // Remove this user's portion from the portion_data
        const updatedPortionData = { ...meal.portion_data };
        delete updatedPortionData[partner.id];

        // Check if any portions remain
        const remainingUsers = Object.keys(updatedPortionData);

        if (remainingUsers.length === 0) {
          // No users left, delete the entire meal
          const { error: deleteError } = await supabase
            .from('meals')
            .delete()
            .eq('id', mealId);

          if (deleteError) throw deleteError;
        } else {
          // Update the meal with remaining portions
          const { error: updateError } = await supabase
            .from('meals')
            .update({ portion_data: updatedPortionData })
            .eq('id', mealId);

          if (updateError) throw updateError;
        }
      } else {
        // For individual meals, delete the entire meal
        const { error } = await supabase
          .from('meals')
          .delete()
          .eq('id', mealId);

        if (error) throw error;
      }

      // Refresh meals after deletion
      fetchMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal: ' + error.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8">Loading...</div>;
  }

  if (users.length < 2) {
    return <div className="min-h-screen bg-slate-50 p-8">Need at least 2 users</div>;
  }

  const partnerA = users[0];
  const partnerB = users[1];
  const partner = activePartner === 'A' ? partnerA : partnerB;

  // Organize meals by type
  const getMealByType = (type) => {
    const meal = meals.find(m => m.meal_type === type);
    if (!meal) return null;

    const isShared = meal.household_id !== null;
    const calories = isShared && meal.portion_data?.[partner.id]
      ? meal.portion_data[partner.id].calories
      : meal.calories;

    return {
      id: meal.id,
      name: meal.custom_name || 'Meal',
      calories: calories,
      time: meal.meal_time,
      isShared: isShared,
      protein: meal.protein_g,
      carbs: meal.carbs_g,
      fat: meal.fat_g
    };
  };

  const mealsByType = {
    breakfast: getMealByType('breakfast'),
    lunch: getMealByType('lunch'),
    dinner: getMealByType('dinner'),
    snack: getMealByType('snack')
  };

  const totalCalories = meals.reduce((sum, meal) => {
    const isShared = meal.household_id !== null;
    const calories = isShared && meal.portion_data?.[partner.id]
      ? meal.portion_data[partner.id].calories
      : meal.calories;
    return sum + (calories || 0);
  }, 0);

  const remaining = partner.daily_calorie_target - totalCalories;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Sync-Plate</h1>
          <p className="text-slate-600">Calorie tracking for couples who eat together</p>
        </div>

        {/* Partner Toggle */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActivePartner('A')}
            className={`flex-1 p-6 rounded-2xl shadow-lg transition-all ${
              activePartner === 'A'
                ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white scale-105'
                : 'bg-white text-slate-700 hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{partnerA.name}</h2>
                <p className={`text-sm ${activePartner === 'A' ? 'text-rose-100' : 'text-slate-500'}`}>
                  {partnerA.age} years • {partnerA.weight}kg • {partnerA.height}cm
                </p>
              </div>
              <Users className="w-8 h-8" />
            </div>
          </button>

          <button
            onClick={() => setActivePartner('B')}
            className={`flex-1 p-6 rounded-2xl shadow-lg transition-all ${
              activePartner === 'B'
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white scale-105'
                : 'bg-white text-slate-700 hover:shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{partnerB.name}</h2>
                <p className={`text-sm ${activePartner === 'B' ? 'text-blue-100' : 'text-slate-500'}`}>
                  {partnerB.age} years • {partnerB.weight}kg • {partnerB.height}cm
                </p>
              </div>
              <Users className="w-8 h-8" />
            </div>
          </button>
        </div>

        {/* Daily Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">Today's Progress</h3>
            <span className={`text-2xl font-bold ${
              activePartner === 'A' ? 'text-rose-600' : 'text-blue-600'
            }`}>
              {totalCalories} / {partner.daily_calorie_target} cal
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full ${
                activePartner === 'A'
                  ? 'bg-gradient-to-r from-rose-400 to-pink-500'
                  : 'bg-gradient-to-r from-blue-400 to-indigo-500'
              }`}
              style={{ width: `${Math.min((totalCalories / partner.daily_calorie_target) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-slate-600">
              BMR: {partner.bmr} cal
            </span>
            <span className={remaining >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {remaining >= 0 ? `${remaining} cal remaining` : `${Math.abs(remaining)} cal over`}
            </span>
          </div>
        </div>

        {/* AI Food Input */}
        <FoodInput
          activePartner={activePartner}
          partnerA={partnerA}
          partnerB={partnerB}
          householdId={partnerA.household_id}
          onMealAdded={fetchMeals}
        />

        {/* Meals Grid */}
        <div className="grid gap-4 mb-6">

          {/* Breakfast */}
          {mealsByType.breakfast ? (
            <MealCard
              icon={Coffee}
              title="Breakfast"
              subtitle={mealsByType.breakfast.isShared ? "Shared" : "Individual"}
              meal={mealsByType.breakfast}
              color={activePartner}
              isShared={mealsByType.breakfast.isShared}
              onDelete={handleDeleteMeal}
            />
          ) : (
            <EmptyMealCard icon={Coffee} title="Breakfast" color={activePartner} />
          )}

          {/* Lunch */}
          {mealsByType.lunch ? (
            <MealCard
              icon={Apple}
              title="Lunch"
              subtitle={mealsByType.lunch.isShared ? "Shared" : "Individual"}
              meal={mealsByType.lunch}
              color={activePartner}
              isShared={mealsByType.lunch.isShared}
              onDelete={handleDeleteMeal}
            />
          ) : (
            <EmptyMealCard icon={Apple} title="Lunch" color={activePartner} />
          )}

          {/* Dinner */}
          {mealsByType.dinner ? (
            <MealCard
              icon={Utensils}
              title="Dinner"
              subtitle={mealsByType.dinner.isShared ? "Shared" : "Individual"}
              meal={mealsByType.dinner}
              color={activePartner}
              isShared={mealsByType.dinner.isShared}
              onDelete={handleDeleteMeal}
            />
          ) : (
            <EmptyMealCard icon={Utensils} title="Dinner" color={activePartner} />
          )}

          {/* Snack */}
          {mealsByType.snack ? (
            <MealCard
              icon={Moon}
              title="Snack"
              subtitle={mealsByType.snack.isShared ? "Shared" : "Individual"}
              meal={mealsByType.snack}
              color={activePartner}
              isShared={mealsByType.snack.isShared}
              onDelete={handleDeleteMeal}
            />
          ) : (
            <EmptyMealCard icon={Moon} title="Snack" color={activePartner} />
          )}
        </div>

        {/* Weekly View */}
        <WeeklyView user={partner} household={{ id: partnerA.household_id }} />

        {/* Grocery List */}
        <GroceryList
          household={{ id: partnerA.household_id }}
        />

        {/* Key Feature Callout */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">🎯 How Couple-Sync Works</h3>
          <p className="text-purple-50 mb-3">
            Click between {partnerA.name} and {partnerB.name} above to see how the <strong>same dinner</strong> shows 
            different portions based on each person's calorie target.
          </p>
          <ul className="space-y-2 text-sm text-purple-50">
            <li>✅ One recipe stored in the database</li>
            <li>✅ One grocery list generated</li>
            <li>✅ Portions calculated individually based on BMR + goals</li>
            <li>✅ Any meal can be shared or kept individual</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Reusable Meal Card Component
const MealCard = ({ icon: Icon, title, subtitle, meal, color, isShared, onDelete }) => {
  const colorClasses = {
    A: 'bg-rose-50 border-rose-200',
    B: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${isShared ? 'border-purple-200' : 'border-slate-200'} relative`}>
      {isShared && (
        <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Users className="w-3 h-3" />
          SHARED
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className={`${colorClasses[color]} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${color === 'A' ? 'text-rose-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              isShared ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {subtitle}
            </span>
          </div>
          <p className="text-slate-600 mb-2">{meal.name}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-slate-800">{meal.calories}</span>
              <span className="text-sm text-slate-500">calories • {meal.time}</span>
            </div>
            <button
              onClick={() => onDelete(meal.id, isShared)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
              title={isShared ? "Remove your portion from this shared meal" : "Delete meal"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty Meal Card Component
const EmptyMealCard = ({ icon: Icon, title, color }) => {
  const colorClasses = {
    A: 'bg-rose-50 border-rose-200',
    B: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-dashed border-slate-200 opacity-50">
      <div className="flex items-start gap-4">
        <div className={`${colorClasses[color]} p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 ${color === 'A' ? 'text-rose-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">No meal logged yet</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
