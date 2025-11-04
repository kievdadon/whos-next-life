import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Check, Shield, ArrowLeft, CreditCard, Clock, User, Mail, MapPin, Star, Users, BarChart3, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';

const CheckoutVeteran = () => {
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

  // If user already has Veteran plan
  if (subscribed && subscriptionTier === 'veteran') {
    return <Navigate to="/subscription-plans" replace />;
  }

  const planDetails = {
    name: 'Veteran Plan',
    price: 40,
    originalPrice: 60,
    features: [
      'Free delivery every day',
      '30% off clothing & accessories',
      'VIP customer support',
      'Instant gig notifications',
      'Exclusive gig access',
      'Full online store suite',
      'Business analytics dashboard'
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
    console.log('Starting checkout process for veteran tier');
    console.log('Session exists:', !!session);
    console.log('Billing info:', billingInfo);
    
    try {
      console.log('Calling create-checkout function...');
      
      // Add timeout to the function call
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Function call timeout')), 30000)
      );
      
      const functionCallPromise = supabase.functions.invoke('create-checkout', {
        body: { 
          tier: 'veteran',
          billingInfo: billingInfo
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await Promise.race([functionCallPromise, timeoutPromise]);
      const { data, error } = result;
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
        description: error.message || "Failed to create checkout session. Please try again.",
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
          <div className="flex justify-center mb-4">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              Premium Plan
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete Your Veteran Subscription</h1>
          <p className="text-muted-foreground">Welcome to the ultimate WHOSENXT experience!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Billing Information */}
          <Card className="border-2 border-gradient-to-r from-wellness-primary to-wellness-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-wellness-primary" />
                VIP Billing Information
              </CardTitle>
              <CardDescription>
                Enter your details for billing and VIP account setup
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
                <Label htmlFor="phone">Phone Number (VIP Support)</Label>
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

              {/* VIP Perks Preview */}
              <div className="mt-6 p-4 bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5 rounded-lg border border-wellness-primary/20">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-wellness-primary" />
                  VIP Benefits Included
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-3 w-3 text-wellness-primary" />
                    <span>Personal account manager assignment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <BarChart3 className="h-3 w-3 text-wellness-secondary" />
                    <span>Advanced business analytics access</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="h-fit border-2 border-gradient-to-r from-wellness-primary to-wellness-secondary shadow-xl">
            <CardHeader className="bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-wellness-primary" />
                VIP Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-wellness-primary to-wellness-secondary">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{planDetails.name}</h3>
                    <p className="text-sm text-muted-foreground">Premium monthly subscription</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {planDetails.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-wellness-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">+ {planDetails.features.length - 6} more premium features</p>
                </div>

                {/* Annual Savings Calculator */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4 rounded-lg border">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Your Annual Savings
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>30% off $500 purchases:</span>
                      <span className="font-semibold text-green-600">$150</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily free delivery (365 days):</span>
                      <span className="font-semibold text-green-600">$1,825</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VIP support value:</span>
                      <span className="font-semibold text-green-600">$600</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total annual value:</span>
                      <span className="text-wellness-primary">$2,575+</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Veteran Plan (Monthly)</span>
                  <div className="text-right">
                    <span className="line-through text-muted-foreground text-sm">${planDetails.originalPrice}.00</span>
                    <span className="ml-2">${planDetails.price}.00</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>VIP Setup & Onboarding</span>
                  <span>Free ($99 value)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Founder's Discount</span>
                  <span className="text-green-600">-$20.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-wellness-primary">${planDetails.price}.00/month</span>
                </div>
              </div>

              {/* Payment Security */}
              <div className="bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-wellness-primary" />
                  <span className="font-medium">Enterprise-Grade Security</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    <span>All payment methods accepted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Instant VIP activation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Bank-level encryption</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-wellness-primary to-wellness-secondary hover:from-wellness-primary/90 hover:to-wellness-secondary/90 text-white py-3 text-lg font-semibold"
                size="lg"
              >
                {loading ? 'Processing...' : 'Activate VIP Membership'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Premium support team will contact you within 24 hours to welcome you 
                and set up your personal account manager.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutVeteran;