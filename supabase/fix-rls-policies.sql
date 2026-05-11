-- ============================================
-- Fix missing RLS policies for prize_pools and voting_rounds
-- Run this in the Supabase SQL Editor
-- ============================================

-- VOTING ROUNDS: readable by all authenticated members, managed by admins
CREATE POLICY voting_rounds_read ON voting_rounds FOR SELECT USING (true);
CREATE POLICY voting_rounds_admin ON voting_rounds FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'superadmin'))
);

-- PRIZE POOLS: readable by all authenticated members, managed by admins
CREATE POLICY prize_pools_read ON prize_pools FOR SELECT USING (true);
CREATE POLICY prize_pools_admin ON prize_pools FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'superadmin'))
);
