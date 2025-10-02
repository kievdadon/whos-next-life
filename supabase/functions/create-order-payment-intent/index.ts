import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 create-order-payment-intent started");

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const {
      deliveryInfo,
      cartItems,
      storeInfo,
      totals,
    } = await req.json();

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!deliveryInfo?.email || !emailRegex.test(deliveryInfo.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Validate required delivery information
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
      return new Response(
        JSON.stringify({ error: "Complete delivery information required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Validate cart items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart cannot be empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Authenticate user (required)
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !data.user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const user = data.user;
    console.log("✅ User authenticated");

    // SERVER-SIDE VALIDATION: Fetch actual product prices from database
    console.log("🔍 Validating cart items against database");
    const productIds = cartItems.map((item: any) => item.productId).filter(Boolean);
    
    if (productIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart cannot be empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_active')
      .in('id', productIds);

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return new Response(
        JSON.stringify({ error: "Unable to validate order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // Validate each cart item and calculate server-side subtotal
    let serverSubtotal = 0;
    for (const item of cartItems) {
      const product = products?.find((p: any) => p.id === item.productId);
      
      if (!product) {
        console.error("❌ Product not found in database");
        return new Response(
          JSON.stringify({ error: "Invalid product in cart" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }

      if (!product.is_active) {
        console.error("❌ Product no longer active");
        return new Response(
          JSON.stringify({ error: "Some products are no longer available" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }

      if (product.stock_quantity < item.quantity) {
        console.error("❌ Insufficient stock");
        return new Response(
          JSON.stringify({ error: "Insufficient stock for requested quantity" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }

      // Use database price, not client-provided price
      serverSubtotal += Number(product.price) * item.quantity;
    }

    // Calculate server-side totals
    const serverDeliveryFee = Number(totals?.deliveryFee ?? 5);
    const serverTax = serverSubtotal * 0.08; // 8% tax
    const serverTotal = serverSubtotal + serverDeliveryFee + serverTax;

    // Validate client total matches server calculation (1 cent tolerance for rounding)
    const clientTotal = Number(totals?.total ?? 0);
    if (Math.abs(serverTotal - clientTotal) > 0.01) {
      console.error("❌ Price mismatch detected");
      return new Response(
        JSON.stringify({ error: "Price validation failed. Please refresh your cart." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    console.log("✅ Server-side validation passed");

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("❌ Missing Stripe configuration");
      return new Response(
        JSON.stringify({ error: "Payment system unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Ensure Stripe customer exists
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: deliveryInfo.email, limit: 1 });
    if (customers.data.length > 0) customerId = customers.data[0].id;
    if (!customerId) {
      const created = await stripe.customers.create({
        email: deliveryInfo.email,
        name: deliveryInfo.name,
        address: undefined,
        phone: deliveryInfo.phone,
      });
      customerId = created.id;
    }

    // Use SERVER-CALCULATED total for payment
    const amount = Math.round(serverTotal * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: deliveryInfo.email,
      metadata: {
        store_name: storeInfo?.name ?? "",
        customer_name: deliveryInfo.name,
      },
    });

    // Estimated delivery time ≈ 35 minutes
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35);

    // Compute earnings split using SERVER-CALCULATED delivery fee
    const driverEarning = Math.max(0, Math.round(serverDeliveryFee * 0.8 * 100) / 100);
    const companyCommission = Math.max(0, Math.round((serverDeliveryFee - driverEarning) * 100) / 100);

    // Record order
    const { data: order, error: orderError } = await supabase
      .from("delivery_orders")
      .insert({
        customer_id: user?.id || null,
        customer_email: deliveryInfo.email,
        customer_name: deliveryInfo.name,
        customer_phone: deliveryInfo.phone,
        store_name: storeInfo?.name ?? null,
        delivery_address: deliveryInfo.address,
        customer_address: deliveryInfo.address,
        restaurant_address: storeInfo?.address || storeInfo?.name || "N/A",
        cart_items: cartItems,
        subtotal: serverSubtotal,
        delivery_fee: serverDeliveryFee,
        driver_earning: driverEarning,
        company_commission: companyCommission,
        tax: serverTax,
        total_amount: serverTotal,
        payment_status: "pending",
        order_status: "pending",
        stripe_session_id: paymentIntent.id, // reuse column to store PI id
        estimated_delivery_time: estimatedDeliveryTime.toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
        estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("❌ Error in create-order-payment-intent:", error);
    
    // Return generic error message to client, log details server-side
    return new Response(
      JSON.stringify({ error: "Payment processing failed. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
