import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Store, Shirt, Scissors, UtensilsCrossed, Star, MapPin, Clock } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DeliveryBusinessCard from '@/components/DeliveryBusinessCard';
import WebsiteBusinessCard from '@/components/WebsiteBusinessCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
  is_active: boolean;
  delivery_available: boolean;
  delivery_radius: number;
  business_id: string;
}

interface Business {
  id: string;
  business_name: string;
  business_type: string;
  description: string;
  address: string;
  products?: Product[];
}

const BusinessMarketplace = () => {
  const { user, subscribed, subscriptionTier } = useAuth();
  const { benefits } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const categories = [
    { id: 'all', name: 'All Businesses', icon: Store },
    { id: 'clothing', name: 'Clothing', icon: Shirt },
    { id: 'beauty', name: 'Beauty & Hair', icon: Scissors },
    { id: 'food', name: 'Food & Dining', icon: UtensilsCrossed }
  ];

  // Fetch real businesses from Supabase that meet delivery criteria
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchApprovedBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('business_applications')
          .select('*')
          .eq('status', 'approved');

        if (error) throw error;

        const businessesWithMockData = (data || []).map(business => ({
          id: business.id,
          name: business.business_name,
          category: business.business_type,
          description: business.description || 'Local business',
          rating: 4.0 + Math.random() * 1, // Mock rating
          location: business.address || 'Local area',
          discount: benefits.discountPercentage,
          image: '/placeholder.svg',
          hours: business.is_24_7 ? '24/7' : 'Mon-Sun 8AM-8PM', // Simplified for demo
          isBrandPartner: business.is_brand_partner,
          hasPhysicalLocation: business.has_physical_location
        }));

        setBusinesses(businessesWithMockData);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        // Fallback to empty array if error
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedBusinesses();
  }, [subscribed, subscriptionTier]);

  // Separate businesses into delivery-eligible and website-only
  const deliveryEligibleBusinesses = businesses.filter(business => 
    business.isBrandPartner || (business.hasPhysicalLocation)
  );
  
  const websiteOnlyBusinesses = businesses.filter(business => 
    !business.isBrandPartner && !business.hasPhysicalLocation
  );

  // Filter function that works on both arrays
  const filterBusinesses = (businessList: any[]) => {
    return businessList.filter(business => {
      const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           business.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredDeliveryBusinesses = filterBusinesses(deliveryEligibleBusinesses);
  const filteredWebsiteBusinesses = filterBusinesses(websiteOnlyBusinesses);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
            Business Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Support local businesses in your community. Create your own store or discover amazing products and services.
          </p>
          {subscribed && benefits.discountPercentage > 0 && (
            <Badge className="mt-4 bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20">
              Your {subscriptionTier} discount: {benefits.discountPercentage}% off clothing & accessories
            </Badge>
          )}
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id 
                    ? "bg-wellness-primary hover:bg-wellness-primary/90" 
                    : "border-wellness-primary/20 hover:bg-wellness-primary/5"
                  }
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Create Store CTA */}
        <Card className="mb-8 border-wellness-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Store className="h-6 w-6 text-wellness-primary" />
              Start Your Business
            </CardTitle>
            <CardDescription>
              Ready to showcase your products or services? Create your own online store and reach more customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              className="bg-wellness-secondary hover:bg-wellness-secondary/90"
              onClick={() => window.location.href = '/business-registration'}
            >
              Apply to Join Marketplace
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Simple application process for business partnerships
            </p>
            {!subscribed && (
              <p className="text-sm text-muted-foreground mt-2">
                Subscribe to access store creation tools
              </p>
            )}
          </CardContent>
        </Card>

        {/* Business Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-wellness-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading verified businesses...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Delivery-Eligible Businesses */}
            {filteredDeliveryBusinesses.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold">🚚 Delivery Available</h2>
                  <Badge className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20">
                    {filteredDeliveryBusinesses.length} stores
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDeliveryBusinesses.map((business) => (
                    <DeliveryBusinessCard key={business.id} business={business} />
                  ))}
                </div>
              </section>
            )}

            {/* Website-Only Businesses */}
            {filteredWebsiteBusinesses.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold">🌐 Online Marketplaces</h2>
                  <Badge className="bg-wellness-secondary/10 text-wellness-secondary border-wellness-secondary/20">
                    {filteredWebsiteBusinesses.length} stores
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWebsiteBusinesses.map((business) => (
                    <WebsiteBusinessCard key={business.id} business={business} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!loading && filteredDeliveryBusinesses.length === 0 && filteredWebsiteBusinesses.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or browse different categories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessMarketplace;