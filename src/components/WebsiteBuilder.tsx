import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CameraCapture } from '@/components/CameraCapture';
import { 
  Palette, 
  Type, 
  Layout, 
  Image as ImageIcon, 
  Eye, 
  Save,
  Upload,
  Monitor,
  Smartphone,
  Tablet,
  Camera,
  Link,
  X
} from 'lucide-react';

interface WebsiteConfig {
  businessName: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headerStyle: string;
  layout: string;
  logoUrl: string;
  heroImage: string;
  aboutText: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_active: boolean;
}

interface WebsiteBuilderProps {
  businessName: string;
  businessId: string;
  onSave: (config: WebsiteConfig) => void;
}

const WebsiteBuilder: React.FC<WebsiteBuilderProps> = ({ businessName, businessId, onSave }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [config, setConfig] = useState<WebsiteConfig>({
    businessName,
    description: `Welcome to ${businessName} - Your trusted partner`,
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Inter',
    headerStyle: 'modern',
    layout: 'hero-centered',
    logoUrl: '',
    heroImage: '',
    aboutText: `At ${businessName}, we are committed to providing exceptional service and quality products to our customers.`,
    contactInfo: {
      phone: '',
      email: '',
      address: ''
    }
  });

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<'logo' | 'hero'>('logo');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload' | 'camera'>('url');
  const [logoUploadMethod, setLogoUploadMethod] = useState<'url' | 'upload' | 'camera'>('url');
  const [heroUploadMethod, setHeroUploadMethod] = useState<'url' | 'upload' | 'camera'>('url');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load products for this business
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
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
      } finally {
        setIsLoadingProducts(false);
      }
    };

    if (businessId) {
      loadProducts();
    }
  }, [businessId]);

