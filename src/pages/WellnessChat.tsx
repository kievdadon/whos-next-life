import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  Send, 
  Mic,
  Heart,
  Brain,
  Smile,
  MessageCircle,
  TrendingUp,
  Calendar,
  Settings,
  MoreVertical,
  Sparkles,
  Activity,
  Moon,
  Sun
} from "lucide-react";

const WellnessChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const todayMood = {
    mood: "Calm",
    emoji: "😌",
    score: 7.5,
    color: "wellness-primary"
  };


  const moodStats = [
    { day: "Mon", mood: 6.5, emoji: "😊" },
    { day: "Tue", mood: 7.2, emoji: "😌" },
    { day: "Wed", mood: 5.8, emoji: "😐" },
    { day: "Thu", mood: 8.1, emoji: "😄" },
    { day: "Fri", mood: 7.5, emoji: "😌" },
    { day: "Sat", mood: 8.7, emoji: "😆" },
    { day: "Sun", mood: 7.9, emoji: "😊" }
  ];

  const quickActions = [
    { icon: Heart, label: "Mood Check", color: "wellness-warm" },
    { icon: Brain, label: "Meditation", color: "wellness-primary" },
    { icon: Activity, label: "Breathing", color: "wellness-secondary" },
    { icon: Moon, label: "Sleep Tips", color: "wellness-accent" }
  ];

  // Create or get current wellness session
  const getOrCreateSession = async () => {
    try {
      // Get existing active session
      const { data: existingSessions, error: fetchError } = await supabase
        .from('wellness_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingSessions && existingSessions.length > 0) {
        setCurrentSession(existingSessions[0]);
        return existingSessions[0];
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('wellness_chat_sessions')
        .insert({
          user_id: user.id,
          session_name: `Wellness Chat - ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (createError) throw createError;

      setCurrentSession(newSession);

      // Add initial AI message
      await supabase
        .from('wellness_chat_messages')
        .insert({
          session_id: newSession.id,
          user_id: null,
          content: "Good morning! How are you feeling today? I'm here to support your wellness journey.",
          message_type: 'ai'
        });

      return newSession;
    } catch (error) {
      console.error('Error with session:', error);
      return null;
    }
  };

  // Load chat messages
  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('wellness_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading || !currentSession) return;

    setIsLoading(true);

    try {
      // Add user message to database
      const { error: userMessageError } = await supabase
        .from('wellness_chat_messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          content: message.trim(),
          message_type: 'user'
        });

      if (userMessageError) throw userMessageError;

      const userMessageContent = message.trim();
      setMessage("");

      // Get AI response
      const { data, error } = await supabase.functions.invoke('wellness-chat', {
        body: { message: userMessageContent }
      });

      if (error) throw error;

      // Add AI response to database
      await supabase
        .from('wellness_chat_messages')
        .insert({
          session_id: currentSession.id,
          user_id: null,
          content: data.response,
          message_type: 'ai'
        });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!currentSession) return;

    const messagesChannel = supabase
      .channel('wellness_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wellness_chat_messages',
          filter: `session_id=eq.${currentSession.id}`
        },
        (payload) => {
          setChatHistory(prev => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [currentSession]);

  // Load initial data
  useEffect(() => {
    const initializeChat = async () => {
      setLoading(true);
      const session = await getOrCreateSession();
      if (session) {
        await loadMessages(session.id);
      }
      setLoading(false);
    };

    initializeChat();
  }, [user.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-wellness-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wellness chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-lg">
        {/* Header */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
              💬 Wellness AI
            </h1>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Today's Mood */}
          <Card className="bg-gradient-to-r from-wellness-primary/10 to-wellness-secondary/10 border-wellness-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Mood</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{todayMood.emoji}</span>
                    <span className="font-semibold">{todayMood.mood}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-wellness-primary">
                    {todayMood.score}/10
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b border-border/30">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 flex-col gap-1 border-wellness-primary/20 hover:bg-wellness-primary/5"
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Week Overview */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">This Week</h3>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {moodStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium w-8">{stat.day}</span>
                  <span className="text-lg">{stat.emoji}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-wellness-primary rounded-full transition-all duration-300"
                      style={{ width: `${(stat.mood / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{stat.mood}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-border/30 bg-card/30 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-wellness-primary to-wellness-secondary rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Wellness Assistant</h2>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online • AI-powered support</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20">
                24/7 Available
              </Badge>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatHistory.map((chat) => (
            <div key={chat.id} className={`flex ${chat.message_type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${chat.message_type === 'user' ? 'order-2' : ''}`}>
                {chat.message_type === 'ai' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-wellness-primary rounded-full flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-muted-foreground">Wellness AI</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
                <Card className={`${
                  chat.message_type === 'user' 
                    ? 'bg-wellness-primary text-primary-foreground ml-12' 
                    : 'bg-card mr-12'
                }`}>
                  <CardContent className="p-4">
                    <p className="leading-relaxed">{chat.content}</p>
                  </CardContent>
                </Card>
                
                {chat.message_type === 'user' && (
                  <div className="flex items-center justify-end space-x-2 mt-1 mr-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-border/30 bg-card/30 backdrop-blur-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share how you're feeling or ask for wellness advice..."
                className="pr-20 h-12 bg-background/50 border-border/50"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`p-2 ${isListening ? 'bg-wellness-accent/20 border-wellness-accent' : 'border-border/50'}`}
                  onClick={handleVoiceInput}
                >
                  <Mic className={`h-4 w-4 ${isListening ? 'text-wellness-accent' : ''}`} />
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="h-12 px-6 bg-wellness-primary hover:bg-wellness-primary/90"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>💡 Try: "I feel stressed" or "Help me sleep better"</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-3 w-3 text-wellness-warm" />
              <span>Confidential & secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessChat;