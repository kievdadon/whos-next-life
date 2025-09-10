import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  ShoppingBag,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

const CategoryStores = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'All Stores';
  const [searchTerm, setSearchTerm] = useState("");

  const handleStoreClick = (storeName: string) => {
    navigate(`/store/${encodeURIComponent(storeName)}`);
  };

  const allStores = [
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
    },
    {
      name: "Fresh Bites Cafe",
      category: "Cafe",
      rating: 4.4,
      deliveryTime: "15-25 min",
      deliveryFee: 2.49,
      image: "☕",
      promo: "Morning special"
    },
    {
      name: "Green Garden Grocery",
      category: "Grocery",
      rating: 4.3,
      deliveryTime: "45-60 min",
      deliveryFee: 3.99,
      image: "🥬",
      promo: "Fresh produce"
    },
    {
      name: "Home Essentials",
      category: "Appliances",
      rating: 4.2,
      deliveryTime: "Same day",
      deliveryFee: 9.99,
      image: "🏠",
      promo: "Installation available"
    },
    {
      name: "Pizza Palace",
      category: "Pizza",
      rating: 4.6,
      deliveryTime: "25-40 min",
      deliveryFee: 2.99,
      image: "🍕",
      promo: "Buy 1 Get 1"
    }
  ];

  const filteredStores = useMemo(() => {
    let stores = allStores;
    
    // Filter by category
    if (category !== 'All Stores') {
      const categoryMapping: {[key: string]: string[]} = {
        "Food Delivery": ["Italian Food", "Cafe", "Pizza"],
        "Grocery": ["Grocery"],
        "Clothing": ["Clothing"],
        "Electronics": ["Electronics"],
        "Appliances": ["Appliances"],
        "Pharmacy": ["Healthcare"]
      };
      
      const relevantCategories = categoryMapping[category] || [category];
      stores = stores.filter(store => 
        relevantCategories.some(cat => 
          store.category.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      stores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return stores;
  }, [category, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/delivery')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">{category}</h1>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="py-6 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search stores..." 
              className="pl-12 h-12 bg-card/50 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Stores Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {filteredStores.length} stores found
            </h2>
          </div>
          
          {filteredStores.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No stores found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or browse all categories
              </p>
              <Button onClick={() => navigate('/delivery')}>
                Browse All Categories
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-card to-wellness-calm/30 overflow-hidden cursor-pointer" 
                  onClick={() => handleStoreClick(store.name)}
                >
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-wellness-primary/10 to-wellness-secondary/10 flex items-center justify-center text-6xl">
                      {store.image}
                    </div>
                    {store.promo && (
                      <Badge className="absolute top-3 left-3 bg-wellness-accent/90 text-primary-foreground">
                        {store.promo}
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{store.name}</CardTitle>
                    <CardDescription className="text-sm">{store.category}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{store.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{store.deliveryTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Delivery fee: ${store.deliveryFee}</span>
                      </div>
                      
                      <Button 
                        className="w-full bg-wellness-primary hover:bg-wellness-primary/90" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStoreClick(store.name);
                        }}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Menu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryStores;