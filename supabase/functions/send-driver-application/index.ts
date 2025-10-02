import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DriverApplicationRequest {
  applicationId?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth?: string;
  vehicleType: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  licensePlate?: string;
  insuranceProvider?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  availability?: string;
  experience?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    // Input validation
    const applicationData: DriverApplicationRequest = await req.json();
    
    if (!applicationData || typeof applicationData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid application data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'vehicleType'];
    for (const field of requiredFields) {
      if (!applicationData[field as keyof DriverApplicationRequest] || 
          typeof applicationData[field as keyof DriverApplicationRequest] !== 'string') {
        return new Response(
          JSON.stringify({ error: `Missing or invalid required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicationData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate field lengths
    if (applicationData.fullName.length > 200 || 
        applicationData.email.length > 255 ||
        applicationData.phone.length > 50 ||
        applicationData.address.length > 500) {
      return new Response(
        JSON.stringify({ error: 'One or more fields exceed maximum length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Received driver application:", applicationData);

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
          New Driver Application
        </h1>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Personal Information</h2>
          <p><strong>Full Name:</strong> ${applicationData.fullName}</p>
          <p><strong>Email:</strong> <a href="mailto:${applicationData.email}">${applicationData.email}</a></p>
          <p><strong>Phone:</strong> ${applicationData.phone}</p>
          <p><strong>Date of Birth:</strong> ${applicationData.dateOfBirth || 'Not provided'}</p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Address Information</h2>
          <p><strong>Address:</strong> ${applicationData.address}</p>
          <p><strong>City:</strong> ${applicationData.city}</p>
          <p><strong>State:</strong> ${applicationData.state}</p>
          <p><strong>ZIP Code:</strong> ${applicationData.zipCode}</p>
        </div>

        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Vehicle Information</h2>
          <p><strong>Vehicle Type:</strong> ${applicationData.vehicleType}</p>
          ${applicationData.vehicleMake ? `<p><strong>Make:</strong> ${applicationData.vehicleMake}</p>` : ''}
          ${applicationData.vehicleModel ? `<p><strong>Model:</strong> ${applicationData.vehicleModel}</p>` : ''}
          ${applicationData.vehicleYear ? `<p><strong>Year:</strong> ${applicationData.vehicleYear}</p>` : ''}
          ${applicationData.licensePlate ? `<p><strong>License Plate:</strong> ${applicationData.licensePlate}</p>` : ''}
          ${applicationData.insuranceProvider ? `<p><strong>Insurance Provider:</strong> ${applicationData.insuranceProvider}</p>` : ''}
        </div>

        ${(applicationData.emergencyContactName || applicationData.emergencyContactPhone) ? `
        <div style="background-color: #fef7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Emergency Contact</h2>
          ${applicationData.emergencyContactName ? `<p><strong>Name:</strong> ${applicationData.emergencyContactName}</p>` : ''}
          ${applicationData.emergencyContactPhone ? `<p><strong>Phone:</strong> ${applicationData.emergencyContactPhone}</p>` : ''}
        </div>
        ` : ''}

        ${(applicationData.availability || applicationData.experience) ? `
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #4f46e5; margin-top: 0;">Additional Information</h2>
          ${applicationData.availability ? `
          <div style="margin: 15px 0;">
            <strong>Availability:</strong>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 5px;">
              ${applicationData.availability}
            </div>
          </div>
          ` : ''}
          ${applicationData.experience ? `
          <div style="margin: 15px 0;">
            <strong>Experience:</strong>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 5px;">
              ${applicationData.experience}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div style="background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0;">Application submitted on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Please review this application in the admin dashboard.</p>
        </div>
      </div>
    `;

    // Send email to business owner
    const emailResponse = await resend.emails.send({
      from: "WHOSENXT Driver Applications <onboarding@resend.dev>",
      to: ["jameskiev16@gmail.com"],
      subject: `New Driver Application - ${applicationData.fullName}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Send confirmation email to applicant
    const confirmationEmail = await resend.emails.send({
      from: "WHOSENXT Driver Applications <onboarding@resend.dev>",
      to: [applicationData.email],
      subject: "Driver Application Received - WHOSENXT",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Thank you for applying to be a WHOSENXT driver!</h1>
          
          <p>Hi ${applicationData.fullName},</p>
          
          <p>We have successfully received your driver application.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4f46e5; margin-top: 0;">What happens next?</h3>
            <ul>
              <li>Our team will review your application and documents within 2-3 business days</li>
              <li>We'll verify your driver's license and insurance information</li>
              <li>If approved, we'll contact you with next steps for onboarding</li>
              <li>You'll receive access to the driver dashboard and training materials</li>
            </ul>
          </div>
          
          <p>If you have any questions in the meantime, feel free to reply to this email.</p>
          
          <p>Best regards,<br>
          The WHOSENXT Driver Team</p>
          
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
    console.error("Error in send-driver-application function:", error);
    
    const errorMessage = error.message?.includes('Authentication')
      ? error.message
      : "Unable to submit application";
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: error.message?.includes('Authentication') ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);