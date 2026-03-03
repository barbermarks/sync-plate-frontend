import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Home, Users, Plus, LogIn, Copy, Check } from 'lucide-react';

const HouseholdSetup = ({ userId, onComplete }) => {
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [householdCode, setHouseholdCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied] = useState(false);

  function generateHouseholdCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function handleCreateHousehold() {
    setLoading(true);
    setError('');

    try {
      const code = generateHouseholdCode();

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert([{ invite_code: code }])
        .select()
        .single();

      if (householdError) throw householdError;

      // Update user with household_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ household_id: household.id })
        .eq('id', userId);

      if (updateError) throw updateError;

      setCreatedCode(code);

      // Wait for partner to join
      // For now, we'll let them continue and their partner can join later
      // In production, you might want to poll for the second user
    } catch (error) {
      console.error('Error creating household:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinHousehold(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Find household by invite code
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', householdCode.toUpperCase())
        .single();

      if (householdError || !household) {
        throw new Error('Invalid household code');
      }

      // Check if household already has 2 users
      const { data: existingUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('household_id', household.id);

      if (usersError) throw usersError;

      if (existingUsers.length >= 2) {
        throw new Error('This household already has 2 members');
      }

      // Update user with household_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ household_id: household.id })
        .eq('id', userId);

      if (updateError) throw updateError;

      onComplete();
    } catch (error) {
      console.error('Error joining household:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (createdCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Household Created!</h1>
            <p className="text-slate-600">Share this code with your partner</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <p className="text-sm text-slate-600 mb-3">Your household invite code:</p>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 mb-4">
                <div className="text-5xl font-bold text-purple-600 tracking-wider font-mono">
                  {createdCode}
                </div>
              </div>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Note:</strong> Your partner needs to create an account and enter this code to join your household.
              </p>
            </div>

            <button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Continue to Dashboard
            </button>

            <p className="text-xs text-center text-slate-500 mt-4">
              You can add your partner later from the settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl mb-4">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Set Up Your Household</h1>
            <p className="text-slate-600">Sync-Plate works best with a partner</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Household */}
            <button
              onClick={() => setMode('create')}
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Create Household</h3>
              <p className="text-slate-600 mb-4">
                Start fresh and invite your partner to join you
              </p>
              <div className="text-purple-600 font-medium group-hover:gap-2 flex items-center transition-all">
                Get started
                <span className="ml-1 group-hover:ml-2 transition-all">→</span>
              </div>
            </button>

            {/* Join Household */}
            <button
              onClick={() => setMode('join')}
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Join Household</h3>
              <p className="text-slate-600 mb-4">
                Your partner already created a household? Join them!
              </p>
              <div className="text-blue-600 font-medium group-hover:gap-2 flex items-center transition-all">
                Enter code
                <span className="ml-1 group-hover:ml-2 transition-all">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl mb-4">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Create Household</h1>
            <p className="text-slate-600">You'll get a code to share with your partner</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-800">What happens next:</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>We'll generate a unique household code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>Share the code with your partner</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>They'll use it to join your household</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Start tracking meals together!</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleCreateHousehold}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? 'Creating...' : 'Create Household'}
            </button>

            <button
              onClick={() => setMode(null)}
              className="w-full text-slate-600 hover:text-slate-800 py-2"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Join Household</h1>
            <p className="text-slate-600">Enter the code your partner shared with you</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleJoinHousehold}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Household Code
                </label>
                <input
                  type="text"
                  value={householdCode}
                  onChange={(e) => setHouseholdCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-4 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-2xl font-mono tracking-wider text-center"
                  placeholder="ABC123"
                  required
                  maxLength={6}
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Enter the 6-character code
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || householdCode.length !== 6}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {loading ? 'Joining...' : 'Join Household'}
              </button>

              <button
                type="button"
                onClick={() => setMode(null)}
                className="w-full text-slate-600 hover:text-slate-800 py-2"
              >
                ← Back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
};

export default HouseholdSetup;
