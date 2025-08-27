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
  DollarSign
} from "lucide-react";
import heroImage from "@/assets/hero-wellness.jpg";

const Index = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Wellness AI Chat",
      description: "AI-powered wellness conversations with emotional check-ins",
      color: "wellness-primary",
      emoji: "💬"
    },
    {
      icon: Package,
      title: "WHOSENXT DELIVERY",
      description: "Delivery system with voice confirmation for clothing, food, appliances & devices",
      color: "wellness-secondary",
      emoji: "📦"
    },
    {
      icon: Briefcase,
      title: "WHOSENXT JOB",
      description: "Worker dashboard with integrated payouts system",
      color: "wellness-accent",
      emoji: "🧰"
    },
    {
      icon: ShoppingBag,
      title: "WHOSENXT MARKETPLACE",
      description: "Buy and sell furniture, clothes, and more",
      color: "wellness-warm",
      emoji: "🛍️"
    },
    {
      icon: Wrench,
      title: "WHOSENXT GIG",
      description: "Post or apply for help gigs in your community",
      color: "wellness-primary",
      emoji: "🛠️"
    },
    {
      icon: Users,
      title: "Family Group Chat",
      description: "Stay connected with real-time location sharing",
      color: "wellness-secondary",
      emoji: "👨‍👩‍👧"
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
                <Button size="lg" className="bg-wellness-primary hover:bg-wellness-primary/90 shadow-lg">
                  Get Started
                  <Heart className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="border-wellness-primary/20 hover:bg-wellness-primary/5">
                  Learn More
                </Button>
              </div>
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

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Six Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern life - wellness, work, shopping, and family connection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-wellness-calm/30">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-2xl">{feature.emoji}</span>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
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
