import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

const SubscriptionPlans = () => {
  const { user, session, subscribed, subscriptionTier, checkSubscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const plans = [
    {
      id: 'pro',
      name: 'Pro',
      price: '$10',
      icon: Star,
      description: 'Perfect for casual users',
      features: [
        'Free delivery 2 days per week',
        'Access to all WHOSENXT features',
        'Basic customer support',
        'Mobile app access'
      ],
      popular: false
    },
    {
      id: 'elite',
      name: 'Elite',
      price: '$25',
      icon: Crown,
      description: 'Great for regular users',
      features: [
        'Free delivery 4 days per week',
        'Priority customer support',
        'Advanced wellness features',
        'Family group management',
        'Premium marketplace access'
      ],
      popular: true
    },
    {
      id: 'veteran',
      name: 'Veteran',
      price: '$40',
      icon: Shield,
      description: 'Ultimate experience',
      features: [
        'Free delivery every day',
        'VIP customer support',
        'Exclusive features access',
        'Priority order processing',
        'Advanced analytics',
        'Personal account manager'
      ],
      popular: false
    }
  ];

  const handleSubscribe = async (tier: string) => {
    if (!session) return;
    
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      // Check subscription status after a delay
      setTimeout(() => {
        checkSubscription();
      }, 3000);
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of WHOSENXT with our subscription plans featuring free delivery benefits
          </p>
          {subscribed && (
            <div className="mt-6 space-y-2">
              <Badge className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20">
                Current Plan: {subscriptionTier?.charAt(0).toUpperCase() + subscriptionTier?.slice(1)}
              </Badge>
              <div>
                <Button
                  onClick={handleManageSubscription}
                  variant="outline"
                  className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                >
                  Manage Subscription
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscribed && subscriptionTier === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'border-wellness-primary shadow-lg scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-wellness-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-wellness-primary text-white">Most Popular</Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-wellness-secondary text-white">Current Plan</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-wellness-primary/10">
                      <Icon className="h-8 w-8 text-wellness-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-wellness-primary">
                    {plan.price}<span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-wellness-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id || isCurrentPlan}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-wellness-primary hover:bg-wellness-primary/90' 
                        : 'bg-wellness-secondary hover:bg-wellness-secondary/90'
                    }`}
                  >
                    {loading === plan.id ? 'Loading...' : 
                     isCurrentPlan ? 'Current Plan' : 
                     `Subscribe to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button 
            onClick={checkSubscription}
            variant="outline"
            className="border-wellness-primary/20 hover:bg-wellness-primary/5"
          >
            Refresh Subscription Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;