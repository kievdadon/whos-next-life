import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CameraCapture } from '@/components/CameraCapture';
import { Camera, Upload, DollarSign, Package, ArrowLeft, Check } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const SellItem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect non-authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    deliveryAvailable: true,
    stockQuantity: 1
  });

  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const categories = [
    { value: 'furniture', label: 'Furniture', icon: '🪑' },
    { value: 'clothing', label: 'Clothing', icon: '👕' },
    { value: 'electronics', label: 'Electronics', icon: '📱' },
    { value: 'toys', label: 'Toys & Games', icon: '🧸' },
    { value: 'phones', label: 'Phones & Tablets', icon: '📱' },
    { value: 'automotive', label: 'Cars & Automotive', icon: '🚗' },
    { value: 'books', label: 'Books & Media', icon: '📚' },
    { value: 'sports', label: 'Sports & Outdoors', icon: '⚽' },
    { value: 'home', label: 'Home & Garden', icon: '🏡' },
    { value: 'beauty', label: 'Beauty & Health', icon: '💄' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const conditions = [
    { value: 'new', label: 'New', description: 'Brand new, never used' },
    { value: 'like-new', label: 'Like New', description: 'Used once or twice, excellent condition' },
    { value: 'excellent', label: 'Excellent', description: 'Very well maintained, minor wear' },
    { value: 'good', label: 'Good', description: 'Normal wear, fully functional' },
    { value: 'fair', label: 'Fair', description: 'Noticeable wear, works well' },
    { value: 'poor', label: 'Poor', description: 'Heavy wear, may need repairs' }
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file: File) => {
    setProductImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (file: File) => {
    handleFileUpload(file);
    setCameraOpen(false);
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `product-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validation
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!productImage) {
      toast({
        title: "Image Required",
        description: "Please add a photo of your item",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image
      const imageUrl = await uploadImageToStorage(productImage);

      // Create product listing directly for the user
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: `${formData.description}\n\nCondition: ${conditions.find(c => c.value === formData.condition)?.label}${formData.location ? `\nLocation: ${formData.location}` : ''}`,
          price: parseFloat(formData.price),
          category: formData.category,
          image_url: imageUrl,
          user_id: user.id, // Use user_id instead of business_id
          stock_quantity: formData.stockQuantity,
          delivery_available: formData.deliveryAvailable,
          is_active: true
        })
        .select()
        .single();

      if (productError) throw productError;

      console.log('New product created:', newProduct);

      toast({
        title: "Item Listed Successfully!",
        description: "Your item is now live on the marketplace and visible to buyers in your area!",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        condition: '',
        location: '',
        deliveryAvailable: true,
        stockQuantity: 1
      });
      setProductImage(null);
      setImagePreview(null);

      // Navigate to marketplace immediately to show the new listing
      setTimeout(() => {
        navigate('/marketplace', { 
          state: { newProductId: newProduct?.id, showSuccess: true }
        });
      }, 1500);

    } catch (error) {
      console.error('Error listing item:', error);
      toast({
        title: "Listing Failed",
        description: error instanceof Error ? error.message : "Failed to list your item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-wellness-accent/10 to-wellness-secondary/10 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-wellness-primary/20">
              <Package className="h-8 w-8 text-wellness-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sell Your Item</h1>
          <p className="text-muted-foreground">List your item on the marketplace and connect with buyers</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/marketplace')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-wellness-primary" />
                Product Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      className="w-full h-64 object-cover rounded-lg border-2 border-border"
                    />
                    <Badge className="absolute top-3 right-3 bg-wellness-primary">
                      <Check className="h-3 w-3 mr-1" />
                      Photo Added
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute bottom-3 right-3"
                      onClick={() => {
                        setProductImage(null);
                        setImagePreview(null);
                      }}
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Add photos of your item</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          className="hidden"
                          id="product-upload"
                        />
                        <Label htmlFor="product-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload from Files
                          </Button>
                        </Label>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => setCameraOpen(true)}
                      >
                        <Camera className="h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., iPhone 13 Pro, Vintage Armchair, Kids Bicycle"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your item in detail - size, color, features, any defects..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            {category.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{condition.label}</span>
                            <span className="text-xs text-muted-foreground">{condition.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
               </div>

               <div>
                 <Label htmlFor="location">Your Location (City, State)</Label>
                 <Input
                   id="location"
                   value={formData.location}
                   onChange={(e) => handleInputChange('location', e.target.value)}
                   placeholder="e.g., Cleveland, OH or Local Pickup"
                 />
                 <p className="text-xs text-muted-foreground mt-1">
                   Help buyers know where the item is located for pickup/delivery.
                 </p>
               </div>

               <div>
                 <Label htmlFor="price">Asking Price *</Label>
                 <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     id="price"
                     type="number"
                     step="0.01"
                     value={formData.price}
                     onChange={(e) => handleInputChange('price', e.target.value)}
                     placeholder="0.00"
                     className="pl-10"
                     required
                   />
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">
                   Set a competitive price. Buyers can negotiate through messages.
                 </p>
               </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button 
              type="submit" 
              size="lg"
              className="bg-wellness-primary hover:bg-wellness-primary/90 text-white px-8 py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Listing Item..." : "List Item for Sale"}
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Your item will appear on the marketplace immediately
            </p>
          </div>
        </form>

        <CameraCapture
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Take Product Photo"
        />
      </div>
    </div>
  );
};

export default SellItem;