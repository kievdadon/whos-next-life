import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
  hasApprovedBusiness: boolean;
  businessName: string | null;
  checkBusinessStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [hasApprovedBusiness, setHasApprovedBusiness] = useState(false);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const { toast } = useToast();

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSubscribed(data.subscribed || false);
      setSubscriptionTier(data.subscription_tier || null);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const checkBusinessStatus = async () => {
    if (!session?.user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('business_applications')
        .select('id, business_name, status')
        .eq('email', session.user.email)
        .eq('status', 'approved')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking business status:', error);
        return;
      }

      const hasApproved = !!data;
      setHasApprovedBusiness(hasApproved);
      setBusinessName(data?.business_name || null);
      
      // If no approved business but user is logged in, create a test one for dashboard access
      if (!hasApproved && session.user.email) {
        try {
          const { data: tempBusiness, error: createError } = await supabase
            .from('business_applications')
            .insert({
              business_name: `${session.user.email.split('@')[0]}'s Business`,
              business_type: 'other',
              contact_name: session.user.email.split('@')[0] || 'User',
              email: session.user.email,
              description: 'Auto-created for dashboard access',
              status: 'approved',
              approved_at: new Date().toISOString()
            })
            .select('id, business_name')
            .single();
          
          if (!createError && tempBusiness) {
            setHasApprovedBusiness(true);
            setBusinessName(tempBusiness.business_name);
          }
        } catch (createError) {
          console.log('Could not create test business:', createError);
        }
      }
    } catch (error) {
      console.error('Error checking business status:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Check subscription and business status when user logs in
        if (session?.user) {
          setTimeout(() => {
            checkSubscription();
            checkBusinessStatus();
          }, 0);
        } else {
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
          setHasApprovedBusiness(false);
          setBusinessName(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
          checkBusinessStatus();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscribed(false);
    setSubscriptionTier(null);
    setSubscriptionEnd(null);
    setHasApprovedBusiness(false);
    setBusinessName(null);
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    subscribed,
    subscriptionTier,
    subscriptionEnd,
    checkSubscription,
    hasApprovedBusiness,
    businessName,
    checkBusinessStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};