"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Zap, Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

type Step = "request" | "verify";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn("password", { email, flow: "reset" });
      setStep("verify");
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("Could not find") ||
          err.message.includes("InvalidAccountId")
        ) {
          setError("No account found with that email address.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await signIn("password", {
        email,
        code,
        newPassword,
        flow: "reset-verification",
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Invalid code") || err.message.includes("expired")) {
          setError("Invalid or expired code. Please request a new one.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
          <Zap className="h-6 w-6 text-black" />
        </div>
        <span className="text-xl font-medium text-text-primary">
          ACU Youth Venture
        </span>
      </div>

      <Card padding="lg" className="border-border-default">
        {step === "request" ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-medium text-text-primary">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Enter your email and we'll send you a verification code
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestReset} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="brand"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Send Reset Code
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                <ShieldCheck className="h-6 w-6 text-brand-500" />
              </div>
              <h1 className="text-2xl font-medium text-text-primary">
                Check your email
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                We sent a verification code to{" "}
                <span className="font-medium text-text-primary">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyReset} className="space-y-4">
              <Input
                label="Verification code"
                type="text"
                placeholder="Enter the code from your email"
                leftIcon={<ShieldCheck className="h-4 w-4" />}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />

              <Input
                label="New password"
                type="password"
                placeholder="At least 8 characters"
                leftIcon={<Lock className="h-4 w-4" />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm password"
                type="password"
                placeholder="Re-enter your new password"
                leftIcon={<Lock className="h-4 w-4" />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="brand"
                className="w-full"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Reset Password
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setStep("request");
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setError(null);
              }}
              className="mt-4 w-full text-center text-sm text-text-tertiary hover:text-text-secondary transition-colors"
            >
              Didn't receive it? Try again
            </button>
          </>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-400 font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
