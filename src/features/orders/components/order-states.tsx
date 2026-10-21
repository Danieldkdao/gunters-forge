"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/error-state";
import { LoadingSwap } from "@/components/loading-swap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const OrderSkeleton = ({ rows = 2 }: { rows?: number }) => (
  <div className="space-y-4" aria-busy="true">
    <span role="status" className="sr-only">
      Loading order information…
    </span>
    <Skeleton className="h-9 w-48" />
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <Card key={index} aria-hidden="true">
          <CardContent>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const OrderLoadError = ({
  description = "We couldn't load your order information. Please try again.",
  onRetry,
}: {
  description?: string;
  onRetry?: () => Promise<unknown>;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <ErrorState title="Unable to load orders" description={description}>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (onRetry) await onRetry();
            else router.refresh();
          })
        }
      >
        <LoadingSwap isLoading={pending}>Try again</LoadingSwap>
      </Button>
    </ErrorState>
  );
};
