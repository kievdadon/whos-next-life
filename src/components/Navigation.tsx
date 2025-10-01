import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Package, 
  ShoppingBag, 
  Wrench,
  Home,
  Users,
  FileText,
  PlusCircle,
  MessageSquare,
  Car,
  Store
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  priority?: boolean;
}

const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isApprovedDriver, setIsApprovedDriver] = useState(false);
  const [isApprovedBusiness, setIsApprovedBusiness] = useState(false);

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

      setIsApprovedDriver(!!driverData);
      setIsApprovedBusiness(!!businessData);
    } catch (error) {
      console.error('Error checking user approvals:', error);
    }
  };

  const baseNavItems: NavItem[] = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/wellness-chat", icon: MessageCircle, label: "Wellness AI" },
    { to: "/delivery", icon: Package, label: "Delivery" },
    { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
    { to: "/marketplace-chat", icon: MessageSquare, label: "Chat" },
    { to: "/sell-item", icon: PlusCircle, label: "Sell" },
    { to: "/gig-browse", icon: Wrench, label: "Gigs" },
    { to: "/family-chat", icon: Users, label: "Messaging" },
  ];

  // Add driver dashboard if user is approved driver
  const navItems: NavItem[] = [...baseNavItems];
  if (isApprovedDriver) {
    navItems.splice(1, 0, { 
      to: "/driver-dashboard", 
      icon: Car, 
      label: "Driver", 
      priority: true 
    });
  }
  if (isApprovedBusiness) {
    navItems.splice(isApprovedDriver ? 2 : 1, 0, { 
      to: "/business-dashboard", 
      icon: Store, 
      label: "Business", 
      priority: true 
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full flex-col h-auto py-3 px-2 ${
                  isActive 
                    ? 'text-wellness-primary bg-wellness-primary/10' 
                    : 'text-muted-foreground hover:text-wellness-primary hover:bg-wellness-primary/5'
                } ${
                  item.priority ? 'ring-2 ring-wellness-primary/30 bg-wellness-primary/5' : ''
                }`}
              >
                <item.icon className={`mb-1 ${item.priority ? 'h-6 w-6' : 'h-5 w-5'}`} />
                <span className={`${item.priority ? 'text-xs font-semibold' : 'text-xs'}`}>
                  {item.label}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;