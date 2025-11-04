import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionBenefits {
  discountPercentage: number;
  freeDeliveryDays: number;
  supportTier: 'standard' | 'priority' | 'vip';
  hasEarlyGigAccess: boolean;
  hasStoreTools: boolean;
  hasAnalytics: boolean;
  hasAccountManager: boolean;
  gigNotificationPriority: 'basic' | 'priority' | 'instant';
}

export const useSubscription = () => {
  const { subscribed, subscriptionTier } = useAuth();

  const getBenefits = (): SubscriptionBenefits => {
    if (!subscribed || !subscriptionTier) {
      return {
        discountPercentage: 0,
        freeDeliveryDays: 0,
        supportTier: 'standard',
        hasEarlyGigAccess: false,
        hasStoreTools: false,
        hasAnalytics: false,
        hasAccountManager: false,
        gigNotificationPriority: 'basic'
      };
    }

    switch (subscriptionTier) {
      case 'pro':
        return {
          discountPercentage: 10,
          freeDeliveryDays: 2,
          supportTier: 'standard',
          hasEarlyGigAccess: false,
          hasStoreTools: false,
          hasAnalytics: false,
          hasAccountManager: false,
          gigNotificationPriority: 'basic'
        };
      case 'elite':
        return {
          discountPercentage: 20,
          freeDeliveryDays: 4,
          supportTier: 'priority',
          hasEarlyGigAccess: true,
          hasStoreTools: true,
          hasAnalytics: false,
          hasAccountManager: false,
          gigNotificationPriority: 'priority'
        };
      case 'veteran':
        return {
          discountPercentage: 30,
          freeDeliveryDays: 7,
          supportTier: 'vip',
          hasEarlyGigAccess: true,
          hasStoreTools: true,
          hasAnalytics: true,
          hasAccountManager: false,
          gigNotificationPriority: 'instant'
        };
      default:
        return {
          discountPercentage: 0,
          freeDeliveryDays: 0,
          supportTier: 'standard',
          hasEarlyGigAccess: false,
          hasStoreTools: false,
          hasAnalytics: false,
          hasAccountManager: false,
          gigNotificationPriority: 'basic'
        };
    }
  };

  const applyDiscount = (price: number, category?: string): number => {
    const benefits = getBenefits();
    
    // Only apply discount to clothing and accessories
    const discountableCategories = ['clothing', 'accessories', 'fashion'];
    if (category && !discountableCategories.some(cat => 
      category.toLowerCase().includes(cat)
    )) {
      return price;
    }

    const discount = price * (benefits.discountPercentage / 100);
    return price - discount;
  };

  const calculateSavings = (price: number, category?: string): number => {
    const benefits = getBenefits();
    
    const discountableCategories = ['clothing', 'accessories', 'fashion'];
    if (category && !discountableCategories.some(cat => 
      category.toLowerCase().includes(cat)
    )) {
      return 0;
    }

    return price * (benefits.discountPercentage / 100);
  };

  return {
    subscribed,
    subscriptionTier,
    benefits: getBenefits(),
    applyDiscount,
    calculateSavings
  };
};
