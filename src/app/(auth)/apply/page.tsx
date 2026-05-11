"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { CategorizedMultiSelectDropdown } from "@/components/ui/categorized-multi-select-dropdown";
import { PROFILE_SKILL_OPTIONS, PROFILE_TOOL_CATEGORIES } from "@/lib/profile-options";
import { US_STATE_ABBREVIATIONS } from "@/lib/us-states";
import {
  schoolToKey,
  keyToSchool,
  formatSchoolLabel,
  type NewSchoolPayload,
  type SchoolListing,
} from "@/lib/school-directory";
import { SchoolPicker } from "@/components/school-picker";
import { cn } from "@/lib/utils";
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  User,
  Sparkles,
  Heart,
  ShieldCheck,
  FileCheck,
  Eye,
  EyeOff,
  Lock,
  ExternalLink,
} from "lucide-react";

const STEPS = [
  { id: "personal", label: "About", icon: User },
  { id: "profile", label: "Profile", icon: Sparkles },
  { id: "faith", label: "Faith", icon: Heart },
  { id: "parent", label: "Guardian", icon: ShieldCheck },
  { id: "review", label: "Review & Submit", icon: FileCheck },
];

const graduationYears = Array.from({ length: 7 }, (_, i) => ({
  value: String(2025 + i),
  label: String(2025 + i),
}));

const GUARDIAN_RELATIONS = [
  { value: "Mother", label: "Mother" },
  { value: "Father", label: "Father" },
  { value: "Guardian", label: "Guardian" },
];

function ApplyReferralBanner({ onRef }: { onRef: (code: string) => void }) {
  const params = useSearchParams();
  const ref = params.get("ref");
  const calledRef = useRef(false);

  useEffect(() => {
    if (ref && !calledRef.current) {
      calledRef.current = true;
      onRef(ref);
    }
  }, [ref, onRef]);

  if (!ref) return null;
  return (
    <div
      className="mb-6 rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-center"
      role="status"
    >
      <p className="text-xs text-text-secondary">
        You&apos;re applying with a member invite. When you&apos;re approved, your referrer
        earns <span className="font-medium text-brand-500">500 points</span> on the
        leaderboard.
      </p>
    </div>
  );
}

/** Calculate age in years from an ISO date string. */
function ageFromBirthdate(birthdate: string): number {
  const bd = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const monthDiff = today.getMonth() - bd.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) {
    age--;
  }
  return age;
}

