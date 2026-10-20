"use client";

import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useSignOut } from "@/hooks/use-sign-out";

const Home = () => {
  const { data: session } = useAuthSession();
  const { signOut, isSigningOut } = useSignOut();

  return (
    <div>
      {session?.user && (
        <Button onClick={signOut} disabled={isSigningOut}>
          Sign Out
        </Button>
      )}
    </div>
  );
};

export default Home;
