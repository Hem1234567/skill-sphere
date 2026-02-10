
-- Hackathons table
CREATE TABLE public.hackathons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  banner_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  max_team_size INTEGER NOT NULL DEFAULT 4,
  min_team_size INTEGER NOT NULL DEFAULT 1,
  prizes TEXT,
  rules TEXT,
  themes TEXT[] DEFAULT '{}'::TEXT[],
  status TEXT NOT NULL DEFAULT 'upcoming',
  is_published BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published hackathons" ON public.hackathons FOR SELECT USING (is_published = true);
CREATE POLICY "Admins full access hackathons" ON public.hackathons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON public.hackathons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Teams table
CREATE TABLE public.hackathon_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hackathon_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.hackathon_teams FOR SELECT USING (true);
CREATE POLICY "Auth users can create teams" ON public.hackathon_teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update teams" ON public.hackathon_teams FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Leaders can delete teams" ON public.hackathon_teams FOR DELETE USING (auth.uid() = leader_id);
CREATE POLICY "Admins full access teams" ON public.hackathon_teams FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Team leaders can manage members" ON public.team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.hackathon_teams WHERE id = team_id AND leader_id = auth.uid())
);
CREATE POLICY "Admins full access members" ON public.team_members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Project submissions table
CREATE TABLE public.hackathon_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_description TEXT,
  github_url TEXT,
  demo_url TEXT,
  video_url TEXT,
  tech_stack TEXT[] DEFAULT '{}'::TEXT[],
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hackathon_id, team_id)
);

ALTER TABLE public.hackathon_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions" ON public.hackathon_submissions FOR SELECT USING (true);
CREATE POLICY "Team leaders can submit" ON public.hackathon_submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hackathon_teams WHERE id = team_id AND leader_id = auth.uid())
);
CREATE POLICY "Team leaders can update submissions" ON public.hackathon_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hackathon_teams WHERE id = team_id AND leader_id = auth.uid())
);
CREATE POLICY "Admins full access submissions" ON public.hackathon_submissions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hackathon_submissions_updated_at BEFORE UPDATE ON public.hackathon_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scores/judging table
CREATE TABLE public.hackathon_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.hackathon_submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  innovation_score INTEGER NOT NULL DEFAULT 0,
  technical_score INTEGER NOT NULL DEFAULT 0,
  design_score INTEGER NOT NULL DEFAULT 0,
  presentation_score INTEGER NOT NULL DEFAULT 0,
  comments TEXT,
  scored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id, judge_id)
);

ALTER TABLE public.hackathon_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scores" ON public.hackathon_scores FOR SELECT USING (true);
CREATE POLICY "Admins can score" ON public.hackathon_scores FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
