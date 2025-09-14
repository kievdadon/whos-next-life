import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Clock, Truck, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DeliveryOrder {
  id: string;
  customer_name: string;
  store_name: string;
  delivery_address: string;
  customer_address: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  estimated_delivery_time: string;
  driver_id?: string;
  cart_items: any;
  subtotal: number;
  delivery_fee: number;
  tax: number;
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    if (sessionId.startsWith('demo_')) {
      // Handle demo orders
      loadDemoOrder();
    } else {
      // Handle real orders
      verifyPaymentAndLoadOrder();
    }
  }, [sessionId]);

  const loadDemoOrder = async () => {
    try {
      setLoading(true);
      const orderId = sessionId.replace('demo_', '');
      
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        toast({
          title: "Order Not Found",
          description: "Unable to find your demo order.",
          variant: "destructive",
        });
        return;
      }

      setOrder({
        ...data,
        cart_items: Array.isArray(data.cart_items) ? data.cart_items : []
      } as DeliveryOrder);

      // Set up real-time updates for the order
      const channel = supabase
        .channel(`order-${data.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'delivery_orders',
            filter: `id=eq.${data.id}`
          },
          (payload) => {
            console.log('Order updated:', payload);
            setOrder(prev => prev ? { ...prev, ...payload.new } : null);
            
            // Show notification for status changes
            if (payload.new.order_status === 'assigned') {
              toast({
                title: "Driver Assigned!",
                description: "A driver has been assigned to your order.",
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } catch (error) {
      console.error('Error loading demo order:', error);
      toast({
        title: "Error",
        description: "Something went wrong loading your demo order.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymentAndLoadOrder = async () => {
    try {
      setLoading(true);
      
      // Verify payment with Stripe
      const { data, error } = await supabase.functions.invoke('verify-order-payment', {
        body: { sessionId }
      });

      if (error || !data.success) {
        toast({
          title: "Payment Verification Failed",
          description: "Unable to verify your payment. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      setOrder(data.order);

      // Set up real-time updates for the order
      const channel = supabase
        .channel(`order-${data.order.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'delivery_orders',
            filter: `id=eq.${data.order.id}`
          },
          (payload) => {
            console.log('Order updated:', payload);
            setOrder(prev => prev ? { ...prev, ...payload.new } : null);
            
            // Show notification for status changes
            if (payload.new.order_status === 'assigned') {
              toast({
                title: "Driver Assigned!",
                description: "A driver has been assigned to your order.",
              });
            } else if (payload.new.order_status === 'picked_up') {
              toast({
                title: "Order Picked Up",
                description: "Your order has been picked up and is on the way!",
              });
            } else if (payload.new.order_status === 'delivered') {
              toast({
                title: "Order Delivered!",
                description: "Your order has been delivered. Enjoy!",
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'assigned': return 'secondary';
      case 'picked_up': return 'secondary';
      case 'delivered': return 'default';
      default: return 'outline';
    }
  };

  const formatDeliveryTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            {order.payment_status === 'demo_mode' ? 'Demo Order Created!' : 'Order Confirmed!'}
          </h1>
          <p className="text-muted-foreground">
            {order.payment_status === 'demo_mode' 
              ? 'This is a demo order. No payment was processed.'
              : 'Thank you for your order. We\'ll keep you updated on your delivery.'
            }
          </p>
        </div>

        {/* Pending Driver Alert */}
        {order.order_status === 'pending_driver' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="animate-pulse w-4 h-4 bg-yellow-400 rounded-full"></div>
              <div>
                <h3 className="font-semibold text-yellow-800">Looking for a Driver</h3>
                <p className="text-yellow-700">
                  We're finding a nearby driver to accept your order. This usually takes 2-5 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Status</span>
              <Badge variant={getStatusBadgeColor(order.order_status)}>
                {order.order_status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-muted-foreground">{order.delivery_address}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Estimated Delivery</p>
                  <p className="text-muted-foreground">
                    {formatDeliveryTime(order.estimated_delivery_time)}
                  </p>
                </div>
              </div>

              {order.driver_id && (
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Driver Assigned</p>
                    <p className="text-muted-foreground">Your order is being prepared for delivery</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">From: {order.store_name}</p>
                <p className="text-muted-foreground">Order #{order.id.slice(-8)}</p>
              </div>
              
              <div className="space-y-2">
                {order.cart_items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 font-medium flex justify-between">
                  <span>Total</span>
                  <span>${order.total_amount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/delivery')} 
            className="w-full"
          >
            <Truck className="w-4 h-4 mr-2" />
            Track More Orders
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Support Info */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-center">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Need Help?</p>
                <p className="text-muted-foreground">Call us at (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderSuccess;