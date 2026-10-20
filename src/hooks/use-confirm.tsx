import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const useConfirm = (title: string, description: string) => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  // Keep the promise pending until resolved with true or false, closing the dialog resolves with false
  const confirm = async () => {
    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };

  const close = () => {
    setPromise(null);
  };

  const accept = () => {
    promise?.resolve(true);
    close();
  };

  const cancel = () => {
    promise?.resolve(false);
    close();
  };

  const ConfirmationDialog = (
    <Dialog
      open={promise !== null}
      onOpenChange={(open) => {
        if (!open) {
          cancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 w-full flex flex-col-reverse gap-y-2 lg:flex-row gap-x-2 items-center justify-end">
          <Button
            onClick={cancel}
            variant="outline"
            className="w-full lg:w-auto"
          >
            Cancel
          </Button>
          <Button onClick={accept} className="w-full lg:w-auto">
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmationDialog };
};
