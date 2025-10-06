import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  MessageCircle,
  Package,
  ShoppingBag,
  MessageSquare,
  PlusCircle,
  Wrench,
  Users,
  Car,
  Store,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  priority?: boolean;
}

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
      const { data: driverApplications } = await supabase
        .from("driver_applications")
        .select("status")
        .eq("email", user.email)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1);

      const { data: businessApplications } = await supabase
        .from("business_applications")
        .select("status")
        .eq("email", user.email)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1);

      setIsApprovedDriver(!!driverApplications?.[0]);
      setIsApprovedBusiness(!!businessApplications?.[0]);
    } catch (error) {
      console.error("Error checking user approvals:", error);
    }
  };

  const baseNavItems: NavItem[] = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/mission-control", icon: LayoutDashboard, label: "Dashboard", priority: true },
    { to: "/wellness-chat", icon: MessageCircle, label: "Wellness AI" },
    { to: "/delivery", icon: Package, label: "Delivery" },
    { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
    { to: "/marketplace-chat", icon: MessageSquare, label: "Chat" },
    { to: "/sell-item", icon: PlusCircle, label: "Sell" },
    { to: "/gig-browse", icon: Wrench, label: "Gigs" },
    { to: "/family-chat", icon: Users, label: "Messaging" },
  ];

  const navItems: NavItem[] = [...baseNavItems];
  if (isApprovedDriver) {
    navItems.splice(1, 0, {
      to: "/driver-dashboard",
      icon: Car,
      label: "Driver Dashboard",
      priority: true,
    });
  }
  if (isApprovedBusiness) {
    navItems.splice(isApprovedDriver ? 2 : 1, 0, {
      to: "/business-dashboard",
      icon: Store,
      label: "Business Dashboard",
      priority: true,
    });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden hover:bg-wellness-primary/10"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-card">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.to)
                  ? "bg-wellness-primary/10 text-wellness-primary font-medium"
                  : "text-muted-foreground hover:bg-wellness-primary/5 hover:text-wellness-primary"
              } ${item.priority ? "ring-1 ring-wellness-primary/30" : ""}`}
            >
              <item.icon className={`${item.priority ? "h-5 w-5" : "h-4 w-4"}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
