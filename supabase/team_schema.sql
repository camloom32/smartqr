-- Team Members Table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  member_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(owner_id, member_email)
);

-- RLS for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Owner can view/manage their team
CREATE POLICY "Owner can view team members"
  ON public.team_members FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can insert team members"
  ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can delete team members"
  ON public.team_members FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can update team members"
  ON public.team_members FOR UPDATE
  USING (auth.uid() = owner_id);

-- Update tiers seed to reflect new limits
UPDATE public.tiers SET max_active_codes = 5 WHERE id = 'starter';
UPDATE public.tiers SET max_active_codes = 25 WHERE id = 'growth';
