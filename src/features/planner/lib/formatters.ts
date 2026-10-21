import type { PlannerRunStatus } from "@/db/shared";

export const plannerStatusLabels: Record<PlannerRunStatus, string> = {
  pending_review: "Awaiting review",
  approved: "Approved",
  applied: "Applied",
  rejected: "Rejected",
  stale: "Queue changed",
};

export const plannerWorkLabels = {
  small_job: "Quick job",
  extended_project: "Extended project",
  batch_candidate: "Batch opportunity",
  standard: "Standard job",
};

export const formatCraftingMinutes = (minutes: number) =>
  `${new Intl.NumberFormat("en-US").format(minutes)} min`;
