import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  BanknoteIcon,
  HammerIcon,
  ListOrderedIcon,
  PackageCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import {
  formatOrderDate,
  formatOrderNumber,
  orderStatusLabels,
} from "@/features/orders/lib/formatters";
import {
  formatPrice,
  formatProductCategory,
} from "@/features/products/lib/formatters";
import { plannerStatusLabels } from "@/features/planner/lib/formatters";
import { readDashboardOverviewAction } from "../actions/actions";
import type { DashboardOverviewData } from "../server/queries";
import { DashboardRefresh } from "./dashboard-refresh";
import { cn } from "@/lib/utils";

const number = (value: number) => value.toLocaleString("en-US");

export const DashboardOverview = async () => {
  const response = await readDashboardOverviewAction();
  if (response.error)
    return (
      <ErrorState
        title="Unable to load the dashboard"
        description={response.message}
      >
        <DashboardRefresh />
      </ErrorState>
    );
  const { name, stats, queue, recentOrders, products, plans } = response.data;
  const metrics = [
    {
      label: "Waiting orders",
      value: number(stats.orders.queued),
      note: "Ready for the workbench",
      icon: ListOrderedIcon,
      href: "/dashboard/orders?view=queue&status=queued",
    },
    {
      label: "Being crafted",
      value: number(stats.orders.inProgress),
      note: "Work currently in progress",
      icon: HammerIcon,
      href: "/dashboard/orders?view=queue&status=in_progress",
    },
    {
      label: "Ready for delivery",
      value: number(stats.orders.ready),
      note: "Crafted and ready to go",
      icon: PackageCheckIcon,
      href: "/dashboard/orders?status=ready",
    },
    {
      label: "Paid order value",
      value: formatPrice(stats.orders.paidValue),
      note: "Fully paid orders · all time",
      icon: BanknoteIcon,
      href: "/dashboard/orders",
    },
  ];
  return (
    <div className="min-w-0 space-y-6 pb-4 text-base">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome back, {name.trim().split(/\s+/)[0] || "Gunter"}.
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Here&apos;s what&apos;s happening at the forge.
          </p>
        </div>
        <DashboardRefresh />
      </div>
      <section
        className="flex flex-col justify-between gap-6 rounded-xl border bg-card p-6 sm:flex-row sm:items-center"
        aria-labelledby="forge-focus-title"
      >
        <div className="space-y-3">
          <h2 id="forge-focus-title" className="text-2xl font-semibold">
            A clear plan for the next piece.
          </h2>
          <p className="max-w-2xl text-xl text-muted-foreground">
            Review the queue, decide what comes first, and give each order the
            attention it deserves.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-lg">
            <span>{number(stats.orders.queued)} waiting to be crafted</span>
            <span>
              {number(stats.plans.awaitingReview)} plans awaiting review
            </span>
          </div>
        </div>
        <Button
          size="lg"
          className="self-start sm:self-center"
          render={<Link href="/dashboard/planning" />}
          nativeButton={false}
        >
          <SparklesIcon />
          Plan the work
        </Button>
      </section>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon, href }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-1"
          >
            <div className="flex flex-col gap-0.5">
              <dt>
                <Link
                  href={href}
                  className="flex items-center gap-2 hover:underline text-lg font-medium"
                >
                  <Icon
                    className="size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              </dt>
              <dd className="mt-3 wrap-break-word text-2xl font-semibold tabular-nums sm:text-3xl">
                {value}
              </dd>
            </div>

            <dd className="mt-1 text-muted-foreground text-lg font-medium">
              {note}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <OverviewSection
          title="At the workbench"
          description="The current work queue, in priority order."
          href="/dashboard/orders?view=queue"
          className="xl:col-span-2"
        >
          <OrderRows orders={queue} ranked />
        </OverviewSection>
        <OverviewSection
          title="Recent plans"
          description="Saved suggestions for the forge."
          href="/dashboard/planning"
        >
          {plans.length ? (
            <ul className="divide-y">
              {plans.map((plan) => (
                <li key={plan.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-lg">
                      {formatOrderDate(plan.generatedAt)}
                    </p>
                    <Badge
                      variant={
                        plan.status === "applied" ? "default" : "secondary"
                      }
                    >
                      {plannerStatusLabels[plan.status]}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 wrap-break-word text-muted-foreground text-lg">
                    {plan.summary}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              No plans yet. Head to Planning to organize the waiting queue.
            </Empty>
          )}
        </OverviewSection>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <OverviewSection
          title="Recent orders"
          description={`${number(stats.orders.total)} orders placed across the shop.`}
          href="/dashboard/orders"
        >
          <OrderRows orders={recentOrders} />
        </OverviewSection>
        <OverviewSection
          title="From the shop"
          description={`${number(stats.products.active)} active products · ${number(stats.products.total)} in the catalog`}
          href="/dashboard/products"
        >
          {products.length ? (
            <ul className="divide-y">
              {products.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/dashboard/products?search=${encodeURIComponent(product.name)}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <Image
                      src={product.imageUrl}
                      alt=""
                      width={50}
                      height={50}
                      className="size-12 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xl font-medium">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        {formatProductCategory(product.category).label}
                      </p>
                    </div>

                    <div className="shrink-0 space-y-1 text-right">
                      <p className="font-semibold tabular-nums text-xl">
                        {formatPrice(product.price)}
                      </p>
                      <Badge variant="outline">
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              The catalog is empty. Add a product to stock the shop.
            </Empty>
          )}
        </OverviewSection>
      </div>
    </div>
  );
};

const OverviewSection = ({
  title,
  description,
  href,
  className = "",
  children,
}: {
  title: string;
  description: string;
  href: string;
  className?: string;
  children: ReactNode;
}) => (
  <section
    className={cn(
      "min-w-0 overflow-hidden rounded-xl border h-full",
      className,
    )}
  >
    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-muted-foreground text-lg">{description}</p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-9 shrink-0 items-center gap-1 font-medium text-primary hover:underline"
      >
        View all
        <ArrowRightIcon className="size-4" />
      </Link>
    </div>
    {children}
  </section>
);

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="px-5 py-8 text-muted-foreground">{children}</p>
);

const OrderRows = ({
  orders,
  ranked = false,
}: {
  orders: DashboardOverviewData["queue"];
  ranked?: boolean;
}) =>
  orders.length ? (
    <ol className="divide-y">
      {orders.map((order, index) => (
        <li key={order.id}>
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
          >
            {ranked && (
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium tabular-nums"
                aria-label={`Queue position ${index + 1}`}
              >
                {index + 1}
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-semibold">
                  {formatOrderNumber(order.orderNumber)}
                </h3>
                <Badge variant="secondary">
                  {orderStatusLabels[order.status]}
                </Badge>
              </div>
              <p className="line-clamp-2 wrap-break-word text-muted-foreground text-lg">
                {order.items
                  .map((item) => `${item.quantity} × ${item.productName}`)
                  .join(", ") || "View order details"}
              </p>
              {!ranked && (
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-muted-foreground text-lg">
                    {formatOrderDate(order.createdAt)}
                  </span>
                  <span className="font-semibold tabular-nums text-xl">
                    {formatPrice(order.total)}
                  </span>
                </div>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ol>
  ) : (
    <Empty>
      {ranked
        ? "The workbench is clear. New queued orders will appear here."
        : "No orders yet. New purchases will appear here."}
    </Empty>
  );
