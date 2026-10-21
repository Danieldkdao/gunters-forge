"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  HammerIcon,
  ListOrderedIcon,
  LockKeyholeIcon,
  RefreshCwIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSwap } from "@/components/loading-swap";
import { NotFound } from "@/components/not-found";
import { toast } from "@/components/ui/toast";
import {
  formatOrderDate,
  formatOrderNumber,
  orderStatusLabels,
} from "@/features/orders/lib/formatters";
import {
  approvePlannerRunAction,
  applyPlannerRunAction,
  rejectPlannerRunAction,
  generatePlannerRunAction,
  readPlannerGenerationAction,
  readPlannerRunAction,
  readPlanningScreenAction,
} from "../actions/actions";
import type { PlanningScreenData, PlannerDetailData } from "../server/queries";
import {
  formatCraftingMinutes,
  plannerStatusLabels,
  plannerWorkLabels,
} from "../lib/formatters";
import { PlannerHistory } from "./planner-history";
import { PlanningSkeleton } from "./planning-states";

export const PlanningScreen = ({
  initialData,
}: {
  initialData: PlanningScreenData;
}) => {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jobId, setJobId] = useQueryState("planningJob", parseAsString);
  const [notice, setNotice] = useState("");
  const [historyRetry, setHistoryRetry] = useState(0);
  const screen = useQuery({
    queryKey: ["planner", "screen"],
    initialData,
    queryFn: async () => {
      const response = await readPlanningScreenAction();
      if (response.error) throw new Error(response.message);
      return response.data;
    },
    retry: false,
  });
  const data = screen.data;
  const planId = selectedId ?? data.plan?.id;
  const detail = useQuery({
    queryKey: ["planner", "detail", planId],
    enabled: !!planId,
    initialData:
      data.plan?.id === planId ? (data.plan ?? undefined) : undefined,
    queryFn: async () => {
      const response = await readPlannerRunAction(planId!);
      if (response.error) throw new Error(response.message);
      return response.data;
    },
    retry: false,
  });
  const plan = detail.data;
  const generation = useQuery({
    queryKey: ["planner", "generation", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const response = await readPlannerGenerationAction(jobId!);
      if (response.error) throw new Error(response.message);
      return response.data;
    },
    refetchInterval: (query) =>
      query.state.error ||
      (query.state.data && query.state.data.state !== "running")
        ? false
        : 2500,
    retry: false,
  });
  useEffect(() => {
    const result = generation.data;
    if (!jobId || !result || result.state === "running") return;
    let cancelled = false;
    void Promise.all([
      client.invalidateQueries({ queryKey: ["planner", "screen"] }),
      client.invalidateQueries({ queryKey: ["planner", "detail"] }),
    ]).then(() => {
      if (cancelled) return;
      if (result.state === "completed") {
        setSelectedId(result.planId);
        setNotice("Your new plan is ready to review.");
      } else {
        setNotice(
          result.state === "empty"
            ? "There are no waiting orders to plan. Orders already being crafted stay in progress."
            : "The plan could not be generated. Please try again.",
        );
      }
      void setJobId(null);
    });
    return () => {
      cancelled = true;
    };
  }, [generation.data, jobId, setJobId, client]);

  const generate = useMutation({
    mutationFn: async () => {
      const response = await generatePlannerRunAction(crypto.randomUUID());
      if (response.error) throw new Error(response.message);
      return response.data;
    },
    onSuccess: async ({ runId }) => {
      setNotice("");
      await setJobId(runId);
    },
    onError: (error) => toast.error(error.message),
  });
  const review = useMutation({
    mutationFn: async (decision: "approve" | "apply" | "reject") => {
      if (!plan) throw new Error("Choose a plan first.");
      const action =
        decision === "approve"
          ? approvePlannerRunAction
          : decision === "apply"
            ? applyPlannerRunAction
            : rejectPlannerRunAction;
      const response = await action(plan.id);
      if (response.error) throw new Error(response.message);
      return response;
    },
    onSuccess: (response) => toast.success(response.message),
    onError: (error) => toast.error(error.message),
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["planner", "screen"] }),
        client.invalidateQueries({ queryKey: ["planner", "detail"] }),
      ]);
    },
  });
  const generating = generate.isPending || !!jobId;
  const busy = generating || review.isPending || detail.isFetching;
  const stale = plan?.isStale || plan?.status === "stale";
  const reviewable =
    plan?.status === "pending_review" || plan?.status === "approved";
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <SparklesIcon className="size-6 text-primary" />
              Your forge plan
            </CardTitle>
            <Button
              variant="outline"
              disabled={screen.isFetching}
              onClick={() => {
                void screen.refetch();
                if (planId) void detail.refetch();
              }}
            >
              <RefreshCwIcon
                className={screen.isFetching ? "animate-spin" : ""}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-lg">
            Generate a suggested order for the waiting queue. Review it, approve
            it, then apply it when you are ready. Orders already being crafted
            stay first.
          </p>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-2 text-muted-foreground text-lg">
                <ListOrderedIcon className="size-4.5" />
                Waiting orders
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {data.overview.queued}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-muted-foreground text-lg">
                <HammerIcon className="size-4.5" />
                Being crafted
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {data.overview.inProgress}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-muted-foreground text-lg">
                <ClockIcon className="size-4.5" />
                Estimated active work
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {formatCraftingMinutes(data.overview.craftingMinutes)}
              </dd>
            </div>
          </dl>
          {plan && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex flex-wrap items-center gap-2 text-lg">
                <Badge
                  variant={plan.status === "applied" ? "default" : "secondary"}
                >
                  {stale ? "Queue changed" : plannerStatusLabels[plan.status]}
                </Badge>
                <span className="text-muted-foreground">
                  Generated {formatOrderDate(plan.generatedAt)}
                </span>
              </div>
              <p className="wrap-break-word text-lg">{plan.summary}</p>
              {plan.reviewedAt && (
                <p className="text-muted-foreground">
                  Reviewed {formatOrderDate(plan.reviewedAt)}
                </p>
              )}
              {plan.appliedAt && (
                <p className="text-muted-foreground">
                  Applied {formatOrderDate(plan.appliedAt)}
                </p>
              )}
              {stale && (
                <p role="status" className="text-muted-foreground text-lg">
                  The queue has changed since this plan was generated. Generate
                  a fresh plan before approving or applying it.
                </p>
              )}
              {plan.status === "approved" && !stale && (
                <p className="text-muted-foreground text-lg">
                  Approved and ready to apply. The work queue has not changed
                  yet.
                </p>
              )}
              {(plan.status === "applied" || plan.status === "rejected") && (
                <p className="text-muted-foreground text-lg">
                  This is a saved plan. Open the work queue to see the current
                  order.
                </p>
              )}
            </div>
          )}
          <div aria-live="polite">
            {generating && !generation.error && (
              <p className="flex items-center gap-2 text-muted-foreground text-lg">
                <RefreshCwIcon className="size-4 animate-spin" />
                Generating a plan in the background. You can keep reviewing the
                current plan.
              </p>
            )}
            {notice && <p className="text-lg">{notice}</p>}
          </div>
          {screen.error && (
            <p role="alert" className="text-destructive">
              {screen.error.message}{" "}
              <Button variant="link" onClick={() => void screen.refetch()}>
                Try again
              </Button>
            </p>
          )}
          {generation.error && (
            <div role="alert" className="space-y-2">
              <p className="text-destructive text-lg">
                Unable to check the job. It may still be running.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void generation.refetch()}
                >
                  Check again
                </Button>
                <Button variant="ghost" onClick={() => void setJobId(null)}>
                  Stop tracking
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          <Button
            aria-label={
              generating
                ? "Generating plan"
                : data.plan
                  ? "Regenerate plan"
                  : "Generate plan"
            }
            disabled={generating || review.isPending || !data.overview.queued}
            onClick={() => generate.mutate()}
          >
            <LoadingSwap
              isLoading={generating}
              className="flex items-center gap-2"
            >
              <SparklesIcon />
              {data.plan ? "Regenerate plan" : "Generate plan"}
            </LoadingSwap>
          </Button>
          {plan?.status === "pending_review" && !stale && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => review.mutate("approve")}
            >
              <CheckIcon />
              Approve plan
            </Button>
          )}
          {plan?.status === "approved" && !stale && (
            <Button disabled={busy} onClick={() => review.mutate("apply")}>
              <CheckIcon />
              Apply to queue
            </Button>
          )}
          {(reviewable || plan?.status === "stale") && (
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => review.mutate("reject")}
            >
              <XIcon />
              Reject plan
            </Button>
          )}
          <Button
            variant="outline"
            render={<Link href="/dashboard/orders?view=queue" />}
            nativeButton={false}
          >
            View work queue
            <ArrowRightIcon />
          </Button>
          {review.isPending && (
            <span role="status" className="text-muted-foreground text-lg">
              Saving plan…
            </span>
          )}
        </CardFooter>
      </Card>
      {detail.isPending && planId ? (
        <PlanningSkeleton />
      ) : detail.error ? (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">{detail.error.message}</p>
          <Button variant="outline" onClick={() => void detail.refetch()}>
            Reload plan
          </Button>
        </div>
      ) : plan ? (
        <Recommendations plan={plan} />
      ) : (
        <NotFound
          title="Your next great plan starts here"
          description={
            data.overview.queued
              ? "Generate a plan to see a suggested work order and the reasoning behind each recommendation."
              : "New eligible orders will appear here once they enter the forge queue."
          }
          icon={<HammerIcon className="size-10" />}
        />
      )}
      <PlannerHistory
        key={`${data.history.key}-${historyRetry}`}
        data={data.history.data}
        nextCursor={data.history.nextCursor}
        selectedId={planId}
        onSelect={setSelectedId}
        onRetry={() => setHistoryRetry((value) => value + 1)}
      />
    </div>
  );
};

