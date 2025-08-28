-- Create conversations table for marketplace messaging
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, seller_id, product_id)
);

-- Create messages table for conversation messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations they're part of"
ON public.conversations 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update conversation status"
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE auth.uid() = buyer_id OR auth.uid() = seller_id
  )
);

CREATE POLICY "Conversation participants can send messages"
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE auth.uid() = buyer_id OR auth.uid() = seller_id
  )
);

CREATE POLICY "Users can update their own message read status"
ON public.messages 
FOR UPDATE 
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE auth.uid() = buyer_id OR auth.uid() = seller_id
  )
);

-- Add updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update conversation updated_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when message is added
CREATE TRIGGER update_conversation_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();