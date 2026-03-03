# Daily Calorie Overage Feature - Implementation Summary

## Overview
The daily calorie overage feature provides users with intelligent options when they exceed their daily calorie target. It offers three rebalancing strategies: Daily Rebalance, Weekly Rebalance, and Grace Day.

## Features Implemented

### 1. **Automatic Overage Detection**
- Monitors total daily calorie intake after each meal is logged
- Compares against the user's `daily_calorie_target`
- Triggers rebalance modal when overage is detected

### 2. **Smart Rebalancing Options**

#### Daily Rebalance (Blue)
- **Description**: Adjusts remaining meals today to compensate for overage
- **Calculation**: `overage ÷ remaining_meals_today`
- **Safety Check**: Disabled if no remaining meals today
- **Example**: If 270 cal over with 2 meals left, reduce each by ~135 cal
- **Pros**: Hit today's target, quick fix, clear immediate action
- **Cons**: Smaller portions, may feel less satisfied

#### Weekly Rebalance (Green) - RECOMMENDED
- **Description**: Spreads overage across remaining days in the week
- **Calculation**: `overage ÷ days_left_in_week`
- **Example**: If 270 cal over with 6 days left, reduce ~45 cal/day
- **Smart Suggestions**:
  - Reduce cooking oil (1 tsp = ~40 cal)
  - Smaller carb portions
  - Minimal noticeable changes
- **Pros**: Barely noticeable, stay on weekly budget, no immediate changes
- **Cons**: Requires planning, needs consistency

#### Grace Day (Purple)
- **Description**: Accept the overage without future adjustments
- **Impact Tracking**:
  - Shows overage amount
  - Calculates weekly budget impact (%)
  - Logs as "accepted deviation"
- **Pros**: Enjoy the moment, no meal changes, mental flexibility
- **Cons**: Weekly goal impacted, progress may slow

### 3. **Interactive UI Components**

#### Option Cards
- Color-coded by strategy type (Blue/Green/Purple)
- Visual pros/cons comparison
- Impact preview before confirming
- Disabled state for unavailable options
- Recommended badge for optimal choice

#### Processing State
- AI processing animation with "Sparkles" icon
- 2-second simulated processing time
- Prevents duplicate submissions

#### Results Screen
- Strategy-specific result details
- Daily: Shows meal adjustment breakdown with smart reduction strategy
- Weekly: Shows per-day adjustments with examples
- Grace: Shows weekly impact percentage

### 4. **Safety Checks & Calculations**

#### Safety Defaults
```javascript
safeOverage = overage || 0
safeRemainingMeals = remainingMealsToday || 0
safeDaysLeft = daysLeftInWeek || 6
dailyTarget = user?.daily_calorie_target || 2000
weeklyTarget = user?.weekly_calorie_target || dailyTarget * 7
```

#### Smart Calculations
- **Remaining Meals**: Counts unlogged meal types (breakfast, lunch, dinner, snack)
- **Days Left in Week**: Calculates from current day (0=Sunday to 6=Saturday)
- **Weekly Impact**: Shows percentage over weekly budget
- **Redistribution**: Evenly distributes overage across available meals/days

### 5. **Integration Points**

#### FoodInput Component
```javascript
// After saving meal, check for overage
await checkForOverageAndTriggerModal(parsedData, mealData.custom_name);
```

#### Overage Check Function
1. Fetches all meals for today from Supabase
2. Calculates total daily calories
3. Compares to user's daily target
4. Calculates remaining meals and days in week
5. Triggers modal with complete data

## Component Structure

### Main Components
- **RebalanceModal**: Main modal container with option selection and results
- **OptionCard**: Reusable card for each rebalancing option
- **ResultsScreen**: Shows detailed results after confirming a choice

