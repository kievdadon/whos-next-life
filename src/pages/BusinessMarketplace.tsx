import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Store, Shirt, Scissors, UtensilsCrossed, Star, MapPin, Clock } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const BusinessMarketplace = () => {
  const { user, subscribed, subscriptionTier } = useAuth();
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

  const businesses = [
    {
      id: 1,
      name: 'Urban Threads',
      category: 'clothing',
      description: 'Trendy streetwear and casual fashion',
      rating: 4.8,
      location: 'Downtown District',
      discount: subscribed ? (subscriptionTier === 'pro' ? 10 : subscriptionTier === 'elite' ? 20 : 30) : 0,
      image: '/placeholder.svg',
      hours: 'Mon-Sat 9AM-8PM'
    },
    {
      id: 2,
      name: 'Glow Beauty Studio',
      category: 'beauty',
      description: 'Professional hair styling and beauty services',
      rating: 4.9,
      location: 'Midtown Plaza',
      discount: subscribed ? (subscriptionTier === 'pro' ? 10 : subscriptionTier === 'elite' ? 20 : 30) : 0,
      image: '/placeholder.svg',
      hours: 'Tue-Sun 10AM-7PM'
    },
    {
      id: 3,
      name: 'Soul Kitchen',
      category: 'food',
      description: 'Farm-to-table dining with local ingredients',
      rating: 4.7,
      location: 'Arts Quarter',
      discount: subscribed ? (subscriptionTier === 'pro' ? 10 : subscriptionTier === 'elite' ? 20 : 30) : 0,
      image: '/placeholder.svg',
      hours: 'Daily 11AM-10PM'
    },
    {
      id: 4,
      name: 'Elite Boutique',
      category: 'clothing',
      description: 'Designer clothing and luxury accessories',
      rating: 4.6,
      location: 'Fashion District',
      discount: subscribed ? (subscriptionTier === 'pro' ? 10 : subscriptionTier === 'elite' ? 20 : 30) : 0,
      image: '/placeholder.svg',
      hours: 'Mon-Sat 10AM-9PM'
    }
  ];

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          {subscribed && (
            <Badge className="mt-4 bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20">
              Your {subscriptionTier} discount: {subscriptionTier === 'pro' ? '10%' : subscriptionTier === 'elite' ? '20%' : '30%'} off
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    <CardDescription>{business.description}</CardDescription>
                  </div>
                  {business.discount > 0 && (
                    <Badge className="bg-wellness-secondary text-white">
                      {business.discount}% off
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{business.rating}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{business.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{business.hours}</span>
                </div>
                
                <Button 
                  className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                >
                  Visit Store
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBusinesses.length === 0 && (
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