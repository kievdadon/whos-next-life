import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Truck } from 'lucide-react';

interface DeliveryBusinessCardProps {
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

const DeliveryBusinessCard = ({ business }: DeliveryBusinessCardProps) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-wellness-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {business.name}
              <Truck className="h-4 w-4 text-wellness-primary" />
            </CardTitle>
            <CardDescription>{business.description}</CardDescription>
          </div>
          {business.discount > 0 && (
            <Badge className="bg-wellness-secondary text-white">
              {business.discount}% off
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{business.rating.toFixed(1)}</span>
          <span className="text-wellness-primary">• Delivery Available</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{business.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{business.hours}</span>
        </div>

        <div className="bg-wellness-calm/30 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Available for delivery:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-card p-2 rounded">🍕 Food Items</div>
            <div className="bg-card p-2 rounded">📱 Electronics</div>
            <div className="bg-card p-2 rounded">👕 Clothing</div>
            <div className="bg-card p-2 rounded">💊 Pharmacy</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button className="w-full bg-wellness-primary hover:bg-wellness-primary/90">
            Order for Delivery
          </Button>
          <Button variant="outline" className="w-full">
            View Store Menu
          </Button>
        </div>
        
        {business.isBrandPartner && (
          <Badge className="w-full justify-center bg-wellness-accent/10 text-wellness-accent border-wellness-accent/20">
            Official Brand Partner
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryBusinessCard;