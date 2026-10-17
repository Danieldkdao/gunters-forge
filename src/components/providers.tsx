import { ReactNode } from "react";
import { TooltipProvider } from "./ui/tooltip";
import { Toaster } from "./ui/toast";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <TooltipProvider>
      <Toaster />
      {children}
    </TooltipProvider>
  );
};
