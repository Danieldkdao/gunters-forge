"use client";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";

export default function ProductError({ reset }: { reset: () => void }) {
  return <ErrorState title="Unable to load this product" description="Please try again in a moment.">
    <Button onClick={reset}>Try again</Button>
  </ErrorState>;
}
