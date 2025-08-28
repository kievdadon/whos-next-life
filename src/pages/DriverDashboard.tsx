import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { 
  Clock, 
  DollarSign, 
  Package, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Timer,
  TrendingUp,
  Car,
  PlayCircle,
  StopCircle
} from 'lucide-react';

interface DriverApplication {
  id: string;
  full_name: string;
  email: string;
  status: string;
  approved_at: string;
}

interface DriverShift {
  id: string;
  driver_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  total_hours: number | null;
  total_earnings: number;
  total_deliveries: number;
  status: string;
}

interface DeliveryOrder {
  id: string;
  order_id: string;
  customer_address: string;
  restaurant_address: string;
  pickup_time: string | null;
  delivery_time: string | null;
  distance_miles: number;
  delivery_fee: number;
  driver_earning: number;
  company_commission: number;
  tips: number;
  status: string;
  assigned_at: string;
}

const DriverDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [driver, setDriver] = useState<DriverApplication | null>(null);
  const [currentShift, setCurrentShift] = useState<DriverShift | null>(null);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<DeliveryOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<DeliveryOrder[]>([]);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    loadDriverData();
  }, [user]);

  const loadDriverData = async () => {
    if (!user?.email) return;

    try {
      // Check if user is an approved driver
      const { data: driverData, error: driverError } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'approved')
        .single();

      if (driverError && driverError.code !== 'PGRST116') {
        console.error('Error loading driver:', driverError);
        return;
      }

      if (driverData) {
        setDriver(driverData);
        
        // Load current active shift
        const { data: shiftData } = await supabase
          .from('driver_shifts')
          .select('*')
          .eq('driver_id', driverData.id)
          .eq('status', 'active')
          .single();
        
        if (shiftData) {
          setCurrentShift(shiftData);
        }

        // Load available orders (unassigned)
        const { data: availableOrdersData } = await supabase
          .from('delivery_orders')
          .select('*')
          .is('driver_id', null)
          .eq('status', 'pending')
          .order('assigned_at', { ascending: true });

        setAvailableOrders(availableOrdersData || []);

        // Load driver's active orders
        const { data: activeOrdersData } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('driver_id', driverData.id)
          .in('status', ['accepted', 'picked_up'])
          .order('assigned_at', { ascending: true });

        setActiveOrders(activeOrdersData || []);

        // Load completed orders for today
        const today = new Date().toISOString().split('T')[0];
        const { data: completedOrdersData } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('driver_id', driverData.id)
          .eq('status', 'delivered')
          .gte('delivery_time', `${today}T00:00:00`)
          .order('delivery_time', { ascending: false });

        setCompletedOrders(completedOrdersData || []);

        // Calculate earnings
        const todayEarnings = (completedOrdersData || []).reduce((sum, order) => 
          sum + order.driver_earning + order.tips, 0);
        
        setEarnings({
          today: todayEarnings,
          week: todayEarnings, // Simplified for demo
          total: todayEarnings
        });
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clockIn = async () => {
    if (!driver) return;

    try {
      const { data, error } = await supabase
        .from('driver_shifts')
        .insert({
          driver_id: driver.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error clocking in:', error);
        toast({
          title: "Error",
          description: "Failed to clock in. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setCurrentShift(data);
      toast({
        title: "Clocked In",
        description: "You're now online and ready to receive orders!",
      });
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const clockOut = async () => {
    if (!currentShift) return;

    try {
      const clockOutTime = new Date().toISOString();
      const clockInTime = new Date(currentShift.clock_in_time);
      const totalHours = (Date.now() - clockInTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('driver_shifts')
        .update({
          clock_out_time: clockOutTime,
          total_hours: Math.round(totalHours * 100) / 100,
          status: 'completed'
        })
        .eq('id', currentShift.id);

      if (error) {
        console.error('Error clocking out:', error);
        toast({
          title: "Error",
          description: "Failed to clock out. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setCurrentShift(null);
      toast({
        title: "Clocked Out",
        description: `Shift completed! You worked ${Math.round(totalHours * 100) / 100} hours.`,
      });
      
      loadDriverData();
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const acceptOrder = async (order: DeliveryOrder) => {
    if (!driver || !currentShift) {
      toast({
        title: "Clock In Required",
        description: "You must be clocked in to accept orders.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          driver_id: driver.id,
          status: 'accepted'
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error accepting order:', error);
        toast({
          title: "Error",
          description: "Failed to accept order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Order Accepted",
        description: "Navigate to the restaurant to pick up the order.",
      });
      
      loadDriverData();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const updateData: any = { status };
      
      if (status === 'picked_up') {
        updateData.pickup_time = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivery_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('delivery_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Error",
          description: "Failed to update order status.",
          variant: "destructive",
        });
        return;
      }

      const statusMessages = {
        picked_up: "Order picked up! Navigate to customer location.",
        delivered: "Order delivered successfully! Great job!",
        cancelled: "Order cancelled."
      };

      toast({
        title: "Status Updated",
        description: statusMessages[status as keyof typeof statusMessages],
      });
      
      loadDriverData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-wellness-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Driver Access Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to be an approved driver to access this dashboard. Please apply for driver registration first.
            </p>
            <Button onClick={() => window.location.href = '/driver-application'}>
              Apply to Become a Driver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Driver Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {driver.full_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={currentShift ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {currentShift ? 'Online' : 'Offline'}
            </Badge>
            {currentShift ? (
              <Button onClick={clockOut} variant="outline" className="flex items-center gap-2">
                <StopCircle className="h-4 w-4" />
                Clock Out
              </Button>
            ) : (
              <Button onClick={clockIn} className="bg-wellness-primary hover:bg-wellness-primary/90 flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Clock In
              </Button>
            )}
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Today's Earnings</p>
                  <p className="text-2xl font-bold">${earnings.today.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-wellness-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Deliveries Today</p>
                  <p className="text-2xl font-bold">{completedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Timer className="h-8 w-8 text-wellness-secondary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Hours Today</p>
                  <p className="text-2xl font-bold">
                    {currentShift ? 
                      Math.round(((Date.now() - new Date(currentShift.clock_in_time).getTime()) / (1000 * 60 * 60)) * 100) / 100 
                      : '0.00'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Active Deliveries</h2>
            <div className="grid gap-4">
              {activeOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className="mb-2">{order.status.replace('_', ' ').toUpperCase()}</Badge>
                        <p className="font-semibold">Order #{order.order_id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">{order.distance_miles} miles</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${order.driver_earning.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">+ tips</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Pickup: {order.restaurant_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Deliver: {order.customer_address}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'accepted' && (
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Mark Picked Up
                        </Button>
                      )}
                      {order.status === 'picked_up' && (
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Mark Delivered
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Orders */}
        {currentShift && availableOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Available Orders</h2>
            <div className="grid gap-4">
              {availableOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold">Order #{order.order_id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">{order.distance_miles} miles</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${order.driver_earning.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Your earnings</p>
                        <p className="text-xs text-muted-foreground">Company: ${order.company_commission.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Pickup: {order.restaurant_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Deliver: {order.customer_address}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => acceptOrder(order)}
                        className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Deliveries */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Today's Completed Deliveries</h2>
            <div className="grid gap-4">
              {completedOrders.map((order) => (
                <Card key={order.id} className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Order #{order.order_id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Delivered at {new Date(order.delivery_time!).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ${(order.driver_earning + order.tips).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Earnings: ${order.driver_earning.toFixed(2)} | Tips: ${order.tips.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Company: ${order.company_commission.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!currentShift && availableOrders.length === 0 && activeOrders.length === 0 && completedOrders.length === 0 && (
          <Card>
            <CardContent className="text-center pt-8">
              <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Start Driving?</h3>
              <p className="text-muted-foreground mb-4">
                Clock in to start receiving delivery orders and earning money.
              </p>
              <Button 
                onClick={clockIn}
                className="bg-wellness-primary hover:bg-wellness-primary/90 flex items-center gap-2 mx-auto"
              >
                <PlayCircle className="h-4 w-4" />
                Start Your Shift
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;