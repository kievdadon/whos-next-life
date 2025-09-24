import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BrandApplicationRequest {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  description?: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  partnershipType?: string;
  experience?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const applicationData: BrandApplicationRequest = await req.json();
    
    console.log("Received brand partnership application:", applicationData);

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          New Brand Partnership Application
        </h1>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Company Information</h2>
          <p><strong>Company Name:</strong> ${applicationData.companyName}</p>
          <p><strong>Industry:</strong> ${applicationData.industry || 'Not specified'}</p>
          <p><strong>Website:</strong> ${applicationData.website || 'Not provided'}</p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Contact Information</h2>
          <p><strong>Contact Name:</strong> ${applicationData.contactName}</p>
          <p><strong>Email:</strong> <a href="mailto:${applicationData.email}">${applicationData.email}</a></p>
          <p><strong>Phone:</strong> ${applicationData.phone || 'Not provided'}</p>
        </div>

        ${Object.values(applicationData.socialMedia).some(val => val) ? `
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Social Media</h2>
          ${applicationData.socialMedia.instagram ? `<p><strong>Instagram:</strong> ${applicationData.socialMedia.instagram}</p>` : ''}
          ${applicationData.socialMedia.facebook ? `<p><strong>Facebook:</strong> ${applicationData.socialMedia.facebook}</p>` : ''}
          ${applicationData.socialMedia.twitter ? `<p><strong>Twitter/X:</strong> ${applicationData.socialMedia.twitter}</p>` : ''}
        </div>
        ` : ''}

        <div style="background-color: #fef7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Partnership Details</h2>
          <p><strong>Partnership Type:</strong> ${applicationData.partnershipType || 'Not specified'}</p>
          
          ${applicationData.description ? `
          <div style="margin: 15px 0;">
            <strong>About Their Brand:</strong>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 5px;">
              ${applicationData.description}
            </div>
          </div>
          ` : ''}

          ${applicationData.experience ? `
          <div style="margin: 15px 0;">
            <strong>Partnership Experience:</strong>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 5px;">
              ${applicationData.experience}
            </div>
          </div>
          ` : ''}
        </div>

        <div style="background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0;">Quick Actions</h3>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <a href="https://iosdtunxezeccsfxvvqn.supabase.co/functions/v1/send-brand-status-update?email=${encodeURIComponent(applicationData.email)}&companyName=${encodeURIComponent(applicationData.companyName)}&contactName=${encodeURIComponent(applicationData.contactName)}&status=approved&messageType=exciting" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ✨ Approve (Exciting)
            </a>
            <a href="https://iosdtunxezeccsfxvvqn.supabase.co/functions/v1/send-brand-status-update?email=${encodeURIComponent(applicationData.email)}&companyName=${encodeURIComponent(applicationData.companyName)}&contactName=${encodeURIComponent(applicationData.contactName)}&status=approved&messageType=sincere" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ✓ Approve (Sincere)
            </a>
            <a href="https://iosdtunxezeccsfxvvqn.supabase.co/functions/v1/send-brand-status-update?email=${encodeURIComponent(applicationData.email)}&companyName=${encodeURIComponent(applicationData.companyName)}&contactName=${encodeURIComponent(applicationData.contactName)}&status=rejected&messageType=sincere" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ✗ Decline
            </a>
          </div>
        </div>

        <div style="background-color: #f8fafc; color: #64748b; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0;">Application submitted on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    `;

    // Send email to business owner
    const emailResponse = await resend.emails.send({
      from: "WHOSENXT Brand Partnerships <onboarding@resend.dev>",
      to: ["jameskiev16@gmail.com"],
      subject: `New Brand Partnership Application - ${applicationData.companyName}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Send confirmation email to applicant
    const confirmationEmail = await resend.emails.send({
      from: "WHOSENXT Brand Partnerships <onboarding@resend.dev>",
      to: [applicationData.email],
      subject: "Brand Partnership Application Received - WHOSENXT",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Thank you for your interest in partnering with WHOSENXT!</h1>
          
          <p>Hi ${applicationData.contactName},</p>
          
          <p>We have successfully received your brand partnership application for <strong>${applicationData.companyName}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4f46e5; margin-top: 0;">What happens next?</h3>
            <ul>
              <li>Our partnership team will review your application within 2-3 business days</li>
              <li>We'll reach out to discuss partnership opportunities</li>
              <li>If approved, we'll guide you through the onboarding process</li>
            </ul>
          </div>
          
          <p>If you have any questions in the meantime, feel free to reply to this email.</p>
          
          <p>Best regards,<br>
          The WHOSENXT Partnership Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>This is an automated confirmation email. Please do not reply directly to this message.</p>
          </div>
        </div>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmail);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Application submitted successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-brand-application function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);