-- ============================================
-- Team Submissions: Collaborative Pitches
-- ============================================

-- Add team flag to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_team_submission BOOLEAN DEFAULT false;

-- Collaborators junction table
CREATE TABLE submission_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('lead', 'collaborator')),
  revenue_split_pct NUMERIC(5,2) NOT NULL CHECK (revenue_split_pct >= 0 AND revenue_split_pct <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id)
);

-- Indexes
CREATE INDEX idx_collab_submission ON submission_collaborators(submission_id);
CREATE INDEX idx_collab_user_status ON submission_collaborators(user_id, status);

-- RLS
ALTER TABLE submission_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborators can read rows they're part of
CREATE POLICY collab_read ON submission_collaborators FOR SELECT USING (
  user_id = auth.uid()
  OR invited_by = auth.uid()
  OR EXISTS (SELECT 1 FROM submissions WHERE submissions.id = submission_collaborators.submission_id AND submissions.user_id = auth.uid())
);

-- Lead (submission owner) can insert/update/delete collaborators
CREATE POLICY collab_manage ON submission_collaborators FOR ALL USING (
  EXISTS (SELECT 1 FROM submissions WHERE submissions.id = submission_collaborators.submission_id AND submissions.user_id = auth.uid())
);

-- Collaborators can update their own status (accept/decline)
CREATE POLICY collab_respond ON submission_collaborators FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- Admins can read all
CREATE POLICY collab_admin ON submission_collaborators FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'superadmin'))
);