const handleBuyProduct = async (productId: string, productPrice: number) => {
  try {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase products.",
        variant: "destructive",
      });
      return;
    }

    if (!businessId) {
      toast({
        title: 'Missing business info',
        description: 'Please reload the dashboard and try again.',
        variant: 'destructive',
      });
      return;
    }

    // 1) Create an order record
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

    // 2) Create the Stripe Checkout session via Edge Function
    const { data, error } = await supabase.functions.invoke('create-marketplace-payment', {
      body: {
        orderType: 'product',
        orderId: order.id,
        totalAmount: Math.round(productPrice * 100), // cents
        businessId,
      },
    });

    if (error) throw error;

    if (data?.error?.toString().includes('No Connect account')) {
      toast({
        title: 'Seller not ready to accept payments',
        description: 'Please open Payment & Banking Setup in your dashboard to connect Stripe.',
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
    } else {
      throw new Error('Checkout session URL not returned');
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    toast({
      title: 'Payment Error',
      description: 'Failed to create checkout session. Please try again.',
      variant: 'destructive',
    });
  }
};

  const colorOptions = [
    { name: 'Ocean Blue', value: '#667eea' },
    { name: 'Purple Gradient', value: '#764ba2' },
    { name: 'Emerald Green', value: '#10b981' },
    { name: 'Sunset Orange', value: '#f59e0b' },
    { name: 'Rose Pink', value: '#ec4899' },
    { name: 'Slate Gray', value: '#64748b' }
  ];

  const fontOptions = [
    { name: 'Inter (Modern)', value: 'Inter' },
    { name: 'Playfair Display (Elegant)', value: 'Playfair Display' },
    { name: 'Roboto (Clean)', value: 'Roboto' },
    { name: 'Poppins (Friendly)', value: 'Poppins' },
    { name: 'Merriweather (Classic)', value: 'Merriweather' }
  ];

  const layoutOptions = [
    { name: 'Hero Centered', value: 'hero-centered' },
    { name: 'Side Navigation', value: 'side-nav' },
    { name: 'Full Width Banner', value: 'full-banner' },
    { name: 'Grid Layout', value: 'grid' }
  ];

  const handleConfigChange = (key: keyof WebsiteConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleContactInfoChange = (key: keyof WebsiteConfig['contactInfo'], value: string) => {
    setConfig(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [key]: value
      }
    }));
  };

  const uploadImageToStorage = async (file: File, folder: string = 'website-media'): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'hero') => {
    const imageUrl = await uploadImageToStorage(file, type === 'logo' ? 'logos' : 'hero-images');
    if (imageUrl) {
      if (type === 'logo') {
        handleConfigChange('logoUrl', imageUrl);
      } else {
        handleConfigChange('heroImage', imageUrl);
      }
      toast({
        title: "Image Uploaded",
        description: `${type === 'logo' ? 'Logo' : 'Hero image'} uploaded successfully!`,
      });
    }
  };

  const handleCameraCapture = async (file: File) => {
    await handleImageUpload(file, captureTarget);
    setShowCameraCapture(false);
  };

  const openCameraForImage = (type: 'logo' | 'hero') => {
    setCaptureTarget(type);
    setShowCameraCapture(true);
  };

  const generatePreview = () => {
    const deviceStyles = {
      desktop: 'w-full max-w-6xl mx-auto',
      tablet: 'w-full max-w-2xl mx-auto',
      mobile: 'w-full max-w-sm mx-auto'
    };

    return (
      <div className={`${deviceStyles[previewDevice]} border rounded-lg overflow-hidden shadow-lg`}
           style={{ 
             backgroundColor: config.backgroundColor,
             color: config.textColor,
             fontFamily: config.fontFamily
           }}>
        {/* Header */}
        <header className="px-6 py-4 border-b" 
                style={{ backgroundColor: config.primaryColor, color: 'white' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              WHOSENXT_{config.businessName.toUpperCase().replace(/\s+/g, '_')}
            </h1>
            <nav className="hidden md:flex gap-6">
              <a href="#" className="hover:opacity-80">Home</a>
              <a href="#" className="hover:opacity-80">About</a>
              <a href="#" className="hover:opacity-80">Services</a>
              <a href="#" className="hover:opacity-80">Contact</a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-6 py-12 text-center"
                 style={{ 
                   backgroundImage: config.heroImage ? `url(${config.heroImage})` : 
                     `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                   backgroundSize: 'cover',
                   backgroundPosition: 'center',
                   color: config.heroImage ? 'white' : 'white'
                 }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              {config.businessName}
            </h2>
            <p className="text-xl mb-8 opacity-90">
              {config.description}
            </p>
            <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg">
              Get Started
            </Button>
          </div>
        </section>

        {/* Products Section */}
        {products.length > 0 && (
          <section className="px-6 py-12 bg-gray-50" style={{ backgroundColor: `${config.backgroundColor}f0` }}>
            <div className="max-w-6xl mx-auto">
              <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: config.primaryColor }}>
                Our Products
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h4 className="font-bold text-lg mb-2">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ color: config.primaryColor }}>
                          ${Number(product.price).toFixed(2)}
                        </span>
                        {product.stock_quantity > 0 ? (
                          <Button 
                            size="sm"
                            onClick={() => handleBuyProduct(product.id, Number(product.price))}
                            style={{ 
                              backgroundColor: config.primaryColor,
                              color: 'white'
                            }}
                            className="hover:opacity-90"
                          >
                            Buy Now
                          </Button>
                        ) : (
                          <Badge variant="secondary">Out of Stock</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-6" style={{ color: config.primaryColor }}>
              About Us
            </h3>
            <p className="text-lg leading-relaxed">
              {config.aboutText}
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="px-6 py-12 border-t">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-6" style={{ color: config.primaryColor }}>
              Contact Information
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {config.contactInfo.phone && (
                <div>
                  <h4 className="font-semibold mb-2">Phone</h4>
                  <p>{config.contactInfo.phone}</p>
                </div>
              )}
              {config.contactInfo.email && (
                <div>
                  <h4 className="font-semibold mb-2">Email</h4>
                  <p>{config.contactInfo.email}</p>
                </div>
              )}
              {config.contactInfo.address && (
                <div>
                  <h4 className="font-semibold mb-2">Address</h4>
                  <p>{config.contactInfo.address}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 text-center border-t"
                style={{ backgroundColor: config.primaryColor, color: 'white' }}>
          <p>&copy; 2024 WHOSENXT_{config.businessName.toUpperCase().replace(/\s+/g, '_')}. All rights reserved.</p>
          <p className="text-sm opacity-80 mt-2">Powered by WHOSENXT</p>
        </footer>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Website Builder</h2>
          <p className="text-muted-foreground">
            Customize your business website with WHOSENXT branding
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary">
          WHOSENXT_{businessName.toUpperCase().replace(/\s+/g, '_')}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Customization Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="design" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Design
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={config.primaryColor}
                          onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                          className="w-12 h-10"
                        />
                        <Select value={config.primaryColor} onValueChange={(value) => handleConfigChange('primaryColor', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map(color => (
                              <SelectItem key={color.value} value={color.value}>
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="color" 
                          value={config.secondaryColor}
                          onChange={(e) => handleConfigChange('secondaryColor', e.target.value)}
                          className="w-12 h-10"
                        />
                        <Select value={config.secondaryColor} onValueChange={(value) => handleConfigChange('secondaryColor', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map(color => (
                              <SelectItem key={color.value} value={color.value}>
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Font Family</Label>
                    <Select value={config.fontFamily} onValueChange={(value) => handleConfigChange('fontFamily', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Business Description</Label>
                    <Textarea 
                      value={config.description}
                      onChange={(e) => handleConfigChange('description', e.target.value)}
                      placeholder="Describe your business..."
                    />
                  </div>
                  <div>
                    <Label>About Text</Label>
                    <Textarea 
                      value={config.aboutText}
                      onChange={(e) => handleConfigChange('aboutText', e.target.value)}
                      placeholder="Tell customers about your business..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Phone Number</Label>
                      <Input 
                        value={config.contactInfo.phone}
                        onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input 
                        type="email"
                        value={config.contactInfo.email}
                        onChange={(e) => handleContactInfoChange('email', e.target.value)}
                        placeholder="contact@yourbusiness.com"
                      />
                    </div>
                    <div>
                      <Label>Business Address</Label>
                      <Input 
                        value={config.contactInfo.address}
                        onChange={(e) => handleContactInfoChange('address', e.target.value)}
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Layout Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Page Layout</Label>
                    <Select value={config.layout} onValueChange={(value) => handleConfigChange('layout', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {layoutOptions.map(layout => (
                          <SelectItem key={layout.value} value={layout.value}>
                            {layout.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Images & Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload Section */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business Logo
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Upload your business logo that will appear on your website
                    </p>
                    
                    {/* Logo Upload Method Selection */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        type="button"
                        variant={logoUploadMethod === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLogoUploadMethod('url')}
                        className="flex items-center gap-1"
                      >
                        <Link className="h-3 w-3" />
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={logoUploadMethod === 'upload' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLogoUploadMethod('upload')}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                      <Button
                        type="button"
                        variant={logoUploadMethod === 'camera' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLogoUploadMethod('camera')}
                        className="flex items-center gap-1"
                      >
                        <Camera className="h-3 w-3" />
                        Camera
                      </Button>
                    </div>

                    {/* Logo URL Input */}
                    {logoUploadMethod === 'url' && (
                      <Input 
                        value={config.logoUrl}
                        onChange={(e) => handleConfigChange('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full"
                      />
                    )}

                    {/* Logo File Upload */}
                    {logoUploadMethod === 'upload' && (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, 'logo');
                            }
                          }}
                          className="w-full"
                          disabled={isUploadingImage}
                        />
                        {isUploadingImage && (
                          <p className="text-xs text-blue-600">Uploading logo...</p>
                        )}
                      </div>
                    )}

                    {/* Logo Camera Capture */}
                    {logoUploadMethod === 'camera' && (
                      <Button
                        type="button"
                        onClick={() => openCameraForImage('logo')}
                        className="w-full"
                        disabled={isUploadingImage}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Logo Photo
                      </Button>
                    )}

                    {/* Logo Preview */}
                    {config.logoUrl && (
                      <div className="mt-3 relative">
                        <img
                          src={config.logoUrl}
                          alt="Logo preview"
                          className="w-full h-20 object-contain rounded-lg border bg-gray-50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleConfigChange('logoUrl', '')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Hero Image Upload Section */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Hero Background Image
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Upload a background image for your website's hero section
                    </p>
                    
                    {/* Hero Upload Method Selection */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        type="button"
                        variant={heroUploadMethod === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setHeroUploadMethod('url')}
                        className="flex items-center gap-1"
                      >
                        <Link className="h-3 w-3" />
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={heroUploadMethod === 'upload' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setHeroUploadMethod('upload')}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                      <Button
                        type="button"
                        variant={heroUploadMethod === 'camera' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setHeroUploadMethod('camera')}
                        className="flex items-center gap-1"
                      >
                        <Camera className="h-3 w-3" />
                        Camera
                      </Button>
                    </div>

                    {/* Hero URL Input */}
                    {heroUploadMethod === 'url' && (
                      <Input 
                        value={config.heroImage}
                        onChange={(e) => handleConfigChange('heroImage', e.target.value)}
                        placeholder="https://example.com/hero-image.jpg"
                        className="w-full"
                      />
                    )}

                    {/* Hero File Upload */}
                    {heroUploadMethod === 'upload' && (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, 'hero');
                            }
                          }}
                          className="w-full"
                          disabled={isUploadingImage}
                        />
                        {isUploadingImage && (
                          <p className="text-xs text-blue-600">Uploading hero image...</p>
                        )}
                      </div>
                    )}

                    {/* Hero Camera Capture */}
                    {heroUploadMethod === 'camera' && (
                      <Button
                        type="button"
                        onClick={() => openCameraForImage('hero')}
                        className="w-full"
                        disabled={isUploadingImage}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Hero Photo
                      </Button>
                    )}

                    {/* Hero Preview */}
                    {config.heroImage && (
                      <div className="mt-3 relative">
                        <img
                          src={config.heroImage}
                          alt="Hero image preview"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleConfigChange('heroImage', '')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button onClick={() => {
              console.log('Save Website button clicked!');
              console.log('Current config:', config);
              onSave(config);
            }} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Save Website
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const previewWindow = window.open('', 'preview', 'width=1200,height=800,scrollbars=yes,resizable=yes');
                if (previewWindow) {
                  const previewHtml = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>WHOSENXT_${config.businessName.toUpperCase().replace(/\s+/g, '_')}</title>
                      <link href="https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(' ', '+')}:wght@300;400;600;700&display=swap" rel="stylesheet">
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                          font-family: '${config.fontFamily}', sans-serif; 
                          background-color: ${config.backgroundColor}; 
                          color: ${config.textColor}; 
                          line-height: 1.6;
                        }
                        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
                        header { 
                          background-color: ${config.primaryColor}; 
                          color: white; 
                          padding: 1rem 0; 
                          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .header-content { display: flex; justify-content: space-between; align-items: center; }
                        .logo { font-size: 1.5rem; font-weight: bold; }
                        nav { display: flex; gap: 2rem; }
                        nav a { color: white; text-decoration: none; transition: opacity 0.3s; }
                        nav a:hover { opacity: 0.8; }
                        .hero { 
                          background: ${config.heroImage ? `url(${config.heroImage})` : `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`};
                          background-size: cover;
                          background-position: center;
                          color: white;
                          padding: 6rem 0;
                          text-align: center;
                        }
                        .hero h1 { font-size: 3.5rem; font-weight: bold; margin-bottom: 1rem; }
                        .hero p { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; }
                        .cta-button { 
                          background: white; 
                          color: #1f2937; 
                          padding: 0.75rem 2rem; 
                          border: none; 
                          border-radius: 0.5rem; 
                          font-size: 1.1rem; 
                          font-weight: 600; 
                          cursor: pointer; 
                          transition: all 0.3s;
                        }
                        .cta-button:hover { background: #f3f4f6; }
                        .section { padding: 4rem 0; }
                        .section h2 { color: ${config.primaryColor}; font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; }
                        .section p { font-size: 1.1rem; line-height: 1.8; }
                        .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 2rem; }
                        .contact-item h3 { font-weight: 600; margin-bottom: 0.5rem; color: ${config.primaryColor}; }
                        footer { 
                          background-color: ${config.primaryColor}; 
                          color: white; 
                          text-align: center; 
                          padding: 2rem 0; 
                          border-top: 1px solid rgba(255,255,255,0.1);
                        }
                        .footer-brand { font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem; }
                        @media (max-width: 768px) {
                          .hero h1 { font-size: 2.5rem; }
                          .hero { padding: 4rem 0; }
                          nav { display: none; }
                          .contact-grid { grid-template-columns: 1fr; }
                        }
                      </style>
                    </head>
                    <body>
                      <header>
                        <div class="container">
                          <div class="header-content">
                            <div class="logo">WHOSENXT_${config.businessName.toUpperCase().replace(/\s+/g, '_')}</div>
                            <nav>
                              <a href="#home">Home</a>
                              <a href="#about">About</a>
                              <a href="#services">Services</a>
                              <a href="#contact">Contact</a>
                            </nav>
                          </div>
                        </div>
                      </header>

                      <section class="hero" id="home">
                        <div class="container">
                          <h1>${config.businessName}</h1>
                          <p>${config.description}</p>
                          <button class="cta-button">Get Started</button>
                        </div>
                      </section>

                      <section class="section" id="about">
                        <div class="container">
                          <h2>About Us</h2>
                          <p>${config.aboutText}</p>
                        </div>
                      </section>

                      <section class="section" id="contact" style="border-top: 1px solid #e5e7eb;">
                        <div class="container">
                          <h2>Contact Information</h2>
                          <div class="contact-grid">
                            ${config.contactInfo.phone ? `
                              <div class="contact-item">
                                <h3>Phone</h3>
                                <p>${config.contactInfo.phone}</p>
                              </div>
                            ` : ''}
                            ${config.contactInfo.email ? `
                              <div class="contact-item">
                                <h3>Email</h3>
                                <p>${config.contactInfo.email}</p>
                              </div>
                            ` : ''}
                            ${config.contactInfo.address ? `
                              <div class="contact-item">
                                <h3>Address</h3>
                                <p>${config.contactInfo.address}</p>
                              </div>
                            ` : ''}
                          </div>
                        </div>
                      </section>

                      <footer>
                        <div class="container">
                          <p>&copy; 2024 WHOSENXT_${config.businessName.toUpperCase().replace(/\s+/g, '_')}. All rights reserved.</p>
                          <p class="footer-brand">Powered by WHOSENXT</p>
                        </div>
                      </footer>
                    </body>
                    </html>
                  `;
                  previewWindow.document.write(previewHtml);
                  previewWindow.document.close();
                }
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Live
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="flex gap-2">
              <Button 
                variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button 
                variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button 
                variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50 min-h-[600px] overflow-auto">
            {generatePreview()}
          </div>
        </div>
      </div>

      {/* Camera Capture Component */}
      <CameraCapture
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={handleCameraCapture}
        title={`Take ${captureTarget === 'logo' ? 'Logo' : 'Hero Image'} Photo`}
      />
    </div>
  );
};

export default WebsiteBuilder;