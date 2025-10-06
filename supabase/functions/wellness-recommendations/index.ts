import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get recent mood scores (last 7 days)
    const { data: moodData } = await supabaseClient
      .from('wellness_chat_messages')
      .select('mood_score, created_at')
      .eq('user_id', user.id)
      .not('mood_score', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!moodData || moodData.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate average mood
    const avgMood = moodData.reduce((sum, m) => sum + (m.mood_score || 0), 0) / moodData.length;
    const recommendations = [];

    // Low mood recommendations (< 5)
    if (avgMood < 5) {
      // Mood-boosting products (wellness items, not just food)
      const { data: wellnessProducts } = await supabaseClient
        .from('products')
        .select('*, business_applications_safe!inner(*)')
        .eq('is_active', true)
        .in('category', ['Wellness', 'Self-Care', 'Aromatherapy', 'Personal Care', 'Health', 'Candles', 'Fragrances', 'ADHD Support', 'Mental Health'])
        .limit(3);

      if (wellnessProducts && wellnessProducts.length > 0) {
        recommendations.push({
          type: 'delivery',
          title: 'Mood-Boosting Items',
          description: 'Products to help you feel better',
          items: wellnessProducts,
          mood_context: 'low_mood'
        });
      }

      // Relaxation gigs
      const { data: relaxGigs } = await supabaseClient
        .from('gigs')
        .select('*')
        .eq('status', 'open')
        .in('category', ['Wellness', 'Home Services', 'Personal Care'])
        .limit(3);

      if (relaxGigs && relaxGigs.length > 0) {
        recommendations.push({
          type: 'gig',
          title: 'Self-Care Services',
          description: 'Take time for yourself',
          items: relaxGigs,
          mood_context: 'low_mood'
        });
      }
    }

    // High mood recommendations (> 7)
    if (avgMood > 7) {
      // Productivity gigs
      const { data: productivityGigs } = await supabaseClient
        .from('gigs')
        .select('*')
        .eq('status', 'open')
        .in('category', ['Professional Services', 'Tech', 'Creative'])
        .limit(3);

      if (productivityGigs && productivityGigs.length > 0) {
        recommendations.push({
          type: 'gig',
          title: 'New Opportunities',
          description: 'Your energy is high - tackle something new!',
          items: productivityGigs,
          mood_context: 'high_mood'
        });
      }

      // Fitness/wellness products
      const { data: wellnessProducts } = await supabaseClient
        .from('products')
        .select('*, business_applications_safe!inner(*)')
        .eq('is_active', true)
        .in('category', ['Fitness', 'Wellness', 'Sports'])
        .limit(3);

      if (wellnessProducts && wellnessProducts.length > 0) {
        recommendations.push({
          type: 'marketplace',
          title: 'Stay Active',
          description: 'Keep the momentum going',
          items: wellnessProducts,
          mood_context: 'high_mood'
        });
      }
    }

    // Store recommendations
    for (const rec of recommendations) {
      await supabaseClient
        .from('wellness_recommendations')
        .insert({
          user_id: user.id,
          recommendation_type: rec.type,
          mood_score: avgMood,
          recommendation_data: rec
        });
    }

    return new Response(JSON.stringify({ 
      recommendations,
      avgMood,
      moodTrend: moodData.length > 1 ? 
        (moodData[0].mood_score || 0) - (moodData[moodData.length - 1].mood_score || 0) : 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});