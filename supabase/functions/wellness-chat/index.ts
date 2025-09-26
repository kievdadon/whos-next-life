import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
console.log('OpenAI API Key status:', openAIApiKey ? 'Present' : 'Missing');

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
    
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY is not set');
      throw new Error('OpenAI API key is not configured');
    }
    
    console.log('API key found, parsing request body...');
    const { message, includeMoodAnalysis, userId } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Wellness chat request:', { message, includeMoodAnalysis, userId });

    const systemPrompt = `You are an advanced wellness AI assistant that provides comprehensive mental health and wellness support. You are like ChatGPT but specialized for wellness, providing:

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

RESPONSE STYLE:
- Warm, supportive, and professional
- Use emojis appropriately for emotional connection
- Provide detailed explanations like ChatGPT
- Include scientific backing when relevant
- Always offer actionable next steps

${includeMoodAnalysis ? `
MOOD ANALYSIS:
When the user is doing a mood check or expressing feelings, analyze their emotional state and provide:
1. A mood score from 1-10 (1=very low, 10=excellent)
2. A mood label (e.g., "anxious", "calm", "excited", "sad", "neutral")
3. Include this in your response naturally
4. End your response with: [MOOD_SCORE: X] [MOOD_LABEL: label]
` : ''}

Remember: You're not just giving quick tips - you're providing comprehensive, ChatGPT-level responses focused on wellness and mental health solutions.`;

    const requestBody = {
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_completion_tokens: 800,
    };

    console.log('Making request to OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);

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
    console.log('OpenAI response data received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }
    
    let aiResponse = data.choices[0].message.content;
    console.log('AI response generated successfully, length:', aiResponse?.length);

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