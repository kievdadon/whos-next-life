import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Globe, ExternalLink, ShoppingBag } from 'lucide-react';

interface WebsiteBusinessCardProps {
  business: {
    id: string;
    name: string;
    category: string;
    description: string;
    rating: number;
    location: string;
    discount: number;
    image: string;
    hours: string;
    isBrandPartner: boolean;
    hasPhysicalLocation: boolean;
  };
}

const WebsiteBusinessCard = ({ business }: WebsiteBusinessCardProps) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-wellness-secondary/20 bg-gradient-to-br from-card to-wellness-calm/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {business.name}
              <Globe className="h-4 w-4 text-wellness-secondary" />
            </CardTitle>
            <CardDescription>{business.description}</CardDescription>
          </div>
          <Badge className="bg-wellness-warm/10 text-wellness-warm border-wellness-warm/20">
            Online Store
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{business.rating.toFixed(1)}</span>
          <span className="text-wellness-secondary">• Online Marketplace</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{business.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Available 24/7 Online</span>
        </div>

        <div className="bg-gradient-to-r from-wellness-secondary/5 to-wellness-warm/5 p-4 rounded-lg border border-wellness-secondary/10">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="h-4 w-4 text-wellness-secondary" />
            <span className="font-medium text-sm">Visit Website Store</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Browse their full catalog, custom services, and exclusive online offerings
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-card/50 p-2 rounded text-center">Custom Orders</div>
            <div className="bg-card/50 p-2 rounded text-center">Online Catalog</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button className="w-full bg-wellness-secondary hover:bg-wellness-secondary/90">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Website Store
          </Button>
          <Button variant="outline" className="w-full border-wellness-secondary/20">
            Contact Business
          </Button>
        </div>

        {business.discount > 0 && (
          <Badge className="w-full justify-center bg-wellness-secondary/10 text-wellness-secondary border-wellness-secondary/20">
            {business.discount}% off online orders
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default WebsiteBusinessCard;