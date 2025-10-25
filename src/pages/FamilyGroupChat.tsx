import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Plus, Settings, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const FamilyGroupChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [familyGroups, setFamilyGroups] = useState<any[]>([]);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
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

  // Load user's family groups
  const loadFamilyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('family_groups')
        .select(`
          *,
          family_group_members!inner(*)
        `)
        .eq('family_group_members.user_id', user.id)
        .eq('family_group_members.status', 'active');

      if (error) throw error;
      setFamilyGroups(data || []);
      
      // Select first group if available
      if (data && data.length > 0 && !currentGroup) {
        setCurrentGroup(data[0]);
      }
    } catch (error) {
      console.error('Error loading family groups:', error);
    }
  };

  // Load group members
  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  // Load chat messages
  const loadMessages = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !currentGroup) return;

    try {
      const { error } = await supabase
        .from('family_chat_messages')
        .insert({
          group_id: currentGroup.id,
          user_id: user.id,
          content: message.trim()
        });

      if (error) throw error;
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Create a new family group
  const createFamilyGroup = async () => {
    const groupName = prompt("Enter family group name:");
    if (!groupName?.trim()) return;

    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "Please sign in to create a family group.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .insert({
          name: groupName.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError || !groupData) throw groupError || new Error('No group returned');

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('family_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'You',
          is_admin: true,
          status: 'active',
        });

      if (memberError) throw memberError;

      // Optimistically update UI
      setCurrentGroup(groupData);
      setFamilyGroups((prev) => [groupData, ...prev.filter((g) => g.id !== groupData.id)]);

      toast({
        title: "Group Created!",
        description: `Family group "${groupName}" has been created. Share invite code: ${groupData.invite_code}`,
      });

      // Refresh from server to ensure consistency
      loadFamilyGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create family group",
        variant: "destructive",
      });
    }
  };
  // Join group by invite code
  const joinGroup = async () => {
    const inviteCode = prompt("Enter invite code:");
    if (!inviteCode?.trim()) return;

    try {
      // Find group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .maybeSingle();

      if (groupError) throw groupError;
      
      if (!groupData) {
        toast({
          title: "Invalid Code",
          description: "No group found with that invite code.",
          variant: "destructive",
        });
        return;
      }

      // Add user to group
      const { error: memberError } = await supabase
        .from('family_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'You'
        });

      if (memberError) throw memberError;

      toast({
        title: "Joined Group!",
        description: `You've joined "${groupData.name}"`,
      });

      loadFamilyGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join group. Check the invite code.",
        variant: "destructive",
      });
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!currentGroup) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('family_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_chat_messages',
          filter: `group_id=eq.${currentGroup.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    // Subscribe to member changes
    const membersChannel = supabase
      .channel('family_group_members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_group_members',
          filter: `group_id=eq.${currentGroup.id}`
        },
        () => {
          loadGroupMembers(currentGroup.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [currentGroup]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadFamilyGroups();
      setLoading(false);
    };
    loadData();
  }, [user.id]);

  // Load group-specific data when current group changes
  useEffect(() => {
    if (currentGroup) {
      loadGroupMembers(currentGroup.id);
      loadMessages(currentGroup.id);
    }
  }, [currentGroup]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-wellness-accent/10 to-wellness-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-wellness-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading family groups...</p>
        </div>
      </div>
    );
  }

  if (familyGroups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-wellness-accent/10 to-wellness-secondary/10 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Messaging</CardTitle>
            <p className="text-muted-foreground">Create or join a group to start chatting</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
              onClick={createFamilyGroup}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Family Group
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={joinGroup}
            >
              <Users className="h-4 w-4 mr-2" />
              Join with Invite Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-wellness-accent/10 to-wellness-secondary/10">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-wellness-primary/20">
              <Users className="h-6 w-6 text-wellness-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {currentGroup?.name || "Family Group"}
              </h1>
              <p className="text-muted-foreground">
                {groupMembers.length} members • {groupMembers.filter(m => m.status === 'active').length} active
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={createFamilyGroup}>
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
            <Button variant="outline" size="sm" onClick={joinGroup}>
              <Users className="h-4 w-4 mr-2" />
              Join Group
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Family Members Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Family Members</span>
                <Badge variant="secondary">{groupMembers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-wellness-primary/20 text-wellness-primary">
                        {member.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                      member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {member.display_name || 'Family Member'} 
                      {member.user_id === user.id && ' (You)'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.is_admin ? 'Admin' : 'Member'}
                    </p>
                  </div>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {member.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col h-[70vh]">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-wellness-primary text-white">
                    {currentGroup?.name?.[0]?.toUpperCase() || 'F'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{currentGroup?.name || 'Messaging'}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {messages.length > 0 
                      ? `Last message ${new Date(messages[messages.length - 1]?.created_at).toLocaleTimeString()}`
                      : 'No messages yet'
                    }
                  </p>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.user_id === user.id;
                const sender = groupMembers.find(m => m.user_id === msg.user_id);
                
                return (
                  <div key={msg.id} className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!isOwn && (
                      <Avatar className="mt-1">
                        <AvatarFallback className="bg-wellness-secondary/20 text-wellness-secondary text-xs">
                          {sender?.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : ''}`}>
                      {!isOwn && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {sender?.display_name || 'Family Member'}
                        </p>
                      )}
                      <div className={`p-3 rounded-lg ${
                        isOwn 
                          ? 'bg-wellness-primary text-white ml-auto' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {isOwn && (
                      <Avatar className="mt-1">
                        <AvatarFallback className="bg-wellness-primary text-white text-xs">
                          {user.email?.[0]?.toUpperCase() || 'Y'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="bg-wellness-primary hover:bg-wellness-primary/90">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyGroupChat;