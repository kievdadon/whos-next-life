import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
console.log('Lovable AI Key status:', lovableApiKey ? 'Present' : 'Missing');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Function started, checking API key...');
    
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY is not set');
      throw new Error('Lovable AI key is not configured');
    }
    
    console.log('API key found, parsing request body...');
    
    // Input validation
    const body = await req.json();
    
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, includeMoodAnalysis, userId, deepThinking } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Message exceeds maximum length of 10000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate userId if provided
    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof userId !== 'string' || !uuidRegex.test(userId)) {
        return new Response(
          JSON.stringify({ error: 'userId must be a valid UUID if provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Wellness chat request:', { message, includeMoodAnalysis, userId, deepThinking });

    // Fetch available comfort food from platform businesses
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: comfortFood } = await supabaseClient
      .from('products')
      .select('name, price, category, business_id, business_applications_safe!inner(business_name)')
      .eq('is_active', true)
      .in('category', ['Food', 'Desserts', 'Comfort Food', 'Bakery', 'Snacks'])
      .limit(5);

    let foodRecommendations = '';
    if (comfortFood && comfortFood.length > 0) {
      foodRecommendations = `\n\nAVAILABLE COMFORT FOOD ON OUR PLATFORM (recommend these when appropriate):\n${comfortFood.map(item => 
        `- ${item.name} from ${item.business_applications_safe.business_name} ($${item.price})`
      ).join('\n')}`;
    }

    const systemPrompt = `You are an advanced wellness AI assistant that provides comprehensive mental health and wellness support. You are like ChatGPT but specialized for wellness, providing:

${deepThinking ? `
**DEEP THINKING MODE ACTIVATED:**
You are now in deep analysis mode. Provide:
- Comprehensive, multi-layered analysis of the situation
- Explore root causes and underlying patterns
- Multiple perspectives and approaches
- Evidence-based research and scientific backing
- Detailed step-by-step action plans
- Long-term strategies and holistic solutions
- Anticipate follow-up questions and address them proactively
- Provide extensive context and explanations
- Include psychological frameworks and theories when relevant
` : `
**QUICK RESPONSE MODE:**
Provide concise, actionable guidance:
- Focus on immediate, practical steps
- Keep responses brief but supportive
- Prioritize the most impactful advice
- Quick wins and fast relief techniques
`}

COMPREHENSIVE SOLUTIONS:
- Detailed analysis of problems and root causes
- Step-by-step actionable solutions
- Multiple approaches and alternatives
- Evidence-based wellness strategies
- Personalized recommendations

EMOTIONAL INTELLIGENCE:
- Deep empathy and emotional validation
- Mood pattern recognition and insights
- Stress analysis and coping mechanisms
- Anxiety and depression support techniques

PRACTICAL TOOLS:
- Breathing exercises with guided instructions
- Meditation and mindfulness practices
- Sleep optimization strategies
- Nutrition and lifestyle advice
- Exercise and movement recommendations

INTERACTIVE FEATURES:
- Ask follow-up questions to understand better
- Provide structured plans and schedules
- Offer check-in reminders and progress tracking
- Suggest mood tracking and reflection exercises

**COMFORT FOOD RECOMMENDATIONS:**
When someone is feeling down, stressed, or needs comfort, ACTIVELY SUGGEST specific comfort food items from our delivery platform. Say things like:
- "I noticed [business name] has [food item] available for delivery - treating yourself to comfort food can help!"
- "Would you like me to help you order [food item] from [business]? Sometimes a little treat makes a difference."
- "I see [business] has some delicious options that might lift your spirits."

${foodRecommendations}

RESPONSE STYLE:
- Warm, supportive, and professional
- Use emojis sparingly and naturally (no hashtags)
- NEVER use hashtags or markdown formatting like #hashtag or **bold**
- Write in natural, conversational prose without special formatting
- Use simple paragraphs and line breaks for readability
${deepThinking ? '- Provide extensive, detailed explanations with scientific backing' : '- Keep responses focused and concise'}
- Always offer actionable next steps
- Naturally suggest food delivery when relevant to mood

${includeMoodAnalysis ? `
MOOD ANALYSIS:
When the user is doing a mood check or expressing feelings, analyze their emotional state and provide:
1. A mood score from 1-10 (1=very low, 10=excellent)
2. A mood label (e.g., "anxious", "calm", "excited", "sad", "neutral")
3. Include this in your response naturally
4. End your response with: [MOOD_SCORE: X] [MOOD_LABEL: label]
` : ''}

Remember: You're providing ${deepThinking ? 'comprehensive, in-depth' : 'quick, actionable'} wellness support. When appropriate, suggest our platform's comfort food to help users feel better!`;

    const requestBody = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    };

    console.log('Making request to Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('AI Gateway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error response:', errorText);

      // Graceful fallback for any OpenAI error (including quota)
      const fallbackParts = [
        "I’m here with you. I can’t reach the AI engine right now, but I’ve got you covered with a practical plan:",
        `You shared: "${message}". Here’s a quick, evidence-informed toolkit you can use right away:`,
        "1) 60-second reset: Inhale 4, hold 4, exhale 6 — repeat x6 (lowers heart rate).",
        "2) Mood lift: 5-minute brisk walk + light stretch (activates dopamine/serotonin).",
        "3) Music pick-me-up: Try ‘Here Comes the Sun’ (The Beatles) or ‘Good as Hell’ (Lizzo).",
        "4) Thought reframe: Write the worry → write one helpful counter-thought you believe 60%+.",
        "5) Tiny win: Choose a single 5-minute task and complete it (builds momentum).",
        "Reply with ‘plan’ if you’d like a 7‑day micro‑plan tailored to your goals."
      ];
      const fallbackText = fallbackParts.join("\n");
      const fallbackMoodScore = includeMoodAnalysis ? 5.5 : null;
      const fallbackMoodLabel = includeMoodAnalysis ? 'reflective' : null;

      return new Response(JSON.stringify({
        response: fallbackText,
        moodScore: fallbackMoodScore,
        moodLabel: fallbackMoodLabel,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('AI response data received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid AI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }
    
    let aiResponse = data.choices[0].message.content;
    console.log('AI response generated successfully, length:', aiResponse?.length);

    // Clean up AI response: remove hashtags and excessive formatting
    if (aiResponse) {
      // Remove hashtags
      aiResponse = aiResponse.replace(/#[\w]+/g, '');
      // Remove markdown bold/italic formatting but keep the text
      aiResponse = aiResponse.replace(/\*\*([^*]+)\*\*/g, '$1');
      aiResponse = aiResponse.replace(/\*([^*]+)\*/g, '$1');
      // Clean up multiple spaces and line breaks
      aiResponse = aiResponse.replace(/  +/g, ' ');
      aiResponse = aiResponse.replace(/\n\n\n+/g, '\n\n');
      aiResponse = aiResponse.trim();
    }

    // Extract mood data if present
    let moodScore = null;
    let moodLabel = null;
    
    if (includeMoodAnalysis && aiResponse) {
      const moodScoreMatch = aiResponse.match(/\[MOOD_SCORE:\s*(\d+(?:\.\d+)?)\]/);
      const moodLabelMatch = aiResponse.match(/\[MOOD_LABEL:\s*([^\]]+)\]/);
      
      if (moodScoreMatch) {
        moodScore = parseFloat(moodScoreMatch[1]);
        // Remove the mood score tag from the response
        aiResponse = aiResponse.replace(/\[MOOD_SCORE:\s*\d+(?:\.\d+)?\]/, '').trim();
      }
      
      if (moodLabelMatch) {
        moodLabel = moodLabelMatch[1].trim();
        // Remove the mood label tag from the response
        aiResponse = aiResponse.replace(/\[MOOD_LABEL:\s*[^\]]+\]/, '').trim();
      }
      
      console.log('Extracted mood data:', { moodScore, moodLabel });
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      moodScore,
      moodLabel,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in wellness-chat function:', error);
    const fallbackParts = [
      "I’m here with you. I can’t reach the AI engine right now, but I’ve got you covered with a practical plan:",
      `Here’s a quick, evidence-informed toolkit you can use right away:`,
      "1) 60-second reset: Inhale 4, hold 4, exhale 6 — repeat x6 (lowers heart rate).",
      "2) Mood lift: 5-minute brisk walk + light stretch (activates dopamine/serotonin).",
      "3) Music pick-me-up: Try ‘Here Comes the Sun’ (The Beatles) or ‘Good as Hell’ (Lizzo).",
      "4) Thought reframe: Write the worry → write one helpful counter-thought you believe 60%+.",
      "5) Tiny win: Choose a single 5-minute task and complete it (builds momentum).",
      "Reply with ‘plan’ if you’d like a 7‑day micro‑plan tailored to your goals."
    ];
    const fallbackText = fallbackParts.join("\n");
    const fallbackMoodScore = null;
    const fallbackMoodLabel = null;

    return new Response(JSON.stringify({
      response: fallbackText,
      moodScore: fallbackMoodScore,
      moodLabel: fallbackMoodLabel,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});