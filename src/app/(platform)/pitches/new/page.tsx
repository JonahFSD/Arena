"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/contexts/user-context";
import { Card, CardTitle } from "@/components/ui/card";
import { InfoCallout } from "@/components/ui/info-callout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PaywallGate } from "@/components/auth/paywall-gate";
import {
  Upload,
  Video,
  Code,
  Globe,
  FileText,
  Link2,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle,
  Users,
  User,
  Search,
  Percent,
  AlertTriangle,
  Shield,
  Clock,
  Handshake,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  school: string;
  splitPct: number;
  status: "pending" | "accepted" | "declined";
}

export default function NewSubmissionPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const createSubmission = useMutation(api.submissions.create);
  const submitSubmission = useMutation(api.submissions.submit);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const inviteCollaborator = useMutation(api.collaborators.invite);
  const membersData = useQuery(api.users.listMembers, {});

  const availableMembers = (membersData ?? [])
    .filter((m) => m._id !== currentUser?._id)
    .map((m) => ({
      id: m._id,
      name: m.fullName,
      school: m.schoolName ?? "",
    }));

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [slideDeckUrl, setSlideDeckUrl] = useState("");
  const [additionalLinks, setAdditionalLinks] = useState<
    { label: string; url: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Team state
  const [isTeam, setIsTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const steps = [
    { label: "Pitch Details" },
    { label: "Team" },
    { label: "Video Upload" },
    { label: "Supporting Links" },
    { label: "Review & Submit" },
  ];

  // Team helpers
  const MAX_TEAM = 4;
  const leadSplit =
    100 - teamMembers.reduce((sum, m) => sum + m.splitPct, 0);
  const splitsValid = isTeam ? leadSplit >= 0 && leadSplit <= 100 : true;
  const allAccepted =
    !isTeam || teamMembers.every((m) => m.status === "accepted");
  const canSubmit = splitsValid && (isTeam ? teamMembers.length > 0 : true);

  const filteredMembers = availableMembers.filter(
    (m) =>
      !teamMembers.find((tm) => tm.id === m.id) &&
      (m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.school.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const addMember = (member: (typeof availableMembers)[0]) => {
    if (teamMembers.length >= MAX_TEAM - 1) return;
    setTeamMembers([
      ...teamMembers,
      {
        ...member,
        splitPct: 0,
        status: "pending",
      },
    ]);
    setMemberSearch("");
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  const updateSplit = (id: string, pct: number) => {
    setTeamMembers(
      teamMembers.map((m) =>
        m.id === id ? { ...m, splitPct: Math.min(100, Math.max(0, pct)) } : m
      )
    );
  };

  const userName = currentUser?.fullName ?? "You";

  // Compute current monthYear for submission (format: YYYY-MM)
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Upload video file to Convex storage if present
      let videoStorageId: string | undefined;
      if (videoFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": videoFile.type },
          body: videoFile,
        });
        if (!result.ok) throw new Error("Video upload failed");
        const json = await result.json();
        videoStorageId = json.storageId;
      }

      const submissionId = await createSubmission({
        title,
        description,
        videoStorageId: videoStorageId as any,
        githubUrl: githubUrl || undefined,
        websiteUrl: websiteUrl || undefined,
        slideDeckUrl: slideDeckUrl || undefined,
        additionalLinks:
          additionalLinks.length > 0
            ? additionalLinks.filter((l) => l.url.trim() !== "")
            : undefined,
        monthYear,
        isTeamSubmission: isTeam,
      });

      // Invite team collaborators if this is a team submission
      if (isTeam && teamMembers.length > 0) {
        await Promise.all(
          teamMembers.map((member) =>
            inviteCollaborator({
              submissionId,
              userId: member.id as any,
              role: "collaborator",
              revenueSplitPct: member.splitPct,
            })
          )
        );
      }

      await submitSubmission({ submissionId });
      router.push("/pitches");
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <PaywallGate feature="submit pitches">
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                i <= step
                  ? "bg-brand-500 text-black"
                  : "bg-surface-elevated text-text-muted"
              }`}
            >
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                i <= step ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  i < step ? "bg-brand-500" : "bg-border-default"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {/* Step 1: Pitch Details */}
        {step === 0 && (
          <div className="space-y-5 animate-fade-in">
            <CardTitle>Pitch Details</CardTitle>
            <Input
              label="Pitch Title"
              placeholder="Give your venture a compelling name"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Description"
              placeholder="Describe your venture idea, the problem it solves, and who it helps..."
              hint="Be clear and concise. Judges will read this alongside your video. (50-500 words)"
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {/* Step 2: Team */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <CardTitle>Team Setup</CardTitle>

            {/* Solo / Team Toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsTeam(false);
                  setTeamMembers([]);
                }}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  !isTeam
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-border-default bg-surface-elevated hover:border-border-strong"
                }`}
              >
                <User
                  className={`h-5 w-5 ${!isTeam ? "text-brand-500" : "text-text-tertiary"}`}
                />
                <div className="text-left">
                  <p className={`text-sm font-medium ${!isTeam ? "text-brand-500" : "text-text-primary"}`}>Solo</p>
                  <p className="text-xs text-text-muted">Submit on your own</p>
                </div>
              </button>
              <button
                onClick={() => setIsTeam(true)}
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isTeam
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-border-default bg-surface-elevated hover:border-border-strong"
                }`}
              >
                <Users className={`h-5 w-5 ${isTeam ? "text-brand-500" : "text-text-tertiary"}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${isTeam ? "text-brand-500" : "text-text-primary"}`}>Team</p>
                  <p className="text-xs text-text-muted">Up to {MAX_TEAM} members</p>
                </div>
              </button>
            </div>

            {isTeam && (
              <>
                <div className="relative">
                  <Input
                    label="Invite Members"
                    placeholder="Search by name or school..."
                    leftIcon={<Search className="h-4 w-4" />}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    hint={`${teamMembers.length + 1}/${MAX_TEAM} team members`}
                  />
                  {memberSearch && (
                    <div className="absolute z-10 left-0 right-0 top-[72px] bg-surface-elevated border border-border-default rounded-xl shadow-elevated overflow-hidden">
                      {filteredMembers.length === 0 ? (
                        <div className="p-3 text-sm text-text-muted text-center">No members found</div>
                      ) : (
                        filteredMembers.slice(0, 5).map((member) => (
                          <button
                            key={member.id}
                            onClick={() => addMember(member)}
                            disabled={teamMembers.length >= MAX_TEAM - 1}
                            className="w-full flex items-center gap-3 p-3 hover:bg-surface-overlay transition-colors text-left disabled:opacity-50"
                          >
                            <Avatar name={member.name} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">{member.name}</p>
                              <p className="text-xs text-text-muted">{member.school}</p>
                            </div>
                            <Plus className="h-4 w-4 text-brand-500 ml-auto" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {teamMembers.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-text-secondary">Revenue Split</label>
                      <div className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-text-muted" />
                        <span className={`text-xs font-medium ${splitsValid ? "text-text-muted" : "text-error"}`}>Must total 100%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20">
                      <Avatar name={userName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">You (Lead)</p>
                          <Badge variant="brand">Lead</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-lg font-medium ${leadSplit >= 0 ? "text-brand-500" : "text-error"}`}>{leadSplit}%</span>
                        <span className="text-xs text-text-muted">(auto)</span>
                      </div>
                    </div>

                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-default bg-surface-elevated">
                        <Avatar name={member.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                            <Badge variant={member.status === "accepted" ? "success" : member.status === "declined" ? "error" : "warning"}>
                              {member.status === "accepted" ? (<><CheckCircle className="h-3 w-3 mr-0.5" />Accepted</>) : member.status === "declined" ? "Declined" : (<><Clock className="h-3 w-3 mr-0.5" />Pending</>)}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-muted">{member.school}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} max={100} value={member.splitPct} onChange={(e) => updateSplit(member.id, Number(e.target.value) || 0)} className="w-16 h-9 px-2 rounded-lg text-sm text-center bg-surface-primary border border-border-default text-text-primary focus:outline-none focus:border-white" />
                          <span className="text-sm text-text-muted">%</span>
                          <button onClick={() => removeMember(member.id)} className="p-1.5 rounded-lg hover:bg-surface-overlay text-text-tertiary hover:text-error transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {!splitsValid && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
                        <AlertTriangle className="h-4 w-4 text-error flex-shrink-0" />
                        <p className="text-xs text-error">Revenue splits must total exactly 100%. Currently at {100 - leadSplit + teamMembers.reduce((s, m) => s + m.splitPct, 0)}%.</p>
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/10">
                      <Shield className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-text-secondary">
                        <span className="font-medium text-warning">Revenue Split Agreement:</span>{" "}
                        All team members must accept the proposed split before submission. Once submitted, the split cannot be changed and serves as a binding agreement for prize distribution.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Video Upload */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <CardTitle>Video Pitch</CardTitle>
            <p className="text-sm text-text-secondary">Record a 2-5 minute video pitching your idea. Be passionate, clear, and concise.</p>

            {!videoFile ? (
              <label className="flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-border-default bg-surface-elevated hover:bg-surface-overlay hover:border-brand-500/30 transition-all cursor-pointer group">
                <div className="p-4 rounded-2xl bg-brand-500/10 text-brand-500 mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-text-primary">Drag & drop or click to upload</p>
                <p className="text-xs text-text-muted mt-1">MP4, MOV, or WebM &bull; Max 500MB &bull; 2-5 minutes</p>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
              </label>
            ) : (
              <div className="p-4 rounded-xl border border-border-default bg-surface-elevated">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-500/10"><Video className="h-5 w-5 text-brand-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{videoFile.name}</p>
                      <p className="text-xs text-text-muted">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => setVideoFile(null)} className="p-1.5 rounded-lg hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Progress value={100} size="sm" className="mt-3" />
              </div>
            )}

            <div className="p-4 rounded-xl bg-surface-elevated border border-border-default">
              <h4 className="text-sm font-medium text-text-primary mb-2">Tips for a great pitch video:</h4>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                <li>&bull; Start with the customer &amp; their problem</li>
                <li>&bull; Explain your solution &amp; its defensibility</li>
                <li>&bull; Articulate your plan to launch &amp; scale</li>
                <li>&bull; End with realistic revenue projections</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Supporting Links */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <CardTitle>Supporting Materials</CardTitle>
            <p className="text-sm text-text-secondary">Add links to demonstrate your work (all optional)</p>
            <Input label="GitHub Repository" type="url" placeholder="https://github.com/your-repo" leftIcon={<Code className="h-4 w-4" />} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
            <Input label="Website / Demo" type="url" placeholder="https://your-project.com" leftIcon={<Globe className="h-4 w-4" />} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
            <Input label="Slide Deck" type="url" placeholder="https://docs.google.com/presentation/..." leftIcon={<FileText className="h-4 w-4" />} value={slideDeckUrl} onChange={(e) => setSlideDeckUrl(e.target.value)} />

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-secondary">Additional Links</label>
              {additionalLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Label" className="w-1/3" value={link.label} onChange={(e) => { const updated = [...additionalLinks]; updated[i].label = e.target.value; setAdditionalLinks(updated); }} />
                  <Input placeholder="URL" className="flex-1" value={link.url} leftIcon={<Link2 className="h-4 w-4" />} onChange={(e) => { const updated = [...additionalLinks]; updated[i].url = e.target.value; setAdditionalLinks(updated); }} />
                  <button onClick={() => setAdditionalLinks(additionalLinks.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-surface-overlay text-text-tertiary"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setAdditionalLinks([...additionalLinks, { label: "", url: "" }])} leftIcon={<Plus className="h-4 w-4" />}>Add Link</Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <CardTitle>Review & Submit</CardTitle>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-elevated border border-border-default">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Pitch Title</h4>
                <p className="text-sm text-text-primary">{title || "(No title)"}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated border border-border-default">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Submission Type</h4>
                <div className="flex items-center gap-2">
                  {isTeam ? (<><Users className="h-4 w-4 text-brand-500" /><p className="text-sm text-text-primary">Team Submission ({teamMembers.length + 1} members)</p></>) : (<><User className="h-4 w-4 text-brand-500" /><p className="text-sm text-text-primary">Solo Submission</p></>)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated border border-border-default">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Video</h4>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-brand-500" />
                  <p className="text-sm text-text-primary">{videoFile?.name || "No video uploaded"}</p>
                </div>
              </div>

              {isTeam && teamMembers.length > 0 && (
                <div className="rounded-xl border-2 border-brand-500/30 overflow-hidden">
                  <div className="bg-brand-500/10 px-4 py-3 flex items-center gap-2">
                    <Handshake className="h-4 w-4 text-brand-500" />
                    <h4 className="text-sm font-medium text-brand-500">Revenue Split Agreement</h4>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated">
                      <div className="flex items-center gap-2"><Avatar name={userName} size="sm" /><div><p className="text-sm font-medium text-text-primary">{userName}</p><Badge variant="brand" className="mt-0.5">Lead</Badge></div></div>
                      <span className="text-lg font-medium text-brand-500">{leadSplit}%</span>
                    </div>
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated">
                        <div className="flex items-center gap-2"><Avatar name={member.name} size="sm" /><div><p className="text-sm font-medium text-text-primary">{member.name}</p><Badge variant={member.status === "accepted" ? "success" : "warning"} className="mt-0.5">{member.status === "accepted" ? "Accepted" : "Pending"}</Badge></div></div>
                        <span className="text-lg font-medium text-text-primary">{member.splitPct}%</span>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between">
                      <span className="text-xs text-text-muted">Total</span>
                      <span className={`text-sm font-medium ${leadSplit + teamMembers.reduce((s, m) => s + m.splitPct, 0) === 100 ? "text-success" : "text-error"}`}>{leadSplit + teamMembers.reduce((s, m) => s + m.splitPct, 0)}%</span>
                    </div>
                  </div>
                  <div className="bg-warning/5 px-4 py-3 border-t border-warning/10">
                    <p className="text-xs text-text-secondary"><Shield className="h-3 w-3 text-warning inline mr-1" /><span className="font-medium text-warning">This split cannot be changed after submission.</span> By submitting, all parties agree to this revenue distribution for any prizes won.</p>
                  </div>
                </div>
              )}

              {!allAccepted && isTeam && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                  <p className="text-xs text-warning">All team members must accept the invitation before you can submit. Pending members will receive a notification.</p>
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
                  <AlertTriangle className="h-4 w-4 text-error flex-shrink-0" />
                  <p className="text-xs text-error">{submitError}</p>
                </div>
              )}

              <InfoCallout padding="sm">
                <p className="text-sm text-text-secondary">By submitting, your pitch will be processed by our AI judging engine. You&apos;ll receive detailed feedback within 24-48 hours. Top scoring pitches qualify for community voting.</p>
              </InfoCallout>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-default">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0} leftIcon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
          {step < steps.length - 1 ? (
            <Button variant="brand" onClick={() => setStep(step + 1)} disabled={step === 1 && isTeam && !splitsValid} rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</Button>
          ) : (
            <Button variant="brand" onClick={handleSubmit} isLoading={isSubmitting} disabled={isTeam && !allAccepted} rightIcon={<Send className="h-4 w-4" />}>Submit Pitch</Button>
          )}
        </div>
      </Card>
    </div>
    </PaywallGate>
  );
}
