import { ReactNode } from "react";
import { TooltipProvider } from "./ui/tooltip";
import { Toaster } from "./ui/toast";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { CartHydration } from "@/features/cart/components/cart-hydration";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableColorScheme
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <CartHydration />
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
};
