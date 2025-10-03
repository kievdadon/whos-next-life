import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Briefcase, 
  ShoppingBag, 
  TrendingUp, 
  Heart,
  Users,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function MissionControl() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [marketplaceActivity, setMarketplaceActivity] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [familyGroups, setFamilyGroups] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load delivery orders
      const { data: orders } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('customer_id', user.id)
        .in('order_status', ['pending', 'confirmed', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(5);
      
      setDeliveryOrders(orders || []);

      // Load gigs (posted and applied)
      const { data: myGigs } = await supabase
        .from('gigs')
        .select('*')
        .or(`posted_by_user_id.eq.${user.id},assigned_to_user_id.eq.${user.id}`)
        .in('status', ['open', 'in_progress'])
        .limit(5);
      
      setGigs(myGigs || []);

      // Load marketplace conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5);
      
      setMarketplaceActivity(conversations || []);

      // Load family groups
      const { data: groups } = await supabase
        .from('family_group_members')
        .select('*, family_groups(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      setFamilyGroups(groups?.map(g => g.family_groups) || []);

      // Load wellness recommendations
      const { data: recs } = await supabase.functions.invoke('wellness-recommendations');
      if (recs?.data?.recommendations) {
        setRecommendations(recs.data.recommendations);
      }

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your mission control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mission Control
          </h1>
          <p className="text-muted-foreground">Your unified dashboard for all WHOSENXT services</p>
        </div>

        {/* Wellness Recommendations */}
        {recommendations.length > 0 && (
          <Card className="mb-6 border-wellness-primary/20 bg-wellness-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-wellness-primary" />
                <CardTitle>Wellness-Based Recommendations</CardTitle>
              </div>
              <CardDescription>Personalized suggestions based on your wellbeing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-background rounded-lg">
                    <h3 className="font-semibold mb-1">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(rec.type === 'delivery' ? '/delivery' : rec.type === 'gig' ? '/gig-browse' : '/marketplace')}
                    >
                      Explore <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>Active Deliveries</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {deliveryOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active deliveries</p>
              ) : (
                <div className="space-y-3">
                  {deliveryOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-secondary/20 rounded">
                      <div>
                        <p className="font-medium">{order.store_name}</p>
                        <p className="text-xs text-muted-foreground">{order.order_status}</p>
                      </div>
                      <Badge>{order.payment_status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => navigate('/delivery')}
                type="button"
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>

          {/* Gigs */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle>Active Gigs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {gigs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active gigs</p>
              ) : (
                <div className="space-y-3">
                  {gigs.map(gig => (
                    <div key={gig.id} className="p-3 bg-secondary/20 rounded">
                      <p className="font-medium">{gig.title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{gig.category}</Badge>
                        <Badge>{gig.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => navigate('/gig-browse')}
                type="button"
              >
                Browse Gigs
              </Button>
            </CardContent>
          </Card>

          {/* Marketplace Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <CardTitle>Marketplace Chats</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {marketplaceActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active conversations</p>
              ) : (
                <div className="space-y-3">
                  {marketplaceActivity.map(conv => (
                    <div key={conv.id} className="p-3 bg-secondary/20 rounded">
                      <p className="font-medium">{conv.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {conv.messages?.length || 0} messages
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => navigate('/marketplace')}
                type="button"
              >
                View Marketplace
              </Button>
            </CardContent>
          </Card>

          {/* Family Groups */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Family Groups</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {familyGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No family groups</p>
              ) : (
                <div className="space-y-3">
                  {familyGroups.map((group: any) => (
                    <div key={group.id} className="p-3 bg-secondary/20 rounded">
                      <p className="font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{group.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4" 
                onClick={() => navigate('/family-group-chat')}
                type="button"
              >
                Manage Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}