"use client";

import { useCallback } from "react";
import type { PlannerRunSelectData } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListError, ListLoader, Sentinel } from "@/components/list-components";
import { useInfiniteCursor } from "@/hooks/use-infinite-cursor";
import { formatOrderDate } from "@/features/orders/lib/formatters";
import { readPlannerRunsAction } from "../actions/actions";
import { plannerStatusLabels } from "../lib/formatters";

export const PlannerHistory = ({
  data,
  nextCursor: initialCursor,
  selectedId,
  onSelect,
  onRetry,
}: {
  data: PlannerRunSelectData[];
  nextCursor: string | null;
  selectedId?: string;
  onSelect: (id: string) => void;
  onRetry: () => void;
}) => {
  const fetchRuns = useCallback(
    (lastCursor: string | null) => readPlannerRunsAction({ lastCursor }),
    [],
  );
  const { items, nextCursor, isPending, error, sentinelRef } =
    useInfiniteCursor(data, initialCursor, fetchRuns);
  if (!items.length) return null;

  return (
    <section className="space-y-3" aria-labelledby="plan-history-title">
      <h2 id="plan-history-title" className="text-2xl font-semibold">
        Plan history
      </h2>
      <div className="divide-y rounded-xl border">
        {items.map((run) => (
          <div
            key={run.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">
                  {formatOrderDate(run.generatedAt)}
                </p>
                <Badge variant="secondary">
                  {plannerStatusLabels[run.status]}
                </Badge>
              </div>
              <p className="line-clamp-2 wrap-break-word text-muted-foreground">
                {run.summary}
              </p>
            </div>
            <Button
              variant="outline"
              aria-pressed={selectedId === run.id}
              onClick={() => onSelect(run.id)}
            >
              {selectedId === run.id ? "Viewing" : "View plan"}
            </Button>
          </div>
        ))}
      </div>
      <ListLoader loading={isPending} />
      <Sentinel ref={sentinelRef} show={!!nextCursor && !error} />
      <ListError error={error} />
      {error && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </section>
  );
};
