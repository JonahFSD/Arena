-- Enable RLS on the two missing tables
ALTER TABLE voting_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;
