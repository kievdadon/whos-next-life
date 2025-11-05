import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: "alloy",
        instructions: `You are WHOSENXT Voice Assistant, an intelligent voice-powered AI helper for the WHOSENXT platform.

Your role is to help users navigate and use WHOSENXT features including:
- Shopping on the marketplace
- Finding and applying for gigs
- Ordering food delivery
- Checking delivery status
- Managing business operations
- Wellness support (coordinate with the wellness chatbot when needed)
- Messaging sellers, gig posters, and drivers

CRITICAL RULES:
1. ALWAYS ask for confirmation before performing ANY action (searches, checkout, messaging, etc.)
2. Be conversational but concise
3. If the wellness chatbot is more appropriate for a request, suggest switching to it
4. Guide users step-by-step through complex tasks
5. When searching, describe what you're searching for before doing it
6. For messaging, read back the message before sending
7. Keep the wellness bot on standby - mention it's available if users need health/wellness support
8. For purchases, remind users about voice confirmation if enabled in settings

Always be helpful, friendly, and ask for explicit confirmation before taking actions.`,
        tools: [
          {
            type: "function",
            name: "navigate_to_page",
            description: "Navigate to a specific page in the WHOSENXT app. Always confirm with user before navigating.",
            parameters: {
              type: "object",
              properties: {
                page: {
                  type: "string",
                  enum: ["marketplace", "delivery", "gigs", "business-dashboard", "driver-dashboard", "wellness-chat", "mission-control", "home"],
                  description: "The page to navigate to"
                }
              },
              required: ["page"]
            }
          },
          {
            type: "function",
            name: "search_marketplace",
            description: "Search for products in the marketplace. Ask user to confirm search terms.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
                category: { type: "string", description: "Category filter (clothing, accessories, fashion, etc.)" }
              },
              required: ["query"]
            }
          },
          {
            type: "function",
            name: "search_gigs",
            description: "Search for available gigs. Confirm search criteria with user.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" }
              },
              required: ["query"]
            }
          },
          {
            type: "function",
            name: "send_message",
            description: "Send a message to a seller, driver, or gig poster. Always read the message back to user before sending.",
            parameters: {
              type: "object",
              properties: {
                recipient: { type: "string", description: "Recipient identifier" },
                message: { type: "string", description: "Message content" },
                type: { type: "string", enum: ["seller", "driver", "gig_poster"], description: "Type of recipient" }
              },
              required: ["recipient", "message", "type"]
            }
          },
          {
            type: "function",
            name: "add_to_cart",
            description: "Add a product to the shopping cart. Confirm quantity and product with user.",
            parameters: {
              type: "object",
              properties: {
                productId: { type: "string", description: "Product ID" },
                quantity: { type: "number", description: "Quantity to add" }
              },
              required: ["productId", "quantity"]
            }
          },
          {
            type: "function",
            name: "update_cart_quantity",
            description: "Update the quantity of an item in the cart. Confirm with user.",
            parameters: {
              type: "object",
              properties: {
                itemId: { type: "string", description: "Cart item ID" },
                quantity: { type: "number", description: "New quantity" }
              },
              required: ["itemId", "quantity"]
            }
          },
          {
            type: "function",
            name: "remove_from_cart",
            description: "Remove an item from the cart. Confirm with user.",
            parameters: {
              type: "object",
              properties: {
                itemId: { type: "string", description: "Cart item ID" }
              },
              required: ["itemId"]
            }
          },
          {
            type: "function",
            name: "initiate_checkout",
            description: "Start the checkout process. Requires voice confirmation if enabled in settings.",
            parameters: {
              type: "object",
              properties: {
                voiceConfirmed: { type: "boolean", description: "Whether voice confirmation was completed" }
              },
              required: ["voiceConfirmed"]
            }
          },
          {
            type: "function",
            name: "check_delivery_status",
            description: "Check the status of a food delivery order.",
            parameters: {
              type: "object",
              properties: {
                orderId: { type: "string", description: "Order ID to check" }
              }
            }
          },
          {
            type: "function",
            name: "cancel_delivery",
            description: "Cancel a delivery order. Confirm with user before canceling.",
            parameters: {
              type: "object",
              properties: {
                orderId: { type: "string", description: "Order ID to cancel" }
              },
              required: ["orderId"]
            }
          },
          {
            type: "function",
            name: "go_back",
            description: "Navigate back to the previous page.",
            parameters: { type: "object", properties: {} }
          },
          {
            type: "function",
            name: "go_forward",
            description: "Navigate forward to the next page.",
            parameters: { type: "object", properties: {} }
          }
        ]
      }),
    });

    const data = await response.json();
    console.log("Voice assistant session created:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating voice assistant session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
