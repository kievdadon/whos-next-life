-- Create worker profiles table for people who want to do gigs
CREATE TABLE IF NOT EXISTS public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  profile_photo_url text,
  date_of_birth date,
  phone text,
  bio text,
  skills text[] DEFAULT '{}',
  hourly_rate_min numeric,
  hourly_rate_max numeric,
  availability text,
  years_experience integer,
  portfolio_url text,
  is_verified boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_jobs_completed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create gigs table for actual gig postings
CREATE TABLE IF NOT EXISTS public.gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by_user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget_min numeric NOT NULL,
  budget_max numeric,
  budget_type text NOT NULL DEFAULT 'per hour', -- 'per hour', 'fixed', 'per day'
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  duration_estimate text,
  urgency text DEFAULT 'Next Week', -- 'ASAP', 'This Weekend', 'Next Week', etc.
  requirements text[] DEFAULT '{}',
  status text DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
  assigned_to_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create gig applications table
CREATE TABLE IF NOT EXISTS public.gig_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  applicant_user_id uuid NOT NULL,
  worker_profile_id uuid REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  cover_message text,
  proposed_rate numeric,
  estimated_completion_time text,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(gig_id, applicant_user_id)
);

-- Enable RLS
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for worker_profiles
CREATE POLICY "Anyone can view worker profiles"
ON public.worker_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own worker profile"
ON public.worker_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own worker profile"
ON public.worker_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for gigs
CREATE POLICY "Anyone can view open gigs"
ON public.gigs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can post gigs"
ON public.gigs
FOR INSERT
TO authenticated
WITH CHECK (posted_by_user_id = auth.uid());

CREATE POLICY "Gig posters can update their own gigs"
ON public.gigs
FOR UPDATE
TO authenticated
USING (posted_by_user_id = auth.uid());

CREATE POLICY "Gig posters can delete their own gigs"
ON public.gigs
FOR DELETE
TO authenticated
USING (posted_by_user_id = auth.uid());

-- RLS Policies for gig_applications
CREATE POLICY "Applicants and gig posters can view applications"
ON public.gig_applications
FOR SELECT
TO authenticated
USING (
  applicant_user_id = auth.uid() OR
  gig_id IN (SELECT id FROM public.gigs WHERE posted_by_user_id = auth.uid())
);

CREATE POLICY "Users can create applications"
ON public.gig_applications
FOR INSERT
TO authenticated
WITH CHECK (applicant_user_id = auth.uid());

CREATE POLICY "Applicants can update their own applications"
ON public.gig_applications
FOR UPDATE
TO authenticated
USING (applicant_user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_worker_profiles_user_id ON public.worker_profiles(user_id);
CREATE INDEX idx_gigs_status ON public.gigs(status);
CREATE INDEX idx_gigs_category ON public.gigs(category);
CREATE INDEX idx_gig_applications_gig_id ON public.gig_applications(gig_id);
CREATE INDEX idx_gig_applications_applicant_user_id ON public.gig_applications(applicant_user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER handle_worker_profiles_updated_at
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_gigs_updated_at
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_gig_applications_updated_at
  BEFORE UPDATE ON public.gig_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();