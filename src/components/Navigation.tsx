import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Package, 
  ShoppingBag, 
  Wrench,
  Home,
  Users,
  FileText,
  PlusCircle
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/wellness-chat", icon: MessageCircle, label: "Wellness AI" },
    { to: "/delivery", icon: Package, label: "Delivery" },
    { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
    { to: "/sell-item", icon: PlusCircle, label: "Sell" },
    { to: "/gig-browse", icon: Wrench, label: "Gigs" },
    { to: "/family-chat", icon: Users, label: "Family" },
  ];

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
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;