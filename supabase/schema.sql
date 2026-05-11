-- ============================================
-- ACU Youth Venture Community Platform
-- Database Schema for Supabase (PostgreSQL)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  school_name TEXT,
  graduation_year INTEGER,
  age INTEGER CHECK (age >= 14 AND age <= 18),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'superadmin')),
  skills TEXT[] DEFAULT '{}',
  looking_for_cofounders BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS
-- ============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 14 AND age <= 18),
  school TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  faith_statement TEXT NOT NULL,
  entrepreneurship_interest TEXT NOT NULL,
  ai_interest TEXT NOT NULL,
  video_intro_url TEXT,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info')),
  reviewer_id UUID REFERENCES users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMBERSHIPS
-- ============================================
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBMISSIONS
-- ============================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT,
  video_thumbnail_url TEXT,
  github_url TEXT,
  website_url TEXT,
  slide_deck_url TEXT,
  additional_links JSONB DEFAULT '{}',
  month_year TEXT NOT NULL, -- e.g., '2026-03'
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'scored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI SCORES
-- ============================================
CREATE TABLE ai_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rubric_version TEXT NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  category_scores JSONB NOT NULL,
  qualitative_feedback TEXT NOT NULL,
  model_used TEXT NOT NULL,
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOTING ROUNDS
-- ============================================
CREATE TABLE voting_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year TEXT NOT NULL UNIQUE,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  min_score_threshold INTEGER NOT NULL DEFAULT 80,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'closed', 'finalized'))
);

-- ============================================
-- VOTES
-- ============================================
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voting_round_id UUID NOT NULL REFERENCES voting_rounds(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voting_round_id, voter_user_id, submission_id)
);

-- ============================================
-- PRIZE POOLS
-- ============================================
CREATE TABLE prize_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year TEXT NOT NULL UNIQUE,
  total_collected INTEGER NOT NULL DEFAULT 0, -- in cents
  operational_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  net_prize INTEGER NOT NULL DEFAULT 0, -- in cents
  first_place_pct NUMERIC(5,2) NOT NULL DEFAULT 55.00,
  second_place_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  third_place_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  first_place_user_id UUID REFERENCES users(id),
  second_place_user_id UUID REFERENCES users(id),
  third_place_user_id UUID REFERENCES users(id),
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  finalized_at TIMESTAMPTZ
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT NOT NULL,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VENTURE STUDIO FLAGS
-- ============================================
CREATE TABLE venture_studio_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flagged_by_admin_id UUID NOT NULL REFERENCES users(id),
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_submissions_user_month ON submissions(user_id, month_year);
CREATE INDEX idx_submissions_month_status ON submissions(month_year, status);
CREATE INDEX idx_votes_round_submission ON votes(voting_round_id, submission_id);
CREATE INDEX idx_memberships_user_status ON memberships(user_id, status);
CREATE INDEX idx_applications_status_created ON applications(status, created_at);
CREATE INDEX idx_ai_scores_submission ON ai_scores(submission_id);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX idx_messages_recipient ON messages(recipient_user_id, read_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at);
CREATE INDEX idx_venture_flags_user ON venture_studio_flags(user_id);

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_studio_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles, update their own
CREATE POLICY users_read ON users FOR SELECT USING (true);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Members can read their own membership
CREATE POLICY memberships_read ON memberships FOR SELECT USING (auth.uid() = user_id);

-- Submissions visible to all members, writable by owner
CREATE POLICY submissions_read ON submissions FOR SELECT USING (true);
CREATE POLICY submissions_insert ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY submissions_update ON submissions FOR UPDATE USING (auth.uid() = user_id);

-- AI scores readable by submission owner
CREATE POLICY ai_scores_read ON ai_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM submissions WHERE submissions.id = ai_scores.submission_id AND submissions.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'superadmin'))
);

-- Votes: members can vote, see own votes
CREATE POLICY votes_read ON votes FOR SELECT USING (voter_user_id = auth.uid());
CREATE POLICY votes_insert ON votes FOR INSERT WITH CHECK (auth.uid() = voter_user_id);

-- Messages: participants only
CREATE POLICY messages_read ON messages FOR SELECT USING (
  auth.uid() = sender_user_id OR auth.uid() = recipient_user_id
);
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (auth.uid() = sender_user_id);

-- Notifications: own only
CREATE POLICY notifications_read ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Admin-only tables
CREATE POLICY applications_admin ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'superadmin'))
);
CREATE POLICY applications_insert ON applications FOR INSERT WITH CHECK (true);

CREATE POLICY venture_flags_admin ON venture_studio_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'superadmin'))
);

CREATE POLICY audit_admin ON audit_log FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'superadmin'))
);
