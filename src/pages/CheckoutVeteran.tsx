import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, ArrowLeft, CreditCard, Clock, Star, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';

const CheckoutVeteran = () => {
  const { user, session, subscribed, subscriptionTier } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user already has Veteran plan
  if (subscribed && subscriptionTier === 'veteran') {
    return <Navigate to="/subscription-plans" replace />;
  }

  const features = [
    'Free delivery every day',
    'VIP customer support',
    '30% off clothing & accessories',
    'Instant gig notifications',
    'Exclusive gig access',
    'Full online store suite',
    'Business analytics dashboard',
    'Personal account manager',
    'Advanced wellness programs',
    'Exclusive member meetups',
    'White-label marketplace options',
    'API access for integrations'
  ];

  const handleCheckout = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: 'veteran' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
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
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to="/subscription-plans" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Link>
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-wellness-primary to-wellness-secondary relative">
              <Shield className="h-12 w-12 text-white" />
              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                Premium
              </Badge>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
            Veteran Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The ultimate WHOSENXT experience with exclusive access and premium features
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card className="border-2 border-gradient-to-r from-wellness-primary to-wellness-secondary">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Shield className="h-6 w-6 text-wellness-primary" />
                Veteran Plan Features
              </CardTitle>
              <CardDescription>
                Everything in Elite, plus exclusive premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-wellness-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Premium Features Highlight */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5 rounded-lg border border-wellness-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-wellness-primary" />
                    <span className="font-semibold text-sm">Personal Account Manager</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get dedicated 1-on-1 support from your personal WHOSENXT specialist.
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-wellness-secondary/5 to-wellness-primary/5 rounded-lg border border-wellness-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-wellness-secondary" />
                    <span className="font-semibold text-sm">Business Analytics</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Advanced insights and analytics for your marketplace activities and business growth.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Card */}
          <Card className="h-fit border-2 border-gradient-to-r from-wellness-primary to-wellness-secondary shadow-xl">
            <CardHeader className="text-center bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5">
              <div className="text-4xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent mb-2">
                $40<span className="text-lg text-muted-foreground">/month</span>
              </div>
              <CardTitle>Start Your Veteran Subscription</CardTitle>
              <CardDescription>
                Ultimate plan - VIP treatment and exclusive access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Value Comparison */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4 rounded-lg border">
                <p className="text-sm font-medium text-center mb-3">💰 Potential Annual Savings</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>30% off $500 annual purchases:</span>
                    <span className="font-semibold">$150</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily free delivery ($5/day × 365):</span>
                    <span className="font-semibold">$1,825</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total annual value:</span>
                    <span className="text-wellness-primary">$1,975+</span>
                  </div>
                </div>
              </div>

              {/* Exclusive Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Exclusive member benefits</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-wellness-primary" />
                  <span>Secure payment powered by Stripe</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-wellness-primary" />
                  <span>Accepts all major credit and debit cards</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-wellness-primary" />
                  <span>Instant VIP activation</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-wellness-primary to-wellness-secondary hover:from-wellness-primary/90 hover:to-wellness-secondary/90 text-white py-3 text-lg font-semibold"
                size="lg"
              >
                {loading ? 'Processing...' : 'Subscribe to Veteran Plan'}
              </Button>

              {/* Terms */}
              <p className="text-xs text-muted-foreground text-center">
                By subscribing, you agree to our Terms of Service and Privacy Policy. 
                Your VIP subscription will auto-renew monthly until cancelled.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Veteran Plan FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">What makes Veteran the ultimate plan?</h4>
              <p className="text-sm text-muted-foreground">
                Veteran includes daily free delivery, highest discounts (30%), personal account manager, exclusive gig access, and advanced business tools that aren't available in other plans.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What is a personal account manager?</h4>
              <p className="text-sm text-muted-foreground">
                You'll be assigned a dedicated WHOSENXT specialist who knows your preferences, helps optimize your experience, and provides priority support via direct contact.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can small businesses benefit from this plan?</h4>
              <p className="text-sm text-muted-foreground">
                Absolutely! The business analytics, API access, and white-label options make this perfect for entrepreneurs and businesses wanting to leverage the WHOSENXT platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is the daily free delivery really unlimited?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You get free delivery every single day of the year on all qualifying orders. This alone can save you thousands annually.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutVeteran;