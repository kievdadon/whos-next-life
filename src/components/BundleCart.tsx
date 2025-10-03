import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Sparkles, X } from "lucide-react";

interface BundleItem {
  id: string;
  service_type: 'delivery' | 'gig' | 'marketplace' | 'wellness';
  service_id?: string;
  price: number;
}

interface BundleCartProps {
  onBundleChange?: () => void;
}

export default function BundleCart({ onBundleChange }: BundleCartProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<BundleItem[]>([]);
  const [bundleId, setBundleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBundle();
  }, []);

  const loadBundle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: bundle } = await supabase
        .from('service_bundles')
        .select('*, bundle_items(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (bundle) {
        setBundleId(bundle.id);
        setItems((bundle.bundle_items || []) as BundleItem[]);
      }
    } catch (error) {
      console.error('Error loading bundle:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToBundle = async (serviceType: BundleItem['service_type'], price: number, serviceId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use bundles",
          variant: "destructive"
        });
        return;
      }

      let currentBundleId = bundleId;

      // Create bundle if doesn't exist
      if (!currentBundleId) {
        const { data: newBundle, error: bundleError } = await supabase
          .from('service_bundles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (bundleError) throw bundleError;
        currentBundleId = newBundle.id;
        setBundleId(currentBundleId);
      }

      // Add item to bundle
      const { error: itemError } = await supabase
        .from('bundle_items')
        .insert({
          bundle_id: currentBundleId,
          service_type: serviceType,
          service_id: serviceId,
          price
        });

      if (itemError) throw itemError;

      await loadBundle();
      onBundleChange?.();

      toast({
        title: "Added to bundle!",
        description: `Save ${calculateDiscount()}% when you bundle services`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const removeFromBundle = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('bundle_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await loadBundle();
      onBundleChange?.();

      toast({
        title: "Removed from bundle",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateDiscount = () => {
    if (items.length >= 3) return 15;
    if (items.length >= 2) return 10;
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
    const discount = calculateDiscount();
    return {
      subtotal,
      discount,
      total: subtotal * (1 - discount / 100)
    };
  };

  if (loading || items.length === 0) return null;

  const totals = calculateTotal();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Bundle Cart</CardTitle>
          </div>
          <Badge variant="secondary">
            {items.length} {items.length === 1 ? 'service' : 'services'}
          </Badge>
        </div>
        <CardDescription>
          {calculateDiscount() > 0 
            ? `You're saving ${calculateDiscount()}%!` 
            : 'Add 2+ services to save 10%'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div>
                <p className="font-medium capitalize">{item.service_type}</p>
                <p className="text-sm text-muted-foreground">${item.price}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromBundle(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Bundle Discount ({totals.discount}%)</span>
              <span>-${(totals.subtotal * totals.discount / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>

        <Button className="w-full mt-4">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Checkout Bundle
        </Button>
      </CardContent>
    </Card>
  );
}