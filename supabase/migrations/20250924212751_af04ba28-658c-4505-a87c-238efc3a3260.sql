-- Create content moderation and community guidelines enforcement system

-- Create community guidelines violations table
CREATE TABLE public.community_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('hate_speech', 'harassment', 'inappropriate_content', 'spam', 'fraud', 'other')),
  content_type TEXT NOT NULL CHECK (content_type IN ('business_application', 'driver_application', 'product_description', 'business_description', 'website_content')),
  flagged_content TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken TEXT NOT NULL CHECK (action_taken IN ('warning', 'content_removed', 'temporary_ban', 'permanent_ban')),
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create user bans table
CREATE TABLE public.user_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('business_registration', 'driver_registration', 'platform_access', 'all_services')),
  ban_reason TEXT NOT NULL,
  banned_by TEXT, -- admin email who issued the ban
  ban_duration_days INTEGER, -- NULL for permanent bans
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  violation_id UUID REFERENCES public.community_violations(id)
);

-- Create user warnings table  
CREATE TABLE public.user_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  warning_reason TEXT NOT NULL,
  warning_message TEXT NOT NULL,
  issued_by TEXT, -- system or admin email
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  violation_id UUID REFERENCES public.community_violations(id)
);

-- Enable RLS on all tables
ALTER TABLE public.community_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_violations
CREATE POLICY "Admins can manage all violations" 
ON public.community_violations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own violations" 
ON public.community_violations 
FOR SELECT 
USING (user_email = auth.email());

-- RLS Policies for user_bans
CREATE POLICY "Admins can manage all bans" 
ON public.user_bans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own bans" 
ON public.user_bans 
FOR SELECT 
USING (user_email = auth.email());

-- RLS Policies for user_warnings
CREATE POLICY "Admins can manage all warnings" 
ON public.user_warnings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view and acknowledge their warnings" 
ON public.user_warnings 
FOR SELECT 
USING (user_email = auth.email());

CREATE POLICY "Users can acknowledge their warnings" 
ON public.user_warnings 
FOR UPDATE 
USING (user_email = auth.email())
WITH CHECK (user_email = auth.email());

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_email TEXT, _ban_type TEXT DEFAULT 'platform_access')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_bans 
    WHERE user_email = _user_email 
      AND (ban_type = _ban_type OR ban_type = 'all_services')
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get user warning count
CREATE OR REPLACE FUNCTION public.get_user_warning_count(_user_email TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.user_warnings 
    WHERE user_email = _user_email 
      AND created_at > now() - interval '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add indexes for performance
CREATE INDEX idx_community_violations_user_email ON public.community_violations(user_email);
CREATE INDEX idx_user_bans_user_email ON public.user_bans(user_email, is_active);
CREATE INDEX idx_user_warnings_user_email ON public.user_warnings(user_email);

-- Add audit trigger for violations
CREATE TRIGGER audit_community_violations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.community_violations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();