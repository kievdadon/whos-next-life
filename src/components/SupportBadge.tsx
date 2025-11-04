import { Badge } from "@/components/ui/badge";
import { Crown, Star, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const SupportBadge = () => {
  const { benefits, subscriptionTier } = useSubscription();

  if (benefits.supportTier === 'standard') {
    return null;
  }

  const config = {
    priority: {
      icon: Crown,
      label: 'Priority Support',
      className: 'bg-wellness-secondary/10 text-wellness-secondary border-wellness-secondary/20'
    },
    vip: {
      icon: Shield,
      label: 'VIP Support',
      className: 'bg-wellness-primary/10 text-wellness-primary border-wellness-primary/20'
    }
  };

  const supportConfig = config[benefits.supportTier as 'priority' | 'vip'];
  const Icon = supportConfig.icon;

  return (
    <Badge className={supportConfig.className}>
      <Icon className="mr-1 h-3 w-3" />
      {supportConfig.label}
    </Badge>
  );
};
