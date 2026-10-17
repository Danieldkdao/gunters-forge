import { AuthForm } from "@/components/auth/auth-form";
import { Suspense } from "react";

const SignInPage = () => {
  return (
    <Suspense>
      <AuthForm signIn />
    </Suspense>
  );
};

export default SignInPage;
