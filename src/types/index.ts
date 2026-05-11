// ============================================
// Database Types for ACU Youth Venture Platform
// ============================================

export type UserRole = "member" | "admin" | "superadmin";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "more_info";

export type MembershipStatus = "active" | "past_due" | "cancelled" | "trialing";

export type SubmissionStatus = "draft" | "submitted" | "scored";

export type VotingRoundStatus = "upcoming" | "open" | "closed" | "finalized";

export type PayoutStatus = "pending" | "paid" | "failed";

export type NotificationType =
  | "submission_received"
  | "ai_score_ready"
  | "voting_open"
  | "vote_received"
  | "winner_announced"
  | "payout_sent"
  | "application_approved"
  | "application_rejected"
  | "new_message"
  | "venture_studio_flagged";

// ============================================
// Core Entities
// ============================================

export type BQType =
  | "Anchor"
  | "Visionary"
  | "Operator"
  | "Catalyst"
  | "Strategist"
  | "Builder";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  school_name: string | null;
  graduation_year: number | null;
  age: number | null;
  state: string | null;
  role: UserRole;
  skills: string[];
  looking_for_cofounders: boolean;
  bq_type: BQType | null;
  bq_results_url: string | null;
  network_count: number;
  total_earnings: number;
  avg_ai_score: number | null;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_email: string;
  full_name: string;
  age: number;
  school: string;
  graduation_year: number;
  faith_statement: string;
  entrepreneurship_interest: string;
  ai_interest: string;
  video_intro_url: string | null;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  status: ApplicationStatus;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: MembershipStatus;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export type CollaboratorRole = "lead" | "collaborator";

export type CollaboratorStatus = "pending" | "accepted" | "declined";

export interface SubmissionCollaborator {
  id: string;
  submission_id: string;
  user_id: string;
  invited_by: string;
  role: CollaboratorRole;
  revenue_split_pct: number;
  status: CollaboratorStatus;
  accepted_at: string | null;
  created_at: string;
  user?: User;
}

export interface Submission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string | null;
  video_thumbnail_url: string | null;
  github_url: string | null;
  website_url: string | null;
  slide_deck_url: string | null;
  additional_links: Record<string, string>;
  month_year: string;
  status: SubmissionStatus;
  is_team_submission: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  user?: User;
  ai_score?: AIScore;
  vote_count?: number;
  collaborators?: SubmissionCollaborator[];
}

export interface AIScore {
  id: string;
  submission_id: string;
  rubric_version: string;
  overall_score: number;
  category_scores: CategoryScore[];
  qualitative_feedback: string;
  model_used: string;
  scored_at: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  max_score: number;
  feedback: string;
}

export interface VotingRound {
  id: string;
  month_year: string;
  opens_at: string;
  closes_at: string;
  min_score_threshold: number;
  status: VotingRoundStatus;
  submissions?: Submission[];
}

export interface Vote {
  id: string;
  voting_round_id: string;
  voter_user_id: string;
  submission_id: string;
  created_at: string;
}

export interface PrizePlacement {
  user_id: string | null;
  place: 1 | 2 | 3;
  pct: number;
  amount: number;
  user?: User;
}

export interface PrizePool {
  id: string;
  month_year: string;
  total_collected: number;
  operational_fee_pct: number;
  net_prize: number;
  first_place_pct: number;
  second_place_pct: number;
  third_place_pct: number;
  first_place_user_id: string | null;
  second_place_user_id: string | null;
  third_place_user_id: string | null;
  payout_status: PayoutStatus;
  stripe_transfer_id: string | null;
  finalized_at: string | null;
  placements?: PrizePlacement[];
}

export interface Message {
  id: string;
  thread_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: User;
  recipient?: User;
}

export interface MessageThread {
  thread_id: string;
  other_user: User;
  last_message: Message;
  unread_count: number;
}

export interface VentureStudioFlag {
  id: string;
  user_id: string;
  flagged_by_admin_id: string;
  notes: string;
  created_at: string;
  user?: User;
  admin?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

// ============================================
// Bounties
// ============================================

export type BountyStatus = "active" | "reviewing" | "completed" | "cancelled";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  founder_name: string;
  founder_company: string;
  bounty_amount: number;
  due_date: string;
  status: BountyStatus;
  requirements: string[];
  submissions_count: number;
  winner_submission_id: string | null;
  created_at: string;
}

export interface BountySubmission {
  id: string;
  bounty_id: string;
  user_id: string;
  is_team: boolean;
  submission_url: string;
  notes: string | null;
  is_winner: boolean;
  submitted_at: string;
  user?: User;
  collaborators?: SubmissionCollaborator[];
}

// ============================================
// Dashboard / Analytics
// ============================================

export interface DashboardStats {
  total_members: number;
  active_submissions: number;
  current_pool: number;
  pending_applications: number;
  members_growth: number;
  submissions_growth: number;
}

export interface MonthlyMetrics {
  month: string;
  members: number;
  submissions: number;
  pool_amount: number;
  votes_cast: number;
}
