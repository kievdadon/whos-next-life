import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Plus, Link2, ShoppingCart, DollarSign, Copy, Check, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface GroupOrder {
  id: string;
  group_name: string;
  invite_code: string;
  delivery_address: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface Participant {
  id: string;
  display_name: string;
  contribution_amount: number;
  payment_status: string;
  is_admin: boolean;
}

interface GroupItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  participant: {
    display_name: string;
  };
  business: {
    business_name: string;
  };
}

const GroupOrder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');

  const [myGroupOrders, setMyGroupOrders] = useState<GroupOrder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(!!inviteCode);
  const [selectedGroup, setSelectedGroup] = useState<GroupOrder | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groupItems, setGroupItems] = useState<GroupItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState(inviteCode || '');
  const [joinDisplayName, setJoinDisplayName] = useState('');

  useEffect(() => {
    if (user) {
      loadMyGroupOrders();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup.id);
      // Subscribe to real-time updates
      const channel = supabase
        .channel(`group_order_${selectedGroup.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_order_items',
            filter: `group_order_id=eq.${selectedGroup.id}`,
          },
          () => loadGroupDetails(selectedGroup.id)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedGroup]);

  const loadMyGroupOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('group_orders')
        .select('*')
        .in('status', ['active', 'locked'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyGroupOrders(data || []);
    } catch (error) {
      console.error('Error loading group orders:', error);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('group_order_participants')
        .select('*')
        .eq('group_order_id', groupId);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('group_order_items')
        .select(`
          *,
          participant:group_order_participants(display_name),
          business:business_applications(business_name)
        `)
        .eq('group_order_id', groupId);

      if (itemsError) throw itemsError;
      setGroupItems(itemsData || []);
    } catch (error) {
      console.error('Error loading group details:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName) {
      toast({
        title: "Missing Information",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('group_orders')
        .insert({
          created_by: user.id,
          group_name: newGroupName,
          status: 'active'
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin participant
      const { error: participantError } = await supabase
        .from('group_order_participants')
        .insert({
          group_order_id: groupData.id,
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Admin',
          email: user.email,
          is_admin: true
        });

      if (participantError) throw participantError;

      toast({
        title: "Group Created!",
        description: `Share the invite code: ${groupData.invite_code}`,
      });

      setShowCreateDialog(false);
      setNewGroupName('');
      loadMyGroupOrders();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group order",
        variant: "destructive",
      });
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !joinCode || !joinDisplayName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from('group_orders')
        .select('*')
        .eq('invite_code', joinCode)
        .eq('status', 'active')
        .single();

      if (groupError || !groupData) {
        toast({
          title: "Invalid Code",
          description: "Group order not found or already completed",
          variant: "destructive",
        });
        return;
      }

      // Add as participant
      const { error: participantError } = await supabase
        .from('group_order_participants')
        .insert({
          group_order_id: groupData.id,
          user_id: user.id,
          display_name: joinDisplayName,
          email: user.email
        });

      if (participantError) throw participantError;

      toast({
        title: "Joined Group!",
        description: `You're now part of ${groupData.group_name}`,
      });

      setShowJoinDialog(false);
      setJoinCode('');
      setJoinDisplayName('');
      loadMyGroupOrders();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join group order",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const link = `${window.location.origin}/group-order?code=${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Link Copied!",
      description: "Share this link with others to join",
    });
  };

  const handleBrowseProducts = () => {
    if (selectedGroup) {
      navigate('/delivery', { state: { groupOrderId: selectedGroup.id } });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Users className="h-8 w-8 text-wellness-primary" />
                <span>Group Orders</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Order from multiple stores with friends and split the cost
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowJoinDialog(true)}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Join Group
              </Button>
              <Button
                className="bg-wellness-primary hover:bg-wellness-primary/90"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>

          {/* Group Orders List */}
          <div className="grid md:grid-cols-2 gap-6">
            {myGroupOrders.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Active Group Orders</h3>
                  <p className="text-muted-foreground mb-6">
                    Create a new group order or join an existing one to get started
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowJoinDialog(true)}
                    >
                      Join Group
                    </Button>
                    <Button
                      className="bg-wellness-primary hover:bg-wellness-primary/90"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      Create Group
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              myGroupOrders.map((group) => (
                <Card
                  key={group.id}
                  className="group hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedGroup(group)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{group.group_name}</span>
                      <Badge variant="outline">{group.status}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Total:</span>
                        <span className="font-semibold text-lg">${group.total_amount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Invite Code: <span className="font-mono font-semibold">{group.invite_code}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteLink(group.invite_code);
                          }}
                        >
                          {copiedCode === group.invite_code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Group Details Dialog */}
          {selectedGroup && (
            <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{selectedGroup.group_name}</span>
                    <Button
                      size="sm"
                      onClick={handleBrowseProducts}
                      className="bg-wellness-primary hover:bg-wellness-primary/90"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add Items
                    </Button>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Participants */}
                  <div>
                    <h3 className="font-semibold mb-3">Participants ({participants.length})</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{p.display_name}</span>
                          <div className="flex items-center space-x-2">
                            {p.is_admin && <Badge variant="outline" className="text-xs">Admin</Badge>}
                            <span className="text-sm font-semibold">${p.contribution_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items ({groupItems.length})</h3>
                    {groupItems.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-8">
                        No items added yet. Click "Add Items" to start ordering!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {groupItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded">
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.business.business_name} • Added by {item.participant.display_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${(item.product_price * item.quantity).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-wellness-primary">${selectedGroup.total_amount.toFixed(2)}</span>
                  </div>

                  <Button
                    className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                    size="lg"
                    disabled={groupItems.length === 0}
                  >
                    <DollarSign className="h-5 w-5 mr-2" />
                    Split Payment & Checkout
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Create Group Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Group Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="e.g., Office Lunch, Movie Night"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateGroup}
                  className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                >
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Join Group Dialog */}
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Group Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="Enter the 8-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="display-name">Your Display Name</Label>
                  <Input
                    id="display-name"
                    placeholder="How others will see you"
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleJoinGroup}
                  className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                >
                  Join Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default GroupOrder;
