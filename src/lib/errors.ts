/**
 * Maps internal failures to something a student can act on. Raw backend text
 * never reaches the UI.
 */
const FRIENDLY: [RegExp, string][] = [
  [/out of stock/i, "One of your items just went out of stock. Please review your cart."],
  [/no longer on the menu/i, "An item in your cart is no longer on the menu."],
  [/cart is empty/i, "Your cart is empty."],
  [/not paid/i, "This order has not been paid for yet."],
  [/invalid status transition/i, "That status change isn't allowed."],
  [/insufficient_privilege|permission|policy/i, "You don't have access to do that."],
  [/duplicate key|already exists/i, "That has already been recorded."],
  [/signature|verification/i, "We couldn't confirm your payment. If money was deducted, show this screen to the canteen staff."],
  [/fetch failed|network|offline/i, "You appear to be offline. Check your connection and try again."],
];

export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "";

  for (const [pattern, message] of FRIENDLY) {
    if (pattern.test(raw)) return message;
  }
  return fallback;
}
