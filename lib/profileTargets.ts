import { supabase } from './supabase';
import {
  deriveMacroTargetsFromCalories,
  type MacroRatioPercentagesInput,
} from './nutritionTargetUtils';

export type ProfileTargetSettings = {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  proteinRatioPct: number;
  carbRatioPct: number;
  fatRatioPct: number;
};

export type UpdateProfileTargetSettingsInput = {
  targetCalories: number;
} & MacroRatioPercentagesInput;

type ProfileTargetsRow = {
  default_target_calories: number | null;
  default_target_protein: number | null;
  default_target_carbs: number | null;
  default_target_fats: number | null;
  protein_ratio_pct: number | null;
  carb_ratio_pct: number | null;
  fat_ratio_pct: number | null;
};

function mapProfileTargetsRowToSettings(row: ProfileTargetsRow): ProfileTargetSettings {
  if (
    row.default_target_calories == null ||
    row.default_target_protein == null ||
    row.default_target_carbs == null ||
    row.default_target_fats == null ||
    row.protein_ratio_pct == null ||
    row.carb_ratio_pct == null ||
    row.fat_ratio_pct == null
  ) {
    throw new Error(
      'Profile target settings are incomplete. Please set calories and macro ratios.'
    );
  }

  return {
    targetCalories: row.default_target_calories,
    targetProtein: row.default_target_protein,
    targetCarbs: row.default_target_carbs,
    targetFats: row.default_target_fats,
    proteinRatioPct: row.protein_ratio_pct,
    carbRatioPct: row.carb_ratio_pct,
    fatRatioPct: row.fat_ratio_pct,
  };
}

// Reads the user's current profile default targets plus their stored ratio percentages.
export async function getProfileTargetSettings(
  userId: string
): Promise<ProfileTargetSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      default_target_calories,
      default_target_protein,
      default_target_carbs,
      default_target_fats,
      protein_ratio_pct,
      carb_ratio_pct,
      fat_ratio_pct
    `
    )
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile target settings: ${error.message}`);
  }

  return mapProfileTargetsRowToSettings(data);
}

// Updates the user's profile defaults.
// Ratios are treated as the source of truth, and macro gram targets are derived before save.
export async function updateProfileTargetSettings(
  userId: string,
  input: UpdateProfileTargetSettingsInput
): Promise<ProfileTargetSettings> {
  const derivedTargets = deriveMacroTargetsFromCalories(input.targetCalories, {
    proteinRatioPct: input.proteinRatioPct,
    carbRatioPct: input.carbRatioPct,
    fatRatioPct: input.fatRatioPct,
  });

  const { data, error } = await supabase
    .from('profiles')
    .update({
      default_target_calories: input.targetCalories,
      default_target_protein: derivedTargets.targetProtein,
      default_target_carbs: derivedTargets.targetCarbs,
      default_target_fats: derivedTargets.targetFats,
      protein_ratio_pct: input.proteinRatioPct,
      carb_ratio_pct: input.carbRatioPct,
      fat_ratio_pct: input.fatRatioPct,
    })
    .eq('id', userId)
    .select(
      `
      default_target_calories,
      default_target_protein,
      default_target_carbs,
      default_target_fats,
      protein_ratio_pct,
      carb_ratio_pct,
      fat_ratio_pct
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to update profile target settings: ${error.message}`);
  }

  return mapProfileTargetsRowToSettings(data);
}
