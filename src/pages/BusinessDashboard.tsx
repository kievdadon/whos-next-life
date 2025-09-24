import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Navigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Store, DollarSign, Eye, EyeOff, Clock, Globe, Palette, CreditCard, Building } from 'lucide-react';
import { StoreHours, DAY_NAMES, isStoreCurrentlyOpen } from '@/lib/storeHours';
import WebsiteBuilder from '@/components/WebsiteBuilder';

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
}

interface BusinessApplication {
  id: string;
  business_name: string;
  business_type: string;
  contact_name: string;
  email: string;
  status: string;
  monday_open: string | null;
  monday_close: string | null;
  tuesday_open: string | null;
  tuesday_close: string | null;
  wednesday_open: string | null;
  wednesday_close: string | null;
  thursday_open: string | null;
  thursday_close: string | null;
  friday_open: string | null;
  friday_close: string | null;
  saturday_open: string | null;
  saturday_close: string | null;
  sunday_open: string | null;
  sunday_close: string | null;
  timezone: string;
  is_24_7: boolean;
  temporary_closure: boolean;
  closure_message: string | null;
  routing_number: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  stripe_connect_account_id: string | null;
  payout_enabled: boolean;
}

const BusinessDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<BusinessApplication | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStoreHours, setShowStoreHours] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBankingForm, setShowBankingForm] = useState(false);
  const [bankingForm, setBankingForm] = useState({
    routing_number: '',
    account_number: '',
    account_holder_name: ''
  });
  const [storeHoursForm, setStoreHoursForm] = useState({
    monday_open: '',
    monday_close: '',
    tuesday_open: '',
    tuesday_close: '',
    wednesday_open: '',
    wednesday_close: '',
    thursday_open: '',
    thursday_close: '',
    friday_open: '',
    friday_close: '',
    saturday_open: '',
    saturday_close: '',
    sunday_open: '',
    sunday_close: '',
    is_24_7: false,
    temporary_closure: false
  });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    stock_quantity: '',
    delivery_available: true,
    delivery_radius: '10'
  });

  const categories = [
    'Clothing & Accessories',
    'Food & Beverages', 
    'Health & Beauty',
    'Home & Garden',
    'Electronics',
    'Sports & Fitness',
    'Books & Media',
    'Toys & Games',
    'Other'
  ];

  // Redirect non-authenticated users to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const loadBusinessData = async () => {
    if (!user?.email) return;

    try {
      // Check if user has an approved business application - use maybeSingle to handle multiple records
      const { data: businessData, error: businessError } = await supabase
        .from('business_applications')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (businessError) {
        console.error('Error loading business:', businessError);
        setIsLoading(false);
        return;
      }

      if (!businessData) {
        // No approved business found - create a test business for dashboard access
        console.log('No approved business application found, creating test business');
        const { data: tempBusiness, error: createError } = await supabase
          .from('business_applications')
          .insert({
            business_name: `${user.email?.split('@')[0]}'s Business`,
            business_type: 'other',
            contact_name: user.email?.split('@')[0] || 'User',
            email: user.email!,
            description: 'Test business for dashboard access',
            status: 'approved',
            approved_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (!createError && tempBusiness) {
          setBusiness(tempBusiness);
        }
        setIsLoading(false);
        return;
      }

      if (businessData) {
        setBusiness(businessData);
        
        // Load products for this business
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('Error loading products:', productsError);
        } else {
          setProducts(productsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadBusinessData();
    }
  }, [user]);

  const handleWebsiteSave = async (websiteConfig: any) => {
    if (!business) return;
    
    try {
      const { error } = await supabase
        .from('business_applications')
        .update({ website_config: websiteConfig })
        .eq('id', business.id);
      
      if (error) throw error;
      
      toast({
        title: "Website Saved",
        description: "Your business website configuration has been updated successfully!",
      });
      
      // Reload business data to get the updated website config
      loadBusinessData();
    } catch (error) {
      console.error('Error saving website config:', error);
      toast({
        title: "Error",
        description: "Failed to save website configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) {
        console.error('Error updating product status:', error);
        toast({
          title: "Error",
          description: "Failed to update product status.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Product ${product.is_active ? 'hidden' : 'made visible'} successfully!`,
      });
      
      loadBusinessData();
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "Failed to delete product.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      
      loadBusinessData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !user) return;

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        image_url: productForm.image_url,
        stock_quantity: parseInt(productForm.stock_quantity) || 0,
        delivery_available: productForm.delivery_available,
        delivery_radius: parseInt(productForm.delivery_radius) || 10,
        business_id: business.id,
        user_id: user.id,
        is_active: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: 'Product updated successfully!' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast({ title: 'Product added successfully!' });
      }

      setShowAddProduct(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        stock_quantity: '',
        delivery_available: true,
        delivery_radius: '10'
      });
      loadBusinessData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error saving product', variant: 'destructive' });
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity.toString(),
      delivery_available: product.delivery_available,
      delivery_radius: product.delivery_radius.toString()
    });
    setShowAddProduct(true);
  };

  const cancelProductForm = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      stock_quantity: '',
      delivery_available: true,
      delivery_radius: '10'
    });
  };

  const handleBankingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !user) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: {
          accountType: 'business',
          businessData: {
            ...bankingForm,
            contact_name: business.contact_name,
            business_name: business.business_name
          }
        }
      });

      if (error) throw error;

      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
        toast({ title: 'Redirecting to Stripe onboarding...' });
      }

      setShowBankingForm(false);
      setBankingForm({
        routing_number: '',
        account_number: '',
        account_holder_name: ''
      });
    } catch (error) {
      console.error('Error setting up banking:', error);
      toast({ title: 'Error setting up banking information', variant: 'destructive' });
    }
  };

  const handleStoreHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!business) return;
    
    try {
      const { error } = await supabase
        .from('business_applications')
        .update(storeHoursForm)
        .eq('id', business.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Store hours updated successfully",
      });
      
      setShowStoreHours(false);
      loadBusinessData(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating store hours:', error);
      toast({
        title: "Error",
        description: "Failed to update store hours. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelBankingForm = () => {
    setShowBankingForm(false);
    setBankingForm({
      routing_number: '',
      account_number: '',
      account_holder_name: ''
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading business dashboard...</p>
      </div>
    );
  }
  // For testing: Allow access even without approved business
  if (!business) {
    console.log('No approved business found, creating test business for dashboard access');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      <div className="container mx-auto px-4 py-8">
        {/* Header with WHOSENXT Branding */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                WHOSENXT_{business?.business_name?.toUpperCase().replace(/\s+/g, '_') || 'BUSINESS'}
              </h1>
              <p className="text-lg text-muted-foreground mt-2">Business Management Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                WHOSENXT Powered Business
              </Badge>
              {business && (
                <Badge className={
                  business.temporary_closure 
                    ? 'bg-red-100 text-red-800' 
                     : isStoreCurrentlyOpen(business as StoreHours).isOpen
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                }>
                  {business.temporary_closure 
                    ? 'Temporarily Closed' 
                    : isStoreCurrentlyOpen(business as StoreHours).isOpen
                      ? 'Open'
                      : 'Closed'
                  }
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website Builder
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Store Hours
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Website Builder Tab */}
          <TabsContent value="website" className="space-y-6">
            <WebsiteBuilder 
              businessName={business?.business_name || 'Your Business'}
              onSave={handleWebsiteSave}
            />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {products.filter(p => p.is_active).length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Store Status</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {business?.temporary_closure 
                      ? 'Closed' 
                      : business && isStoreCurrentlyOpen(business as StoreHours).isOpen
                        ? 'Open'
                        : 'Closed'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current status
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Website</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold text-primary">
                    WHOSENXT_{business?.business_name?.toUpperCase().replace(/\s+/g, '_')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your branded website
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your business efficiently</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button onClick={() => setActiveTab('products')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('website')}>
                  <Palette className="mr-2 h-4 w-4" />
                  Customize Website
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('hours')}>
                  <Clock className="mr-2 h-4 w-4" />
                  Update Hours
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Management</h2>
              <Button onClick={() => setShowAddProduct(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>

            <div className="grid gap-6">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {product.name}
                          {product.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Hidden</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleProductStatus(product)}
                        >
                          {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Price:</span> ${product.price}
                      </div>
                      <div>
                        <span className="font-medium">Stock:</span> {product.stock_quantity}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {product.category}
                      </div>
                      <div>
                        <span className="font-medium">Delivery:</span> {product.delivery_available ? 'Available' : 'Not Available'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Store Hours Tab */}
          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Hours Management</CardTitle>
                <CardDescription>Set your business operating hours for each day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  // Initialize form with current business hours
                  if (business) {
                    setStoreHoursForm({
                      monday_open: business.monday_open || '09:00',
                      monday_close: business.monday_close || '17:00',
                      tuesday_open: business.tuesday_open || '09:00',
                      tuesday_close: business.tuesday_close || '17:00',
                      wednesday_open: business.wednesday_open || '09:00',
                      wednesday_close: business.wednesday_close || '17:00',
                      thursday_open: business.thursday_open || '09:00',
                      thursday_close: business.thursday_close || '17:00',
                      friday_open: business.friday_open || '09:00',
                      friday_close: business.friday_close || '17:00',
                      saturday_open: business.saturday_open || '09:00',
                      saturday_close: business.saturday_close || '17:00',
                      sunday_open: business.sunday_open || '09:00',
                      sunday_close: business.sunday_close || '17:00',
                      is_24_7: business.is_24_7 || false,
                      temporary_closure: business.temporary_closure || false
                    });
                  }
                  setShowStoreHours(true);
                }}>
                  <Clock className="mr-2 h-4 w-4" />
                  Update Store Hours
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Manage your business information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Business Name</Label>
                  <Input value={business?.business_name || ''} disabled />
                </div>
                <div>
                  <Label>WHOSENXT URL</Label>
                  <Input 
                    value={`whosenxt.com/${business?.business_name?.toLowerCase().replace(/\s+/g, '_') || 'business'}`} 
                    disabled 
                  />
                </div>
                <div>
                  <Label>Business Type</Label>
                  <Input value={business?.business_type || ''} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment & Banking Setup
                </CardTitle>
                <CardDescription>
                  Configure your banking information to receive payments from customers. 
                  WHOSENXT will take a 15% commission from each sale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {business?.stripe_connect_account_id ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-700 font-medium">Banking connected successfully</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Your Stripe Connect account is set up and ready to receive payments.</p>
                      <p className="mt-2">Commission structure:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>You receive: 85% of each sale</li>
                        <li>WHOSENXT commission: 15% of each sale</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-700 font-medium">Banking setup required</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set up your banking information to start receiving payments from customers.
                    </p>
                    <Button onClick={() => setShowBankingForm(true)} className="w-full">
                      <Building className="mr-2 h-4 w-4" />
                      Set Up Banking Information
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Banking Form Modal */}
        {showBankingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Banking Information Setup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This information will be used to set up your Stripe Connect account for receiving payments.
                </p>
                <form onSubmit={handleBankingSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="account_holder_name">Account Holder Name</Label>
                    <Input
                      id="account_holder_name"
                      value={bankingForm.account_holder_name}
                      onChange={(e) => setBankingForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                      placeholder="Full name on bank account"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="routing_number">Routing Number</Label>
                    <Input
                      id="routing_number"
                      value={bankingForm.routing_number}
                      onChange={(e) => setBankingForm(prev => ({ ...prev, routing_number: e.target.value }))}
                      placeholder="9-digit routing number"
                      maxLength={9}
                      pattern="[0-9]{9}"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={bankingForm.account_number}
                      onChange={(e) => setBankingForm(prev => ({ ...prev, account_number: e.target.value }))}
                      placeholder="Bank account number"
                      required
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Commission Structure</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• You receive 85% of each sale</li>
                      <li>• WHOSENXT takes 15% commission</li>
                      <li>• Payments processed securely through Stripe</li>
                    </ul>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={cancelBankingForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Setup Banking
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: e.target.value }))}
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="delivery_available"
                      checked={productForm.delivery_available}
                      onChange={(e) => setProductForm(prev => ({ ...prev, delivery_available: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="delivery_available">Delivery Available</Label>
                  </div>
                  {productForm.delivery_available && (
                    <div>
                      <Label htmlFor="delivery_radius">Delivery Radius (miles)</Label>
                      <Input
                        id="delivery_radius"
                        type="number"
                        value={productForm.delivery_radius}
                        onChange={(e) => setProductForm(prev => ({ ...prev, delivery_radius: e.target.value }))}
                        min="1"
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={cancelProductForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Store Hours Modal */}
        {showStoreHours && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Store Hours Management</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Set your business operating hours for each day of the week.
                </p>
                <form onSubmit={handleStoreHoursSubmit} className="space-y-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="grid grid-cols-3 gap-4 items-center">
                      <Label className="font-medium">{day}</Label>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Open</Label>
                        <Input
                          type="time"
                          value={storeHoursForm[`${day.toLowerCase()}_open` as keyof typeof storeHoursForm] as string}
                          onChange={(e) => setStoreHoursForm(prev => ({ ...prev, [`${day.toLowerCase()}_open`]: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Close</Label>
                        <Input
                          type="time"
                          value={storeHoursForm[`${day.toLowerCase()}_close` as keyof typeof storeHoursForm] as string}
                          onChange={(e) => setStoreHoursForm(prev => ({ ...prev, [`${day.toLowerCase()}_close`]: e.target.value }))}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <input
                      type="checkbox"
                      id="is_24_7"
                      checked={storeHoursForm.is_24_7}
                      onChange={(e) => setStoreHoursForm(prev => ({ ...prev, is_24_7: e.target.checked }))}
                    />
                    <Label htmlFor="is_24_7">Open 24/7</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="temporary_closure"
                      checked={storeHoursForm.temporary_closure}
                      onChange={(e) => setStoreHoursForm(prev => ({ ...prev, temporary_closure: e.target.checked }))}
                    />
                    <Label htmlFor="temporary_closure">Temporarily Closed</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowStoreHours(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update Hours
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;