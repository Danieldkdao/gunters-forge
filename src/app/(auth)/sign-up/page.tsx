import { AuthForm } from "@/components/auth/auth-form";
import { Suspense } from "react";

const SignUpPage = () => {
  return (
    <Suspense>
      <AuthForm signIn={false} />
    </Suspense>
  );
};

export default SignUpPage;
