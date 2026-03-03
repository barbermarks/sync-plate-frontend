# Testing the Rebalance Feature

## Quick Test Steps

### Test 1: Basic Overage Detection

1. **Start the app**:
   ```bash
   cd sync-plate-app/sync-plate-frontend
   npm start
   ```

2. **Log meals until you exceed your daily target**:
   - Click on a partner (Partner A or B)
   - Note their daily calorie target (e.g., 1800 cal)
   - Log several meals using the AI Food Logger
   - Example sequence:
     - Breakfast: "2 eggs and toast" (~400 cal)
     - Lunch: "chicken salad" (~500 cal)
     - Snack: "handful of walnuts" (~200 cal)
     - Dinner: "grilled salmon with vegetables" (~600 cal)
   - Total: ~1700 cal (not over yet)
   - Log one more item: "chocolate bar" (~250 cal)
   - **Total: ~1950 cal (over 1800 target by 150 cal)**

3. **Rebalance modal should appear**:
   - Wait 3.5 seconds after success message
   - Modal should show with orange header
   - Should show your overage amount
   - Three options should be visible

### Test 2: Test Each Option

#### Daily Rebalance Option
1. Click the **Blue "Daily Rebalance"** card
2. Verify:
   - Shows how many remaining meals today
   - Shows calories to reduce per meal
   - Shows pros/cons
   - Selection indicator appears (blue circle with white dot)
3. Click "Confirm Daily Rebalance"
4. Wait for processing animation (2 seconds)
5. Results screen should show:
   - Meal adjustment breakdown
   - Smart reduction strategy tips
   - Example calculations

#### Weekly Rebalance Option
1. Click the **Green "Weekly Rebalance"** card
2. Verify:
   - Has "⭐ RECOMMENDED" badge
   - Shows calories per day for remaining days
   - Shows example adjustments
3. Click "Confirm Weekly Rebalance"
4. Results screen should show:
   - Weekly adjustment plan
   - Per-day examples
   - Total overage and daily reduction amount

#### Grace Day Option
1. Click the **Purple "Grace Day"** card
2. Verify:
   - Shows weekly impact percentage
   - Shows overage amount
   - Has heart icon
3. Click "Confirm Grace Day"
4. Results screen should show:
   - Today's total with overage
   - Weekly impact calculations
   - Percentage over weekly budget

### Test 3: Edge Cases

#### No Remaining Meals
1. Log meals throughout the day for all 4 meal types:
   - Breakfast
   - Lunch
   - Dinner
   - Snack
2. If you go over, the modal should appear
3. **Daily Rebalance should be disabled** with "⚠️ NOT AVAILABLE" badge
4. Can only select Weekly or Grace Day

#### Early Morning Overage
1. First thing in the morning, log a huge breakfast
2. Example: "large breakfast burrito with hash browns" (~1200 cal)
3. Should NOT trigger modal if under daily target
4. Log another meal that pushes you over
5. Modal should show 2-3 remaining meals

#### Different Days of Week
Test on different days to verify "days left in week" calculation:
- **Sunday**: Should show 6 days remaining
- **Monday**: Should show 6 days remaining
- **Wednesday**: Should show 4 days remaining
- **Saturday**: Should show 1 day remaining

### Test 4: Modal Interactions

#### Close Modal
- Click the **X button** in top-right
- Modal should close
- Can re-trigger by logging another overage item

#### Back Button
- After selecting an option and seeing results
- Click the back arrow in results screen
- Should return to option selection
- Previous selection should be cleared

#### Multiple Selections
- Click one option (e.g., Daily)
- Click another option (e.g., Weekly)
- Only the most recent should be selected
- Confirm button text should update

### Test 5: Visual & Responsive Testing

#### Desktop (1920x1080)
- Modal should be centered
- Max width: 3xl (~768px)
- Should not be too tall (90vh max)
- All content should be visible without scrolling

#### Tablet (768x1024)
- Modal should adapt with padding
- Cards should stack nicely
- Text should remain readable

#### Mobile (375x667)
- Modal should fill most of screen with padding
- Scrollable if content exceeds height
- Buttons should be thumb-friendly
- Pros/cons should remain in 2-column grid

### Test 6: Data Accuracy

#### Overage Calculation
1. Note starting daily total
2. Log a meal with known calories
3. Calculate expected new total
4. Verify modal shows correct overage amount
5. Formula: `new_total - daily_target = overage`

#### Remaining Meals
1. Check which meal types are already logged today
2. Count how many of [breakfast, lunch, dinner, snack] are NOT logged
3. Verify modal shows correct count

#### Days Left in Week
1. Check today's day of week
2. Calculate: if Sunday = 6, else = 7 - dayOfWeek
3. Verify modal shows correct days remaining

## Common Issues & Solutions

### Modal doesn't appear
- **Check**: Did meals actually exceed daily target?
- **Check**: Wait full 3.5 seconds after success message
- **Check**: Console for any errors

### Wrong overage amount
- **Check**: Are shared meals counting correctly?
- **Check**: Database has correct calorie values
- **Check**: No duplicate meals logged

### Daily rebalance always disabled
- **Check**: Are all 4 meal types already logged?
- **Check**: Time of day (late evening = likely no meals left)

### Processing animation doesn't stop
- **Check**: Browser console for errors
- **Clear**: Browser cache and reload

## Database Verification

Check that meals are saving correctly:

```javascript
// In browser console or Supabase dashboard
const { data } = await supabase
  .from('meals')
  .select('*')
  .eq('meal_date', '2024-02-16')  // today's date
  .eq('user_id', 'your-user-id');

console.log(data);
```

Verify:
- All logged meals are present
- Calorie values are correct
- meal_type is set
- is_unplanned is true for manually logged items

## Performance Testing

1. **Modal Open Speed**: Should appear immediately when triggered
2. **Option Selection**: Should respond instantly to clicks
3. **Processing Animation**: Should start and stop smoothly
4. **Results Render**: Should display < 100ms after processing

## Accessibility Testing

1. **Keyboard Navigation**:
   - Tab through options
   - Enter to select
   - Escape to close modal

2. **Screen Reader**:
   - Modal announces "Daily Budget Exceeded"
   - Options are readable
   - Results are clear

3. **Color Contrast**:
   - Text on colored backgrounds should be readable
   - Disabled state should be obvious

## Success Criteria

✅ Modal appears when daily target exceeded
✅ Correct overage amount displayed
✅ All three options selectable (unless daily disabled)
✅ Processing animation works smoothly
✅ Results screen shows strategy-specific content
✅ Modal closes properly
✅ No console errors
✅ Responsive on mobile/tablet/desktop
✅ Edge cases handled gracefully
✅ Calculations are accurate

## Next Steps After Testing

1. Implement database persistence for rebalance choices
2. Add actual meal adjustment logic
3. Integrate with Weekly View component
4. Add analytics tracking
5. Consider A/B testing different recommendations

## Questions to Consider

- Should the modal auto-dismiss after a certain time?
- Should there be a "Don't show this again today" option?
- Should the recommended option change based on user history?
- Should we show past rebalance events in a history view?
