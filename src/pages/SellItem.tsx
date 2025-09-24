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
    stockQuantity: 1,
    productType: '', // virtual or physical
    dimensions: '',
    weight: '',
    priceType: 'fixed', // fixed, negotiable, auction
    originalPrice: '',
    brand: '',
    features: ''
  });

  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
    { value: 'digital', label: 'Digital Products', icon: '💻' },
    { value: 'services', label: 'Services', icon: '🔧' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const productTypes = [
    { value: 'physical', label: 'Physical Product', description: 'Tangible item that can be shipped or picked up' },
    { value: 'virtual', label: 'Virtual/Digital', description: 'Digital product delivered electronically' },
    { value: 'service', label: 'Service', description: 'Service or consultation offered' }
  ];

  const priceTypes = [
    { value: 'fixed', label: 'Fixed Price', description: 'Set price, no negotiation' },
    { value: 'negotiable', label: 'Negotiable', description: 'Open to price discussions' },
    { value: 'auction', label: 'Auction', description: 'Let buyers bid on your item' }
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

  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages = fileArray.slice(0, 7 - productImages.length); // Limit to 7 total images
    
    if (productImages.length + newImages.length > 7) {
      toast({
        title: "Too Many Images",
        description: "You can upload a maximum of 7 images per product.",
        variant: "destructive"
      });
      return;
    }

    setProductImages(prev => [...prev, ...newImages]);
    
    // Create previews for new images
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = (file: File) => {
    handleFileUpload([file]);
    setCameraOpen(false);
  };

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToStorage = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${Date.now()}-${index}.${fileExt}`;
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
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validation
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.productType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (productImages.length === 0 && formData.productType !== 'virtual') {
      toast({
        title: "Images Required",
        description: "Please add at least one photo of your item (not required for virtual products)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload all images
      const imageUrls = await uploadImagesToStorage(productImages);

      // Build detailed description
      let detailedDescription = formData.description;
      
      if (formData.productType === 'physical' && formData.condition) {
        detailedDescription += `\n\nCondition: ${conditions.find(c => c.value === formData.condition)?.label}`;
      }
      
      if (formData.brand) detailedDescription += `\nBrand: ${formData.brand}`;
      if (formData.features) detailedDescription += `\nFeatures: ${formData.features}`;
      if (formData.dimensions && formData.productType === 'physical') detailedDescription += `\nDimensions: ${formData.dimensions}`;
      if (formData.weight && formData.productType === 'physical') detailedDescription += `\nWeight: ${formData.weight}`;
      if (formData.originalPrice) detailedDescription += `\nOriginal Price: $${formData.originalPrice}`;
      if (formData.location) detailedDescription += `\nLocation: ${formData.location}`;
      if (formData.priceType !== 'fixed') detailedDescription += `\nPricing: ${priceTypes.find(p => p.value === formData.priceType)?.label}`;

      // Create product listing directly for the user
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: detailedDescription,
          price: parseFloat(formData.price),
          category: formData.category,
          image_url: imageUrls[0] || null, // Primary image (null for virtual products)
          user_id: user.id,
          stock_quantity: formData.stockQuantity,
          delivery_available: formData.productType === 'physical' ? formData.deliveryAvailable : false,
          is_active: true
        })
        .select()
        .single();

      if (productError) throw productError;

      // Save additional images to product_images table
      if (imageUrls.length > 1) {
        const additionalImages = imageUrls.slice(1).map((url, index) => ({
          product_id: newProduct.id,
          image_url: url,
          image_order: index + 2 // Start from 2 since main image is 1
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(additionalImages);

        if (imagesError) {
          console.error('Error saving additional images:', imagesError);
          // Don't throw error here - main product was saved successfully
        }
      }

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
        stockQuantity: 1,
        productType: '',
        dimensions: '',
        weight: '',
        priceType: 'fixed',
        originalPrice: '',
        brand: '',
        features: ''
      });
      setProductImages([]);
      setImagePreviews([]);

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
          <p className="text-muted-foreground">Fill out the form below to list your item on the marketplace and connect with buyers</p>
          <div className="bg-wellness-accent/10 rounded-lg p-4 mt-4 text-sm">
            <h3 className="font-semibold mb-2">📝 What you'll need:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>1-7 clear photos of your item (not required for digital products)</li>
              <li>Detailed description including condition and features</li>
              <li>Competitive pricing information</li>
              <li>Your location for pickup/delivery</li>
            </ul>
          </div>
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
              <p className="text-sm text-muted-foreground">
                Add 1-7 high-quality photos. The first photo will be the main image buyers see. Good photos increase your chances of selling!
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imagePreviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Product preview ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-lg border-2 border-border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                          {index === 0 && (
                            <Badge className="absolute bottom-2 left-2 text-xs">
                              Main Photo
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {productImages.length < 7 && (
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          Add more photos ({productImages.length}/7)
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <div>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files) handleFileUpload(files);
                              }}
                              className="hidden"
                              id="additional-upload"
                            />
                            <Label htmlFor="additional-upload" className="cursor-pointer">
                              <Button type="button" variant="outline" size="sm" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Add More Photos
                              </Button>
                            </Label>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
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
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Add 1-7 photos of your item</p>
                    <p className="text-sm text-muted-foreground mb-4">First photo will be the main display image</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) handleFileUpload(files);
                          }}
                          className="hidden"
                          id="product-upload"
                        />
                        <Label htmlFor="product-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload Photos
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
              <p className="text-sm text-muted-foreground">
                Provide detailed information about your item. The more details you include, the more likely buyers are to be interested.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-base font-medium">Product Name *</Label>
                <p className="text-xs text-muted-foreground mb-2">Be specific and descriptive. Include brand, model, size, or key features.</p>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., iPhone 13 Pro 128GB Unlocked, Vintage Oak Dining Table, Men's Nike Running Shoes Size 10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="productType" className="text-base font-medium">Product Type *</Label>
                <p className="text-xs text-muted-foreground mb-2">Choose what type of product you're selling to help buyers understand what they're getting.</p>
                <Select onValueChange={(value) => handleInputChange('productType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium">Description *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Write a detailed description. Include condition, age, features, dimensions, any flaws, and why you're selling.
                </p>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={formData.productType === 'virtual' 
                    ? "Describe your digital product - what's included, format, delivery method, system requirements, license terms..."
                    : formData.productType === 'service'
                    ? "Describe your service - what you offer, your experience, duration, what's included, your qualifications..."
                    : "Describe your item in detail - condition, age, brand, features, size, color, any wear or damage, reason for selling..."
                  }
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.productType === 'virtual' 
                    ? "Tip: Mention file formats, compatibility, and how the buyer will receive the product"
                    : formData.productType === 'service'
                    ? "Tip: Include your experience, availability, and what makes your service special"
                    : "Tip: Be honest about any flaws - it builds trust with buyers"
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand" className="text-base font-medium">Brand (optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Include the brand name if applicable - it helps buyers search and trust your listing.</p>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="e.g., Apple, Nike, Samsung, IKEA, Toyota"
                  />
                </div>

                <div>
                  <Label htmlFor="features" className="text-base font-medium">Key Features (optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">List the main features that make your item special or useful.</p>
                  <Input
                    id="features"
                    value={formData.features}
                    onChange={(e) => handleInputChange('features', e.target.value)}
                    placeholder="e.g., Bluetooth, Touch Screen, Wireless, Waterproof, Memory Foam"
                  />
                </div>
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

                {formData.productType === 'physical' && (
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
                )}
               </div>

               {/* Physical Product Details */}
               {formData.productType === 'physical' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="dimensions">Dimensions (optional)</Label>
                     <Input
                       id="dimensions"
                       value={formData.dimensions}
                       onChange={(e) => handleInputChange('dimensions', e.target.value)}
                       placeholder="e.g., 12 x 8 x 3 inches"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="weight">Weight (optional)</Label>
                     <Input
                       id="weight"
                       value={formData.weight}
                       onChange={(e) => handleInputChange('weight', e.target.value)}
                       placeholder="e.g., 2.5 lbs"
                     />
                   </div>
                 </div>
               )}

                <div>
                  <Label htmlFor="location">{formData.productType === 'service' ? 'Service Area' : 'Your Location'} (City, State)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder={formData.productType === 'service' 
                      ? "e.g., Cleveland metro area, Remote"
                      : "e.g., Cleveland, OH or Local Pickup"
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.productType === 'service' 
                      ? "Specify where you provide your service or if it's remote."
                      : "Help buyers know where the item is located for pickup/delivery."
                    }
                  </p>
                </div>

               {/* Pricing Details */}
               <div className="space-y-4 border-t pt-4">
                 <div>
                   <h3 className="text-lg font-semibold">Pricing Information</h3>
                   <p className="text-sm text-muted-foreground">Set a competitive price. Research similar items to price yours fairly.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="price" className="text-base font-medium">Your Price *</Label>
                     <p className="text-xs text-muted-foreground mb-2">Set your asking price. Be competitive but fair based on condition and market value.</p>
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
                   </div>

                   <div>
                     <Label htmlFor="originalPrice" className="text-base font-medium">Original/Retail Price (optional)</Label>
                     <p className="text-xs text-muted-foreground mb-2">What did you originally pay? This shows buyers the value they're getting.</p>
                     <div className="relative">
                       <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         id="originalPrice"
                         type="number"
                         step="0.01"
                         value={formData.originalPrice}
                         onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                         placeholder="0.00"
                         className="pl-10"
                       />
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">
                       Show buyers the savings they're getting
                     </p>
                   </div>
                 </div>

                 <div>
                   <Label htmlFor="priceType">Price Type</Label>
                   <Select onValueChange={(value) => handleInputChange('priceType', value)} defaultValue="fixed">
                     <SelectTrigger>
                       <SelectValue placeholder="Select pricing type" />
                     </SelectTrigger>
                     <SelectContent>
                       {priceTypes.map((type) => (
                         <SelectItem key={type.value} value={type.value}>
                           <div className="flex flex-col">
                             <span className="font-medium">{type.label}</span>
                             <span className="text-xs text-muted-foreground">{type.description}</span>
                           </div>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
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