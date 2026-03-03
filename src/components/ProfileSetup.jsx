import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Scale, Ruler, Target, Activity } from 'lucide-react';

const ProfileSetup = ({ userId, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    activityLevel: 'moderate',
    goal: 'maintain'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activityLevels = {
    sedentary: { label: 'Sedentary', multiplier: 1.2, desc: 'Little or no exercise' },
    light: { label: 'Light', multiplier: 1.375, desc: 'Exercise 1-3 days/week' },
    moderate: { label: 'Moderate', multiplier: 1.55, desc: 'Exercise 3-5 days/week' },
    active: { label: 'Active', multiplier: 1.725, desc: 'Exercise 6-7 days/week' },
    very_active: { label: 'Very Active', multiplier: 1.9, desc: 'Physical job or training' }
  };

  const goals = {
    lose: { label: 'Lose Weight', adjustment: -500 },
    maintain: { label: 'Maintain Weight', adjustment: 0 },
    gain: { label: 'Gain Weight', adjustment: 500 }
  };

  function calculateBMR(weight, height, age) {
    // Using Mifflin-St Jeor Equation (assuming male for simplicity)
    // BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
  }

  function calculateDailyCalories() {
    const bmr = calculateBMR(
      parseFloat(formData.weight),
      parseFloat(formData.height),
      parseFloat(formData.age)
    );
    const tdee = Math.round(bmr * activityLevels[formData.activityLevel].multiplier);
    const target = tdee + goals[formData.goal].adjustment;
    return { bmr, target };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { bmr, target } = calculateDailyCalories();

      // Create user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          name: formData.name,
          age: parseInt(formData.age),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          bmr: bmr,
          daily_calorie_target: target,
          activity_level: formData.activityLevel,
          goal: formData.goal
        }]);

      if (insertError) throw insertError;

      onComplete();
    } catch (error) {
      console.error('Error creating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const isValid = formData.name && formData.age && formData.weight && formData.height;
  const canCalculate = isValid && !isNaN(formData.weight) && !isNaN(formData.height) && !isNaN(formData.age);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Set Up Your Profile</h1>
          <p className="text-slate-600">Tell us about yourself to calculate your calorie needs</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>

            {/* Age, Weight, Height Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="25"
                  required
                  min="13"
                  max="120"
                />
                <p className="text-xs text-slate-500 mt-1">years</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Scale className="inline w-4 h-4 mr-1" />
                  Weight
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="70"
                  required
                  min="30"
                  max="300"
                  step="0.1"
                />
                <p className="text-xs text-slate-500 mt-1">kg</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Ruler className="inline w-4 h-4 mr-1" />
                  Height
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="175"
                  required
                  min="100"
                  max="250"
                />
                <p className="text-xs text-slate-500 mt-1">cm</p>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                <Activity className="inline w-4 h-4 mr-1" />
                Activity Level
              </label>
              <div className="space-y-2">
                {Object.entries(activityLevels).map(([key, level]) => (
                  <label
                    key={key}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.activityLevel === key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="activityLevel"
                      value={key}
                      checked={formData.activityLevel === key}
                      onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{level.label}</div>
                      <div className="text-sm text-slate-500">{level.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                <Target className="inline w-4 h-4 mr-1" />
                Goal
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(goals).map(([key, goal]) => (
                  <label
                    key={key}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.goal === key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={key}
                      checked={formData.goal === key}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="mb-2"
                    />
                    <div className="font-medium text-slate-800 text-center">{goal.label}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Calorie Preview */}
            {canCalculate && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Your Daily Calorie Target</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-600">
                    {calculateDailyCalories().target}
                  </span>
                  <span className="text-slate-600">calories per day</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Based on BMR: {calculateDailyCalories().bmr} cal × {activityLevels[formData.activityLevel].label} ({activityLevels[formData.activityLevel].multiplier}x)
                  {goals[formData.goal].adjustment !== 0 && ` ${goals[formData.goal].adjustment > 0 ? '+' : ''}${goals[formData.goal].adjustment} cal for ${goals[formData.goal].label.toLowerCase()}`}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
