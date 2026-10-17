"use client";

import { authClient } from "@/lib/auth/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { toast } from "../ui/toast";
import { SocialProvider } from "@/lib/types";
import { VerifyAccount } from "./verify-account";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { LoadingSwap } from "../loading-swap";
import { FaGithub, FaGoogle } from "react-icons/fa6";
import { Separator } from "../ui/separator";
import { Field, FieldContent, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { PasswordInput, PasswordInputStrengthChecker } from "../password-input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export const AuthForm = ({ signIn = true }: { signIn?: boolean }) => {
  const formSchema = z
    .object({
      name: z.string().optional(),
      email: z.email({ error: "Please enter a valid email." }),
      password: z
        .string()
        .min(8, { error: "Please enter at least 8 characters." }),
    })
    .superRefine((data, ctx) => {
      if (!signIn && !data.name?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Please enter your name.",
          path: ["name"],
        });
      }
    });

  type FormType = z.infer<typeof formSchema>;

  const searchParams = useSearchParams();
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [isSocialAuth, setIsSocialAuth] = useState(false);
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const currentQueryString = useMemo(
    () => new URLSearchParams(searchParams).toString(),
    [searchParams],
  );

  const callbackURL = searchParams.get("callbackUrl") || "/";

  const handleSignUp = async (data: FormType) => {
    const { name, ...rest } = data;
    if (!name?.trim()) return toast.error("Please enter a name.");

    await authClient.signUp.email({
      ...rest,
      name,
      callbackURL,
      fetchOptions: {
        onSuccess: async () => {
          toast.success("Account created successfully!");
          setVerifyEmail(data.email);
        },
        onError: (error) => {
          toast.error(error.error.message);
        },
      },
    });
  };

  const handleSignIn = async (data: FormType) => {
    await authClient.signIn.email({
      ...data,
      callbackURL,
      fetchOptions: {
        onSuccess: async () => {
          toast.success("Authentication successful!");
        },
        onError: async (error) => {
          console.error(error);
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            setVerifyEmail(data.email);
            toast.error("Please verify your email to continue.");
            await authClient.emailOtp.sendVerificationOtp({
              email: data.email,
              type: "email-verification",
            });
            return;
          }
          toast.error(error.error.message);
        },
      },
    });
  };

  const handleSocialSignIn = async (provider: SocialProvider) => {
    setIsSocialAuth(true);
    await authClient.signIn.social({
      provider,
      callbackURL,
      fetchOptions: {
        onError: (error) => {
          setIsSocialAuth(false);
          toast.error(error.error.message);
        },
      },
    });
  };

  const isAuthenticating = form.formState.isSubmitting || isSocialAuth;

  if (verifyEmail) {
    return <VerifyAccount email={verifyEmail} setEmail={setVerifyEmail} />;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 items-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1 className="text-3xl font-semibold text-center">
            {signIn ? "Welcome Back" : "Get Started"}
          </h1>
          <p className="text-base text-muted-foreground text-center">
            {signIn
              ? "Good to see you again! Enter your credentials to continue."
              : "Enter your credentials below to continue."}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialSignIn("google")}
            disabled={isAuthenticating}
          >
            <LoadingSwap isLoading={isSocialAuth}>
              <FaGoogle />
            </LoadingSwap>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialSignIn("github")}
            disabled={isAuthenticating}
          >
            <LoadingSwap isLoading={isSocialAuth}>
              <FaGithub />
            </LoadingSwap>
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <Separator className="flex-1" />
          <span className="text-muted-foreground">Or continue with</span>
          <Separator className="flex-1" />
        </div>

        <form
          onSubmit={form.handleSubmit(signIn ? handleSignIn : handleSignUp)}
          className="w-full space-y-4"
        >
          {!signIn && (
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="sign-up-name-input">Name</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      placeholder="Enter your name here..."
                      id="sign-up-name-input"
                      aria-invalid={!!fieldState.error}
                    />
                  </FieldContent>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="sign-up-email-input">Email</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Enter your email here..."
                    id="sign-up-email-input"
                    aria-invalid={!!fieldState.error}
                  />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="sign-up-password-input">
                  Password
                </FieldLabel>
                <FieldContent>
                  <PasswordInput
                    {...field}
                    placeholder="••••••••••••"
                    id="sign-up-password-input"
                    aria-invalid={!!fieldState.error}
                  >
                    <PasswordInputStrengthChecker />
                  </PasswordInput>
                </FieldContent>
                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} className="-mt-6" />
                )}
              </Field>
            )}
          />
          <Button type="submit" className="w-full" disabled={isAuthenticating}>
            <LoadingSwap isLoading={form.formState.isSubmitting}>
              {signIn ? "Sign In" : "Create Account"}
            </LoadingSwap>
          </Button>
        </form>
        <Link
          href={`/${signIn ? "sign-up" : "sign-in"}?${currentQueryString}`}
          className="text-sm font-medium text-muted-foreground"
        >
          {signIn
            ? "Don't have an account? Click here to sign up."
            : "Already have an account? Click here to sign in."}
        </Link>
      </CardContent>
    </Card>
  );
};
