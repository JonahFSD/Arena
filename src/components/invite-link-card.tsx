"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { buildInvitePath } from "@/lib/referral";

export function InviteLinkCard({ referralCode }: { referralCode: string }) {
  const [fullUrl, setFullUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFullUrl(`${window.location.origin}${buildInvitePath(referralCode)}`);
  }, [referralCode]);

  async function copyLink() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Could not copy. Select the link and copy manually.");
    }
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardTitle>Unique Invite Link</CardTitle>
      <CardDescription className="mt-1">
        Invite your friends to join 021. Approved members you invited will earn you 500
        points each.
      </CardDescription>
      <div className="relative mt-4 rounded-lg border border-border-default bg-surface-elevated">
        <input
          type="text"
          readOnly
          value={fullUrl || buildInvitePath(referralCode)}
          className="w-full min-w-0 bg-transparent py-2.5 pl-3 pr-12 text-xs font-mono text-text-primary"
          aria-label="Unique invite URL"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={copyLink}
              disabled={!fullUrl}
              className="rounded-md p-2 text-text-muted transition-colors hover:bg-surface-overlay hover:text-brand-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
              aria-label="Copy link to clipboard"
            >
              <Copy className="h-4 w-4" aria-hidden />
            </button>
            {copied && (
              <span
                role="status"
                className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-default bg-surface-elevated px-2 py-1 text-xs font-medium text-text-primary shadow-elevated"
              >
                Copied
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
