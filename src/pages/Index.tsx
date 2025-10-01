
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Package, 
  Briefcase, 
  ShoppingBag, 
  Wrench, 
  Users,
  Heart,
  Smartphone,
  MapPin,
  DollarSign,
  LogIn,
  Crown,
  LogOut,
  Handshake,
  Car,
  Store,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-community.avif";

const Index = () => {
  const { user, signOut, subscribed, subscriptionTier, hasApprovedBusiness } = useAuth();
  const [isApprovedDriver, setIsApprovedDriver] = useState(false);
  const [isApprovedBusiness, setIsApprovedBusiness] = useState(false);
  const [dashboardLinks, setDashboardLinks] = useState<Array<{
    title: string;
    description: string;
    link: string;
    icon: any;
    color: string;
  }>>([]);

  useEffect(() => {
    if (user?.email) {
      checkUserApprovals();
    }
  }, [user]);

  const checkUserApprovals = async () => {
    if (!user?.email) return;

    try {
      // Check if user is an approved driver (get most recent one)
      const { data: driverApplications } = await supabase
        .from('driver_applications')
        .select('status')
        .eq('email', user.email)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const driverData = driverApplications?.[0];

      // Check if user is an approved business (get most recent one)
      const { data: businessApplications } = await supabase
        .from('business_applications')
        .select('status')
        .eq('email', user.email)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      const businessData = businessApplications?.[0];

      const approvedDriver = !!driverData;
      const approvedBusiness = !!businessData;

      setIsApprovedDriver(approvedDriver);
      setIsApprovedBusiness(approvedBusiness);

      // Create dashboard links array
      const links = [];
      if (approvedDriver) {
        links.push({
          title: "Driver Dashboard",
          description: "Manage deliveries, track earnings, and clock in/out",
          link: "/driver-dashboard",
          icon: Car,
          color: "wellness-secondary"
        });
      }
      if (approvedBusiness) {
        links.push({
          title: "Business Dashboard",
          description: "Manage products, inventory, and orders",
          link: "/business-dashboard", 
          icon: Store,
          color: "wellness-primary"
        });
      }
      setDashboardLinks(links);
    } catch (error) {
      console.error('Error checking user approvals:', error);
    }
  };
  const features = [
    {
      icon: MessageCircle,
      title: "Wellness AI Chat",
      description: "AI-powered wellness conversations with emotional check-ins",
      color: "wellness-primary",
      emoji: "💬",
      link: "/wellness-chat"
    },
    {
      icon: Package,
      title: "WHOSENXT DELIVERY",
      description: "Delivery system with voice confirmation for clothing, food, appliances & devices",
      color: "wellness-secondary",
      emoji: "📦",
      link: "/delivery"
    },
    {
      icon: Briefcase,
      title: "WHOSENXT DRIVER APPLICATION",
      description: "Worker dashboard with integrated payouts system",
      color: "wellness-accent",
      emoji: "🧰",
      link: "/driver-application"
    },
    {
      icon: ShoppingBag,
      title: "WHOSENXT MARKETPLACE",
      description: "Buy and sell furniture, clothes, and more",
      color: "wellness-warm",
      emoji: "🛍️",
      link: "/marketplace"
    },
    {
      icon: Wrench,
      title: "WHOSENXT GIG",
      description: "Post or apply for help gigs in your community",
      color: "wellness-primary",
      emoji: "🛠️",
      link: "/gig-browse"
    },
    {
      icon: Users,
      title: "Messaging",
      description: "Stay connected with real-time location sharing",
      color: "wellness-secondary",
      emoji: "👨‍👩‍👧",
      link: "/family-chat"
    },
    {
      icon: Handshake,
      title: "Brand Partnership",
      description: "Represent your brand and grow with our community",
      color: "wellness-primary",
      emoji: "🤝",
      link: "/brand-partnership"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-wellness-calm">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-wellness-primary/10 to-wellness-secondary/10" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20">
                  Tech-Wellness Hybrid Platform
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-wellness-primary to-wellness-secondary bg-clip-text text-transparent">
                  WHOSENXT
                </h1>
                <p className="text-xl text-muted-foreground max-w-md">
                  The all-in-one platform connecting wellness, work, and community in perfect harmony.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <>
                    <Button asChild size="lg" className="bg-wellness-primary hover:bg-wellness-primary/90 shadow-lg">
                      <Link to="/subscription-plans">
                        <Crown className="mr-2 h-4 w-4" />
                        {subscribed ? `Manage ${subscriptionTier?.charAt(0).toUpperCase()}${subscriptionTier?.slice(1)} Plan` : 'Subscribe Now'}
                      </Link>
                    </Button>
                    <Button 
                      onClick={signOut}
                      variant="outline" 
                      size="lg" 
                      className="border-wellness-primary/20 hover:bg-wellness-primary/5"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="bg-wellness-primary hover:bg-wellness-primary/90 shadow-lg">
                      <Link to="/auth">
                        <LogIn className="mr-2 h-4 w-4" />
                        Get Started
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                      <Link to="/subscription-plans">
                        <Crown className="mr-2 h-4 w-4" />
                        View Plans
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              {subscribed && (
                <Badge className="bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20 text-sm">
                  ✨ {subscriptionTier?.charAt(0).toUpperCase()}{subscriptionTier?.slice(1)} Member - Enjoy your delivery benefits!
                </Badge>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-wellness-primary/20 to-wellness-secondary/20 rounded-3xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="WHOSENXT Platform" 
                className="relative z-10 w-full rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Dashboard Links for Approved Users */}
      {(isApprovedDriver || isApprovedBusiness) && (
        <section className="py-12 bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Your Dashboards</h2>
              <p className="text-lg text-muted-foreground">
                Access your approved business tools and driver features
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {dashboardLinks.map((dashboard, index) => (
                <Link key={index} to={dashboard.link}>
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-wellness-calm/30 cursor-pointer h-full">
                    <CardHeader className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-4 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                          <dashboard.icon className="h-8 w-8 text-primary" />
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Approved Access
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl group-hover:text-wellness-primary transition-colors">
                        {dashboard.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed mb-4">
                        {dashboard.description}
                      </CardDescription>
                      <Button className="w-full bg-wellness-primary hover:bg-wellness-primary/90">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Open Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Seven Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern life - wellness, work, shopping, and family connection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link key={index} to={feature.link} className={feature.link === "#" ? "pointer-events-none" : ""}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-wellness-calm/30 cursor-pointer h-full">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-2xl">{feature.emoji}</span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-wellness-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                    {feature.link !== "#" && (
                      <Button variant="outline" size="sm" className="mt-4 border-wellness-primary/20 hover:bg-wellness-primary/5">
                        Explore →
                      </Button>
                    )}
                    {feature.link === "#" && (
                      <Badge variant="outline" className="mt-4 border-muted-foreground/20 text-muted-foreground">
                        Coming Soon
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-wellness-primary/5 to-wellness-secondary/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-wellness-primary">24/7</div>
              <div className="text-muted-foreground">AI Wellness Support</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-wellness-secondary">500+</div>
              <div className="text-muted-foreground">Local Businesses</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-wellness-accent">10k+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-wellness-warm">99%</div>
              <div className="text-muted-foreground">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold">Ready to Transform Your Life?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands who've already discovered the perfect balance of technology and wellness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-wellness-primary hover:bg-wellness-primary/90 shadow-lg">
                <Smartphone className="mr-2 h-4 w-4" />
                Download App
              </Button>
              <Button variant="outline" size="lg" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                <MapPin className="mr-2 h-4 w-4" />
                Find Local Services
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
