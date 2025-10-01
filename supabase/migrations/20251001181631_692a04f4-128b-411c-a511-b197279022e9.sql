-- Add gig_id column to conversations table to support gig-related chats
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS gig_id uuid REFERENCES public.gigs(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_gig_id ON public.conversations(gig_id);