-- Create family groups table
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text from 1 for 8)
);

-- Enable RLS
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;

-- Create family group members table
CREATE TABLE family_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_admin BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE family_group_members ENABLE ROW LEVEL SECURITY;

-- Create family chat messages table
CREATE TABLE family_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE family_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create wellness chat sessions table
CREATE TABLE wellness_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE wellness_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create wellness chat messages table
CREATE TABLE wellness_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES wellness_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'ai')),
  mood_score NUMERIC(3,1),
  mood_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE wellness_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family groups
CREATE POLICY "Users can view groups they belong to"
ON family_groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM family_group_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create groups"
ON family_groups FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups"
ON family_groups FOR UPDATE
USING (
  id IN (
    SELECT group_id FROM family_group_members 
    WHERE user_id = auth.uid() AND is_admin = true AND status = 'active'
  )
);

-- Create RLS policies for family group members
CREATE POLICY "Users can view members of their groups"
ON family_group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM family_group_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can join groups via invite"
ON family_group_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own membership"
ON family_group_members FOR UPDATE
USING (user_id = auth.uid());

-- Create RLS policies for family chat messages
CREATE POLICY "Group members can view messages"
ON family_chat_messages FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM family_group_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Group members can send messages"
ON family_chat_messages FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  group_id IN (
    SELECT group_id FROM family_group_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update their own messages"
ON family_chat_messages FOR UPDATE
USING (user_id = auth.uid());

-- Create RLS policies for wellness chat sessions
CREATE POLICY "Users can view their own sessions"
ON wellness_chat_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
ON wellness_chat_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
ON wellness_chat_sessions FOR UPDATE
USING (user_id = auth.uid());

-- Create RLS policies for wellness chat messages
CREATE POLICY "Users can view their own wellness messages"
ON wellness_chat_messages FOR SELECT
USING (
  session_id IN (
    SELECT id FROM wellness_chat_sessions 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create wellness messages"
ON wellness_chat_messages FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM wellness_chat_sessions 
    WHERE user_id = auth.uid()
  )
);

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE family_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE wellness_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE family_group_members;

-- Add updated_at triggers
CREATE TRIGGER update_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_chat_messages_updated_at
  BEFORE UPDATE ON family_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellness_chat_sessions_updated_at
  BEFORE UPDATE ON wellness_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();