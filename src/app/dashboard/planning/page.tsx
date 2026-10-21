import { readPlanningScreenAction } from "@/features/planner/actions/actions";
import { PlanningScreen } from "@/features/planner/components/planning-screen";
import {
  PlanningLoadError,
  PlanningSkeleton,
} from "@/features/planner/components/planning-states";
import { Suspense } from "react";

export default function PlanningPage() {
  return (
    <div className="min-w-0 space-y-6 text-base">
      <div>
        <h1 className="text-3xl font-semibold">Forge planning</h1>
        <p className="text-lg text-muted-foreground">
          A thoughtful plan for what to forge next. You make the final call.
        </p>
      </div>
      <Suspense fallback={<PlanningSkeleton />}>
        <PlanningContent />
      </Suspense>
    </div>
  );
}

const PlanningContent = async () => {
  const response = await readPlanningScreenAction();
  return response.error ? (
    <PlanningLoadError />
  ) : (
    <PlanningScreen initialData={response.data} />
  );
};
