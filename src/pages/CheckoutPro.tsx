import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, ArrowLeft, CreditCard, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';

const CheckoutPro = () => {
  const { user, session, subscribed, subscriptionTier } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user already has Pro or higher plan
  if (subscribed && (subscriptionTier === 'pro' || subscriptionTier === 'elite' || subscriptionTier === 'veteran')) {
    return <Navigate to="/subscription-plans" replace />;
  }

  const features = [
    'Free delivery 2 days per week',
    'Access to all WHOSENXT features',
    '10% off clothing & accessories',
    'Basic gig notifications',
    'Mobile app access',
    'Email customer support',
    'Monthly wellness tips'
  ];

  const handleCheckout = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: 'pro' },
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
            <div className="p-4 rounded-full bg-wellness-primary/10">
              <Star className="h-12 w-12 text-wellness-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
            Pro Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Perfect for casual users who want the essential WHOSENXT benefits
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Star className="h-6 w-6 text-wellness-primary" />
                Pro Plan Features
              </CardTitle>
              <CardDescription>
                Everything you need to get started with WHOSENXT
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
            </CardContent>
          </Card>

          {/* Checkout Card */}
          <Card className="h-fit">
            <CardHeader className="text-center">
              <div className="text-4xl font-bold text-wellness-primary mb-2">
                $10<span className="text-lg text-muted-foreground">/month</span>
              </div>
              <CardTitle>Start Your Pro Subscription</CardTitle>
              <CardDescription>
                Cancel anytime. First month starts immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Features */}
              <div className="space-y-3">
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
                  <span>Instant activation after payment</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-wellness-primary hover:bg-wellness-primary/90 text-white py-3 text-lg"
                size="lg"
              >
                {loading ? 'Processing...' : 'Subscribe to Pro Plan'}
              </Button>

              {/* Terms */}
              <p className="text-xs text-muted-foreground text-center">
                By subscribing, you agree to our Terms of Service and Privacy Policy. 
                Your subscription will auto-renew monthly until cancelled.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">When does my subscription start?</h4>
              <p className="text-sm text-muted-foreground">
                Your Pro subscription starts immediately after payment confirmation. You'll get instant access to all Pro features.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How does the free delivery work?</h4>
              <p className="text-sm text-muted-foreground">
                With Pro plan, you get free delivery on any orders placed on 2 days per week. You can choose which days work best for you.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I upgrade later?</h4>
              <p className="text-sm text-muted-foreground">
                Absolutely! You can upgrade to Elite or Veteran plans at any time. The price difference will be prorated.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPro;