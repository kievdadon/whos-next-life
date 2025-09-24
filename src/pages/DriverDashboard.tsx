import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Phone,
  Camera,
  CreditCard,
  Building,
  Settings
} from 'lucide-react';
import { CameraCapture } from '@/components/CameraCapture';

interface DriverProfile {
  id: string;
  full_name: string;
  email: string;
  status: string;
  routing_number?: string;
  account_number?: string;
  account_holder_name?: string;
  stripe_connect_account_id?: string;
  payout_enabled?: boolean;
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
  customer_phone?: string;
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
  const [testingMode, setTestingMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showBankingForm, setShowBankingForm] = useState(false);
  const [bankingForm, setBankingForm] = useState({
    routing_number: '',
    account_number: '',
    account_holder_name: ''
  });
  const [currentOrderAction, setCurrentOrderAction] = useState<{
    orderId: string;
    action: 'pickup' | 'delivery';
  } | null>(null);

  // For testing: Allow access without authentication
  const isTestingMode = !user || testingMode;
  
  // Redirect non-authenticated users only if not in testing mode
  if (!user && !testingMode) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    loadDriverData();
    loadOrders();
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
    // For testing mode: Create mock driver data but load real orders
    if (isTestingMode) {
      const mockDriver = {
        id: 'test-driver-123',
        full_name: 'Test Driver',
        email: user?.email || 'test@example.com',
        status: 'approved'
      };
      setDriver(mockDriver);
      
      // Load mock data
      setTodaysEarnings(125.50);
      setWeeklyEarnings(890.25);
      setAssignedOrders([]);
      setIsLoading(false);
      
      // Load real orders from database in testing mode
      loadOrdersForTesting();
      return;
    } else {
      if (!user?.email) return;

    try {
      // Check if user has an approved driver application (get most recent one)
      const { data: driverApplications, error: driverError } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      const driverData = driverApplications?.[0];

      if (driverError && driverError.code !== 'PGRST116') {
        console.error('Error loading driver:', driverError);
        return;
      }

      if (!driverData) {
        // Check if user has any application (get most recent one)
        const { data: anyApplications } = await supabase
          .from('driver_applications')
          .select('status')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1);

        const anyApplication = anyApplications?.[0];

        if (anyApplication?.status === 'pending') {
          setDriver({ 
            id: '', 
            full_name: '', 
            email: user.email!, 
            status: 'pending' 
          });
        } else if (anyApplication?.status === 'rejected') {
          setDriver({ 
            id: '', 
            full_name: '', 
            email: user.email!, 
            status: 'rejected' 
          });
        }
        setIsLoading(false);
        return;
      }

      if (driverData) {
        setDriver(driverData);
        await Promise.all([
          loadCurrentShift(driverData.id),
          loadOrders(driverData.id),
          loadEarnings(driverData.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setIsLoading(false);
    }
    } // Close the else block
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

  const loadOrders = async (driverIdOverride?: string) => {
    const currentDriverId = driverIdOverride ?? driver?.id;

    try {
      // Load available orders (not assigned to anyone)
      const { data: available, error: availableError } = await supabase
        .from('delivery_orders')
        .select('*')
        .is('driver_id', null)
        .eq('status', 'pending')
        .order('assigned_at', { ascending: true });

      console.log('Available orders query result:', { available, availableError });

      if (availableError) {
        console.error('Error loading available orders:', availableError);
      } else {
        console.log('Setting available orders:', available);
        setAvailableOrders(available || []);
      }

      // Load assigned orders only if we have a driver id
      if (currentDriverId) {
        const { data: assigned, error: assignedError } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('driver_id', currentDriverId)
          .in('status', ['accepted', 'picked_up'])
          .order('assigned_at', { ascending: true });

        if (assignedError) {
          console.error('Error loading assigned orders:', assignedError);
        } else {
          setAssignedOrders(assigned || []);
        }
      } else {
        setAssignedOrders([]);
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

  const loadOrdersForTesting = async () => {
    try {
      // Load available orders (not assigned to anyone) - testing mode
      const { data: available, error: availableError } = await supabase
        .from('delivery_orders')
        .select('*')
        .is('driver_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Testing mode - Available orders:', available);

      if (availableError) {
        console.error('Error loading available orders in testing mode:', availableError);
      } else {
        setAvailableOrders(available || []);
      }
    } catch (error) {
      console.error('Error in loadOrdersForTesting:', error);
    }
  };

  const clockIn = async () => {
    if (!driver) return;

    // For testing mode: Mock clock in
    if (isTestingMode) {
      const mockShift = {
        id: 'test-shift-123',
        clock_in_time: new Date().toISOString(),
        clock_out_time: null,
        total_hours: null,
        total_earnings: 0,
        total_deliveries: 0,
        status: 'active'
      };
      setCurrentShift(mockShift);
      toast({
        title: "Clocked In (Testing Mode)",
        description: "You're now on shift and ready to receive orders!",
      });
      return;
    }

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

    // For testing mode: Mock clock out
    if (isTestingMode) {
      const clockInTime = new Date(currentShift.clock_in_time);
      const totalHours = (Date.now() - clockInTime.getTime()) / (1000 * 60 * 60);
      
      toast({
        title: "Clocked Out (Testing Mode)",
        description: `Shift completed! You worked ${totalHours.toFixed(2)} hours.`,
      });
      
      setCurrentShift(null);
      return;
    }

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

    // For testing mode: Mock order acceptance
    if (isTestingMode) {
      const orderToAccept = availableOrders.find(order => order.id === orderId);
      if (orderToAccept) {
        setAvailableOrders(prev => prev.filter(order => order.id !== orderId));
        setAssignedOrders(prev => [...prev, { ...orderToAccept, status: 'accepted' }]);
        
        toast({
          title: "Order Accepted (Testing Mode)",
          description: "You've accepted the delivery order!",
        });
      }
      return;
    }

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
    // For testing mode: Mock status update
    if (isTestingMode) {
      setAssignedOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: newStatus,
              pickup_time: newStatus === 'picked_up' ? new Date().toISOString() : order.pickup_time,
              delivery_time: newStatus === 'delivered' ? new Date().toISOString() : order.delivery_time
            }
          : order
      ));
      
      if (newStatus === 'delivered') {
        // Remove from assigned orders and add to earnings
        setTimeout(() => {
          setAssignedOrders(prev => prev.filter(order => order.id !== orderId));
          setTodaysEarnings(prev => prev + 15.75); // Mock earning
        }, 1000);
      }
      
      toast({
        title: "Status Updated (Testing Mode)",
        description: `Order marked as ${newStatus.replace('_', ' ')}!`,
      });
      return;
    }

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

  const updateOrderStatusWithPhoto = async (orderId: string, newStatus: string, photoFile?: File) => {
    try {
      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        const fileName = `${orderId}-${newStatus}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('driver-documents')
          .upload(fileName, photoFile);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          toast({
            title: "Photo Upload Failed",
            description: "Failed to upload photo. Continuing without photo.",
            variant: "destructive",
          });
        } else {
          photoUrl = uploadData.path;
        }
      }

      // For testing mode: Mock status update with photo
      if (isTestingMode) {
        setAssignedOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                pickup_time: newStatus === 'picked_up' ? new Date().toISOString() : order.pickup_time,
                delivery_time: newStatus === 'delivered' ? new Date().toISOString() : order.delivery_time
              }
            : order
        ));
        
        if (newStatus === 'delivered') {
          // Remove from assigned orders and add to earnings
          setTimeout(() => {
            setAssignedOrders(prev => prev.filter(order => order.id !== orderId));
            setTodaysEarnings(prev => prev + 15.75); // Mock earning
          }, 1000);
        }
        
        toast({
          title: "Status Updated (Testing Mode)",
          description: `Order marked as ${newStatus.replace('_', ' ')}! ${photoFile ? '📸 Photo captured' : ''}`,
        });
        return;
      }

      const updateData: any = { status: newStatus };
      
      if (newStatus === 'picked_up') {
        updateData.pickup_time = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivery_time = new Date().toISOString();
      }

      if (photoUrl) {
        updateData[`${newStatus}_photo_url`] = photoUrl;
      }

      const { error } = await supabase
        .from('delivery_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Error",
          description: "Failed to update order status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // If order is delivered, update driver's shift totals
      if (newStatus === 'delivered' && driver && currentShift) {
        const order = assignedOrders.find(o => o.id === orderId);
        if (order) {
          const orderEarning = Number(order.driver_earning || 0) + Number(order.tips || 0);
          
          const { error: shiftError } = await supabase
            .from('driver_shifts')
            .update({
              total_earnings: Number(currentShift.total_earnings || 0) + orderEarning,
              total_deliveries: Number(currentShift.total_deliveries || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentShift.id);

          if (shiftError) {
            console.error('Error updating shift totals:', shiftError);
          } else {
            // Reload current shift to get updated totals
            await loadCurrentShift(driver.id);
          }
        }
      }

      toast({
        title: "Status Updated",
        description: `Order marked as ${newStatus.replace('_', ' ')}! ${photoFile ? '📸 Photo captured' : ''}`,
      });

      loadOrders();
      if (driver) loadEarnings(driver.id);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleOrderAction = (orderId: string, action: 'pickup' | 'delivery') => {
    setCurrentOrderAction({ orderId, action });
    setShowCamera(true);
  };

  const handlePhotoCapture = (photoFile: File) => {
    if (currentOrderAction) {
      const newStatus = currentOrderAction.action === 'pickup' ? 'picked_up' : 'delivered';
      updateOrderStatusWithPhoto(currentOrderAction.orderId, newStatus, photoFile);
      setCurrentOrderAction(null);
    }
    setShowCamera(false);
  };

  const handleBankingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !user) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: {
          accountType: 'driver',
          businessData: {
            ...bankingForm,
            contact_name: driver.full_name,
            business_name: `${driver.full_name} - Driver`
          }
        }
      });

      if (error) throw error;

      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
        toast({ title: 'Redirecting to Stripe onboarding...' });
      }

      setShowBankingForm(false);
      setBankingForm({
        routing_number: '',
        account_number: '',
        account_holder_name: ''
      });
    } catch (error) {
      console.error('Error setting up banking:', error);
      toast({ title: 'Error setting up banking information', variant: 'destructive' });
    }
  };

  const cancelBankingForm = () => {
    setShowBankingForm(false);
    setBankingForm({
      routing_number: '',
      account_number: '',
      account_holder_name: ''
    });
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
            <h2 className="text-2xl font-bold mb-2">No Driver Application Found</h2>
            <p className="text-muted-foreground mb-6">
              You don't have a driver application yet. Please apply for driver registration first.
            </p>
            <Button onClick={() => window.location.href = '/driver-application'}>
              Apply to Become a Driver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (driver.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8">
            <Timer className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Under Review</h2>
            <p className="text-muted-foreground mb-6">
              Your driver application is being reviewed. We'll notify you via email once it's processed (typically within 2-3 business days).
            </p>
            <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (driver.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Not Approved</h2>
            <p className="text-muted-foreground mb-6">
              Unfortunately, your driver application was not approved. You're welcome to reapply in the future if your circumstances change.
            </p>
            <Button onClick={() => window.location.href = '/driver-application'} variant="outline">
              Apply Again
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
            {isTestingMode && (
              <Badge className="bg-orange-100 text-orange-800 mt-2">
                Testing Mode - No Authentication Required
              </Badge>
            )}
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

        {/* Banking Setup Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment & Banking Setup
            </CardTitle>
            <CardDescription>
              Configure your banking information to receive payments from deliveries. 
              WHOSENXT will take a 15% commission from each delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {driver?.stripe_connect_account_id ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">Banking connected successfully</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Your Stripe Connect account is set up and ready to receive payments.</p>
                  <p className="mt-2">Commission structure:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>You receive: 85% of each delivery</li>
                    <li>WHOSENXT commission: 15% of each delivery</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-700 font-medium">Banking setup required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Set up your banking information to start receiving payments from deliveries.
                </p>
                <Button onClick={() => setShowBankingForm(true)}>
                  <Building className="mr-2 h-4 w-4" />
                  Set Up Banking Information
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
                          {(order.distance_miles ?? '-') + ' miles'} • ${Number(order.driver_earning ?? 0).toFixed(2)}
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
                          <p className="font-bold text-green-600">${Number(order.driver_earning ?? 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Company Fee</p>
                          <p className="font-bold">${Number(order.company_commission ?? 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Delivery Fee</p>
                          <p className="font-bold">${Number(order.delivery_fee ?? 0).toFixed(2)}</p>
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
                          onClick={() => handleOrderAction(order.id, 'pickup')}
                          className="flex-1"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Mark Picked Up
                        </Button>
                      )}
                      {order.status === 'picked_up' && (
                        <Button 
                          onClick={() => handleOrderAction(order.id, 'delivery')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Mark Delivered
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => window.open(`tel:${order.customer_phone || '555-0123'}`, '_self')}
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
        
        {/* Camera Component for Photo Capture */}
        <CameraCapture
          isOpen={showCamera}
          onClose={() => {
            setShowCamera(false);
            setCurrentOrderAction(null);
          }}
          onCapture={handlePhotoCapture}
          title={currentOrderAction?.action === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
        />

        {/* Banking Form Modal */}
        {showBankingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Banking Information Setup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This information will be used to set up your Stripe Connect account for receiving payments.
                </p>
                <form onSubmit={handleBankingSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="account_holder_name">Account Holder Name</Label>
                    <Input
                      id="account_holder_name"
                      value={bankingForm.account_holder_name}
                      onChange={(e) => setBankingForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                      placeholder="Full name on bank account"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="routing_number">Routing Number</Label>
                    <Input
                      id="routing_number"
                      value={bankingForm.routing_number}
                      onChange={(e) => setBankingForm(prev => ({ ...prev, routing_number: e.target.value }))}
                      placeholder="9-digit routing number"
                      maxLength={9}
                      pattern="[0-9]{9}"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={bankingForm.account_number}
                      onChange={(e) => setBankingForm(prev => ({ ...prev, account_number: e.target.value }))}
                      placeholder="Bank account number"
                      required
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Commission Structure</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• You receive 85% of each delivery payment</li>
                      <li>• WHOSENXT takes 15% commission</li>
                      <li>• Payments processed securely through Stripe</li>
                    </ul>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={cancelBankingForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Setup Banking
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;