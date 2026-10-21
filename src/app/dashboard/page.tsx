import { Suspense } from "react";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardOverview />
    </Suspense>
  );
}
