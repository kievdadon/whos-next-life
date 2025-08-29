import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft,
  MessageSquare,
  Heart,
  Share2,
  MapPin,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  X,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Fetch additional product images
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('image_order', { ascending: true });

      if (imagesError) throw imagesError;
      setProductImages(imagesData || []);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to message sellers",
        variant: "destructive"
      });
      return;
    }

    try {
      let sellerId = null;
      
      if (product.user_id) {
        sellerId = product.user_id;
      } else if (product.business_id) {
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
        .maybeSingle();

      if (checkError) throw checkError;

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

  const handleMarkAsSold = async () => {
    if (!user || !product) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ product_status: 'sold', updated_at: new Date().toISOString() })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setProduct({ ...product, product_status: 'sold' });

      toast({
        title: "✅ Item Marked as Sold",
        description: "Your item has been marked as sold. Interested buyers will be notified.",
      });
    } catch (error) {
      console.error('Error marking as sold:', error);
      toast({
        title: "Error",
        description: "Failed to mark item as sold. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveListing = async () => {
    if (!user || !product) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false, product_status: 'removed', updated_at: new Date().toISOString() })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "🗑️ Listing Removed",
        description: "Your item has been removed from the marketplace.",
      });

      // Navigate back to marketplace
      navigate('/marketplace');
    } catch (error) {
      console.error('Error removing listing:', error);
      toast({
        title: "Error",
        description: "Failed to remove listing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isUserSeller = () => {
    return user && product && (
      (product.user_id && product.user_id === user.id) ||
      (product.business_id && user.email)
    );
  };

  const getAllImages = () => {
    const images = [];
    if (product?.image_url) {
      images.push({ url: product.image_url, order: 0 });
    }
    productImages.forEach(img => {
      images.push({ url: img.image_url, order: img.image_order });
    });
    return images.sort((a, b) => a.order - b.order);
  };

  const allImages = getAllImages();

  const nextImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wellness-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/marketplace')} className="bg-wellness-primary hover:bg-wellness-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gradient-to-br from-wellness-primary/10 to-wellness-secondary/10 rounded-lg overflow-hidden">
              {allImages.length > 0 ? (
                <>
                  <img 
                    src={allImages[currentImageIndex]?.url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-6xl">
                  📦
                </div>
              )}
              
              {/* Status Overlay */}
              {product.product_status === 'sold' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Badge className="bg-green-600 text-white text-xl py-3 px-6">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    SOLD
                  </Badge>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-wellness-primary' 
                        : 'border-transparent hover:border-wellness-primary/50'
                    }`}
                  >
                    <img 
                      src={image.url} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-wellness-primary/90 text-primary-foreground">
                  {product.category}
                </Badge>
                
                {isUserSeller() && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleMarkAsSold}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Sold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRemoveListing} className="text-destructive">
                        <X className="h-4 w-4 mr-2" />
                        Remove Listing
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              
              <div className="text-4xl font-bold text-wellness-primary mb-6">
                ${product.price}
              </div>
            </div>

            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {product.description || 'No description provided.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Local Area</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Listed recently</span>
                  </div>
                  {product.stock_quantity && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{product.stock_quantity} available</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Seller</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Seller */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Interested in this item?</h3>
                      <p className="text-sm text-muted-foreground">
                        Contact the seller to ask questions or make an offer
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg"
                    className={`w-full ${
                      product.product_status === 'sold' 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'bg-wellness-primary hover:bg-wellness-primary/90'
                    }`}
                    onClick={handleMessageSeller}
                    disabled={product.product_status === 'sold'}
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    {product.product_status === 'sold' 
                      ? 'Item Sold' 
                      : user 
                        ? "Message Seller" 
                        : "Sign In to Message"
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;