import { getProfile } from "@/lib/auth";
import { CartView } from "@/components/student/cart-view";

export const metadata = { title: "Cart · Campus Canteen" };

export default async function CartPage() {
  const profile = await getProfile();

  return (
    <main className="px-5 pt-6 pb-20">
      <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">Your cart</h1>
      <CartView student={{ name: profile?.full_name ?? "", email: profile?.email ?? null }} />
    </main>
  );
}
