import { Loader2Icon } from "lucide-react";
import { Ref } from "react";

export const ListLoader = ({ loading }: { loading: boolean }) => {
  return (
    loading && (
      <div className="flex items-center justify-center w-full">
        <Loader2Icon className="size-6 animate-spin text-primary" />
      </div>
    )
  );
};

export const Sentinel = ({
  ref,
  show = true,
}: {
  ref: Ref<HTMLDivElement>;
  show?: boolean;
}) => {
  return show && <div ref={ref} className="h-1 w-full bg-transparent" />;
};

export const ListError = ({ error }: { error: string | null }) => {
  return (
    error && (
      <div className="flex items-center justify-center w-full">
        <p className="text-base font-medium text-destructive">{error}</p>
      </div>
    )
  );
};
