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
  MapPin, 
  CheckCircle, 
  XCircle, 
  Timer, 
  TrendingUp,
  Car,
  Navigation,
  Phone
} from 'lucide-react';

interface DriverProfile {
  id: string;
  full_name: string;
  email: string;
  status: string;
}

interface DriverShift {
  id: string;
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
  distance_miles: number;
  delivery_fee: number;
  driver_earning: number;
  company_commission: number;
  tips: number;
  status: string;
  assigned_at: string;
  pickup_time: string | null;
  delivery_time: string | null;
}

const DriverDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [currentShift, setCurrentShift] = useState<DriverShift | null>(null);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    loadDriverData();
    // Set up real-time subscription for new orders
    const ordersSubscription = supabase
      .channel('delivery-orders')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'delivery_orders' },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
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
        await Promise.all([
          loadCurrentShift(driverData.id),
          loadOrders(),
          loadEarnings(driverData.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentShift = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_shifts')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading current shift:', error);
        return;
      }

      setCurrentShift(data);
    } catch (error) {
      console.error('Error loading current shift:', error);
    }
  };

  const loadOrders = async () => {
    if (!driver) return;

    try {
      // Load available orders (not assigned to anyone)
      const { data: available, error: availableError } = await supabase
        .from('delivery_orders')
        .select('*')
        .is('driver_id', null)
        .eq('status', 'pending')
        .order('assigned_at', { ascending: true });

      if (availableError) {
        console.error('Error loading available orders:', availableError);
      } else {
        setAvailableOrders(available || []);
      }

      // Load assigned orders
      const { data: assigned, error: assignedError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('driver_id', driver.id)
        .in('status', ['accepted', 'picked_up'])
        .order('assigned_at', { ascending: true });

      if (assignedError) {
        console.error('Error loading assigned orders:', assignedError);
      } else {
        setAssignedOrders(assigned || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadEarnings = async (driverId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Today's earnings
      const { data: todayData, error: todayError } = await supabase
        .from('delivery_orders')
        .select('driver_earning, tips')
        .eq('driver_id', driverId)
        .eq('status', 'delivered')
        .gte('delivery_time', today);

      if (!todayError && todayData) {
        const todayTotal = todayData.reduce((sum, order) => 
          sum + order.driver_earning + (order.tips || 0), 0
        );
        setTodaysEarnings(todayTotal);
      }

      // Weekly earnings
      const { data: weekData, error: weekError } = await supabase
        .from('delivery_orders')
        .select('driver_earning, tips')
        .eq('driver_id', driverId)
        .eq('status', 'delivered')
        .gte('delivery_time', weekAgo);

      if (!weekError && weekData) {
        const weekTotal = weekData.reduce((sum, order) => 
          sum + order.driver_earning + (order.tips || 0), 0
        );
        setWeeklyEarnings(weekTotal);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const clockIn = async () => {
    if (!driver) return;

    try {
      const { error } = await supabase
        .from('driver_shifts')
        .insert({
          driver_id: driver.id,
          status: 'active'
        });

      if (error) {
        console.error('Error clocking in:', error);
        toast({
          title: "Error",
          description: "Failed to clock in. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Clocked In",
        description: "You're now on shift and ready to receive orders!",
      });

      loadCurrentShift(driver.id);
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const clockOut = async () => {
    if (!driver || !currentShift) return;

    try {
      const clockOutTime = new Date().toISOString();
      const clockInTime = new Date(currentShift.clock_in_time);
      const totalHours = (Date.now() - clockInTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('driver_shifts')
        .update({
          clock_out_time: clockOutTime,
          total_hours: totalHours,
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

      toast({
        title: "Clocked Out",
        description: `Shift completed! You worked ${totalHours.toFixed(2)} hours.`,
      });

      setCurrentShift(null);
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (!driver) return;

    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          driver_id: driver.id,
          status: 'accepted'
        })
        .eq('id', orderId);

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
        description: "You've accepted the delivery order!",
      });

      loadOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'picked_up') {
        updateData.pickup_time = new Date().toISOString();
      } else if (newStatus === 'delivered') {
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

      toast({
        title: "Status Updated",
        description: `Order marked as ${newStatus.replace('_', ' ')}!`,
      });

      loadOrders();
      if (driver) loadEarnings(driver.id);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-wellness-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your driver dashboard...</p>
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
            <h2 className="text-2xl font-bold mb-2">No Approved Driver Application</h2>
            <p className="text-muted-foreground mb-6">
              You don't have an approved driver application yet. Please apply for driver registration first.
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
            <p className="text-muted-foreground">Welcome back, {driver.full_name}!</p>
          </div>
          <div className="flex gap-4">
            <Badge className="bg-green-100 text-green-800">
              Active Driver
            </Badge>
            {currentShift ? (
              <Button onClick={clockOut} variant="destructive">
                <Clock className="h-4 w-4 mr-2" />
                Clock Out
              </Button>
            ) : (
              <Button onClick={clockIn} className="bg-wellness-primary hover:bg-wellness-primary/90">
                <Clock className="h-4 w-4 mr-2" />
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
                  <p className="text-2xl font-bold">${todaysEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-wellness-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Weekly Earnings</p>
                  <p className="text-2xl font-bold">${weeklyEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-wellness-secondary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">{assignedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Timer className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Shift Status</p>
                  <p className="text-lg font-bold">
                    {currentShift ? 'On Duty' : 'Off Duty'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Shift Info */}
        {currentShift && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Shift</CardTitle>
              <CardDescription>
                Started at {new Date(currentShift.clock_in_time).toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hours Worked</p>
                  <p className="text-xl font-bold">
                    {((Date.now() - new Date(currentShift.clock_in_time).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deliveries Today</p>
                  <p className="text-xl font-bold">{currentShift.total_deliveries}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shift Earnings</p>
                  <p className="text-xl font-bold">${currentShift.total_earnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Orders */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Orders</h2>
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold">Order #{order.order_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.distance_miles} miles • ${order.driver_earning.toFixed(2)}
                        </p>
                      </div>
                      <Badge>Available</Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-red-500" />
                        <span>From: {order.restaurant_address}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Navigation className="h-4 w-4 mr-2 text-green-500" />
                        <span>To: {order.customer_address}</span>
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-lg mb-4">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Your Earnings</p>
                          <p className="font-bold text-green-600">${order.driver_earning.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Company Fee</p>
                          <p className="font-bold">${order.company_commission.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Delivery Fee</p>
                          <p className="font-bold">${order.delivery_fee.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => acceptOrder(order.id)} 
                      className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                      disabled={!currentShift}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Order
                    </Button>
                    {!currentShift && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Clock in to accept orders
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {availableOrders.length === 0 && (
                <Card>
                  <CardContent className="text-center pt-8">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Available Orders</h3>
                    <p className="text-muted-foreground">
                      Check back soon for new delivery opportunities!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Assigned Orders */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Active Orders</h2>
            <div className="space-y-4">
              {assignedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold">Order #{order.order_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.distance_miles} miles • ${(order.driver_earning + order.tips).toFixed(2)}
                        </p>
                      </div>
                      <Badge variant={order.status === 'accepted' ? 'default' : 'secondary'}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-red-500" />
                        <span>From: {order.restaurant_address}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Navigation className="h-4 w-4 mr-2 text-green-500" />
                        <span>To: {order.customer_address}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'accepted' && (
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          className="flex-1"
                        >
                          Mark Picked Up
                        </Button>
                      )}
                      {order.status === 'picked_up' && (
                        <Button 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Mark Delivered
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => window.open(`tel:${order.customer_address}`, '_self')}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {assignedOrders.length === 0 && (
                <Card>
                  <CardContent className="text-center pt-8">
                    <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Active Orders</h3>
                    <p className="text-muted-foreground">
                      Accept orders from the available list to start earning!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;