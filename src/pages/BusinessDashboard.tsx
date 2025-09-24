import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Store, DollarSign, Eye, EyeOff, Clock } from 'lucide-react';
import { StoreHours, DAY_NAMES, isStoreCurrentlyOpen } from '@/lib/storeHours';

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
}

const BusinessDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<BusinessApplication | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStoreHours, setShowStoreHours] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [testingMode, setTestingMode] = useState(false);
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
  const [storeHoursForm, setStoreHoursForm] = useState({
    monday_open: '', monday_close: '',
    tuesday_open: '', tuesday_close: '',
    wednesday_open: '', wednesday_close: '',
    thursday_open: '', thursday_close: '',
    friday_open: '', friday_close: '',
    saturday_open: '', saturday_close: '',
    sunday_open: '', sunday_close: '',
    is_24_7: false,
    temporary_closure: false,
    closure_message: ''
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
      // Check if user has an approved business application
      const { data: businessData, error: businessError } = await supabase
        .from('business_applications')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'approved')
        .single();

      if (businessError) {
        if (businessError.code === 'PGRST116') {
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
        } else {
          console.error('Error loading business:', businessError);
        }
        setIsLoading(false);
        return;
      }

      if (businessData) {
        setBusiness(businessData);
        // Initialize store hours form with existing data
        setStoreHoursForm({
          monday_open: businessData.monday_open || '',
          monday_close: businessData.monday_close || '',
          tuesday_open: businessData.tuesday_open || '',
          tuesday_close: businessData.tuesday_close || '',
          wednesday_open: businessData.wednesday_open || '',
          wednesday_close: businessData.wednesday_close || '',
          thursday_open: businessData.thursday_open || '',
          thursday_close: businessData.thursday_close || '',
          friday_open: businessData.friday_open || '',
          friday_close: businessData.friday_close || '',
          saturday_open: businessData.saturday_open || '',
          saturday_close: businessData.saturday_close || '',
          sunday_open: businessData.sunday_open || '',
          sunday_close: businessData.sunday_close || '',
          is_24_7: businessData.is_24_7 || false,
          temporary_closure: businessData.temporary_closure || false,
          closure_message: businessData.closure_message || ''
        });
        
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

  // Show loading while checking business status
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading business dashboard...</p>
      </div>
    );
  }

  // For testing: Allow access even without approved business
  // In production, uncomment the redirect below
  if (!business) {
    console.log('No approved business found, creating test business for dashboard access');
    // return <Navigate to="/business-registration" replace />;
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      const productData = {
        business_id: business.id,
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        image_url: productForm.image_url,
        stock_quantity: parseInt(productForm.stock_quantity),
        delivery_available: productForm.delivery_available,
        delivery_radius: parseInt(productForm.delivery_radius),
        is_active: true
      };

      let error;
      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert(productData);
        error = insertError;
      }

      if (error) {
        console.error('Error saving product:', error);
        toast({
          title: "Error",
          description: "Failed to save product. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: editingProduct ? "Product updated successfully!" : "Product added successfully!",
      });

      // Reset form and reload products
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
      setShowAddProduct(false);
      setEditingProduct(null);
      loadBusinessData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStoreHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      const { error } = await supabase
        .from('business_applications')
        .update({
          monday_open: storeHoursForm.monday_open || null,
          monday_close: storeHoursForm.monday_close || null,
          tuesday_open: storeHoursForm.tuesday_open || null,
          tuesday_close: storeHoursForm.tuesday_close || null,
          wednesday_open: storeHoursForm.wednesday_open || null,
          wednesday_close: storeHoursForm.wednesday_close || null,
          thursday_open: storeHoursForm.thursday_open || null,
          thursday_close: storeHoursForm.thursday_close || null,
          friday_open: storeHoursForm.friday_open || null,
          friday_close: storeHoursForm.friday_close || null,
          saturday_open: storeHoursForm.saturday_open || null,
          saturday_close: storeHoursForm.saturday_close || null,
          sunday_open: storeHoursForm.sunday_open || null,
          sunday_close: storeHoursForm.sunday_close || null,
          is_24_7: storeHoursForm.is_24_7,
          temporary_closure: storeHoursForm.temporary_closure,
          closure_message: storeHoursForm.closure_message || null
        })
        .eq('id', business.id);

      if (error) {
        console.error('Error updating store hours:', error);
        toast({
          title: "Error",
          description: "Failed to update store hours. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Store hours updated successfully!",
      });

      setShowStoreHours(false);
      loadBusinessData();
    } catch (error) {
      console.error('Error updating store hours:', error);
      toast({
        title: "Error",
        description: "Failed to update store hours. Please try again.",
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

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || '',
      stock_quantity: product.stock_quantity.toString(),
      delivery_available: product.delivery_available,
      delivery_radius: product.delivery_radius.toString()
    });
    setShowAddProduct(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-wellness-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your business dashboard...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8">
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Approved Business Found</h2>
            <p className="text-muted-foreground mb-6">
              You don't have an approved business application yet. Please apply for business registration first.
            </p>
            <Button onClick={() => window.location.href = '/business-registration'}>
              Apply for Business Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{business.business_name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">Business Dashboard</p>
              {business && (
                <Badge className={
                  business.temporary_closure 
                    ? 'bg-red-100 text-red-800' 
                    : isStoreCurrentlyOpen(business as StoreHours).isOpen 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                }>
                  {business.temporary_closure 
                    ? business.closure_message || 'Temporarily Closed'
                    : isStoreCurrentlyOpen(business as StoreHours).status}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowStoreHours(true)}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Clock className="h-4 w-4 mr-2" />
              Store Hours
            </Button>
            <Badge className="bg-green-100 text-green-800">
              Approved Business
            </Badge>
          </div>
        </div>

        {showStoreHours && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Store Hours & Status</CardTitle>
              <CardDescription>
                Set your business hours and manage temporary closures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStoreHoursSubmit} className="space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={storeHoursForm.is_24_7}
                      onChange={(e) => setStoreHoursForm({...storeHoursForm, is_24_7: e.target.checked})}
                      className="rounded"
                    />
                    <span>Open 24/7</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={storeHoursForm.temporary_closure}
                      onChange={(e) => setStoreHoursForm({...storeHoursForm, temporary_closure: e.target.checked})}
                      className="rounded"
                    />
                    <span>Temporarily Closed</span>
                  </label>
                </div>

                {storeHoursForm.temporary_closure && (
                  <div className="space-y-2">
                    <Label htmlFor="closureMessage">Closure Message</Label>
                    <Input
                      id="closureMessage"
                      value={storeHoursForm.closure_message}
                      onChange={(e) => setStoreHoursForm({...storeHoursForm, closure_message: e.target.value})}
                      placeholder="e.g., Closed for renovations until next week"
                    />
                  </div>
                )}

                {!storeHoursForm.is_24_7 && !storeHoursForm.temporary_closure && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Weekly Hours</h3>
                    {Object.entries(DAY_NAMES).map(([day, displayName]) => (
                      <div key={day} className="grid grid-cols-3 gap-4 items-center">
                        <Label className="font-medium">{displayName}</Label>
                        <div className="space-y-2">
                          <Label htmlFor={`${day}_open`} className="text-sm text-muted-foreground">Open</Label>
                          <Input
                            id={`${day}_open`}
                            type="time"
                            value={storeHoursForm[`${day}_open` as keyof typeof storeHoursForm] as string}
                            onChange={(e) => setStoreHoursForm({
                              ...storeHoursForm, 
                              [`${day}_open`]: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${day}_close`} className="text-sm text-muted-foreground">Close</Label>
                          <Input
                            id={`${day}_close`}
                            type="time"
                            value={storeHoursForm[`${day}_close` as keyof typeof storeHoursForm] as string}
                            onChange={(e) => setStoreHoursForm({
                              ...storeHoursForm, 
                              [`${day}_close`]: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="bg-wellness-primary hover:bg-wellness-primary/90">
                    Update Store Hours
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowStoreHours(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-wellness-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold">{products.filter(p => p.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-wellness-secondary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                  <p className="text-2xl font-bold">
                    ${products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Products</h2>
          <Button 
            onClick={() => {
              setShowAddProduct(true);
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
            }}
            className="bg-wellness-primary hover:bg-wellness-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {showAddProduct && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
              <CardDescription>
                {editingProduct ? 'Update your product information' : 'Add a new product to your store'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={productForm.category} onValueChange={(value) => setProductForm({...productForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      type="url"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryRadius">Delivery Radius (miles)</Label>
                    <Input
                      id="deliveryRadius"
                      type="number"
                      value={productForm.delivery_radius}
                      onChange={(e) => setProductForm({...productForm, delivery_radius: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="delivery"
                    checked={productForm.delivery_available}
                    onChange={(e) => setProductForm({...productForm, delivery_available: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="delivery">Delivery Available</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-wellness-primary hover:bg-wellness-primary/90">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddProduct(false);
                      setEditingProduct(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className={`${!product.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="pt-6">
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold text-wellness-primary">${product.price}</span>
                  <span className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{product.category}</Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleProductStatus(product)}
                    >
                      {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="text-center pt-8">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your online store by adding your first product.
              </p>
              <Button 
                onClick={() => setShowAddProduct(true)}
                className="bg-wellness-primary hover:bg-wellness-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;