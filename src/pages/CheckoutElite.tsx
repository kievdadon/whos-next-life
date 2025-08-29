import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, ArrowLeft, CreditCard, Shield, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';

const CheckoutElite = () => {
  const { user, session, subscribed, subscriptionTier } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user already has Elite or higher plan
  if (subscribed && (subscriptionTier === 'elite' || subscriptionTier === 'veteran')) {
    return <Navigate to="/subscription-plans" replace />;
  }

  const features = [
    'Free delivery 4 days per week',
    'Priority customer support',
    '20% off clothing & accessories',
    'Priority gig notifications',
    'Early access to new gigs',
    'Online store creation tools',
    'Advanced wellness features',
    'Monthly video consultations',
    'Exclusive member events'
  ];

  const handleCheckout = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: 'elite' },
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
            <div className="p-4 rounded-full bg-wellness-primary/10 relative">
              <Crown className="h-12 w-12 text-wellness-primary" />
              <Badge className="absolute -top-2 -right-2 bg-wellness-primary text-white">Most Popular</Badge>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
            Elite Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Great for regular users who want enhanced benefits and priority access
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card className="border-wellness-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Crown className="h-6 w-6 text-wellness-primary" />
                Elite Plan Features
              </CardTitle>
              <CardDescription>
                Enhanced benefits for the regular WHOSENXT user
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
              
              {/* Value Proposition */}
              <div className="mt-6 p-4 bg-wellness-primary/5 rounded-lg border border-wellness-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-wellness-primary" />
                  <span className="font-semibold text-sm">Elite Value</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Save over $200/year with 20% off all purchases plus priority access to exclusive deals and events.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Card */}
          <Card className="h-fit border-wellness-primary/30 shadow-lg">
            <CardHeader className="text-center">
              <div className="text-4xl font-bold text-wellness-primary mb-2">
                $25<span className="text-lg text-muted-foreground">/month</span>
              </div>
              <CardTitle>Start Your Elite Subscription</CardTitle>
              <CardDescription>
                Most popular plan - Cancel anytime. Instant access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comparison */}
              <div className="bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5 p-4 rounded-lg">
                <p className="text-sm font-medium text-center mb-2">Upgrade from Pro and get:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>• 2x more free delivery days (4 vs 2)</div>
                  <div>• 2x better discount (20% vs 10%)</div>
                  <div>• Priority support & gig access</div>
                  <div>• Exclusive store creation tools</div>
                </div>
              </div>

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
                {loading ? 'Processing...' : 'Subscribe to Elite Plan'}
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
            <CardTitle>Elite Plan FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">What makes Elite different from Pro?</h4>
              <p className="text-sm text-muted-foreground">
                Elite offers double the delivery days (4 vs 2), higher discounts (20% vs 10%), priority support, and exclusive access to advanced features like store creation tools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How much can I save with the 20% discount?</h4>
              <p className="text-sm text-muted-foreground">
                If you spend $100/month on clothing and accessories, you'll save $240/year - already covering most of your subscription cost!
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What are the online store creation tools?</h4>
              <p className="text-sm text-muted-foreground">
                Elite members get access to our drag-and-drop store builder, inventory management, and basic analytics to start selling on the WHOSENXT marketplace.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I downgrade to Pro later?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can change your plan at any time. Downgrades take effect at the start of your next billing cycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutElite;