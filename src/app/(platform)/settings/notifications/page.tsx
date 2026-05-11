"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Save, Check } from "lucide-react";
import {
  platformPaneBleedClass,
  platformPaneCellPaddingClass,
  platformPaneGridCellFillClass,
  platformPaneStackGapClass,
  platformPaneTileClass,
} from "@/lib/platform-pane-grid";

type PreferenceKey =
  | "aiScoringEmail"
  | "aiScoringSms"
  | "votingRoundEmail"
  | "votingRoundSms"
  | "winnersEmail"
  | "winnersSms"
  | "monthlyRecapEmail"
  | "monthlyRecapSms"
  | "newMessagesEmail"
  | "newMessagesSms"
  | "communityUpdatesEmail"
  | "communityUpdatesSms";

type Preferences = Record<PreferenceKey, boolean>;

const NOTIFICATIONS: {
  label: string;
  description: string;
  emailKey: PreferenceKey;
  smsKey: PreferenceKey;
}[] = [
  {
    label: "AI scoring complete",
    description: "When your pitch has been scored by AI",
    emailKey: "aiScoringEmail",
    smsKey: "aiScoringSms",
  },
  {
    label: "Voting round opens",
    description: "When a new monthly voting round begins",
    emailKey: "votingRoundEmail",
    smsKey: "votingRoundSms",
  },
  {
    label: "Winners announced",
    description: "Monthly winner announcements",
    emailKey: "winnersEmail",
    smsKey: "winnersSms",
  },
  {
    label: "Monthly recap",
    description: "Overview of how well you performed",
    emailKey: "monthlyRecapEmail",
    smsKey: "monthlyRecapSms",
  },
  {
    label: "New messages",
    description: "Direct messages from community members",
    emailKey: "newMessagesEmail",
    smsKey: "newMessagesSms",
  },
  {
    label: "Community updates",
    description: "New members, features, and announcements",
    emailKey: "communityUpdatesEmail",
    smsKey: "communityUpdatesSms",
  },
];

const notifRowClass =
  "flex min-h-0 items-center justify-between gap-4 p-3 rounded-none";

export default function SettingsNotificationsPage() {
  const serverPrefs = useQuery(api.users.getNotificationPreferences);
  const updatePrefs = useMutation(api.users.updateNotificationPreferences);

  const [local, setLocal] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync server prefs into local state (only on initial load)
  useEffect(() => {
    if (serverPrefs && !local) {
      setLocal(serverPrefs as Preferences);
    }
  }, [serverPrefs, local]);

  const prefs = local ?? (serverPrefs as Preferences | undefined);

  const toggle = (key: PreferenceKey) => {
    if (!prefs) return;
    setLocal({ ...prefs, [key]: !prefs[key] });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!local) return;
    setSaving(true);
    try {
      await updatePrefs({ preferences: local });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in w-full">
      <div className={cn("rounded-none overflow-hidden", platformPaneBleedClass)}>
        {/* Header row */}
        <div
          className={cn(
            platformPaneGridCellFillClass,
            platformPaneCellPaddingClass
          )}
        >
          <Card className={platformPaneTileClass}>
            <div className="flex items-center justify-between">
              <CardTitle>Notification Preferences</CardTitle>
              <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
                <span className="w-12 text-center">Email</span>
                <span className="w-12 text-center">SMS</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Notification rows */}
        <div
          className={cn(
            "border-t border-solid border-border-default",
            platformPaneGridCellFillClass,
            platformPaneCellPaddingClass
          )}
        >
          <div className={cn(platformPaneStackGapClass)}>
            {NOTIFICATIONS.map((notif) => (
              <div
                key={notif.label}
                className={cn(
                  notifRowClass,
                  platformPaneGridCellFillClass
                )}
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
                  <label className="flex w-12 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={prefs?.[notif.emailKey] ?? true}
                      onChange={() => toggle(notif.emailKey)}
                      className="h-4 w-4 cursor-pointer rounded border-border-strong accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-surface-card"
                    />
                  </label>
                  <label className="flex w-12 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={prefs?.[notif.smsKey] ?? false}
                      onChange={() => toggle(notif.smsKey)}
                      className="h-4 w-4 cursor-pointer rounded border-border-strong accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 focus:ring-offset-surface-card"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div
          className={cn(
            "border-t border-solid border-border-default",
            platformPaneGridCellFillClass,
            platformPaneCellPaddingClass
          )}
        >
          <Card className={platformPaneTileClass}>
            <Button
              variant="brand"
              leftIcon={
                saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )
              }
              onClick={handleSave}
              isLoading={saving}
            >
              {saved ? "Saved" : "Save Preferences"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
