import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONTENT-MODERATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Content moderation function started");

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { content, contentType, userEmail } = await req.json();
    
    if (!content || !contentType || !userEmail) {
      throw new Error("Missing required fields: content, contentType, userEmail");
    }

    logStep("Moderating content", { contentType, userEmail, contentLength: content.length });

    // Check if user is already banned
    const { data: isBanned } = await supabaseClient
      .rpc('is_user_banned', { _user_email: userEmail, _ban_type: 'platform_access' });

    if (isBanned) {
      logStep("User is banned", { userEmail });
      return new Response(JSON.stringify({ 
        flagged: true, 
        banned: true,
        message: "Your account has been suspended for violating community guidelines."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Use OpenAI moderation API
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
      }),
    });

    if (!moderationResponse.ok) {
      throw new Error(`OpenAI moderation API error: ${moderationResponse.statusText}`);
    }

    const moderationData = await moderationResponse.json();
    const result = moderationData.results[0];

    logStep("Moderation result", { flagged: result.flagged, categories: result.categories });

    if (result.flagged) {
      // Determine violation type and severity
      const categories = result.categories;
      const categoryScores = result.category_scores;
      
      let violationType = 'inappropriate_content';
      let severity = 'low';
      
      if (categories.hate || categories['hate/threatening']) {
        violationType = 'hate_speech';
        severity = 'critical';
      } else if (categories.harassment || categories['harassment/threatening']) {
        violationType = 'harassment';
        severity = 'high';
      } else if (categories.sexual || categories['sexual/minors']) {
        violationType = 'inappropriate_content';
        severity = 'high';
      } else if (categories.violence || categories['violence/graphic']) {
        violationType = 'inappropriate_content';
        severity = 'medium';
      }

      // Get user's warning count
      const { data: warningCount } = await supabaseClient
        .rpc('get_user_warning_count', { _user_email: userEmail });

      // Determine action based on severity and warning history
      let actionTaken = 'warning';
      let banDuration = null;
      
      if (severity === 'critical' || warningCount >= 3) {
        actionTaken = 'permanent_ban';
      } else if (severity === 'high' || warningCount >= 2) {
        actionTaken = 'temporary_ban';
        banDuration = 7; // 7 days
      } else if (warningCount >= 1) {
        actionTaken = 'temporary_ban';
        banDuration = 3; // 3 days
      }

      // Log the violation
      const { data: violation, error: violationError } = await supabaseClient
        .from('community_violations')
        .insert({
          user_email: userEmail,
          violation_type: violationType,
          content_type: contentType,
          flagged_content: content.substring(0, 1000), // Store first 1000 chars
          severity,
          action_taken: actionTaken,
          moderator_notes: `AI detected: ${Object.keys(categories).filter(k => categories[k]).join(', ')}`
        })
        .select()
        .single();

      if (violationError) {
        logStep("Error logging violation", violationError);
      }

      // Take action based on severity
      if (actionTaken === 'warning') {
        await supabaseClient
          .from('user_warnings')
          .insert({
            user_email: userEmail,
            warning_reason: violationType,
            warning_message: `Your ${contentType} contains inappropriate content that violates our community guidelines. Please review our terms of service and ensure all future submissions are professional and respectful.`,
            issued_by: 'system',
            violation_id: violation?.id
          });
      } else if (actionTaken.includes('ban')) {
        const expiresAt = banDuration ? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000) : null;
        
        await supabaseClient
          .from('user_bans')
          .insert({
            user_email: userEmail,
            ban_type: 'platform_access',
            ban_reason: `${violationType} violation in ${contentType}`,
            banned_by: 'system',
            ban_duration_days: banDuration,
            expires_at: expiresAt?.toISOString(),
            violation_id: violation?.id
          });
      }

      logStep("Action taken", { actionTaken, userEmail, violationType });

      return new Response(JSON.stringify({ 
        flagged: true,
        violationType,
        severity,
        actionTaken,
        message: actionTaken === 'warning' 
          ? "Your content contains inappropriate material. Please revise and resubmit."
          : "Your account has been suspended for violating community guidelines.",
        banDuration
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: actionTaken === 'warning' ? 400 : 403,
      });
    }

    logStep("Content approved", { userEmail, contentType });

    return new Response(JSON.stringify({ 
      flagged: false,
      message: "Content approved"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in content-moderation", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});