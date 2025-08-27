import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  const todayMood = {
    mood: "Calm",
    emoji: "😌",
    score: 7.5,
    color: "wellness-primary"
  };

  const chatHistory = [
    {
      id: 1,
      type: "ai",
      message: "Good morning! How are you feeling today? I noticed you haven't checked in since yesterday.",
      timestamp: "9:30 AM",
      mood: null
    },
    {
      id: 2,
      type: "user", 
      message: "I'm feeling a bit anxious about my presentation today.",
      timestamp: "9:32 AM",
      mood: { emoji: "😰", level: "moderate" }
    },
    {
      id: 3,
      type: "ai",
      message: "I understand that presentations can feel overwhelming. Let's try a quick breathing exercise. Take a deep breath in for 4 counts, hold for 4, and exhale for 6. Would you like me to guide you through this?",
      timestamp: "9:33 AM",
      mood: null,
      suggestions: ["Start breathing exercise", "Tell me more", "Skip for now"]
    },
    {
      id: 4,
      type: "user",
      message: "Yes, that would help.",
      timestamp: "9:35 AM",
      mood: null
    },
    {
      id: 5,
      type: "ai",
      message: "Perfect! Let's begin. I'll guide you through a 3-minute breathing session. Ready when you are! 🧘‍♀️",
      timestamp: "9:35 AM",
      mood: null,
      isExercise: true
    }
  ];

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

  const handleSend = () => {
    if (message.trim()) {
      setMessage("");
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
  };

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
            <div key={chat.id} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${chat.type === 'user' ? 'order-2' : ''}`}>
                {chat.type === 'ai' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-wellness-primary rounded-full flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-muted-foreground">Wellness AI</span>
                    <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                  </div>
                )}
                
                <Card className={`${
                  chat.type === 'user' 
                    ? 'bg-wellness-primary text-primary-foreground ml-12' 
                    : 'bg-card mr-12'
                } ${chat.isExercise ? 'border-wellness-accent/50 bg-gradient-to-r from-wellness-accent/10 to-wellness-primary/10' : ''}`}>
                  <CardContent className="p-4">
                    <p className="leading-relaxed">{chat.message}</p>
                    
                    {chat.mood && chat.type === 'user' && (
                      <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-primary-foreground/20">
                        <span className="text-lg">{chat.mood.emoji}</span>
                        <Badge variant="secondary" className="text-xs">
                          {chat.mood.level} anxiety
                        </Badge>
                      </div>
                    )}
                    
                    {chat.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {chat.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs border-wellness-primary/30 hover:bg-wellness-primary/10"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {chat.isExercise && (
                      <div className="mt-4 p-3 bg-wellness-primary/10 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Breathing Exercise</span>
                          <Badge className="bg-wellness-accent/20 text-wellness-accent">
                            3 min
                          </Badge>
                        </div>
                        <Button size="sm" className="w-full bg-wellness-primary hover:bg-wellness-primary/90">
                          Start Exercise
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {chat.type === 'user' && (
                  <div className="flex items-center justify-end space-x-2 mt-1 mr-4">
                    <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                    {chat.mood && (
                      <span className="text-sm">{chat.mood.emoji}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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
              disabled={!message.trim()}
              className="h-12 px-6 bg-wellness-primary hover:bg-wellness-primary/90"
            >
              <Send className="h-4 w-4" />
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