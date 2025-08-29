import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Check, Star, ArrowLeft, CreditCard, Shield, Clock, User, Mail, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';

const CheckoutPro = () => {
  const { user, session, subscribed, subscriptionTier } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });
  const { toast } = useToast();

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user already has Pro or higher plan
  if (subscribed && (subscriptionTier === 'pro' || subscriptionTier === 'elite' || subscriptionTier === 'veteran')) {
    return <Navigate to="/subscription-plans" replace />;
  }

  const planDetails = {
    name: 'Pro Plan',
    price: 10,
    features: [
      'Free delivery 2 days per week',
      'Access to all WHOSENXT features',
      '10% off clothing & accessories',
      'Basic gig notifications',
      'Mobile app access',
      'Email customer support',
      'Monthly wellness tips'
    ]
  };

  const handleInputChange = (field: string, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email'];
    for (let field of required) {
      if (!billingInfo[field as keyof typeof billingInfo]) {
        toast({
          title: "Missing Information",
          description: `Please fill in your ${field === 'firstName' ? 'first name' : field === 'lastName' ? 'last name' : field}`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!session || !validateForm()) return;
    
    setLoading(true);
    console.log('Starting checkout process for pro tier');
    console.log('Session exists:', !!session);
    console.log('Billing info:', billingInfo);
    
    try {
      console.log('Calling create-checkout function...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          tier: 'pro',
          billingInfo: billingInfo
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Response from create-checkout:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.url) {
        console.error('No URL returned from create-checkout');
        throw new Error('No checkout URL received');
      }

      console.log('Redirecting to Stripe checkout:', data.url);
      // Redirect to Stripe checkout in the same tab
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to="/subscription-plans" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Link>
          <h1 className="text-3xl font-bold mb-2">Complete Your Pro Subscription</h1>
          <p className="text-muted-foreground">Just a few details and you're ready to go!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-wellness-primary" />
                Billing Information
              </CardTitle>
              <CardDescription>
                Enter your details for billing and account setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={billingInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={billingInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className="pl-10"
                    disabled={!!user?.email}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={billingInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={billingInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={billingInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={billingInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={billingInfo.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={billingInfo.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-wellness-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-wellness-primary/10">
                    <Star className="h-6 w-6 text-wellness-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{planDetails.name}</h3>
                    <p className="text-sm text-muted-foreground">Monthly subscription</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {planDetails.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-wellness-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">+ {planDetails.features.length - 4} more features</p>
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Pro Plan (Monthly)</span>
                  <span>${planDetails.price}.00</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Setup Fee</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-wellness-primary">${planDetails.price}.00/month</span>
                </div>
              </div>

              {/* Payment Security */}
              <div className="bg-wellness-primary/5 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-wellness-primary" />
                  <span className="font-medium">Secure Payment</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    <span>All major credit & debit cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Instant activation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>256-bit SSL encryption</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-wellness-primary hover:bg-wellness-primary/90 text-white py-3 text-lg"
                size="lg"
              >
                {loading ? 'Processing...' : 'Complete Purchase'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You'll be redirected to Stripe's secure payment page to complete your purchase. 
                No payment information is stored on our servers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPro;