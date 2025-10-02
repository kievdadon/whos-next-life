import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import LocationPicker from "@/components/LocationPicker";
import StoreProducts from "@/components/StoreProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { 
  Search, 
  MapPin,
  Clock,
  Truck,
  Package,
  Star,
  Phone,
  ShoppingBag
} from "lucide-react";

const Delivery = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    address: string;
    coordinates: [number, number];
  } | null>(null);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<{
    businessId: string;
    businessName: string;
  } | null>(null);

  // Calculate distance between two coordinates in miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch businesses from Supabase
  const fetchNearbyBusinesses = async (userCoords: [number, number]) => {
    setLoading(true);
    try {
      const { data: businesses, error } = await supabase
        .from('business_applications')
        .select('id, business_name, business_type, address, store_primary_color, store_secondary_color, store_accent_color')
        .eq('status', 'approved');

      if (error) throw error;

      // Calculate distances and filter within 10 miles
      const businessesWithDistance = (businesses || [])
        .map(business => {
          // Parse coordinates from address or use default
          const lat = 41.5 + (Math.random() - 0.5) * 0.1; // Mock coordinates for demo
          const lon = -81.5 + (Math.random() - 0.5) * 0.1;
          const distance = calculateDistance(userCoords[1], userCoords[0], lat, lon);
          
          return {
            ...business,
            distance,
            coordinates: [lon, lat] as [number, number],
            deliveryTime: distance < 5 ? "20-35 min" : "45-60 min",
            deliveryFee: distance < 5 ? 2.99 : 4.99,
            rating: 4.0 + Math.random() * 1, // Mock rating
            primaryColor: business.store_primary_color || '#8B5CF6',
            secondaryColor: business.store_secondary_color || '#EC4899',
            accentColor: business.store_accent_color || '#10B981'
          };
        })
        .filter(business => business.distance <= 10)
        .sort((a, b) => a.distance - b.distance);

      setNearbyBusinesses(businessesWithDistance);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load nearby businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = () => {
    setShowLocationPicker(true);
  };

  const handleLocationSelect = (location: { address: string; coordinates: [number, number] }) => {
    setUserLocation(location);
    fetchNearbyBusinesses(location.coordinates);
    toast({
      title: "Location Updated",
      description: `Finding businesses near ${location.address}`,
    });
  };

  // Show location picker on first load
  useEffect(() => {
    if (!userLocation) {
      setShowLocationPicker(true);
    }
  }, [userLocation]);

  const handleTrackOrder = () => {
    toast({
      title: "Order Tracking",
      description: "Redirecting to order tracking page...",
    });
  };

  const handleCallDriver = (driverName: string) => {
    toast({
      title: "Calling Driver",
      description: `Connecting you to ${driverName}...`,
    });
  };

  const handleTrackLive = (orderId: string) => {
    toast({
      title: "Live Tracking",
      description: `Opening live map for order ${orderId}...`,
    });
  };

  const handleCategoryClick = (categoryName: string) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please set your location first to browse categories",
        variant: "destructive",
      });
      setShowLocationPicker(true);
      return;
    }
    navigate(`/category-stores?category=${encodeURIComponent(categoryName)}`);
  };

  const handleStoreClick = (businessId: string, businessName: string) => {
    if (!userLocation) {
      toast({
        title: "Location Required", 
        description: "Please set your location first",
        variant: "destructive",
      });
      setShowLocationPicker(true);
      return;
    }
    setSelectedStore({ businessId, businessName });
  };


  const handleViewAll = () => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please set your location first",
        variant: "destructive",
      });
      setShowLocationPicker(true);
      return;
    }
    navigate('/marketplace');
  };

  const categories = [
    { 
      name: "Food Delivery", 
      icon: "🍕", 
      count: "120+ restaurants",
      time: "15-45 min",
      color: "wellness-warm"
    },
    { 
      name: "Grocery", 
      icon: "🛒", 
      count: "50+ stores",
      time: "30-60 min",
      color: "wellness-primary"
    },
    { 
      name: "Clothing", 
      icon: "👕", 
      count: "80+ boutiques",
      time: "2-4 hours",
      color: "wellness-secondary"
    },
    { 
      name: "Electronics", 
      icon: "📱", 
      count: "25+ tech stores",
      time: "1-3 hours",
      color: "wellness-accent"
    },
    { 
      name: "Appliances", 
      icon: "🏠", 
      count: "15+ retailers",
      time: "Same day",
      color: "wellness-warm"
    },
    { 
      name: "Pharmacy", 
      icon: "💊", 
      count: "30+ pharmacies",
      time: "20-40 min",
      color: "wellness-primary"
    }
  ];

  const activeDeliveries = [
    {
      id: "DEL001",
      type: "Food",
      restaurant: "Mama's Pizza",
      items: "Large Pepperoni, Garlic Bread",
      status: "preparing",
      driver: "Alex Rodriguez",
      rating: 4.9,
      estimatedTime: "25 min",
      address: "123 Main St, Apt 4B"
    },
    {
      id: "DEL002", 
      type: "Grocery",
      store: "Fresh Market",
      items: "Milk, Bread, Eggs +5 more",
      status: "on_way",
      driver: "Sarah Johnson",
      rating: 4.8,
      estimatedTime: "12 min",
      address: "456 Oak Ave"
    }
  ];

  const nearbyStores = [
    {
      name: "Tony's Italian Kitchen",
      category: "Italian Food",
      rating: 4.7,
      deliveryTime: "20-35 min",
      deliveryFee: 2.99,
      image: "🍝",
      promo: "20% off $25+"
    },
    {
      name: "TechMart Express",
      category: "Electronics",
      rating: 4.5,
      deliveryTime: "1-2 hours",
      deliveryFee: 4.99,
      image: "📱",
      promo: "Free delivery"
    },
    {
      name: "Fashion Forward",
      category: "Clothing",
      rating: 4.6,
      deliveryTime: "2-4 hours", 
      deliveryFee: 3.99,
      image: "👗",
      promo: "New arrivals"
    },
    {
      name: "QuickMeds Pharmacy",
      category: "Healthcare",
      rating: 4.9,
      deliveryTime: "15-30 min",
      deliveryFee: 1.99,
      image: "💊",
      promo: "24/7 available"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing": return "wellness-accent";
      case "on_way": return "wellness-primary";
      case "delivered": return "wellness-secondary";
      default: return "wellness-warm";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing": return "Being Prepared";
      case "on_way": return "On The Way";
      case "delivered": return "Delivered";
      default: return "Processing";
    }
  };

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to WHOSENXT Delivery</CardTitle>
            <CardDescription>Set your location to start browsing nearby businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
              onClick={() => setShowLocationPicker(true)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Set My Location
            </Button>
          </CardContent>
        </Card>
        
        <LocationPicker
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={handleLocationSelect}
          currentLocation="Set Location"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
                📦 WHOSENXT DELIVERY
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleLocationChange}>
                <MapPin className="h-4 w-4 mr-2" />
                {userLocation.address.length > 20 ? userLocation.address.substring(0, 20) + '...' : userLocation.address}
              </Button>
              <Button size="sm" className="bg-wellness-primary hover:bg-wellness-primary/90" onClick={handleTrackOrder}>
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="py-6 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search restaurants, stores, or products..." 
              className="pl-12 h-14 text-lg bg-card/50 border-border/50"
            />
          </div>
        </div>
      </section>


      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Your Active Orders</h2>
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <Card key={delivery.id} className="bg-gradient-to-r from-card to-wellness-calm/20 border-wellness-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={`bg-${getStatusColor(delivery.status)}/10 text-${getStatusColor(delivery.status)} border-${getStatusColor(delivery.status)}/20`}>
                          {getStatusText(delivery.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Order #{delivery.id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-wellness-primary" />
                        <span className="text-sm font-medium">{delivery.estimatedTime}</span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{delivery.restaurant || delivery.store}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{delivery.items}</p>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{delivery.address}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-wellness-primary/10 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-wellness-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{delivery.driver}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">{delivery.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCallDriver(delivery.driver)}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button size="sm" className="flex-1 bg-wellness-primary hover:bg-wellness-primary/90" onClick={() => handleTrackLive(delivery.id)}>
                          Track Live
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">What do you need?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-card to-wellness-calm/20" onClick={() => handleCategoryClick(category.name)}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{category.count}</p>
                  <div className="flex items-center justify-center space-x-1 text-xs text-wellness-primary">
                    <Clock className="h-3 w-3" />
                    <span>{category.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Stores */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Popular Near You</h2>
            <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5" onClick={handleViewAll}>
              View All
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Loading businesses near you...</p>
              </div>
            ) : nearbyBusinesses.length > 0 ? (
              nearbyBusinesses.map((business, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer" 
                  onClick={() => handleStoreClick(business.id, business.business_name)}
                  style={{
                    background: `linear-gradient(135deg, ${business.primaryColor}10, ${business.secondaryColor}10)`,
                    borderColor: `${business.primaryColor}30`
                  }}
                >
                  <div className="relative">
                    <div 
                      className="aspect-video flex items-center justify-center text-6xl"
                      style={{
                        background: `linear-gradient(135deg, ${business.primaryColor}15, ${business.secondaryColor}15)`
                      }}
                    >
                      {business.business_type === 'restaurant' ? '🍽️' : 
                       business.business_type === 'grocery' ? '🛒' : 
                       business.business_type === 'electronics' ? '📱' : 
                       business.business_type === 'pharmacy' ? '💊' : '🏪'}
                    </div>
                    <Badge 
                      className="absolute top-3 left-3 text-primary-foreground"
                      style={{ backgroundColor: `${business.accentColor}90` }}
                    >
                      {business.distance?.toFixed(1)} mi
                    </Badge>
                    <Badge 
                      className="absolute top-3 right-3 text-primary-foreground"
                      style={{ backgroundColor: `${business.secondaryColor}90` }}
                    >
                      ${business.deliveryFee}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg group-hover:text-wellness-primary transition-colors">
                        {business.business_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{business.business_type}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{business.rating?.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{business.deliveryTime}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No businesses found near your location.</p>
                <p className="text-sm text-muted-foreground mt-2">Try setting a different location.</p>
              </div>
            )}
          </div>
        </div>
      </section>


      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={userLocation?.address || ""}
      />
    </div>
  );
};

export default Delivery;