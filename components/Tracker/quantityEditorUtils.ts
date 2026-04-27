// Shared quantity-editor rules used by both:
// 1. search result add flow
// 2. existing food entry edit flow

export const QUANTITY_STEP = 0.5;
export const MIN_QUANTITY = 0.1;

// Parses a quantity input string into a valid positive decimal.
// We return null for invalid values so the UI can disable save actions.
export function parseQuantityInput(value: string): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

// Keeps quantity strings tidy and avoids long floating point artifacts.
export function formatQuantityValue(value: number): string {
  return Number(value.toFixed(2)).toString();
}

// Computes the next quantity when the user taps a stepper button.
// This keeps the minimum quantity rule consistent across components.
export function getNextQuantityValue(
  currentInput: string,
  delta: number
): string {
  const currentQuantity = parseQuantityInput(currentInput) ?? 1;
  const nextQuantity = Math.max(MIN_QUANTITY, currentQuantity + delta);

  return formatQuantityValue(nextQuantity);
}
