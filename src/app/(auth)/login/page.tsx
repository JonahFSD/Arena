"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Swords, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        // If no auth account exists yet, auto-create one via signUp flow.
        // The createOrUpdateUser callback links to the existing seed user by email.
        if (err.message.includes("InvalidAccountId") || err.message.includes("Cannot read properties of null")) {
          try {
            await signIn("password", { email, password, flow: "signUp" });
            router.push("/dashboard");
            return;
          } catch {
            setError("Could not create account. Please try again.");
            return;
          }
        }
        if (
          err.message.includes("Invalid") ||
          err.message.includes("credentials")
        ) {
          setError("Invalid email or password. Please try again.");
        } else if (err.message.includes("not confirmed")) {
          setError("Please verify your email address before signing in.");
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
          <Swords className="h-6 w-6 text-black" />
        </div>
        <span className="text-xl font-bold text-text-primary">
          021
        </span>
      </div>

      <Card padding="lg" className="border-border-default">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to your account to continue
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="rounded border-border-default bg-surface-elevated text-brand-500 focus:ring-brand-500"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-brand-500 hover:text-brand-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="brand"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs text-text-muted bg-surface-card">
              OR
            </span>
          </div>
        </div>

        <Button variant="outline" className="w-full" size="lg" disabled>
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google (coming soon)
        </Button>
      </Card>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Not a member yet?{" "}
        <Link
          href="/apply"
          className="text-brand-500 hover:text-brand-400 font-medium transition-colors"
        >
          Apply to join
        </Link>
      </p>
    </div>
  );
}
