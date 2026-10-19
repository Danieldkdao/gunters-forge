import { ReactNode } from "react";
import { TooltipProvider } from "./ui/tooltip";
import { Toaster } from "./ui/toast";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <NuqsAdapter>
      <TooltipProvider>
        <Toaster />
        {children}
      </TooltipProvider>
    </NuqsAdapter>
  );
};
