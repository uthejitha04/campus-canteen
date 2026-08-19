import type {
  Category,
  Counter,
  MenuItem,
  OrderWithItems,
  Profile,
} from "@/lib/types/database";
import type { MenuSection } from "@/lib/queries/menu";
import type { DashboardData } from "@/lib/queries/analytics";

/**
 * Fixture data for /demo — the signed-out walkthrough of the app.
 * Shapes match the database exactly, so the demo renders the same components
 * the live app does and can't drift away from it.
 */

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const demoCounters: Counter[] = [
  { id: id(1), name: "North Indian", description: "North Indian meals and breads", is_active: true, sort_order: 1 },
  { id: id(2), name: "South Indian", description: "South Indian meals and tiffin", is_active: true, sort_order: 2 },
  { id: id(3), name: "Coffee & Juices", description: "Hot drinks, cold drinks, juices", is_active: true, sort_order: 3 },
];

export const demoCategories: Category[] = [
  { id: id(11), counter_id: id(1), name: "North Indian", sort_order: 1, is_active: true },
  { id: id(12), counter_id: id(2), name: "South Indian", sort_order: 2, is_active: true },
  { id: id(13), counter_id: id(1), name: "Snacks", sort_order: 3, is_active: true },
  { id: id(14), counter_id: id(2), name: "Tiffin", sort_order: 4, is_active: true },
  { id: id(15), counter_id: id(3), name: "Beverages", sort_order: 5, is_active: true },
];

function item(
  n: number,
  categoryId: string,
  counterId: string,
  name: string,
  description: string,
  price: number,
  available = true,
): MenuItem {
  return {
    id: id(n),
    category_id: categoryId,
    counter_id: counterId,
    name,
    description,
    price,
    image_url: null,
    is_available: available,
    stock_qty: null,
    sort_order: n,
    is_archived: false,
  };
}

export const demoMenuItems: MenuItem[] = [
  item(21, id(11), id(1), "Chicken Rice", "Steamed rice with spiced chicken curry", 120),
  item(22, id(11), id(1), "Veg Thali", "Rice, dal, two vegetables, curd, papad", 90),
  item(23, id(11), id(1), "Paneer Butter Masala", "With two butter rotis", 110, false),
  item(24, id(12), id(2), "Masala Dosa", "Crisp dosa with potato masala and chutney", 50),
  item(25, id(12), id(2), "Idli Vada (2+1)", "Served with sambar and coconut chutney", 40),
  item(26, id(13), id(1), "Veg Puff", "Flaky pastry with spiced vegetable filling", 25),
  item(27, id(13), id(1), "Samosa (2 pcs)", "Served hot with mint chutney", 30),
  item(28, id(13), id(1), "French Fries", "Salted, served with ketchup", 60, false),
  item(29, id(14), id(2), "Chicken Biryani", "Available Fridays only", 150),
  item(30, id(15), id(3), "Coke (300ml)", "Chilled", 40),
  item(31, id(15), id(3), "Masala Chai", "Freshly brewed", 15),
  item(32, id(15), id(3), "Cold Coffee", "Blended with ice cream", 60),
];

export const demoSections: MenuSection[] = demoCategories.map((category) => ({
  category,
  items: demoMenuItems.filter((i) => i.category_id === category.id),
}));