const Recommendations = ({ plan }: { plan: PlannerDetailData }) => (
  <section className="space-y-3" aria-labelledby="recommendations-title">
    <div>
      <h2 id="recommendations-title" className="text-2xl font-semibold">
        Recommended work order
      </h2>
      <p className="text-muted-foreground">
        Positions within the waiting queue. Crafting times are estimates.
      </p>
    </div>
    <ol className="space-y-4">
      {plan.recommendations.map((recommendation) => {
        const { order, items } = recommendation;
        const minutes = items.reduce(
          (total, item) => total + item.quantity * item.craftingTimeMinutes,
          0,
        );
        return (
          <li key={recommendation.id}>
            <Card>
              <CardContent className="gap-4 md:flex-row">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary"
                  aria-label={`Proposed waiting position ${recommendation.position}`}
                >
                  {recommendation.position}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="text-xl font-semibold hover:underline"
                      href={`/dashboard/orders/${recommendation.orderId}`}
                    >
                      {order
                        ? formatOrderNumber(order.orderNumber)
                        : "View order"}
                    </Link>
                    <Badge variant="secondary">
                      {plannerWorkLabels[recommendation.workType]}
                    </Badge>
                    {order?.queueRankIsManual && (
                      <Badge variant="outline">
                        <LockKeyholeIcon />
                        Manual priority
                      </Badge>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item.id} className="wrap-break-word">
                        {item.quantity} × {item.productName}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-4" />
                      {formatCraftingMinutes(minutes)}
                    </span>
                    {order && <span>{orderStatusLabels[order.status]}</span>}
                    {(plan.status === "pending_review" ||
                      plan.status === "approved") &&
                      recommendation.currentPosition && (
                        <span>
                          Waiting #{recommendation.currentPosition} → #
                          {recommendation.position}
                          {recommendation.currentPosition ===
                          recommendation.position
                            ? " · Unchanged"
                            : ""}
                        </span>
                      )}
                  </div>
                </div>
                <div className="min-w-0 space-y-1 md:w-2/5">
                  <p className="text-lg font-medium">Why this order</p>
                  <p className="wrap-break-word text-muted-foreground">
                    {recommendation.reason}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ol>
  </section>
);
