import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export const useSignOut = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const signOut = () => {
    startTransition(async () => {
      await authClient.signOut({
        callbackURL: "/sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully!");
            router.push("/sign-in");
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      });
    });
  };

  return {
    signOut,
    isSignOutPending: isPending,
  };
};
