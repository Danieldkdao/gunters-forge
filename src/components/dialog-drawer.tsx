import { useIsMobile } from "@/hooks/use-mobile";
import { ReactElement, ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { SetterType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export const DialogDrawer = ({
  trigger,
  children,
  open,
  onOpenChange,
  options = {},
}: {
  trigger?: ReactElement;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
  options?: { title?: string; description?: string; className?: string };
}) => {
  const isMobile = useIsMobile();

  const { title, description, className } = options;

  if (isMobile) {
    return (
      <Drawer showSwipeHandle open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger render={trigger} />}
        <DrawerContent className={cn("max-h-220")}>
          {/* Keep titles and descriptions available to screen readers if omitted */}
          <DrawerHeader className={cn(!title && !description && "sr-only")}>
            <DrawerTitle className={cn(!title && "sr-only")}>
              {title || "Drawer"}
            </DrawerTitle>
            <DrawerDescription className={cn(!description && "sr-only")}>
              {description || "Drawer Description"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto p-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent showCloseButton={false} className={cn(className)}>
        <DialogHeader className={cn(!title && !description && "sr-only")}>
          <DialogTitle className={cn(!title && "sr-only")}>
            {title || "Title"}
          </DialogTitle>
          <DialogDescription className={cn(!description && "sr-only")}>
            {description || "Dialog Description"}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