### Props Interface
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  overage: number,
  user: {
    daily_calorie_target: number,
    weekly_calorie_target: number,
    // ... other user fields
  },
  remainingMealsToday: number,
  daysLeftInWeek: number,
  unplannedItem: {
    name: string,
    calories: number,
    time: string
  }
}
```

## User Experience Flow

1. **User logs meal** → FoodInput component processes
2. **Total exceeds target** → System calculates overage
3. **Success message shows** → User sees meal logged (3s delay)
4. **Modal appears** → User presented with 3 options
5. **User selects option** → Sees pros/cons and impact
6. **User confirms** → AI processes (2s animation)
7. **Results displayed** → Detailed breakdown shown
8. **User closes modal** → Returns to dashboard

## Smart Reduction Strategy

The feature includes nutritional guidance for reducing calories:

### Priority Order
1. **Reduce fats/oils first** (1 tsp = ~40 cal)
2. **Then reduce refined carbs** (rice, pasta, bread)
3. **Keep protein unchanged** (essential for satiety)
4. **Keep vegetables unchanged** (high volume, low calorie)
5. **Maintain nutritional balance**

## Future Enhancements (TODO)

### Database Integration
Currently marked with `// TODO: Save the choice to database`

Suggested schema additions:
```sql
-- Rebalance events table
CREATE TABLE rebalance_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_date DATE,
  overage_amount INT,
  strategy_chosen VARCHAR(20), -- 'daily', 'weekly', 'grace'
  adjustment_per_meal INT,
  days_to_apply INT,
  created_at TIMESTAMP
);

-- Future meal adjustments table
CREATE TABLE meal_adjustments (
  id UUID PRIMARY KEY,
  rebalance_event_id UUID REFERENCES rebalance_events(id),
  meal_date DATE,
  adjustment_calories INT,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

### AI-Powered Meal Adjustments
- Integration with OpenAI to suggest specific ingredient reductions
- Analyze current meal plan and suggest swaps
- Generate shopping list adjustments

### Weekly View Integration
- Color-code grace days with heart icon
- Show adjustment indicators on future days
- Track rebalance compliance

### Analytics
- Track which strategies users prefer
- Success rate of staying within adjusted targets
- A/B test recommendation algorithm

## Technical Notes

### Dependencies
- React hooks: `useState`
- Lucide React icons: `AlertTriangle`, `Calendar`, `TrendingDown`, `Heart`, `ChevronRight`, `X`, `Sparkles`
- Supabase for database queries
- Tailwind CSS for styling

### Performance Considerations
- Modal only renders when `isOpen={true}`
- Calculations performed client-side (lightweight)
- Database queries only on meal logging
- 3.5s delay before modal prevents jarring UX

### Accessibility
- Keyboard navigation support
- Clear visual feedback for selections
- Disabled states properly indicated
- Color-coded but also icon-differentiated

## Testing Checklist

- [ ] Overage detection works correctly
- [ ] Remaining meals calculated accurately
- [ ] Days left in week calculated correctly
- [ ] Daily rebalance disabled when no meals remaining
- [ ] Weekly calculations correct for all days of week
- [ ] Grace day shows correct percentage
- [ ] Modal closes properly
- [ ] Success messages display
- [ ] Processing animation works
- [ ] Results screen shows for each option type
- [ ] Responsive on mobile devices
- [ ] Works for both partners in household

## Example Scenarios

### Scenario 1: Afternoon Snack Overage
- User: Sarah, 1800 cal target
- Time: 3:45 PM
- Logged: Chocolate Croissant (420 cal)
- Previous: 1650 cal
- New Total: 2070 cal
- **Overage**: 270 cal
- **Remaining Meals**: 1 (dinner)
- **Suggested**: Weekly rebalance (45 cal/day × 6 days)

### Scenario 2: Late Evening Overage
- User: John, 2200 cal target
- Time: 9:30 PM
- Logged: Ice cream (350 cal)
- Previous: 2100 cal
- New Total: 2450 cal
- **Overage**: 250 cal
- **Remaining Meals**: 0
- **Suggested**: Weekly rebalance or grace day (daily disabled)

### Scenario 3: Early Morning Overage
- User: Maria, 1600 cal target
- Time: 8:00 AM
- Logged: Large breakfast (900 cal)
- Previous: 0 cal
- New Total: 900 cal (not over yet, no modal)
- **Later at lunch**: Eats 850 cal
- New Total: 1750 cal
- **Overage**: 150 cal
- **Remaining Meals**: 2 (dinner, snack)
- **Suggested**: Daily rebalance (75 cal per meal)

## Conclusion

This feature provides users with flexible, intelligent options for managing calorie overages while maintaining a positive, non-restrictive relationship with food. The weekly rebalance option is recommended as it promotes sustainable habits with minimal disruption.
