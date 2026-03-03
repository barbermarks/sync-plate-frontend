import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Users } from 'lucide-react';

const WeeklyView = ({ user, household }) => {
  const [weekData, setWeekData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (user) {
    fetchWeekData();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek; // Start on Sunday
    const weekStart = new Date(today.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const fetchWeekData = async () => {
    setLoading(true);
    const dates = getWeekDates();
    
    try {
      // Fetch individual meals for this user
      const { data: individualMeals, error: individualError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .in('meal_date', dates);

      if (individualError) throw individualError;

      // Fetch shared meals for household
      const { data: sharedMeals, error: sharedError } = await supabase
        .from('meals')
        .select('*')
        .eq('household_id', household.id)
        .in('meal_date', dates);

      if (sharedError) throw sharedError;

      // Organize by date
      const weekMap = dates.map(date => {
        const dayIndividual = individualMeals.filter(m => m.meal_date === date);
        const dayShared = sharedMeals.filter(m => m.meal_date === date);
        
        // Calculate total calories for this day
        let totalCalories = 0;
        
        // Add individual meal calories
        dayIndividual.forEach(meal => {
          totalCalories += meal.calories || 0;
        });
        
        // Add shared meal calories (user's portion)
        dayShared.forEach(meal => {
          if (meal.portion_data && meal.portion_data[user.id]) {
            totalCalories += meal.portion_data[user.id].calories || 0;
          }
        });

        const target = user.daily_calorie_target;
        const difference = totalCalories - target;
        
        return {
          date,
          meals: [...dayIndividual, ...dayShared],
          totalCalories,
          target,
          difference,
          dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: new Date(date).getDate(),
          isToday: date === new Date().toISOString().split('T')[0]
        };
      });

      setWeekData(weekMap);
    } catch (error) {
      console.error('Error fetching week data:', error);
    }
    
    setLoading(false);
  };

  const getWeekSummary = () => {
    const totalConsumed = weekData.reduce((sum, day) => sum + day.totalCalories, 0);
    const totalTarget = user.daily_calorie_target * 7;
    const balance = totalConsumed - totalTarget;
    
    return {
      totalConsumed,
      totalTarget,
      balance,
      averageDaily: weekData.length > 0 ? Math.round(totalConsumed / weekData.length) : 0
    };
  };

  const getDayColor = (day) => {
    if (day.totalCalories === 0) return 'bg-slate-100 border-slate-200';
    
    const percentDiff = (day.difference / day.target) * 100;
    
    if (percentDiff > 10) return 'bg-orange-100 border-orange-300'; // Grace day
    if (Math.abs(percentDiff) <= 10) return 'bg-green-100 border-green-300'; // On target
    return 'bg-blue-100 border-blue-300'; // Under target
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">📅 Weekly View</h2>
        <p className="text-slate-600">Loading week data...</p>
      </div>
    );
  }

  const summary = getWeekSummary();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-slate-700" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Weekly View</h2>
            <p className="text-sm text-slate-500">{user.name}'s Week</p>
          </div>
        </div>
        
        <button
          onClick={fetchWeekData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-600 mb-1">Weekly Target</p>
          <p className="text-2xl font-bold text-slate-800">{summary.totalTarget.toLocaleString()}</p>
          <p className="text-xs text-slate-500">calories</p>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-600 mb-1">Consumed</p>
          <p className="text-2xl font-bold text-slate-800">{summary.totalConsumed.toLocaleString()}</p>
          <p className="text-xs text-slate-500">calories</p>
        </div>
        
        <div className={`rounded-lg p-4 ${summary.balance >= 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
          <p className="text-xs text-slate-600 mb-1">Balance</p>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-orange-700' : 'text-green-700'}`}>
            {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            {summary.balance >= 0 ? 'over' : 'under'}
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-600 mb-1">Daily Avg</p>
          <p className="text-2xl font-bold text-slate-800">{summary.averageDaily.toLocaleString()}</p>
          <p className="text-xs text-slate-500">per day</p>
        </div>
      </div>

      {/* 7-Day Calendar */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {weekData.map((day, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedDay(day)}
            className={`${getDayColor(day)} border-2 rounded-xl p-3 cursor-pointer hover:shadow-md transition-all ${
              day.isToday ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-600">{day.dayName}</p>
              <p className="text-2xl font-bold text-slate-800 my-1">{day.dayNumber}</p>
              
              {day.totalCalories > 0 ? (
                <>
                  <p className="text-sm font-bold text-slate-800">{day.totalCalories}</p>
                  <p className="text-xs text-slate-500">cal</p>
                  <div className="mt-2 text-xs">
                    {day.difference > 0 ? (
                      <span className="text-orange-600 font-medium">+{day.difference}</span>
                    ) : day.difference < 0 ? (
                      <span className="text-green-600 font-medium">{day.difference}</span>
                    ) : (
                      <span className="text-green-600 font-medium">✓</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-2">No meals</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span className="text-slate-600">On Target (±10%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
          <span className="text-slate-600">Over Target (&gt;10%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
          <span className="text-slate-600">Under Target</span>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {selectedDay.dayName}, {new Date(selectedDay.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-sm text-slate-600">
                {selectedDay.totalCalories} / {selectedDay.target} calories
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {selectedDay.meals.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No meals logged for this day</p>
          ) : (
            <div className="space-y-3">
              {selectedDay.meals.map((meal, idx) => {
                const isShared = meal.household_id !== null;
                const calories = isShared && meal.portion_data?.[user.id]
                  ? meal.portion_data[user.id].calories
                  : meal.calories;

                return (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500 uppercase">
                            {meal.meal_type}
                          </span>
                          {isShared && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Shared
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-800">{meal.custom_name || 'Meal'}</p>
                        <p className="text-sm text-slate-600">{meal.meal_time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-800">{calories}</p>
                        <p className="text-xs text-slate-500">cal</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyView;