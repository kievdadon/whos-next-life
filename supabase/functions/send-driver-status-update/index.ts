import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  email: string;
  fullName: string;
  status: 'approved' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, status }: StatusUpdateRequest = await req.json();
    
    console.log("Sending driver status update:", { email, fullName, status });

    const isApproved = status === 'approved';
    const statusText = isApproved ? 'Approved' : 'Rejected';
    const statusColor = isApproved ? '#10b981' : '#ef4444';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${statusColor};">Driver Application ${statusText}</h1>
        
        <p>Hi ${fullName},</p>
        
        <div style="background-color: ${isApproved ? '#f0f9ff' : '#fef2f2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <h2 style="color: ${statusColor}; margin-top: 0;">
            Your driver application has been ${status}
          </h2>
          
          ${isApproved ? `
            <p><strong>Congratulations!</strong> Welcome to the WHOSENXT driver team!</p>
            
            <h3 style="color: #333; margin-top: 20px;">Next Steps:</h3>
            <ul>
              <li>You now have access to the driver dashboard</li>
              <li>Start accepting delivery orders in your area</li>
              <li>Complete your first delivery to activate your account</li>
              <li>Check the app regularly for new delivery opportunities</li>
            </ul>
            
            <div style="background-color: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-weight: bold;">Ready to start earning? Log in to your driver dashboard now!</p>
            </div>
          ` : `
            <p>Unfortunately, we cannot approve your driver application at this time.</p>
            
            <h3 style="color: #333; margin-top: 20px;">Common reasons for rejection:</h3>
            <ul>
              <li>Incomplete or unclear documentation</li>
              <li>Vehicle requirements not met</li>
              <li>Insurance coverage insufficient</li>
              <li>Background check issues</li>
            </ul>
            
            <p>You're welcome to reapply in the future if your circumstances change.</p>
          `}
        </div>
        
        <p>If you have any questions, feel free to reply to this email.</p>
        
        <p>Best regards,<br>
        The WHOSENXT Driver Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p>This is an automated notification email. Please do not reply directly to this message.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "WHOSENXT Driver Team <onboarding@resend.dev>",
      to: [email],
      subject: `Driver Application ${statusText} - WHOSENXT`,
      html: htmlContent,
    });

    console.log("Status update email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Status update email sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-driver-status-update function:", error);
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