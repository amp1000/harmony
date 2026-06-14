// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout session with a 7-day free trial.
// Stripe automatically emails the customer 2 days before the trial ends (enable in Stripe settings).
//
// Deploy:  supabase functions deploy create-checkout
// Secrets: supabase secrets set STRIPE_SECRET=sk_live_... STRIPE_PRICE=price_...

import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET")!, { apiVersion: "2023-10-16" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { email, profileId } = await req.json();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: Deno.env.get("STRIPE_PRICE")!, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
      metadata: { profileId },
      success_url: "https://YOUR_APP_URL/?paid=1",
      cancel_url: "https://YOUR_APP_URL/",
    });
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: cors });
  }
});

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" };
