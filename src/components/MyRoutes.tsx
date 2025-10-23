import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, DollarSign, Navigation, Clock, Trash2 } from 'lucide-react';

interface Route {
  id: string;
  route_name: string;
  start_address: string;
  end_address: string;
  is_active: boolean;
  schedule_days: string[];
  typical_time: string;
  max_detour_miles: number;
}

export const MyRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [newRoute, setNewRoute] = useState({
    route_name: '',
    start_address: '',
    end_address: '',
    schedule_days: [] as string[],
    typical_time: '',
    max_detour_miles: 2
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('casual_routes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const handleSaveRoute = async () => {
    if (!newRoute.route_name || !newRoute.start_address || !newRoute.end_address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('casual_routes')
        .insert({
          user_id: user.id,
          ...newRoute
        });

      if (error) throw error;

      toast({
        title: "Route Added!",
        description: "You'll now see delivery opportunities along this route",
      });

      setIsDialogOpen(false);
      setNewRoute({
        route_name: '',
        start_address: '',
        end_address: '',
        schedule_days: [],
        typical_time: '',
        max_detour_miles: 2
      });
      loadRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
      toast({
        title: "Error",
        description: "Failed to save route",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      const { error } = await supabase
        .from('casual_routes')
        .update({ is_active: false })
        .eq('id', routeId);

      if (error) throw error;

      toast({
        title: "Route Removed",
        description: "You'll no longer receive delivery opportunities for this route",
      });

      loadRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-wellness-primary" />
              <span>My Routes</span>
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-wellness-primary hover:bg-wellness-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Route
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Your Regular Route</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="route-name">Route Name</Label>
                    <Input
                      id="route-name"
                      placeholder="e.g., Home to Work"
                      value={newRoute.route_name}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, route_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="start">Starting Location</Label>
                    <Input
                      id="start"
                      placeholder="Start address"
                      value={newRoute.start_address}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, start_address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">Destination</Label>
                    <Input
                      id="end"
                      placeholder="End address"
                      value={newRoute.end_address}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, end_address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Typical Travel Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newRoute.typical_time}
                      onChange={(e) => setNewRoute(prev => ({ ...prev, typical_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="detour">Max Detour (miles)</Label>
                    <Select
                      value={newRoute.max_detour_miles.toString()}
                      onValueChange={(value) => setNewRoute(prev => ({ ...prev, max_detour_miles: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 mile</SelectItem>
                        <SelectItem value="2">2 miles</SelectItem>
                        <SelectItem value="3">3 miles</SelectItem>
                        <SelectItem value="5">5 miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSaveRoute}
                    disabled={loading}
                    className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                  >
                    {loading ? 'Saving...' : 'Save Route'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No routes added yet</p>
              <p className="text-sm mt-2">Add your regular routes to earn money while you travel</p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => (
                <Card key={route.id} className="bg-gradient-to-r from-card to-wellness-calm/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{route.route_name}</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{route.start_address} → {route.end_address}</span>
                          </div>
                          {route.typical_time && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>Usually around {route.typical_time}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-3 w-3" />
                            <span>Max {route.max_detour_miles} mile detour</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-wellness-primary/10 to-wellness-secondary/10">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💰 Earn While You Travel</h3>
          <p className="text-sm text-muted-foreground mb-4">
            When you're heading along one of your routes, we'll show you delivery opportunities nearby.
            Deliver items that are already on your way and earn extra income!
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-wellness-primary">$5-15</div>
              <div className="text-xs text-muted-foreground">Per delivery</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-wellness-primary">5-10min</div>
              <div className="text-xs text-muted-foreground">Extra time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-wellness-primary">100%</div>
              <div className="text-xs text-muted-foreground">Your earnings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
