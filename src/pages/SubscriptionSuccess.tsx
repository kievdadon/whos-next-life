import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SubscriptionSuccess = () => {
  const { checkSubscription } = useAuth();

  useEffect(() => {
    // Check subscription status when the page loads
    const timer = setTimeout(() => {
      checkSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-wellness-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-wellness-primary">
            Subscription Successful!
          </CardTitle>
          <CardDescription>
            Thank you for subscribing to WHOSENXT. Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can now enjoy all the benefits of your chosen plan, including free delivery benefits!
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full bg-wellness-primary hover:bg-wellness-primary/90">
              <Link to="/">Go to Home</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-wellness-primary/20 hover:bg-wellness-primary/5">
              <Link to="/subscription-plans">Manage Subscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;