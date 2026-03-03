import React, { useState } from 'react';
import RebalanceModal from './RebalanceModal';

const RebalanceModalDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [scenario, setScenario] = useState('afternoon');

  const scenarios = {
    afternoon: {
      name: 'Afternoon Snack Overage',
      description: 'Sarah logged a chocolate croissant at 3:45 PM',
      overage: 270,
      remainingMealsToday: 1,
      daysLeftInWeek: 6,
      user: {
        name: 'Sarah',
        daily_calorie_target: 1800,
        weekly_calorie_target: 12600
      },
      unplannedItem: {
        name: 'Chocolate Croissant',
        calories: 420,
        time: '3:45 PM'
      }
    },
    evening: {
      name: 'Late Evening Overage',
      description: 'John logged ice cream at 9:30 PM (no meals remaining)',
      overage: 250,
      remainingMealsToday: 0,
      daysLeftInWeek: 5,
      user: {
        name: 'John',
        daily_calorie_target: 2200,
        weekly_calorie_target: 15400
      },
      unplannedItem: {
        name: 'Ice Cream',
        calories: 350,
        time: '9:30 PM'
      }
    },
    morning: {
      name: 'Early Morning Large Breakfast',
      description: 'Maria had a big breakfast at 8:00 AM',
      overage: 150,
      remainingMealsToday: 3,
      daysLeftInWeek: 4,
      user: {
        name: 'Maria',
        daily_calorie_target: 1600,
        weekly_calorie_target: 11200
      },
      unplannedItem: {
        name: 'Large Breakfast Burrito with Hash Browns',
        calories: 900,
        time: '8:00 AM'
      }
    },
    small: {
      name: 'Small Overage',
      description: 'Alex had a small snack that pushed them slightly over',
      overage: 50,
      remainingMealsToday: 2,
      daysLeftInWeek: 3,
      user: {
        name: 'Alex',
        daily_calorie_target: 2000,
        weekly_calorie_target: 14000
      },
      unplannedItem: {
        name: 'Protein Bar',
        calories: 200,
        time: '2:15 PM'
      }
    },
    large: {
      name: 'Large Overage',
      description: 'Emily had a celebratory dinner',
      overage: 800,
      remainingMealsToday: 1,
      daysLeftInWeek: 2,
      user: {
        name: 'Emily',
        daily_calorie_target: 1700,
        weekly_calorie_target: 11900
      },
      unplannedItem: {
        name: 'Restaurant Pasta Dinner with Dessert',
        calories: 1200,
        time: '7:30 PM'
      }
    }
  };

  const currentScenario = scenarios[scenario];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Demo Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            🧪 Rebalance Modal - Interactive Demo
          </h1>
          <p className="text-slate-600 mb-6">
            Test the daily calorie overage rebalance modal with different scenarios.
            Select a scenario below and click "Test Modal" to see it in action.
          </p>

          {/* Scenario Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Choose a Test Scenario:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(scenarios).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    scenario === key
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800">{s.name}</span>
                    {scenario === key && (
                      <span className="text-blue-500 text-xl">✓</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{s.description}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Overage:</span>
                      <span className="font-bold text-red-600">+{s.overage} cal</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Scenario Details */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-orange-800 mb-4 text-lg">
              📊 Selected Scenario: {currentScenario.name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <span className="text-slate-600 block mb-1">User:</span>
                <span className="font-bold text-slate-800">{currentScenario.user.name}</span>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-slate-600 block mb-1">Daily Target:</span>
                <span className="font-bold text-slate-800">{currentScenario.user.daily_calorie_target} cal</span>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-slate-600 block mb-1">Overage:</span>
                <span className="font-bold text-red-600">+{currentScenario.overage} cal</span>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-slate-600 block mb-1">Remaining Meals:</span>
                <span className="font-bold text-blue-600">{currentScenario.remainingMealsToday}</span>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-slate-600 block mb-1">Days Left in Week:</span>
                <span className="font-bold text-green-600">{currentScenario.daysLeftInWeek}</span>
              </div>
              <div className="bg-white rounded-lg p-3">
                <span className="text-slate-600 block mb-1">Item Logged:</span>
                <span className="font-bold text-orange-600">{currentScenario.unplannedItem.calories} cal</span>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg flex items-center justify-center gap-3 text-lg"
          >
            <span className="text-2xl">⚠️</span>
            Test Rebalance Modal
            <span className="text-2xl">⚠️</span>
          </button>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-blue-900 mb-2">Daily Rebalance</h3>
            <p className="text-sm text-slate-600">
              Adjusts remaining meals today to compensate for the overage.
            </p>
            <div className="mt-3 text-xs text-blue-700 font-medium">
              Best for: Quick fix when meals remain today
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-bold text-green-900 mb-2">Weekly Rebalance</h3>
            <p className="text-sm text-slate-600">
              Spreads the overage across remaining days in the week.
            </p>
            <div className="mt-3 text-xs text-green-700 font-medium">
              ⭐ RECOMMENDED - Barely noticeable changes
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="text-3xl mb-3">💜</div>
            <h3 className="font-bold text-purple-900 mb-2">Grace Day</h3>
            <p className="text-sm text-slate-600">
              Accept the overage without adjusting future meals.
            </p>
            <div className="mt-3 text-xs text-purple-700 font-medium">
              Best for: Special occasions, flexibility
            </div>
          </div>
        </div>

        {/* Testing Tips */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3">💡 Testing Tips</h3>
          <ul className="space-y-2 text-sm text-blue-50">
            <li>✓ Try the "Late Evening" scenario to see Daily Rebalance disabled</li>
            <li>✓ Compare "Small Overage" vs "Large Overage" to see calculation differences</li>
            <li>✓ Test each rebalancing strategy to see different results screens</li>
            <li>✓ Check the pros/cons for each option</li>
            <li>✓ Notice the "AI is Rebalancing" processing animation</li>
            <li>✓ See detailed breakdown in results screen</li>
          </ul>
        </div>
      </div>

      {/* The Modal */}
      <RebalanceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        overage={currentScenario.overage}
        user={currentScenario.user}
        remainingMealsToday={currentScenario.remainingMealsToday}
        daysLeftInWeek={currentScenario.daysLeftInWeek}
        unplannedItem={currentScenario.unplannedItem}
      />
    </div>
  );
};

export default RebalanceModalDemo;
