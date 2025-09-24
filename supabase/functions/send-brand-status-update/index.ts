import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  email: string;
  companyName: string;
  contactName: string;
  status: 'approved' | 'rejected';
  messageType?: 'exciting' | 'sincere';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let email: string, companyName: string, contactName: string, status: 'approved' | 'rejected', messageType: 'exciting' | 'sincere' = 'sincere';

    if (req.method === "GET") {
      // Extract query parameters for email link clicks
      const url = new URL(req.url);
      email = url.searchParams.get("email") || "";
      companyName = url.searchParams.get("companyName") || "";
      contactName = url.searchParams.get("contactName") || "";
      status = (url.searchParams.get("status") as 'approved' | 'rejected') || 'rejected';
      messageType = (url.searchParams.get("messageType") as 'exciting' | 'sincere') || 'sincere';
    } else {
      // Parse JSON body for POST requests
      const body: StatusUpdateRequest = await req.json();
      email = body.email;
      companyName = body.companyName;
      contactName = body.contactName;
      status = body.status;
      messageType = body.messageType || 'sincere';
    }

    console.log(`Processing brand partnership ${status} for ${companyName} (${email}) with ${messageType} tone`);

    // Update database if business_applications table exists
    try {
      const { error: updateError } = await supabase
        .from('business_applications')
        .update({ 
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('email', email)
        .eq('business_name', companyName);

      if (updateError) {
        console.log('Note: Could not update database (table may not exist):', updateError.message);
      }
    } catch (dbError) {
      console.log('Database update skipped:', dbError);
    }

    // Generate email content based on status and message type
    let emailContent = '';
    let subject = '';

    if (status === 'approved') {
      subject = messageType === 'exciting' 
        ? `🎉 WELCOME TO THE WHOSENXT FAMILY! Partnership Approved`
        : `Partnership Application Approved - ${companyName}`;

      if (messageType === 'exciting') {
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; border-radius: 12px; overflow: hidden;">
            <div style="background: rgba(255,255,255,0.1); padding: 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.2);">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎉 CONGRATULATIONS!</h1>
              <p style="color: #f0f9ff; font-size: 18px; margin: 10px 0 0 0;">You're officially part of the WHOSENXT family!</p>
            </div>
            
            <div style="background: white; padding: 40px;">
              <h2 style="color: #667eea; margin-top: 0;">Hi ${contactName}! 🚀</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                We are <strong>THRILLED</strong> to welcome <strong>${companyName}</strong> as our newest brand partner! Your application blew us away, and we can't wait to see the amazing things we'll accomplish together.
              </p>
              
              <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
                <h3 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 20px;">🌟 What happens next?</h3>
                <ul style="text-align: left; color: #7c3aed; font-weight: 500; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Our partnership team will contact you within 24 hours</li>
                  <li style="margin-bottom: 8px;">We'll walk you through our exclusive onboarding process</li>
                  <li style="margin-bottom: 8px;">You'll get access to our premium partner portal</li>
                  <li>Start reaching thousands of new customers immediately!</li>
                </ul>
              </div>
              
              <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="color: #15803d; font-weight: bold; margin: 0; font-size: 16px;">
                  🎯 Welcome bonus: Get 30% off your first month of premium features!
                </p>
              </div>
              
              <p style="font-size: 16px; color: #374151;">
                This is just the beginning of an incredible journey. We're here to support your growth every step of the way!
              </p>
              
              <p style="color: #667eea; font-weight: bold; font-size: 18px;">
                Welcome to the team! 🎊
              </p>
              
              <p>The WHOSENXT Partnership Team</p>
            </div>
          </div>
        `;
      } else {
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">
              Partnership Application Approved
            </h1>
            
            <p>Dear ${contactName},</p>
            
            <p>We are pleased to inform you that your brand partnership application for <strong>${companyName}</strong> has been approved.</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 25px 0;">
              <h3 style="color: #059669; margin-top: 0;">Next Steps</h3>
              <ul style="color: #065f46; margin: 0;">
                <li>Our partnership team will contact you within 2-3 business days</li>
                <li>We will discuss partnership terms and onboarding process</li>
                <li>You will receive access to our partner portal and resources</li>
                <li>We'll help you get started with our platform</li>
              </ul>
            </div>
            
            <p>We look forward to a successful partnership and supporting your business growth.</p>
            
            <p>Best regards,<br>
            The WHOSENXT Partnership Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
          </div>
        `;
      }
    } else {
      subject = `Brand Partnership Application Update - ${companyName}`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            Brand Partnership Application Update
          </h1>
          
          <p>Dear ${contactName},</p>
          
          <p>Thank you for your interest in partnering with WHOSENXT and for submitting your brand partnership application for <strong>${companyName}</strong>.</p>
          
          <p>I'm sorry to inform you that after careful review, we will not be accepting your partnership application at this time. This decision was not made lightly, and we genuinely appreciate the time and effort you put into your submission.</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Why this decision was made:</h3>
            <p style="color: #991b1b; margin: 0;">
              While your application showed merit, we are currently focused on partnerships that align more closely with our immediate strategic goals and target market segments.
            </p>
          </div>
          
          <p>We encourage you to continue building your brand and may consider future applications as our partnership criteria evolve.</p>
          
          <p>We wish you all the best in your business endeavors.</p>
          
          <p>Best regards,<br>
          The WHOSENXT Partnership Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>If you have any questions about this decision, please feel free to contact us.</p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "WHOSENXT Brand Partnerships <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: emailContent,
    });

    console.log("Brand partnership status email sent successfully:", emailResponse);

    // Return appropriate response
    if (req.method === "GET") {
      // For GET requests (email link clicks), return a simple HTML success page
      return new Response(`
        <html>
          <head>
            <title>Partnership ${status === 'approved' ? 'Approved' : 'Declined'}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              .success { color: #059669; }
              .declined { color: #dc2626; }
              .card { background: #f8fafc; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            </style>
          </head>
          <body>
            <div class="card">
              <h1 class="${status === 'approved' ? 'success' : 'declined'}">
                ${status === 'approved' ? '✅ Partnership Approved!' : '❌ Partnership Declined'}
              </h1>
              <p>The ${status} notification has been sent to <strong>${companyName}</strong> (${email}).</p>
              <p><em>Status: ${status} with ${messageType} tone</em></p>
            </div>
          </body>
        </html>
      `, {
        headers: {
          "Content-Type": "text/html",
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Brand partnership status update sent successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-brand-status-update function:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);