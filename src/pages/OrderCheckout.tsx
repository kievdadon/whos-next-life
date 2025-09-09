import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Clock, CreditCard } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const OrderCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { cartItems, storeInfo, totalPrice } = location.state || {
    cartItems: [],
    storeInfo: { name: "Store", deliveryFee: 0, deliveryTime: "30 min" },
    totalPrice: 0
  };

  const [deliveryInfo, setDeliveryInfo] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    instructions: ""
  });

  const subtotal = totalPrice;
  const deliveryFee = storeInfo.deliveryFee;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    // Validate delivery info
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address || !deliveryInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all delivery details.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create payment session with Stripe
      const { data, error } = await supabase.functions.invoke('create-order-payment', {
        body: {
          deliveryInfo,
          cartItems,
          storeInfo,
          totals: {
            subtotal,
            deliveryFee,
            tax,
            total
          }
        }
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Error",
          description: "Failed to process payment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }

    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: "Order Error",
        description: "Failed to place order. Please try again.",
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Delivery
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Store Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>{storeInfo.name}</span>
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{storeInfo.deliveryTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>Delivery ${storeInfo.deliveryFee}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
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
                      placeholder="your.email@example.com"
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

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="text-2xl">{item.image}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <Separator />

                {/* Price Breakdown */}
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

                <Button 
                  size="lg" 
                  className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                  onClick={handlePlaceOrder}
                >
                  Place Order - ${total.toFixed(2)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCheckout;