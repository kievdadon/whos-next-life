import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Share2
} from "lucide-react";
import { useState } from "react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
  spicy?: boolean;
  vegetarian?: boolean;
}

interface StoreData {
  name: string;
  category: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  promo?: string;
  description: string;
  address: string;
  phone: string;
}

const StoreMenu = () => {
  const { storeName } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<{[key: string]: number}>({});

  // Store data mapping
  const storeData: {[key: string]: StoreData} = {
    "Tony's Italian Kitchen": {
      name: "Tony's Italian Kitchen",
      category: "Italian Food",
      rating: 4.7,
      deliveryTime: "20-35 min",
      deliveryFee: 2.99,
      image: "🍝",
      promo: "20% off $25+",
      description: "Authentic Italian cuisine made with love and traditional recipes",
      address: "456 Little Italy Street",
      phone: "(555) 123-TONY"
    },
    "TechMart Express": {
      name: "TechMart Express",
      category: "Electronics",
      rating: 4.5,
      deliveryTime: "1-2 hours",
      deliveryFee: 4.99,
      image: "📱",
      promo: "Free delivery",
      description: "Latest tech gadgets and electronics delivered fast",
      address: "789 Tech Boulevard",
      phone: "(555) TECH-123"
    },
    "Fashion Forward": {
      name: "Fashion Forward",
      category: "Clothing",
      rating: 4.6,
      deliveryTime: "2-4 hours",
      deliveryFee: 3.99,
      image: "👗",
      promo: "New arrivals",
      description: "Trendy fashion for every style and occasion",
      address: "321 Fashion Avenue",
      phone: "(555) STYLE-01"
    },
    "QuickMeds Pharmacy": {
      name: "QuickMeds Pharmacy",
      category: "Healthcare",
      rating: 4.9,
      deliveryTime: "15-30 min",
      deliveryFee: 1.99,
      image: "💊",
      promo: "24/7 available",
      description: "Your trusted pharmacy for all health and wellness needs",
      address: "123 Health Street",
      phone: "(555) MEDS-247"
    }
  };

  // Menu items mapping
  const menuItems: {[key: string]: MenuItem[]} = {
    "Tony's Italian Kitchen": [
      {
        id: "1",
        name: "Margherita Pizza",
        description: "Fresh mozzarella, tomato sauce, basil",
        price: 18.99,
        image: "🍕",
        category: "Pizza",
        popular: true,
        vegetarian: true
      },
      {
        id: "2", 
        name: "Fettuccine Alfredo",
        description: "Creamy alfredo sauce with fresh pasta",
        price: 16.99,
        image: "🍝",
        category: "Pasta",
        vegetarian: true
      },
      {
        id: "3",
        name: "Chicken Parmigiana",
        description: "Breaded chicken with marinara and mozzarella",
        price: 22.99,
        image: "🍗",
        category: "Main Course",
        popular: true
      },
      {
        id: "4",
        name: "Caesar Salad",
        description: "Romaine lettuce, parmesan, croutons, caesar dressing",
        price: 12.99,
        image: "🥗",
        category: "Salads",
        vegetarian: true
      },
      {
        id: "5",
        name: "Tiramisu",
        description: "Classic Italian dessert with coffee and mascarpone",
        price: 8.99,
        image: "🍰",
        category: "Desserts",
        vegetarian: true
      }
    ],
    "TechMart Express": [
      {
        id: "t1",
        name: "iPhone 15 Pro",
        description: "Latest Apple smartphone with A17 Pro chip",
        price: 999.99,
        image: "📱",
        category: "Smartphones",
        popular: true
      },
      {
        id: "t2",
        name: "MacBook Air M3",
        description: "13-inch laptop with M3 chip and 16GB RAM",
        price: 1299.99,
        image: "💻",
        category: "Laptops",
        popular: true
      },
      {
        id: "t3",
        name: "AirPods Pro",
        description: "Active noise cancellation wireless earbuds",
        price: 249.99,
        image: "🎧",
        category: "Audio"
      },
      {
        id: "t4",
        name: "iPad Pro 12.9",
        description: "Professional tablet with M2 chip",
        price: 1099.99,
        image: "📱",
        category: "Tablets"
      }
    ],
    "Fashion Forward": [
      {
        id: "f1",
        name: "Designer Dress",
        description: "Elegant evening dress perfect for special occasions",
        price: 159.99,
        image: "👗",
        category: "Dresses",
        popular: true
      },
      {
        id: "f2",
        name: "Casual Jeans",
        description: "Comfortable slim-fit denim jeans",
        price: 79.99,
        image: "👖",
        category: "Bottoms"
      },
      {
        id: "f3",
        name: "Designer Blazer",
        description: "Professional blazer for business occasions",
        price: 199.99,
        image: "🧥",
        category: "Outerwear",
        popular: true
      },
      {
        id: "f4",
        name: "Sneakers",
        description: "Trendy athletic shoes for everyday wear",
        price: 129.99,
        image: "👟",
        category: "Shoes"
      }
    ],
    "QuickMeds Pharmacy": [
      {
        id: "m1",
        name: "Multivitamins",
        description: "Daily essential vitamins and minerals",
        price: 24.99,
        image: "💊",
        category: "Vitamins",
        popular: true
      },
      {
        id: "m2",
        name: "Pain Relief",
        description: "Over-the-counter pain medication",
        price: 8.99,
        image: "💊",
        category: "Pain Relief"
      },
      {
        id: "m3",
        name: "First Aid Kit",
        description: "Complete emergency first aid supplies",
        price: 39.99,
        image: "🩹",
        category: "First Aid",
        popular: true
      },
      {
        id: "m4",
        name: "Thermometer",
        description: "Digital thermometer for accurate temperature readings",
        price: 19.99,
        image: "🌡️",
        category: "Medical Devices"
      }
    ]
  };

  const currentStore = storeData[storeName || ""];
  const currentMenu = menuItems[storeName || ""] || [];

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    toast({
      title: "Added to Cart",
      description: "Item has been added to your cart",
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, count) => total + count, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [itemId, count]) => {
      const item = currentMenu.find(item => item.id === itemId);
      return total + (item?.price || 0) * count;
    }, 0);
  };

  if (!currentStore) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
          <Button onClick={() => navigate('/delivery')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Delivery
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
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/delivery')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">{currentStore.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{currentStore.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{currentStore.deliveryTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>Delivery ${currentStore.deliveryFee}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              {getTotalItems() > 0 && (
                <Button size="sm" className="bg-wellness-primary hover:bg-wellness-primary/90">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({getTotalItems()}) - ${getTotalPrice().toFixed(2)}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Store Info */}
      <section className="py-6 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6">
            <div className="text-6xl">{currentStore.image}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{currentStore.name}</h2>
              <p className="text-muted-foreground mb-3">{currentStore.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span>{currentStore.category}</span>
                <span>•</span>
                <span>{currentStore.address}</span>
                <span>•</span>
                <span>{currentStore.phone}</span>
              </div>
              {currentStore.promo && (
                <Badge className="mt-2 bg-wellness-accent/10 text-wellness-accent border-wellness-accent/20">
                  {currentStore.promo}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Menu</h2>
          <div className="grid gap-6">
            {currentMenu.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-gradient-to-r from-card to-wellness-calm/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{item.image}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {item.popular && (
                          <Badge className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20">
                            Popular
                          </Badge>
                        )}
                        {item.vegetarian && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Vegetarian
                          </Badge>
                        )}
                        {item.spicy && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            Spicy
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mb-2">{item.description}</CardDescription>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-wellness-primary">
                          ${item.price}
                        </span>
                        <div className="flex items-center space-x-2">
                          {cart[item.id] > 0 && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {cart[item.id]}
                              </span>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            className="bg-wellness-primary hover:bg-wellness-primary/90"
                            onClick={() => addToCart(item.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="container mx-auto">
            <Button 
              size="lg" 
              className="w-full bg-wellness-primary hover:bg-wellness-primary/90"
              onClick={() => {
                const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
                  const item = currentMenu.find(item => item.id === itemId);
                  return {
                    id: itemId,
                    name: item?.name || "",
                    price: item?.price || 0,
                    quantity,
                    image: item?.image || ""
                  };
                });
                
                const subtotal = getTotalPrice();
                const deliveryFee = currentStore.deliveryFee;
                const tax = subtotal * 0.08; // 8% tax
                const total = subtotal + deliveryFee + tax;
                
                navigate('/order-checkout', {
                  state: {
                    cartItems,
                    storeInfo: {
                      name: currentStore.name,
                      deliveryFee: currentStore.deliveryFee,
                      deliveryTime: currentStore.deliveryTime,
                      address: currentStore.address
                    },
                    totals: {
                      subtotal,
                      deliveryFee,
                      tax,
                      total
                    }
                  }
                });
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Checkout - ${getTotalPrice().toFixed(2)} ({getTotalItems()} items)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreMenu;