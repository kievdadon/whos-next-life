import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Crown, Shield, Star } from "lucide-react";

const Header = () => {
  const { user, subscribed, subscriptionTier } = useAuth();

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

  // Only show header if user is logged in and subscribed
  if (!user || !subscribed || !subscriptionTier) {
    return null;
  }

  const tierDisplay = getTierDisplay(subscriptionTier);

  if (!tierDisplay) {
    return null;
  }

  return (
    <header className="fixed top-0 right-0 z-50 p-4">
      <Badge className={`${tierDisplay.color} shadow-lg backdrop-blur-sm`}>
        <span className="mr-1 text-base">{tierDisplay.emoji}</span>
        <tierDisplay.icon className="mr-1 h-3 w-3" />
        {subscriptionTier.charAt(0).toUpperCase()}{subscriptionTier.slice(1)} Member
      </Badge>
    </header>
  );
};

export default Header;