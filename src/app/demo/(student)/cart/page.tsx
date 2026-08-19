import { CartView } from "@/components/student/cart-view";
import { demoProfile } from "@/lib/demo/fixtures";

export default function DemoCartPage() {
  return (
    <main className="px-5 pt-6 pb-20">
      <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">Your cart</h1>
      <CartView
        student={{ name: demoProfile.full_name, email: demoProfile.email }}
        basePath="/demo"
        demo
      />
    </main>
  );
}
