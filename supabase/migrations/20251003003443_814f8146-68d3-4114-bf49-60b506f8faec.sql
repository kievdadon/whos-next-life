-- Add notification preferences to wellness chat sessions
ALTER TABLE wellness_chat_sessions
ADD COLUMN IF NOT EXISTS notification_email text,
ADD COLUMN IF NOT EXISTS notification_phone text,
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false;