function ApplyForm({ nominationToken }: { nominationToken: string }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Step 0: About
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Profile
  const [birthdate, setBirthdate] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [extraSchoolsByState, setExtraSchoolsByState] = useState<
    Record<string, SchoolListing[]>
  >({});
  const [selectedSchoolKey, setSelectedSchoolKey] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);

  // Step 2: Faith
  const [faithStatement, setFaithStatement] = useState("");

  // Step 3: Guardian
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentRelation, setParentRelation] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [consent, setConsent] = useState(false);

  // Referral
  const [referralCode, setReferralCode] = useState<string | undefined>(undefined);
  const handleReferralCode = useCallback((code: string) => setReferralCode(code), []);

  const { signIn } = useAuthActions();
  const submitApplication = useMutation(api.applications.submitApplication);

  function handleAddSchool(payload: NewSchoolPayload) {
    const { schoolCity, schoolState, schoolName } = payload;
    setExtraSchoolsByState((prev) => {
      const next = { ...prev };
      const list = next[schoolState] ?? [];
      next[schoolState] = [...list, { name: schoolName, city: schoolCity }];
      return next;
    });
    setSelectedSchoolKey(
      schoolToKey({ state: schoolState, name: schoolName, city: schoolCity })
    );
  }

  function getSchoolName(): string {
    if (!selectedSchoolKey) return "";
    const parts = selectedSchoolKey.split("|");
    return parts.length >= 3 ? parts[2] : "";
  }

  // Validation
  function validateStep(stepIndex: number): boolean {
    const errors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!firstName.trim()) errors.firstName = "First name is required";
      if (!lastName.trim()) errors.lastName = "Last name is required";
      if (!email.trim()) errors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        errors.email = "Please enter a valid email";
      if (!password) errors.password = "Password is required";
      else if (password.length < 8)
        errors.password = "Password must be at least 8 characters";
      if (password !== confirmPassword)
        errors.confirmPassword = "Passwords do not match";
    }

    if (stepIndex === 1) {
      if (!birthdate) errors.birthdate = "Birthdate is required";
      else {
        const age = ageFromBirthdate(birthdate);
        if (age < 14 || age > 18)
          errors.birthdate = "Must be between 14 and 18 years old";
      }
      if (!graduationYear) errors.graduationYear = "Graduation year is required";
      if (!selectedSchoolKey) errors.school = "School is required";
    }

    if (stepIndex === 2) {
      if (!faithStatement.trim()) errors.faithStatement = "Faith statement is required";
      else if (faithStatement.trim().split(/\s+/).length < 20)
        errors.faithStatement = "Please write at least 20 words";
    }

    if (stepIndex === 3) {
      if (!parentFirstName.trim()) errors.parentFirstName = "First name is required";
      if (!parentLastName.trim()) errors.parentLastName = "Last name is required";
      if (!parentRelation) errors.parentRelation = "Relation is required";
      if (!parentEmail.trim()) errors.parentEmail = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim()))
        errors.parentEmail = "Please enter a valid email";
      if (!parentPhone.trim()) errors.parentPhone = "Phone is required";
      if (!consent) errors.consent = "You must agree to proceed";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      if (validateStep(step)) {
        setStep(step + 1);
      }
    }
  }

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      await submitApplication({
        userEmail: email.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        birthdate,
        school: getSchoolName(),
        graduationYear: Number(graduationYear),
        faithStatement,
        parentFirstName: parentFirstName.trim(),
        parentLastName: parentLastName.trim(),
        parentRelation,
        parentEmail: parentEmail.trim(),
        parentPhone: parentPhone.trim(),
        referralCode,
        nominationToken,
        phone: phone || undefined,
        city: city || undefined,
        state: state || undefined,
        skills: skills.length > 0 ? skills : undefined,
        tools: tools.length > 0 ? tools : undefined,
        linkedinUrl: linkedinUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      });

      await signIn("password", {
        email: email.trim(),
        password,
        flow: "signUp",
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // ---------- Success screen ----------
  if (submitted) {
    return (
      <div className="w-full animate-fade-in">
        <Card padding="lg" className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Application Submitted!
          </h1>
          <p className="mt-3 text-text-secondary max-w-md mx-auto">
            Thank you for applying to ACU Youth Venture! Our executive team will review
            your application within 1-3 business days.
          </p>
          <p className="mt-2 text-sm text-text-muted">
            You&apos;ll receive an email at{" "}
            <span className="font-medium text-text-primary">{email}</span> when a
            decision has been made.
          </p>

          <div className="mt-6 rounded-xl border border-brand-500/20 bg-brand-500/5 p-5 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-brand-500" />
              <h3 className="font-semibold text-text-primary">
                Builder&apos;s Quotient Assessment
              </h3>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              In the meantime, complete your Builder&apos;s Quotient assessment to help us
              understand your entrepreneurial strengths.
            </p>
            <a
              href="https://bq.austinchristianu.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="brand"
                rightIcon={<ExternalLink className="h-4 w-4" />}
              >
                Take the BQ Assessment
              </Button>
            </a>
          </div>

          <Link href="/">
            <Button variant="ghost" className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ---------- Review helpers ----------
  const parsedSchool = selectedSchoolKey ? keyToSchool(selectedSchoolKey) : null;
  const schoolLabel = parsedSchool
    ? formatSchoolLabel(parsedSchool)
    : "Not selected";

  // Progress bar: stop at midpoint of current step's segment
  const progressPercent = ((step + 0.5) / STEPS.length) * 100;

  // ---------- Main form ----------
  return (
    <div className="w-full animate-fade-in">
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
          <Zap className="h-6 w-6 text-black" />
        </div>
        <span className="text-xl font-bold text-text-primary">Apply to Join</span>
      </div>

      <Suspense fallback={null}>
        <ApplyReferralBanner onRef={handleReferralCode} />
      </Suspense>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`text-xs font-medium ${
                i <= step ? "text-brand-500" : "text-text-muted"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
        <Progress value={progressPercent} max={100} size="sm" />
      </div>

      <Card padding="lg">
        {/* ──────────── Step 0: About ──────────── */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={validationErrors.firstName}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={validationErrors.lastName}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={validationErrors.email}
              />
              <Input
                label="Phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(555) 555-5555"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                hint="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={validationErrors.password}
                  leftIcon={<Lock className="h-4 w-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-text-tertiary hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={validationErrors.confirmPassword}
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        )}

        {/* ──────────── Step 1: Profile ──────────── */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Birthdate"
                type="date"
                required
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                error={validationErrors.birthdate}
              />
              <Select
                label="Graduation Year"
                options={graduationYears}
                placeholder="Select year"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                error={validationErrors.graduationYear}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                placeholder="Austin"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Select
                label="State"
                options={US_STATE_ABBREVIATIONS.map((abbr) => ({
                  value: abbr,
                  label: abbr,
                }))}
                placeholder="Select state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <SchoolPicker
                value={selectedSchoolKey}
                onChange={setSelectedSchoolKey}
                extraSchoolsByState={extraSchoolsByState}
                onAddSchool={handleAddSchool}
              />
              {validationErrors.school && (
                <p className="text-xs text-error mt-1.5">{validationErrors.school}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="LinkedIn URL"
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
              <Input
                label="Portfolio URL"
                type="url"
                placeholder="https://..."
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <MultiSelectDropdown
                  label="Skills"
                  options={[...PROFILE_SKILL_OPTIONS]}
                  value={skills}
                  onChange={setSkills}
                  emptyLabel="Select skills"
                />
              </div>
              <div className="min-w-0">
                <CategorizedMultiSelectDropdown
                  label="Tools"
                  categories={PROFILE_TOOL_CATEGORIES}
                  value={tools}
                  onChange={setTools}
                  emptyLabel="Select tools"
                />
              </div>
            </div>
          </div>
        )}

        {/* ──────────── Step 2: Faith ──────────── */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <Textarea
              placeholder="Share what you believe about God and how your faith shows up in your everyday life."
              hint="100-500 words"
              rows={8}
              required
              value={faithStatement}
              onChange={(e) => setFaithStatement(e.target.value)}
              error={validationErrors.faithStatement}
            />
          </div>
        )}

        {/* ──────────── Step 3: Guardian ──────────── */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <p className="text-sm text-text-secondary bg-surface-elevated rounded-xl p-4 border border-border-default">
              Since all members are under 18, we require parent/guardian consent.
              They&apos;ll receive an email to verify and co-sign your membership.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Jane"
                required
                value={parentFirstName}
                onChange={(e) => setParentFirstName(e.target.value)}
                error={validationErrors.parentFirstName}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                required
                value={parentLastName}
                onChange={(e) => setParentLastName(e.target.value)}
                error={validationErrors.parentLastName}
              />
            </div>
            <Select
              label="Relation to Student"
              options={GUARDIAN_RELATIONS}
              placeholder="Select relation"
              value={parentRelation}
              onChange={(e) => setParentRelation(e.target.value)}
              error={validationErrors.parentRelation}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="parent@example.com"
                required
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                error={validationErrors.parentEmail}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                error={validationErrors.parentPhone}
              />
            </div>
            <div>
              <label className="flex items-start gap-3 text-sm text-text-secondary mt-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 rounded border-border-default bg-surface-elevated text-brand-500 focus:ring-brand-500"
                />
                <span>
                  I confirm the applicant is between 14-18 years old and I consent to
                  their participation. I have reviewed and agree to the{" "}
                  <Link
                    href="#"
                    className="text-brand-500 hover:text-brand-400"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-brand-500 hover:text-brand-400"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {validationErrors.consent && (
                <p className="text-xs text-error mt-1.5 ml-7">
                  {validationErrors.consent}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ──────────── Step 4: Review & Submit ──────────── */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            {/* About */}
            <div className="rounded-xl border border-border-default bg-surface-elevated p-4 space-y-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <User className="h-4 w-4 text-brand-500" />
                About
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <ReviewRow label="Name" value={`${firstName} ${lastName}`} />
                <ReviewRow label="Email" value={email} />
                <ReviewRow label="Password" value={"••••••••"} />
                <ReviewRow label="Phone" value={phone || "Not provided"} />
              </div>
            </div>

            {/* Profile */}
            <div className="rounded-xl border border-border-default bg-surface-elevated p-4 space-y-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                Profile
              </h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <ReviewRow label="Birthdate" value={birthdate || "Not provided"} />
                  <ReviewRow label="Graduation Year" value={graduationYear} />
                  <ReviewRow label="Location" value={city && state ? `${city}, ${state}` : city || state || "Not provided"} />
                  <ReviewRow label="School" value={schoolLabel} />
                </div>
                <ReviewRow label="LinkedIn" value={linkedinUrl || "Not provided"} />
                <ReviewRow label="Portfolio" value={portfolioUrl || "Not provided"} />
                <div>
                  <span className="text-text-muted">Skills: </span>
                  {skills.length > 0 ? (
                    <span className="inline-flex flex-wrap gap-1 mt-1">
                      {skills.map((s) => (
                        <Badge key={s} variant="brand" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="text-text-secondary">None selected</span>
                  )}
                </div>
                <div>
                  <span className="text-text-muted">Tools: </span>
                  {tools.length > 0 ? (
                    <span className="inline-flex flex-wrap gap-1 mt-1">
                      {tools.map((t) => (
                        <Badge key={t} variant="default" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="text-text-secondary">None selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Faith */}
            <div className="rounded-xl border border-border-default bg-surface-elevated p-4 space-y-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Heart className="h-4 w-4 text-brand-500" />
                Faith
              </h3>
              <div className="space-y-2 text-sm">
                <ReviewRow label="Faith Statement" value={faithStatement} multiline />
              </div>
            </div>

            {/* Guardian */}
            <div className="rounded-xl border border-border-default bg-surface-elevated p-4 space-y-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-500" />
                Guardian
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <ReviewRow label="Name" value={`${parentFirstName} ${parentLastName}`} />
                <ReviewRow label="Relation" value={parentRelation || "Not provided"} />
                <ReviewRow label="Email" value={parentEmail} />
                <ReviewRow label="Phone" value={parentPhone} />
              </div>
            </div>

            {/* BQ Assessment CTA */}
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-5 w-5 text-brand-500" />
                <h3 className="font-semibold text-text-primary">
                  Builder&apos;s Quotient Assessment
                </h3>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                After submitting your application, we recommend completing the
                Builder&apos;s Quotient (BQ) assessment. This helps us understand your
                entrepreneurial strengths and match you with the right opportunities.
              </p>
              <a
                href="https://bq.austinchristianu.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ExternalLink className="h-4 w-4" />}
                >
                  Take the BQ Assessment
                </Button>
              </a>
              <p className="text-xs text-text-muted mt-2">
                You can complete this before or after your application is reviewed.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-error shrink-0" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-default">
          <Button
            variant="ghost"
            onClick={() => {
              setValidationErrors({});
              setStep(step - 1);
            }}
            disabled={step === 0}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          {step === STEPS.length - 1 ? (
            <Button
              variant="brand"
              onClick={handleSubmit}
              isLoading={isLoading}
              rightIcon={<CheckCircle className="h-4 w-4" />}
            >
              Submit Application
            </Button>
          ) : (
            <Button
              variant="brand"
              onClick={handleNext}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already a member?{" "}
        <Link
          href="/login"
          className="text-brand-500 hover:text-brand-400 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ---------- Nomination gate ----------
// /apply is invite-only. A nominator (e.g. an Adam-Richardson-type school
// partner) sends the kid a link like /apply?n=TOKEN. The token is opaque in
// v1 — just stored on the application for audit. No /apply?n=… means no form.
function ApplyGate() {
  const params = useSearchParams();
  const token = params.get("n")?.trim();
  if (token) return <ApplyForm nominationToken={token} />;
  return <NominationLocked />;
}

function NominationLocked() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/30 mb-4">
          <Lock className="w-6 h-6 text-brand-500" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">
          By nomination only
        </h1>
        <p className="mt-3 text-text-secondary">
          021 is invite-only. Members are nominated by trusted partners
          at participating schools. If you&rsquo;ve been nominated, use the
          private link your nominator sent you.
        </p>
      </div>
      <Card className="p-6 text-center">
        <p className="text-sm text-text-secondary">
          Think you should be a nominator? Request access on the landing page.
        </p>
        <Link
          href="/#home"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border border-border-default text-text-primary hover:bg-surface-card-hover transition-colors text-sm font-medium"
        >
          Back to landing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Card>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already a member?{" "}
        <Link
          href="/login"
          className="text-brand-500 hover:text-brand-400 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyGate />
    </Suspense>
  );
}

// ---------- Review row helper ----------
function ReviewRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <span className="text-text-muted">{label}: </span>
      {multiline ? (
        <p className="text-text-secondary mt-0.5 whitespace-pre-wrap">{value}</p>
      ) : (
        <span className="text-text-secondary">{value}</span>
      )}
    </div>
  );
}
