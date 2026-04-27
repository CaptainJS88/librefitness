// Calories per gram for each macro.
// These constants are the backbone for converting calorie ratios into gram targets.
const PROTEIN_CALORIES_PER_GRAM = 4;
const CARB_CALORIES_PER_GRAM = 4;
const FAT_CALORIES_PER_GRAM = 9;

export type MacroRatioPercentagesInput = {
  proteinRatioPct: number;
  carbRatioPct: number;
  fatRatioPct: number;
};

export type DerivedMacroTargets = {
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
};

// Small shared rounding helper so profile defaults and daily-log snapshots
// use the same decimal precision across the app.
export function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

// Ratios are valid only when they are non-negative whole percentages
// and sum cleanly to 100.
export function areMacroRatiosValid(ratios: MacroRatioPercentagesInput) {
  const { proteinRatioPct, carbRatioPct, fatRatioPct } = ratios;

  if (
    proteinRatioPct < 0 ||
    carbRatioPct < 0 ||
    fatRatioPct < 0
  ) {
    return false;
  }

  return proteinRatioPct + carbRatioPct + fatRatioPct === 100;
}

// Converts one calorie target plus ratio percentages into gram targets.
// Example: 1500 calories with 30/40/30 becomes derived macro grams.
export function deriveMacroTargetsFromCalories(
  targetCalories: number,
  ratios: MacroRatioPercentagesInput
): DerivedMacroTargets {
  if (targetCalories <= 0) {
    throw new Error('Target calories must be greater than 0.');
  }

  if (!areMacroRatiosValid(ratios)) {
    throw new Error('Macro ratios must add up to exactly 100.');
  }

  return {
    targetProtein: roundToOneDecimal(
      (targetCalories * (ratios.proteinRatioPct / 100)) /
        PROTEIN_CALORIES_PER_GRAM
    ),
    targetCarbs: roundToOneDecimal(
      (targetCalories * (ratios.carbRatioPct / 100)) /
        CARB_CALORIES_PER_GRAM
    ),
    targetFats: roundToOneDecimal(
      (targetCalories * (ratios.fatRatioPct / 100)) / FAT_CALORIES_PER_GRAM
    ),
  };
}
