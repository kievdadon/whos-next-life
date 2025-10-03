import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Shield, Star, Store, Car, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const { user, subscribed, subscriptionTier, hasApprovedBusiness, businessName, hasApprovedDriver, driverName } = useAuth();

  const getTierDisplay = (tier: string | null) => {
    switch (tier?.toLowerCase()) {
      case 'pro':
        return { emoji: '⭐', icon: Star, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'elite':
        return { emoji: '👑', icon: Crown, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'veteran':
        return { emoji: '🛡️', icon: Shield, color: 'bg-green-100 text-green-800 border-green-200' };
      default:
        return null;
    }
  };

  // Don't show header if user is not logged in
  if (!user) {
    return null;
  }

  const tierDisplay = getTierDisplay(subscriptionTier);

  return (
    <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-3">
      {/* Mission Control Dashboard Link */}
      <Link to="/mission-control">
        <Button variant="outline" size="sm" className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Mission Control
        </Button>
      </Link>

      {/* Driver Dashboard Link */}
      {hasApprovedDriver && (
        <Link to="/driver-dashboard">
          <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100">
            <Car className="mr-2 h-4 w-4" />
            {driverName ? `${driverName.split(' ')[0]} - Driver` : 'Driver Dashboard'}
          </Button>
        </Link>
      )}

      {/* Business Dashboard Link */}
      {hasApprovedBusiness && (
        <Link to="/business-dashboard">
          <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-800 hover:bg-green-100">
            <Store className="mr-2 h-4 w-4" />
            {businessName || 'Business Dashboard'}
          </Button>
        </Link>
      )}
      
      {/* Subscription Tier Badge */}
      {subscribed && subscriptionTier && tierDisplay && (
        <Badge className={`${tierDisplay.color} shadow-lg backdrop-blur-sm`}>
          <span className="mr-1 text-base">{tierDisplay.emoji}</span>
          <tierDisplay.icon className="mr-1 h-3 w-3" />
          {subscriptionTier.charAt(0).toUpperCase()}{subscriptionTier.slice(1)} Member
        </Badge>
      )}
    </header>
  );
};

export default Header;