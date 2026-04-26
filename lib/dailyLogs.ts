import { supabase } from './supabase';

// DB row types mirror your actual table column names.
// That is why these use snake_case.
export type DailyLogRow = {
  id: string;
  user_id: string;
  date: string;
  target_calories: number;
  target_protein: number;
  target_fats: number;
  target_carbs: number;
};

export type ProfileDefaultTargetsRow = {
  id: string;
  default_target_calories: number | null;
  default_target_protein: number | null;
  default_target_carbs: number | null;
  default_target_fats: number | null;
};

// App-facing input types use camelCase.
// This keeps calling code more natural on the frontend.
export type DailyLogTargetsInput = {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
};

export type CreateDailyLogInput = {
  userId: string;
  date: string;
  targets: DailyLogTargetsInput;
};

// Fetches one daily log for one user on one specific date.
// If that day has never been created, this returns null.
export async function getDailyLogByDate(
  userId: string,
  date: string
): Promise<DailyLogRow | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch daily log: ${error.message}`);
  }

  return data;
}

// Fetches the user's current default targets from profiles.
// These defaults are what we copy into a new daily_log when a date
// is first created in the future.
export async function getProfileDefaultTargets(
  userId: string
): Promise<DailyLogTargetsInput> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'default_target_calories, default_target_protein, default_target_carbs, default_target_fats'
    )
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile default targets: ${error.message}`);
  }

  // We fail early here if defaults are missing.
  // That keeps the app from silently creating broken daily logs.
  if (
    data.default_target_calories == null ||
    data.default_target_protein == null ||
    data.default_target_carbs == null ||
    data.default_target_fats == null
  ) {
    throw new Error(
      'Profile default targets are incomplete. Please set default calories and macros first.'
    );
  }

  return {
    targetCalories: data.default_target_calories,
    targetProtein: data.default_target_protein,
    targetCarbs: data.default_target_carbs,
    targetFats: data.default_target_fats,
  };
}

// Creates a daily log for a specific user/date using the given targets.
// This stores a snapshot of that day's targets, which protects historical data.
export async function createDailyLog(
  input: CreateDailyLogInput
): Promise<DailyLogRow> {
  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      user_id: input.userId,
      date: input.date,
      target_calories: input.targets.targetCalories,
      target_protein: input.targets.targetProtein,
      target_carbs: input.targets.targetCarbs,
      target_fats: input.targets.targetFats,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create daily log: ${error.message}`);
  }

  return data;
}

// Returns the daily log for a date if it already exists.
// Otherwise, it creates one using the user's current profile defaults.
//
// Important idea:
// old daily_logs keep their original targets,
// while new future days use whatever the user's defaults are at creation time.
export async function getOrCreateDailyLog(
  userId: string,
  date: string
): Promise<DailyLogRow> {
  const existingLog = await getDailyLogByDate(userId, date);

  if (existingLog) {
    return existingLog;
  }

  const defaultTargets = await getProfileDefaultTargets(userId);

  return createDailyLog({
    userId,
    date,
    targets: defaultTargets,
  });
}

// Updates the targets for one specific daily log.
// This is for editing a day's targets directly without changing profile defaults.
export async function updateDailyLogTargets(
  dailyLogId: string,
  input: DailyLogTargetsInput
): Promise<DailyLogRow> {
  const { data, error } = await supabase
    .from('daily_logs')
    .update({
      target_calories: input.targetCalories,
      target_protein: input.targetProtein,
      target_carbs: input.targetCarbs,
      target_fats: input.targetFats,
    })
    .eq('id', dailyLogId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update daily log targets: ${error.message}`);
  }

  return data;
}
