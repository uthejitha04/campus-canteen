# Manual test checklist

Run this once against a real Supabase project. Two browsers (or one normal +
one private window) make the realtime steps easy to see side by side.

## The main flow

1. Sign in as a student. Home shows the greeting and today's menu.
2. Add two items, change a quantity in the cart, check the total.
3. Tap **Pay … with UPI**. With `PAYMENT_PROVIDER=mock` this completes
   immediately; with Razorpay test keys, use a test VPA.
4. You land on the tracking screen with a large order number and `Received`.
5. In the staff window, the order appears in **NEW** without a refresh.
6. Staff taps **START PREPARING** → the student's screen moves to `Preparing`
   with no refresh.
7. Staff taps **MARK READY** → the student sees `Ready` and gets the
   "Order #… is ready" notification banner.
8. Staff taps **MARK PICKED UP** → the order leaves the queue.
9. Admin dashboard reflects the order and its revenue in today's numbers.

## Safety checks

| Check | Expected |
| --- | --- |
| Double-tap "Pay" | One order, not two |
| Refresh mid-payment then confirm again | Reports the existing order, no second charge |
| Two staff tap the same button at once | One advances, the other sees "already updated" |
| Student opens `/staff` or `/admin` | Redirected to the student home |
| Staff opens `/admin` | Redirected to `/staff` |
| Staff edits a price via the API | Rejected — staff may only change availability |
| Admin changes an item's price | Old receipts still show the old price |
| Order an item that just went out of stock | Friendly "out of stock" error, no order created |
| Tamper with the total in the checkout request | Ignored — the server prices the cart |
| Disable a staff account | That account is signed out of staff screens |

## Responsiveness

Check 360, 390, 430, 768, 1024, 1280 and 1440 px. No horizontal scrolling at
any width; the staff action buttons stay comfortably tappable on a phone.

## Failure states

- Stop the network mid-checkout → friendly offline message, no partial order.
- Kill the realtime connection → staff header shows "Reconnecting…", the
  student's tracking screen shows the paused-updates note and reconciles on
  focus.
