"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSwap } from "@/components/loading-swap";

export const PlanningSkeleton = () => (
  <div className="space-y-4" aria-busy="true">
    <span role="status" className="sr-only">
      Loading the forge plan…
    </span>
    {[0, 1, 2, 3].map((index) => (
      <Card key={index} aria-hidden="true">
        <CardContent>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
          {index === 0 && <Skeleton className="h-10 w-40" />}
        </CardContent>
      </Card>
    ))}
  </div>
);

export const PlanningLoadError = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <ErrorState
      title="Unable to load planning"
      description="Please try loading the forge plan again."
    >
      <Button
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        <LoadingSwap isLoading={pending}>Try again</LoadingSwap>
      </Button>
    </ErrorState>
  );
};
