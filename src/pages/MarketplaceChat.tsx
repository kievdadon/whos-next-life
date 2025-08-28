import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowLeft, MessageCircle, Clock, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  subject: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  updated_at: string;
  status: string;
  latest_message?: string;
  unread_count?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

const MarketplaceChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchConversations();
  }, [user, navigate]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        fetchMessages(conversationId);
        if (conversation.product_id) {
          fetchProduct(conversation.product_id);
        }
      }
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(m => m.sender_id !== user?.id && !m.read_at) || [];
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage('');
      await fetchMessages(selectedConversation.id);
      await fetchConversations(); // Refresh conversation list
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-wellness-primary" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-wellness-primary" />
                  Messages
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/marketplace')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Marketplace
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Start by messaging a seller from the marketplace</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-wellness-primary/5 border-l-4 border-l-wellness-primary' : ''
                      }`}
                      onClick={() => navigate(`/marketplace/chat/${conversation.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <h4 className="font-medium text-sm truncate">{conversation.subject}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {conversation.latest_message || 'No messages yet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">
                            {formatTime(conversation.updated_at)}
                          </p>
                          {conversation.unread_count && conversation.unread_count > 0 && (
                            <Badge className="bg-wellness-primary text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.subject}</CardTitle>
                      {product && (
                        <div className="flex items-center gap-3 mt-2 p-2 bg-muted/50 rounded-lg">
                          <div className="w-12 h-12 bg-wellness-primary/10 rounded-lg flex items-center justify-center">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-2xl">📦</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-wellness-primary font-semibold">${product.price}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="border-wellness-primary/20">
                      {selectedConversation.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex flex-col h-[400px]">
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] px-3 py-2 rounded-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-wellness-primary text-white'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 opacity-70" />
                                <span className="text-xs opacity-70">
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        disabled={isSending}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim() || isSending}
                        className="bg-wellness-primary hover:bg-wellness-primary/90"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to start chatting</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceChat;