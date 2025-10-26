import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Plus, Settings, Search, Copy, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [sharedOrders, setSharedOrders] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
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

  // Load shared orders
  const loadSharedOrders = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_shared_orders')
        .select('*')
        .eq('group_id', groupId)
        .order('shared_at', { ascending: false });

      if (error) throw error;
      setSharedOrders(data || []);
    } catch (error) {
      console.error('Error loading shared orders:', error);
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

      // Add creator as admin member (use upsert to avoid duplicate key errors)
      const { error: memberError } = await supabase
        .from('family_group_members')
        .upsert({
          group_id: groupData.id,
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'You',
          is_admin: true,
          status: 'active',
        }, {
          onConflict: 'group_id,user_id'
        });

      if (memberError) throw memberError;

      // Add to groups list without switching to it
      setFamilyGroups((prev) => [groupData, ...prev]);

      toast({
        title: "Group Created!",
        description: `Family group "${groupName}" has been created. Share invite code: ${groupData.invite_code}`,
      });
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
  const joinGroup = async (inviteCode?: string) => {
    const code = inviteCode || prompt("Enter invite code:");
    if (!code?.trim()) return;

    try {
      // Find group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('invite_code', code.trim())
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

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (!currentGroup?.invite_code) return;
    navigator.clipboard.writeText(currentGroup.invite_code);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
  };

  // Leave current group
  const leaveGroup = async () => {
    if (!currentGroup) return;

    const confirmed = window.confirm(`Are you sure you want to leave "${currentGroup.name}"?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('family_group_members')
        .update({ status: 'inactive' })
        .eq('group_id', currentGroup.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Left Group",
        description: `You've left "${currentGroup.name}"`,
      });

      // Remove from local state and select another group
      setFamilyGroups(prev => prev.filter(g => g.id !== currentGroup.id));
      setCurrentGroup(null);
      loadFamilyGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group",
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
      loadSharedOrders(currentGroup.id);
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
              onClick={() => joinGroup(undefined)}
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
            <Button variant="outline" size="sm" onClick={() => joinGroup(undefined)}>
              <Users className="h-4 w-4 mr-2" />
              Join Group
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Group Settings</DialogTitle>
                  <DialogDescription>
                    Manage your group settings and invite code
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h4 className="font-medium mb-2">Invite Code</h4>
                    <div className="flex gap-2">
                      <Input 
                        value={currentGroup?.invite_code || ''} 
                        readOnly 
                        className="font-mono"
                      />
                      <Button onClick={copyInviteCode} variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Share this code with others to invite them to the group
                    </p>
                  </div>
                  <div>
                    <Button variant="destructive" onClick={leaveGroup} className="w-full">
                      Leave Group
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
            <Tabs defaultValue="chat" className="flex flex-col h-full">
              <CardHeader className="border-b pb-2">
                <div className="flex items-center justify-between mb-2">
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
                </div>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="orders">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shared Orders ({sharedOrders.length})
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
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
              </TabsContent>

              <TabsContent value="orders" className="flex-1 m-0 overflow-hidden">
                <CardContent className="p-4 overflow-y-auto h-full">
                  {sharedOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders shared yet</p>
                      <p className="text-sm mt-2">Family members can share their orders here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sharedOrders.map((order) => {
                        const sharer = groupMembers.find(m => m.user_id === order.shared_by);
                        return (
                          <Card key={order.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium">Order from {sharer?.display_name || 'Family Member'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.shared_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge>Shared</Badge>
                              </div>
                              {order.order_details && (
                                <div className="text-sm space-y-1 mt-2">
                                  <p className="text-muted-foreground">
                                    {JSON.stringify(order.order_details)}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>

          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyGroupChat;