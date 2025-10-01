import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingBag, MapPin, Clock } from 'lucide-react';

interface StoreProductsProps {
  businessId: string;
  businessName: string;
  onBack: () => void;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_active: boolean;
  category: string;
}

const StoreProducts: React.FC<StoreProductsProps> = ({ businessId, businessName, onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [businessId]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyProduct = async (productId: string, productPrice: number) => {
    try {
      if (!user) {
        toast({
          title: 'Sign In Required',
          description: 'Please sign in to purchase products.',
          variant: 'destructive',
        });
        return;
      }

      // Create an order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          business_id: businessId,
          product_id: productId,
          quantity: 1,
          total_amount: productPrice,
          payment_status: 'pending',
          order_status: 'pending',
        })
        .select('id')
        .single();

      if (orderError || !order?.id) {
        throw new Error(orderError?.message || 'Failed to create order');
      }

      // Create the Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-marketplace-payment', {
        body: {
          orderType: 'product',
          orderId: order.id,
          totalAmount: Math.round(productPrice * 100),
          businessId,
        },
      });

      if (error) throw error;

      if (data?.error?.toString().includes('No Connect account')) {
        toast({
          title: 'Store not ready',
          description: 'This store hasn\'t set up payments yet. Please try again later.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Redirecting to checkout',
          description: 'Opening secure payment page...',
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to create checkout session.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stores
          </Button>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stores
          </Button>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                WHOSENXT_{businessName.toUpperCase().replace(/\s+/g, '_')}
              </h1>
              <p className="text-muted-foreground">Browse our products</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No products available</h3>
              <p className="text-muted-foreground">
                This store hasn't added any products yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-3">
                    <Badge variant="secondary" className="mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    {product.stock_quantity > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => handleBuyProduct(product.id, Number(product.price))}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Buy Now
                      </Button>
                    ) : (
                      <Badge variant="secondary">Out of Stock</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreProducts;