export const demoProfile: Profile = {
  id: id(99),
  role: "student",
  full_name: "Naveen Kumar",
  email: "naveen@college.edu",
  phone: "+91 98765 43210",
  student_id: "21CS1042",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const minutesBefore = (mins: number) =>
  new Date(Date.now() - mins * 60_000).toISOString();

function order(
  n: number,
  orderNumber: number,
  status: OrderWithItems["status"],
  minsAgo: number,
  lines: [MenuItem, number][],
): OrderWithItems {
  const items = lines.map(([menuItem, quantity], index) => ({
    id: id(500 + n * 10 + index),
    order_id: id(n),
    menu_item_id: menuItem.id,
    counter_id: menuItem.counter_id,
    item_name: menuItem.name,
    unit_price: menuItem.price,
    quantity,
    line_total: menuItem.price * quantity,
  }));

  const total = items.reduce((sum, i) => sum + i.line_total, 0);
  const created = minutesBefore(minsAgo);

  return {
    id: id(n),
    order_number: orderNumber,
    student_id: demoProfile.id,
    status,
    payment_status: "paid",
    total_amount: total,
    note: null,
    placed_at: created,
    ready_at: status === "ready" || status === "picked_up" ? minutesBefore(minsAgo - 6) : null,
    completed_at: status === "picked_up" ? minutesBefore(minsAgo - 9) : null,
    created_at: created,
    updated_at: created,
    order_items: items,
  };
}

const byId = (name: string) => demoMenuItems.find((i) => i.name === name)!;

/** The order the walkthrough follows: #1042, ready for pickup. */
export const demoActiveOrder = order(101, 1042, "ready", 14, [
  [byId("Chicken Rice"), 2],
  [byId("Coke (300ml)"), 1],
]);

export const demoStudentOrders: OrderWithItems[] = [
  demoActiveOrder,
  order(102, 1039, "picked_up", 190, [[byId("Masala Dosa"), 1], [byId("Masala Chai"), 1]]),
  order(103, 1027, "picked_up", 1500, [[byId("Veg Thali"), 1]]),
];

/** The kitchen queue: one order in each live column. */
export const demoQueue: OrderWithItems[] = [
  order(201, 1045, "received", 2, [[byId("Veg Thali"), 1], [byId("Masala Chai"), 2]]),
  order(202, 1044, "received", 5, [[byId("Samosa (2 pcs)"), 3]]),
  order(203, 1043, "preparing", 9, [[byId("Chicken Biryani"), 1], [byId("Cold Coffee"), 1]]),
  demoActiveOrder,
];

export const demoCompletedToday: OrderWithItems[] = [
  order(301, 1041, "picked_up", 40, [[byId("Masala Dosa"), 2]]),
  order(302, 1040, "picked_up", 55, [[byId("Veg Puff"), 2], [byId("Masala Chai"), 2]]),
];

function lastDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    // A believable weekly rhythm: quieter at the weekend, busiest midweek.
    const weekday = date.getDay();
    const base = weekday === 0 || weekday === 6 ? 1600 : 4200;
    const revenue = Math.round(base + Math.sin(index * 1.7) * 700 + index * 40);
    return {
      day: date.toISOString().slice(0, 10),
      revenue,
      orders: Math.round(revenue / 78),
    };
  });
}

export const demoDashboard: DashboardData = {
  todayOrders: 63,
  todayRevenue: 4820,
  pending: 4,
  completed: 59,
  popular: [
    { item_name: "Chicken Rice", qty_sold: 148, revenue: 17760 },
    { item_name: "Masala Dosa", qty_sold: 121, revenue: 6050 },
    { item_name: "Masala Chai", qty_sold: 96, revenue: 1440 },
    { item_name: "Samosa (2 pcs)", qty_sold: 74, revenue: 2220 },
    { item_name: "Veg Thali", qty_sold: 61, revenue: 5490 },
    { item_name: "Cold Coffee", qty_sold: 43, revenue: 2580 },
  ],
  recent: [...demoQueue.slice(0, 3), ...demoCompletedToday],
  daily: lastDays(14),
  monthly: [
    { month: new Date().toISOString().slice(0, 8) + "01", orders: 1180, revenue: 92400 },
    { month: "2026-07-01", orders: 1342, revenue: 104900 },
    { month: "2026-06-01", orders: 1105, revenue: 86300 },
  ],
  trends: [
    { hour_of_day: 8, orders: 24 },
    { hour_of_day: 9, orders: 41 },
    { hour_of_day: 10, orders: 33 },
    { hour_of_day: 11, orders: 58 },
    { hour_of_day: 12, orders: 142 },
    { hour_of_day: 13, orders: 168 },
    { hour_of_day: 14, orders: 76 },
    { hour_of_day: 15, orders: 38 },
    { hour_of_day: 16, orders: 52 },
    { hour_of_day: 17, orders: 61 },
  ],
};

export const demoStaff: Profile[] = [
  { ...demoProfile, id: id(91), role: "staff", full_name: "Lakshmi R", email: "lakshmi@college.edu", student_id: null },
  { ...demoProfile, id: id(92), role: "staff", full_name: "Suresh M", email: "suresh@college.edu", student_id: null },
  { ...demoProfile, id: id(93), role: "staff", full_name: "Anita P", email: "anita@college.edu", student_id: null, is_active: false },
];

export const demoAssignments = [
  { staff_id: id(91), counter_id: id(1) },
  { staff_id: id(92), counter_id: id(2) },
  { staff_id: id(92), counter_id: id(3) },
  { staff_id: id(93), counter_id: id(3) },
];
