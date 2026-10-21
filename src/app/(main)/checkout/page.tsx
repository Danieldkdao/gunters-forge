import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/helpers";
import { serverEnv } from "@/data/env/server";
import { CheckoutForm } from "@/features/cart/components/checkout-form";
import {
  OrderLoadError,
  OrderSkeleton,
} from "@/features/orders/components/order-states";

export default function CheckoutPage() {
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="text-lg text-muted-foreground">
          A few final details before Gunter gets to work.
        </p>
      </div>
      <Suspense fallback={<OrderSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

const CheckoutContent = async () => {
  const { user } = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/checkout");
  if (user.banned || !user.emailVerified)
    return (
      <OrderLoadError description="A verified, active account is required to place an order." />
    );
  return (
    <CheckoutForm
      customerName={user.name}
      customerEmail={user.email}
      stripeTestMode={serverEnv.STRIPE_SECRET_KEY.includes("_test_")}
    />
  );
};
