/**
 * Calculate the target date to select
 * - Test mode: Same day next week (7 days from now)
 * - Production: Next Monday or Wednesday
 */
export function getTargetDate(testMode: boolean): Date {
  const today = new Date();
  const targetDate = new Date(today);

  if (testMode) {
    // Test mode: Select same day next week
    targetDate.setDate(today.getDate() + 7);
    console.log(`📅 Test mode: Selecting ${targetDate.toDateString()}`);
  } else {
    // Production: Select next Monday (1) or Wednesday (3)
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    let daysToAdd = 0;

    if (todayDayOfWeek === 0) {
      // Sunday -> next Monday
      daysToAdd = 1;
    } else if (todayDayOfWeek === 1) {
      // Monday -> next Wednesday
      daysToAdd = 2;
    } else if (todayDayOfWeek === 2) {
      // Tuesday -> next Wednesday
      daysToAdd = 1;
    } else if (todayDayOfWeek === 3) {
      // Wednesday -> next Monday
      daysToAdd = 5;
    } else if (todayDayOfWeek === 4) {
      // Thursday -> next Monday
      daysToAdd = 4;
    } else if (todayDayOfWeek === 5) {
      // Friday -> next Monday
      daysToAdd = 3;
    } else {
      // Saturday -> next Monday
      daysToAdd = 2;
    }

    targetDate.setDate(today.getDate() + daysToAdd);
    console.log(`📅 Production mode: Selecting ${targetDate.toDateString()}`);
  }

  return targetDate;
}

/**
 * Get short day name (e.g., "Mon", "Wed") from date
 */
export function getDayName(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

