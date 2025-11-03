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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WellnessProductRecommendations } from "@/components/WellnessProductRecommendations";
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
  Sun,
  Bell,
  Shield
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [moodReminders, setMoodReminders] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedWeekMoodData, setSelectedWeekMoodData] = useState<{ average: number; count: number } | null>(null);
  const [moodDataByDate, setMoodDataByDate] = useState<Map<string, number>>(new Map());
  const [deepThinking, setDeepThinking] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth?redirect=/wellness-chat" replace />;
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [todayMood, setTodayMood] = useState({
    mood: "Getting Started",
    emoji: "🌟",
    score: 5.0,
    color: "wellness-primary"
  });

  const [moodStats, setMoodStats] = useState([
    { day: "Mon", mood: 0, emoji: "⭐", hasData: false },
    { day: "Tue", mood: 0, emoji: "⭐", hasData: false },
    { day: "Wed", mood: 0, emoji: "⭐", hasData: false },
    { day: "Thu", mood: 0, emoji: "⭐", hasData: false },
    { day: "Fri", mood: 0, emoji: "⭐", hasData: false },
    { day: "Sat", mood: 0, emoji: "⭐", hasData: false },
    { day: "Sun", mood: 0, emoji: "⭐", hasData: false }
  ]);

  // Load all mood data for calendar indicators
  const loadAllMoodData = async () => {
    try {
      const { data: sessions } = await supabase
        .from('wellness_chat_sessions')
        .select('id')
        .eq('user_id', user.id);

      if (!sessions?.length) return;

      const sessionIds = sessions.map(s => s.id);
      const { data: messages } = await supabase
        .from('wellness_chat_messages')
        .select('created_at, mood_score')
        .in('session_id', sessionIds)
        .not('mood_score', 'is', null);

      if (messages) {
        const moodMap = new Map<string, number[]>();
        messages.forEach(msg => {
          const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
          if (!moodMap.has(date)) {
            moodMap.set(date, []);
          }
          moodMap.get(date)!.push(msg.mood_score);
        });

        const avgMap = new Map<string, number>();
        moodMap.forEach((scores, date) => {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          avgMap.set(date, avg);
        });
        
        setMoodDataByDate(avgMap);
      }
    } catch (error) {
      console.error('Error loading mood data:', error);
    }
  };

  // Load mood statistics
  const loadMoodStats = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // First get user's sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('wellness_chat_sessions')
        .select('id')
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      const sessionIds = sessions?.map(s => s.id) || [];

      if (sessionIds.length === 0) {
        return; // No sessions yet
      }

      // Then get mood data from those sessions
      const { data, error } = await supabase
        .from('wellness_chat_messages')
        .select('mood_score, mood_label, created_at')
        .in('session_id', sessionIds)
        .gte('created_at', oneWeekAgo.toISOString())
        .not('mood_score', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Calculate daily averages
        const dailyMoods = [
          { day: "Mon", mood: 0, count: 0, emoji: "⭐", hasData: false },
          { day: "Tue", mood: 0, count: 0, emoji: "⭐", hasData: false },
          { day: "Wed", mood: 0, count: 0, emoji: "⭐", hasData: false },
          { day: "Thu", mood: 0, count: 0, emoji: "⭐", hasData: false },
          { day: "Fri", mood: 0, count: 0, emoji: "⭐", hasData: false },
          { day: "Sat", mood: 0, count: 0, emoji: "⭐", hasData: false },
          { day: "Sun", mood: 0, count: 0, emoji: "⭐", hasData: false }
        ];

        // Sum up all mood scores per day
        data.forEach((entry) => {
          const date = new Date(entry.created_at);
          const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
          
          if (entry.mood_score) {
            const score = parseFloat(entry.mood_score.toString());
            dailyMoods[dayIndex].mood += score;
            dailyMoods[dayIndex].count += 1;
            dailyMoods[dayIndex].hasData = true;
          }
        });

        // Calculate averages and set emojis
        dailyMoods.forEach((day) => {
          if (day.count > 0) {
            day.mood = day.mood / day.count; // Average mood
            const score = day.mood;
            
            // Set emoji based on average mood score
            if (score >= 8) day.emoji = "😄";
            else if (score >= 7) day.emoji = "😊";
            else if (score >= 6) day.emoji = "😌";
            else if (score >= 5) day.emoji = "😐";
            else if (score >= 4) day.emoji = "😔";
            else day.emoji = "😢";
          }
        });

        setMoodStats(dailyMoods);

        // Set today's mood
        const today = new Date();
        const todayIndex = (today.getDay() + 6) % 7;
        if (dailyMoods[todayIndex].hasData) {
          const todayScore = dailyMoods[todayIndex].mood;
          setTodayMood({
            mood: todayScore >= 8 ? "Great" : todayScore >= 7 ? "Good" : todayScore >= 6 ? "Okay" : todayScore >= 5 ? "Neutral" : todayScore >= 4 ? "Low" : "Struggling",
            emoji: dailyMoods[todayIndex].emoji,
            score: todayScore,
            color: "wellness-primary"
          });
        }
      }
    } catch (error) {
      console.error('Error loading mood stats:', error);
    }
  };

  // Calculate mood data for selected week
  const calculateWeekMoodData = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const moodScores: number[] = [];
    daysInWeek.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const score = moodDataByDate.get(dateKey);
      if (score !== undefined) {
        moodScores.push(score);
      }
    });

    if (moodScores.length > 0) {
      const average = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
      setSelectedWeekMoodData({ average, count: moodScores.length });
    } else {
      setSelectedWeekMoodData(null);
    }
  };

  const handleMoodCheck = async () => {
    const moodPrompt = "I'd like to do a mood check. Can you help me reflect on how I'm feeling today and log my mood?";
    await handleSend(moodPrompt);
  };

  const handleMeditation = async () => {
    await handleSend("I'd like some meditation guidance to help me relax and find inner peace.");
  };

  const handleBreathing = async () => {
    await handleSend("Can you guide me through some breathing exercises to help me feel calmer?");
  };

  const handleSleepTips = async () => {
    await handleSend("I'm having trouble sleeping. Can you give me some tips for better sleep hygiene?");
  };

  const quickActions = [
    { icon: Heart, label: "Mood Check", color: "wellness-warm", action: handleMoodCheck },
    { icon: Brain, label: "Meditation", color: "wellness-primary", action: handleMeditation },
    { icon: Activity, label: "Breathing", color: "wellness-secondary", action: handleBreathing },
    { icon: Moon, label: "Sleep Tips", color: "wellness-accent", action: handleSleepTips }
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
        const session = existingSessions[0];
        setCurrentSession(session);
        // Load notification preferences
        setNotifications(session.notifications_enabled || false);
        setNotificationEmail(session.notification_email || "");
        setNotificationPhone(session.notification_phone || "");
        return session;
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

  // Save notification preferences
  const saveNotificationPreferences = async () => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('wellness_chat_sessions')
        .update({
          notifications_enabled: notifications,
          notification_email: notificationEmail,
          notification_phone: notificationPhone
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences.",
        variant: "destructive",
      });
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

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || message.trim();
    if (!messageToSend || isLoading || !currentSession) return;

    setIsLoading(true);

    try {
      // Add user message to database
      const { data: userRow, error: userMessageError } = await supabase
        .from('wellness_chat_messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          content: messageToSend,
          message_type: 'user'
        })
        .select()
        .single();

      if (userMessageError) throw userMessageError;

      // Optimistically update UI in case realtime is unavailable
      setChatHistory(prev => [...prev, userRow]);
      scrollToBottom();

      if (!customMessage) setMessage("");

      // Build conversation history for AI context
      const conversationMessages = chatHistory.map(msg => ({
        role: msg.message_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Add current user message to history
      conversationMessages.push({
        role: 'user',
        content: messageToSend
      });

      // Get AI response with mood analysis and full conversation context
      const { data, error } = await supabase.functions.invoke('wellness-chat', {
        body: { 
          messages: conversationMessages,
          message: messageToSend, // Keep for backward compatibility
          includeMoodAnalysis: true,
          userId: user.id,
          deepThinking
        }
      });

      if (error) throw error;

      // Extract mood data if present
      let moodScore = null;
      let moodLabel = null;
      
      if (data.moodScore && data.moodLabel) {
        moodScore = data.moodScore;
        moodLabel = data.moodLabel;
      }

      // Add AI response to database with mood data
      const { data: aiRow, error: aiInsertError } = await supabase
        .from('wellness_chat_messages')
        .insert({
          session_id: currentSession.id,
          user_id: null,
          content: data.response,
          message_type: 'ai',
          mood_score: moodScore,
          mood_label: moodLabel
        })
        .select()
        .single();

      if (aiInsertError) throw aiInsertError;

      // Update UI immediately
      setChatHistory(prev => [...prev, aiRow]);
      scrollToBottom();

      // Reload mood stats if mood was tracked
      if (moodScore) {
        await loadMoodStats();
      }

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
    const initializeSession = async () => {
      setLoading(true);
      const session = await getOrCreateSession();
      if (session) {
        await Promise.all([
          loadMessages(session.id),
          loadMoodStats(),
          loadAllMoodData()
        ]);
      }
      setLoading(false);
    };

    initializeSession();
  }, [user.id]);

  useEffect(() => {
    if (selectedDate) {
      calculateWeekMoodData(selectedDate);
    }
  }, [selectedDate, moodDataByDate]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-wellness-calm/20 to-background flex h-screen overflow-hidden">
      {/* Enhanced Sidebar */}
      <div className="w-80 border-r border-border/30 bg-gradient-to-b from-card/40 to-card/20 backdrop-blur-xl overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-wellness-primary via-wellness-secondary to-wellness-accent bg-clip-text text-transparent">
                Wellness AI
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Your personal wellness companion</p>
            </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-wellness-primary/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-wellness-primary" />
                    <span>Wellness Settings</span>
                  </DialogTitle>
                  <DialogDescription>
                    Customize your wellness experience and preferences
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label htmlFor="notifications" className="text-sm font-medium">
                            Enable Notifications
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Receive wellness tips and updates
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="notifications"
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>

                    {notifications && (
                      <div className="space-y-3 pl-7">
                        <div>
                          <Label htmlFor="notification-email" className="text-xs font-medium text-muted-foreground">
                            Email Address (optional)
                          </Label>
                          <Input
                            id="notification-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                            className="mt-1 h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notification-phone" className="text-xs font-medium text-muted-foreground">
                            Phone Number (optional)
                          </Label>
                          <Input
                            id="notification-phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={notificationPhone}
                            onChange={(e) => setNotificationPhone(e.target.value)}
                            className="mt-1 h-9 text-sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          Provide at least one contact method to receive notifications
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label htmlFor="mood-reminders" className="text-sm font-medium">
                            Mood Check Reminders
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Daily reminders to log your mood
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="mood-reminders"
                        checked={moodReminders}
                        onCheckedChange={setMoodReminders}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={saveNotificationPreferences}
                        className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                      >
                        Save Preferences
                      </Button>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <div className="text-xs">
                          <p className="font-medium">Privacy & Security</p>
                          <p>All conversations are encrypted and confidential</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Today's Mood Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-wellness-primary/20 via-wellness-secondary/15 to-wellness-accent/20">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Today</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl">{todayMood.emoji}</span>
                    <div>
                      <p className="font-bold text-lg">{todayMood.mood}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>Mood Score</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-br from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
                    {todayMood.score}
                  </div>
                  <p className="text-xs text-muted-foreground">/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b border-border/20">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex-col gap-2 border-border/30 hover:border-wellness-primary/30 hover:bg-wellness-primary/5 transition-all group"
                onClick={action.action}
              >
                <action.icon className="h-5 w-5 text-wellness-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Week Overview */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'This Week'}
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-wellness-primary/10">
                  <Calendar className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  modifiers={{
                    hasMood: (date) => {
                      const dateKey = format(date, 'yyyy-MM-dd');
                      return moodDataByDate.has(dateKey);
                    }
                  }}
                  modifiersClassNames={{
                    hasMood: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-wellness-primary"
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {selectedWeekMoodData && (
            <div className="mb-4 p-3 bg-gradient-to-r from-wellness-primary/10 to-wellness-secondary/10 rounded-lg border border-wellness-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Week Average</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-wellness-primary">
                    {selectedWeekMoodData.average.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedWeekMoodData.count} {selectedWeekMoodData.count === 1 ? 'entry' : 'entries'})
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {moodStats.map((stat, index) => (
              <div key={index} className="group p-2 rounded-lg hover:bg-muted/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold w-8 text-muted-foreground">{stat.day}</span>
                    <span className="text-xl group-hover:scale-110 transition-transform">{stat.emoji}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          stat.hasData ? 'bg-gradient-to-r from-wellness-primary to-wellness-secondary' : 'bg-muted'
                        }`}
                        style={{ width: stat.hasData ? `${(stat.mood / 10) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">
                      {stat.hasData ? stat.mood.toFixed(1) : '--'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Enhanced Header */}
        <div className="p-6 border-b border-border/20 bg-gradient-to-r from-card/40 to-card/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-wellness-primary via-wellness-secondary to-wellness-accent rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h2 className="font-bold text-lg">Wellness Assistant</h2>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Brain className="h-3 w-3" />
                  <span>AI-Powered • Evidence-Based Support</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/30 font-medium">
                <Activity className="h-3 w-3 mr-1" />
                Active Session
              </Badge>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8" style={{ scrollBehavior: 'smooth' }}>
          {chatHistory.map((chat, idx) => (
            <div key={chat.id} className={`flex ${chat.message_type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-3xl ${chat.message_type === 'user' ? '' : 'w-full'}`}>
                {chat.message_type === 'ai' && (
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-wellness-primary to-wellness-secondary rounded-xl flex items-center justify-center shadow-md">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">Wellness AI</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className={`relative ${
                  chat.message_type === 'user' 
                    ? 'ml-12' 
                    : ''
                }`}>
                  {chat.message_type === 'user' ? (
                    <Card className="border-0 bg-gradient-to-br from-wellness-primary to-wellness-secondary text-white shadow-lg">
                      <CardContent className="p-5">
                        <p className="leading-relaxed font-medium">{chat.content}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-border/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <p className="leading-relaxed text-foreground whitespace-pre-wrap">{chat.content}</p>
                        {chat.mood_score && (
                          <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Heart className="h-4 w-4 text-wellness-warm" />
                              <span className="text-xs text-muted-foreground">Mood detected:</span>
                              <Badge variant="outline" className="text-xs">
                                {chat.mood_label}
                              </Badge>
                            </div>
                            <div className="text-sm font-semibold text-wellness-primary">
                              {chat.mood_score}/10
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {chat.message_type === 'user' && (
                    <div className="flex items-center justify-end space-x-2 mt-2 mr-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 p-6 border-t border-border/20 bg-gradient-to-r from-card/40 to-card/20 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share how you're feeling, or ask me anything about wellness..."
                  className="pr-14 h-14 bg-background/80 border-border/40 rounded-2xl text-base focus:ring-2 focus:ring-wellness-primary/20 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`h-8 w-8 p-0 rounded-full ${isListening ? 'bg-wellness-accent/20 text-wellness-accent' : ''}`}
                    onClick={handleVoiceInput}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={() => handleSend()}
                disabled={!message.trim() || isLoading}
                size="lg"
                className="h-14 w-14 rounded-2xl bg-gradient-to-br from-wellness-primary to-wellness-secondary hover:shadow-lg transition-all p-0"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="h-3 w-3 text-wellness-primary" />
                  <span>AI-powered responses</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Heart className="h-3 w-3 text-wellness-warm" />
                  <span>100% confidential</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deep-thinking"
                    checked={deepThinking}
                    onCheckedChange={setDeepThinking}
                  />
                  <Label htmlFor="deep-thinking" className="text-xs cursor-pointer">
                    {deepThinking ? '🧠 Deep thinking' : '⚡ Quick response'}
                  </Label>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Press Enter to send</span>
            </div>
          </div>

          {/* Wellness Shopping Recommendations */}
          <div className="mt-6">
            <WellnessProductRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessChat;