"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/contexts/user-context";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { CategorizedMultiSelectDropdown } from "@/components/ui/categorized-multi-select-dropdown";
import { PROFILE_SKILL_OPTIONS, PROFILE_TOOL_CATEGORIES } from "@/lib/profile-options";
import { US_STATE_ABBREVIATIONS } from "@/lib/us-states";
import {
  schoolToKey,
  keyToSchool,
  type NewSchoolPayload,
  type SchoolListing,
} from "@/lib/school-directory";
import { SchoolPicker } from "@/components/school-picker";
import { ProfilePhotoCropModal } from "@/components/profile-photo-crop-modal";
import { InviteLinkCard } from "@/components/invite-link-card";
import { cn } from "@/lib/utils";
import {
  User,
  CreditCard,
  Bell,
  Camera,
  Save,
  ExternalLink,
  CheckCircle,
  Handshake,
} from "lucide-react";

export default function SettingsPage() {
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const registerUpload = useMutation(api.storage.registerUpload);
  const updateAvatar = useMutation(api.users.updateAvatar);
  const referralCode = useQuery(api.users.getMyReferralCode);
  const generateReferralCode = useMutation(api.users.generateReferralCode);

  // Load avatar URL from Convex storage
  const storedAvatarUrl = useQuery(
    api.storage.getUrl,
    user?.avatarStorageId ? { storageId: user.avatarStorageId } : "skip"
  );

  const [skills, setSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [lookingForCofounders, setLookingForCofounders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Controlled fields for save
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const linkedinRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLSelectElement>(null);

  const [extraSchoolsByState, setExtraSchoolsByState] = useState<
    Record<string, SchoolListing[]>
  >({});
  const [selectedSchoolKey, setSelectedSchoolKey] = useState<string | null>(null);
  const [, setSchoolSubmissions] = useState<NewSchoolPayload[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  // Initialize state from user context when it loads
  useEffect(() => {
    if (!user) return;
    setSkills(user.skills ?? []);
    setLookingForCofounders(user.lookingForCofounders ?? false);
    if (user.schoolName) {
      // Try to reconstruct school key; fallback to just setting it from state+name
      const state = user.state ?? "TX";
      setSelectedSchoolKey(
        schoolToKey({ state, name: user.schoolName, city: "" })
      );
    }
  }, [user]);

  // Derived values from user
  const nameParts = user?.fullName?.split(" ") ?? [];
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";
  const email = user?.email ?? "";
  const avatarName = user?.fullName ?? "User";
  const bio = user?.bio ?? "";

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const newFirstName = firstNameRef.current?.value ?? firstName;
      const newLastName = lastNameRef.current?.value ?? lastName;
      const fullName = `${newFirstName} ${newLastName}`.trim();
      const bioValue = bioRef.current?.value ?? bio;

      // Extract school info from selected key
      let schoolName: string | undefined;
      let schoolState: string | undefined;
      if (selectedSchoolKey) {
        const parsed = keyToSchool(selectedSchoolKey);
        if (parsed) {
          schoolName = parsed.name;
          schoolState = parsed.state;
        }
      }

      const cityValue = cityRef.current?.value?.trim() || undefined;
      const stateValue = stateRef.current?.value || schoolState || undefined;

      const linkedinValue = linkedinRef.current?.value?.trim() || undefined;

      await updateProfile({
        fullName: fullName !== user.fullName ? fullName : undefined,
        bio: bioValue,
        linkedinUrl: linkedinValue,
        schoolName,
        city: cityValue,
        state: stateValue,
        skills,
        lookingForCofounders,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to save changes"
      );
    } finally {
      setSaving(false);
    }
  }

  function openPhotoPicker() {
    fileInputRef.current?.click();
  }

  function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      window.alert("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      window.alert("File must be 2MB or smaller.");
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
  }

  function closePhotoCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
  }

  async function onAvatarCropped(dataUrl: string) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
    setAvatarSrc(dataUrl); // optimistic local preview

    try {
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await uploadRes.json();

      // Register the upload (records ownership + validates size/MIME).
      // Must happen before updateAvatar — that mutation checks the
      // uploader matches the caller.
      await registerUpload({ storageId, purpose: "avatar" });

      // Save to user profile
      await updateAvatar({ storageId });
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    }
  }

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
    setSchoolSubmissions((prev) => [...prev, payload]);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <Tabs
        tabs={[
          { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
          { id: "subscription", label: "Subscription", icon: <CreditCard className="h-4 w-4" /> },
          { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
                  {/* Avatar */}
                  <Card className="flex h-full min-h-0 flex-col">
                    <CardTitle>Profile Photo</CardTitle>
                    <div className="mt-4 flex min-h-0 flex-1 flex-col justify-center">
                      <div className="flex items-center gap-6">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png"
                          className="sr-only"
                          aria-label="Upload profile photo, JPG or PNG, max 2MB"
                          onChange={onAvatarFileChange}
                        />
                        <div className="relative shrink-0">
                          <Avatar name={avatarName} size="2xl" src={avatarSrc ?? storedAvatarUrl} />
                          <button
                            type="button"
                            onClick={openPhotoPicker}
                            className="absolute -bottom-0.5 -right-0.5 rounded-full bg-surface-elevated p-2 text-text-primary border border-border-default hover:bg-surface-overlay transition-colors"
                            aria-label="Upload profile photo"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="min-w-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={openPhotoPicker}
                          >
                            Upload Photo
                          </Button>
                          <p className="text-xs text-text-muted mt-1">
                            JPG, PNG. Max 2MB.
                          </p>
                        </div>
                      </div>
                    </div>
                    <ProfilePhotoCropModal
                      isOpen={cropOpen && !!cropSrc}
                      imageSrc={cropSrc}
                      onClose={closePhotoCrop}
                      onSave={onAvatarCropped}
                    />
                  </Card>

                  {referralCode ? (
                    <InviteLinkCard referralCode={referralCode} />
                  ) : (
                    <Card className="flex h-full min-h-0 flex-col">
                      <CardTitle>Unique Invite Link</CardTitle>
                      <CardDescription className="mt-1">
                        Generate your invite link to share with friends. Approved members you invited will earn you 500 points each.
                      </CardDescription>
                      <div className="mt-4 flex flex-1 items-end">
                        <Button
                          variant="brand"
                          onClick={() => generateReferralCode()}
                        >
                          Generate Invite Link
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Personal Info */}
                <Card>
                  <CardTitle>Personal Information</CardTitle>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        ref={firstNameRef}
                        label="First Name"
                        defaultValue={firstName}
                        key={`first-${firstName}`}
                      />
                      <Input
                        ref={lastNameRef}
                        label="Last Name"
                        defaultValue={lastName}
                        key={`last-${lastName}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Email"
                        type="email"
                        defaultValue={email}
                        key={`email-${email}`}
                        disabled
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        ref={cityRef}
                        label="City"
                        defaultValue={user?.city ?? ""}
                        key={`city-${user?.city ?? ""}`}
                        autoComplete="address-level2"
                      />
                      <Select
                        ref={stateRef}
                        label="State"
                        options={US_STATE_ABBREVIATIONS.map((abbr) => ({
                          value: abbr,
                          label: abbr,
                        }))}
                        defaultValue={user?.state ?? "TX"}
                        key={`state-${user?.state ?? "TX"}`}
                      />
                    </div>
                    <SchoolPicker
                      value={selectedSchoolKey}
                      onChange={setSelectedSchoolKey}
                      extraSchoolsByState={extraSchoolsByState}
                      onAddSchool={handleAddSchool}
                    />
                    {user?.graduationYear ? (
                      <Input
                        label="Graduation Year"
                        defaultValue={String(user.graduationYear)}
                        disabled
                        hint="Set during sign-up and cannot be changed"
                      />
                    ) : null}
                    <Textarea
                      ref={bioRef}
                      label="Bio"
                      defaultValue={bio}
                      key={`bio-${bio}`}
                    />
                    <Input
                      ref={linkedinRef}
                      label="LinkedIn URL"
                      type="url"
                      placeholder="https://linkedin.com/in/yourname"
                      defaultValue={user?.linkedinUrl ?? ""}
                      key={`linkedin-${user?.linkedinUrl ?? ""}`}
                    />
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
                    <div className="flex flex-col">
                      <span className="mb-1 block text-xs font-medium text-text-muted">
                        Open to Cofounders
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={lookingForCofounders}
                        aria-label="Open to Cofounders"
                        onClick={() => setLookingForCofounders((v) => !v)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setLookingForCofounders((v) => !v);
                          }
                        }}
                        className={cn(
                          "relative h-9 w-[3.75rem] shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
                          lookingForCofounders
                            ? "border-brand-500 bg-brand-500/15"
                            : "border-border-default bg-surface-elevated"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none absolute left-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface-card shadow-sm transition-transform duration-200",
                            lookingForCofounders
                              ? "translate-x-7 text-brand-500"
                              : "translate-x-0 text-white"
                          )}
                        >
                          <Handshake className="h-4 w-4" aria-hidden />
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border-default flex items-center gap-3">
                    <Button
                      variant="brand"
                      leftIcon={<Save className="h-4 w-4" />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    {saveSuccess && (
                      <span className="text-sm text-success font-medium animate-fade-in">
                        Changes saved
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="space-y-6">
                {/* Current Plan */}
                <Card className="border border-dashed border-border-default">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>Youth Venture Membership</CardTitle>
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        $10/month &bull; 90% goes to the monthly prize pool
                      </CardDescription>
                    </div>
                    <p className="text-4xl font-light text-text-primary">
                      $10
                      <span className="text-sm font-normal text-text-muted">
                        /mo
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-surface-elevated border border-border-default">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        Current billing period
                      </span>
                      <span className="text-text-primary font-medium">
                        Mar 1 - Mar 31, 2026
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-text-secondary">Next payment</span>
                      <span className="text-text-primary font-medium">
                        April 1, 2026
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardTitle>Payment Method</CardTitle>
                  <div className="mt-4 p-4 rounded-xl border border-border-default flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface-elevated">
                        <CreditCard className="h-5 w-5 text-text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Visa ending in 4242
                        </p>
                        <p className="text-xs text-text-muted">
                          Expires 12/2027
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Update
                    </Button>
                  </div>
                </Card>

                {/* Billing Portal */}
                <Card>
                  <CardTitle>Billing Management</CardTitle>
                  <CardDescription>
                    Manage your invoices, update payment method, or cancel
                    your subscription through Stripe&apos;s billing portal.
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="mt-4"
                    rightIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Open Billing Portal
                  </Button>
                </Card>
              </div>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardTitle>Notification Preferences</CardTitle>
                <div className="mt-6 space-y-4">
                  {[
                    {
                      label: "AI scoring complete",
                      description: "When your pitch has been scored by AI",
                      email: true,
                      sms: true,
                    },
                    {
                      label: "Voting round opens",
                      description: "When a new monthly voting round begins",
                      email: true,
                      sms: true,
                    },
                    {
                      label: "Winners announced",
                      description: "Monthly winner announcements",
                      email: true,
                      sms: true,
                    },
                    {
                      label: "Monthly recap",
                      description: "Overview of how well you performed",
                      email: true,
                      sms: false,
                    },
                    {
                      label: "New messages",
                      description: "Direct messages from community members",
                      email: true,
                      sms: true,
                    },
                    {
                      label: "Community updates",
                      description: "New members, features, and announcements",
                      email: true,
                      sms: false,
                    },
                  ].map((notif) => (
                    <div
                      key={notif.label}
                      className="flex items-center justify-between gap-4 py-3 border-b border-border-subtle last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {notif.label}
                        </p>
                        <p className="text-xs text-text-muted">
                          {notif.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
                          <input
                            type="checkbox"
                            defaultChecked={notif.email}
                            className="h-4 w-4 cursor-pointer rounded border-border-strong accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-surface-card"
                          />
                          Email
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
                          <input
                            type="checkbox"
                            defaultChecked={notif.sms}
                            className="h-4 w-4 cursor-pointer rounded border-border-strong accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-surface-card"
                          />
                          SMS
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border-default">
                  <Button
                    variant="brand"
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save Preferences
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
