import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, CreditCard, MapPin, Clock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface StoreInfo {
  name: string;
  deliveryFee: number;
  deliveryTime: string;
}

interface DeliveryInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
  instructions: string;
}

const OrderCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get data from location state
  const { cartItems = [], storeInfo = {}, totals = {} } = location.state || {};
  const { subtotal = 0, deliveryFee = 0, tax = 0, total = 0 } = totals;
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    name: '',
    email: '',
    address: '',
    phone: '',
    instructions: ''
  });

  // Stripe payment states
  const [clientSecret, setClientSecret] = useState<string>('');
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const validateForm = () => {
    if (!deliveryInfo.name || !deliveryInfo.email || !deliveryInfo.address || !deliveryInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    try {
      console.log('Delivery info:', deliveryInfo);
      console.log('Cart items:', cartItems);
      console.log('Store info:', storeInfo);
      console.log('Totals:', { subtotal, deliveryFee, tax, total });

      // Create a Payment Intent (embedded Stripe)
      setIsCreatingPayment(true);
      const { data, error } = await supabase.functions.invoke('create-order-payment-intent', {
        body: {
          deliveryInfo,
          cartItems,
          storeInfo,
          totals: { subtotal, deliveryFee, tax, total }
        }
      });

      console.log('Function response:', { data, error });

      if (error || !data) {
        console.error('Payment setup error:', error);
        toast({
          title: 'Payment Error',
          description: (error as any)?.message || 'Failed to initialize payment. Please try again.',
          variant: 'destructive',
        });
        setIsCreatingPayment(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setPublishableKey(data.publishableKey);
      setOrderId(data.orderId);
      setIsCreatingPayment(false);
      toast({ title: 'Secure payment', description: 'Enter your card details below to complete your order.' });

    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: "Order Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestOrder = async () => {
    if (!validateForm()) return;
    
    // Create a mock order for testing without payment
    const mockOrderId = 'demo-' + Math.random().toString(36).substr(2, 9);
    
    try {
      // Insert a test order into the database
      const { data: insertedData, error } = await supabase
        .from('delivery_orders')
        .insert({
          customer_name: deliveryInfo.name,
          customer_email: deliveryInfo.email,
          customer_phone: deliveryInfo.phone,
          customer_address: deliveryInfo.address,
          delivery_address: deliveryInfo.address,
          restaurant_address: storeInfo.name, // Using store name as address for demo
          store_name: storeInfo.name,
          cart_items: cartItems,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          tax: tax,
          total_amount: total,
          order_status: 'pending_driver', // Waiting for driver acceptance
          payment_status: 'demo_mode',
          estimated_delivery_time: new Date(Date.now() + 35 * 60000).toISOString(), // 35 minutes from now
          driver_earning: deliveryFee * 0.8,
          company_commission: deliveryFee * 0.2,
          status: 'pending',
          distance_miles: 2.5,
          tips: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error('Demo order creation error:', error);
        toast({
          title: "Demo Mode Error",
          description: "Failed to create demo order",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Demo Order Created",
        description: "Redirecting to order status page...",
      });

      // Navigate to order success page with demo order ID
      navigate(`/order-success?session_id=demo_${insertedData.id}`);
      
    } catch (error) {
      console.error('Demo order error:', error);
      toast({
        title: "Demo Mode Error",
        description: "Something went wrong with the demo",
        variant: "destructive",
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Items in Cart</h1>
          <Button onClick={() => navigate('/delivery')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <ShoppingCart className="mr-3 h-8 w-8" />
            Checkout
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Forms */}
            <div className="space-y-6">
              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Delivery Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={deliveryInfo.name}
                        onChange={(e) => setDeliveryInfo(prev => ({...prev, name: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={deliveryInfo.email}
                        onChange={(e) => setDeliveryInfo(prev => ({...prev, email: e.target.value}))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter your full address"
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo(prev => ({...prev, address: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Your phone number"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo(prev => ({...prev, phone: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                    <Input
                      id="instructions"
                      placeholder="e.g., Ring doorbell, leave at door"
                      value={deliveryInfo.instructions}
                      onChange={(e) => setDeliveryInfo(prev => ({...prev, instructions: e.target.value}))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Payment will be processed securely through Stripe when you place your order.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Store Info */}
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="text-2xl">🏪</div>
                    <div>
                      <h3 className="font-semibold">{storeInfo.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{storeInfo.deliveryTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Items */}
                  {cartItems.map((item: CartItem) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="text-2xl">{item.image}</div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <Separator />

                  {/* Order Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {clientSecret && publishableKey && orderId ? (
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      publishableKey={publishableKey}
                      orderId={orderId}
                      amount={total}
                    />
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        size="lg" 
                        className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                        onClick={handlePlaceOrder}
                        disabled={isCreatingPayment}
                      >
                        {isCreatingPayment ? 'Preparing Payment...' : `Place Order - $${total.toFixed(2)}`}
                      </Button>
                      
                      {/* Test Mode Button */}
                      <Button 
                        variant="outline"
                        size="lg" 
                        className="w-full border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                        onClick={handleTestOrder}
                      >
                        🧪 Test Mode - Skip Payment (Demo)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function PaymentFormContent({ orderId, amount }: { orderId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success?order_id=${orderId}`,
      },
    });
    if (error) {
      console.error('Stripe error:', error);
      toast({
        title: 'Payment Error',
        description: (error as any)?.message || 'Payment failed. Please try again.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button
        onClick={handlePay}
        disabled={!stripe || loading}
        className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </div>
  );
}

function StripePaymentForm(props: { clientSecret: string; publishableKey: string; orderId: string; amount: number }) {
  const stripePromise = loadStripe(props.publishableKey);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret, appearance: { theme: 'flat' } }}>
      <PaymentFormContent orderId={props.orderId} amount={props.amount} />
    </Elements>
  );
}

export default OrderCheckout;