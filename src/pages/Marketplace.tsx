import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Heart,
  MessageSquare,
  MapPin,
  Star,
  DollarSign,
  Clock,
  User,
  CheckCircle,
  X,
  Edit3,
  MoreVertical
} from "lucide-react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";

const Marketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect non-authenticated users only if they try to message sellers
  // Allow browsing marketplace without authentication

  useEffect(() => {
    fetchProducts();
    
    // Show success message if user just listed an item
    if (location.state?.showSuccess) {
      toast({
        title: "🎉 Item Listed Successfully!",
        description: "Your item is now visible to buyers in the community marketplace!",
      });
      // Clear the state to prevent showing the message again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchProducts = async () => {
    console.log('🔄 Fetching products from marketplace...');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      console.log('✅ Successfully fetched products:', data);
      console.log(`📦 Found ${data?.length || 0} products in marketplace`);
      setProducts(data || []);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again later.",
        variant: "destructive"
      });
      // Set empty array so the UI can still render
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageSeller = async (product: any) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to message sellers",
        variant: "destructive"
      });
      return;
    }

    try {
      // Determine seller ID based on whether it's a business or individual user
      let sellerId = null;
      
      if (product.user_id) {
        // Individual user product
        sellerId = product.user_id;
      } else if (product.business_id) {
        // Business product - we'll use business_id as seller_id for now
        // This assumes conversations table can handle business IDs as seller_id
        sellerId = product.business_id;
      } else {
        throw new Error("No seller information found for this product");
      }

      // Check for existing conversation
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        // Create a new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
            product_id: product.id,
            subject: `Interest in: ${product.name}`
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }

      // Navigate to the conversation
      navigate(`/marketplace/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation with seller",
        variant: "destructive"
      });
    }
  };
  const categories = [
    { name: "Furniture", count: 245, icon: "🪑" },
    { name: "Clothing", count: 189, icon: "👕" },
    { name: "Electronics", count: 156, icon: "📱" },
    { name: "Home & Garden", count: 98, icon: "🏡" },
    { name: "Sports", count: 76, icon: "⚽" },
    { name: "Books", count: 54, icon: "📚" }
  ];

  const featuredItems = [
    {
      id: 1,
      title: "Vintage Oak Dining Table",
      price: 450,
      location: "Downtown",
      seller: "Sarah M.",
      rating: 4.8,
      image: "🪑",
      condition: "Excellent",
      timePosted: "2h ago"
    },
    {
      id: 2,
      title: "Designer Winter Coat",
      price: 89,
      location: "Uptown",
      seller: "Mike R.",
      rating: 4.9,
      image: "🧥",
      condition: "Like New",
      timePosted: "5h ago"
    },
    {
      id: 3,
      title: "MacBook Pro 2022",
      price: 1200,
      location: "Tech District",
      seller: "Emily K.",
      rating: 5.0,
      image: "💻",
      condition: "Good",
      timePosted: "1d ago"
    },
    {
      id: 4,
      title: "Yoga Mat & Blocks Set",
      price: 35,
      location: "Wellness Zone",
      seller: "Jordan T.",
      rating: 4.7,
      image: "🧘‍♀️",
      condition: "New",
      timePosted: "3h ago"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
                🛍️ MARKETPLACE
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Saved
              </Button>
              <Button size="sm" onClick={() => navigate('/marketplace/chat')} className="bg-wellness-primary hover:bg-wellness-primary/90">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="py-6 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search furniture, clothes, electronics..." 
                className="pl-10 h-12 bg-card/50 border-border/50"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <MapPin className="h-4 w-4 mr-2" />
                Near Me
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-card to-wellness-calm/20">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.count} items</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Marketplace Items</h2>
            <Button variant="outline" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
              View All
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wellness-primary"></div>
              </div>
              <p className="text-muted-foreground">Loading marketplace...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products available yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to list an item!</p>
              <Button onClick={() => navigate('/sell-item')} className="bg-wellness-primary hover:bg-wellness-primary/90">
                <DollarSign className="mr-2 h-4 w-4" />
                List Your First Item
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-card to-wellness-calm/30 overflow-hidden">
                  <div className="relative">
                    <div className="aspect-square bg-gradient-to-br from-wellness-primary/10 to-wellness-secondary/10 flex items-center justify-center text-6xl">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        "📦"
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm border-0"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Badge className="absolute top-3 left-3 bg-wellness-primary/90 text-primary-foreground">
                      {product.category}
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-wellness-primary">
                        ${product.price}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {/* Extract location from description if available */}
                          {product.description?.includes('Location:') 
                            ? product.description.split('Location:')[1]?.split('\n')[0]?.trim() || 'Local Area'
                            : 'Local Area'
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          New
                        </div>
                      </div>
                      
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span className="text-sm">
                             Seller
                           </span>
                         </div>
                       </div>
                      
                      <Button 
                        className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
                        onClick={() => handleMessageSeller(product)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {user ? "Message Seller" : "Sign In to Message"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Selling CTA */}
      <section className="py-12 bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Start Selling Today</h2>
            <p className="text-lg text-muted-foreground">
              Turn your unused items into cash. List for free and reach thousands of local buyers.
            </p>
            <Button size="lg" onClick={() => navigate('/sell-item')} className="bg-wellness-secondary hover:bg-wellness-secondary/90">
              <DollarSign className="mr-2 h-5 w-5" />
              Sell Your Items
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Marketplace;