import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  business: {
    business_name: string;
    id: string;
  };
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  items: Product[];
  mood_context: 'low_mood' | 'high_mood';
}

interface WellnessRecommendationsResponse {
  recommendations: Recommendation[];
  avgMood: number;
  moodTrend: number;
}

export const WellnessProductRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [avgMood, setAvgMood] = useState<number | null>(null);
  const [moodTrend, setMoodTrend] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wellness-recommendations', {
        body: {}
      });

      if (error) throw error;

      if (data) {
        const typedData = data as WellnessRecommendationsResponse;
        setRecommendations(typedData.recommendations || []);
        setAvgMood(typedData.avgMood);
        setMoodTrend(typedData.moodTrend);
      }
    } catch (error) {
      console.error('Error loading wellness recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopProduct = (productId: string, businessId: string) => {
    navigate(`/product/${productId}`, { state: { businessId } });
  };

  const getMoodIcon = () => {
    if (avgMood === null) return null;
    if (avgMood < 5) return <TrendingDown className="h-5 w-5 text-orange-500" />;
    if (avgMood > 7) return <TrendingUp className="h-5 w-5 text-green-500" />;
    return <Heart className="h-5 w-5 text-wellness-primary" />;
  };

  const getMoodText = () => {
    if (avgMood === null) return "Track your mood to get recommendations";
    if (avgMood < 5) return "We've selected items to help boost your mood";
    if (avgMood > 7) return "Keep the positive momentum going!";
    return "Balanced mood - explore what fits";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-wellness-primary" />
            <span>Loading wellness recommendations...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-wellness-primary" />
            <span>Wellness Shopping</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Share more about your mood in the wellness chat to get personalized product recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mood Context Header */}
      {avgMood !== null && (
        <Card className="bg-gradient-to-r from-wellness-primary/10 to-wellness-secondary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getMoodIcon()}
                <div>
                  <p className="font-medium">{getMoodText()}</p>
                  <p className="text-sm text-muted-foreground">
                    Based on your recent mood: {avgMood.toFixed(1)}/10
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-wellness-primary/20">
                {moodTrend > 0 ? '📈 Improving' : moodTrend < 0 ? '📉 Needs care' : '➡️ Stable'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.map((rec, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-wellness-primary" />
              <span>{rec.title}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{rec.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {rec.items.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-4xl">
                      {product.image_url || '🎁'}
                    </div>
                    <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {product.business.business_name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-wellness-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleShopProduct(product.id, product.business.id)}
                        className="bg-wellness-primary hover:bg-wellness-primary/90"
                      >
                        Shop
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={loadRecommendations}
      >
        Refresh Recommendations
      </Button>
    </div>
  );
};
