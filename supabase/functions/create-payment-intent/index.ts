// Supabase Edge Function: Create Payment Intent
// Deploy: supabase functions deploy create-payment-intent

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentIntentRequest {
  plan: 'pro' | 'master';
  cycle: 'monthly' | 'yearly';
  paymentMethod: 'stripe' | 'momo' | 'zalopay';
  userEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: PaymentIntentRequest = await req.json();
    const { plan, cycle, paymentMethod, userEmail } = body;

    // Validate input
    if (!plan || !cycle || !paymentMethod || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate amount (in cents for Stripe, VND for MoMo/ZaloPay)
    const amounts = {
      pro: {
        monthly: { usd: 399, vnd: 79000 }, // $3.99 or 79,000đ
        yearly: { usd: 3999, vnd: 790000 }, // $39.99 or 790,000đ
      },
      master: {
        monthly: { usd: 999, vnd: 199000 },
        yearly: { usd: 9999, vnd: 1990000 },
      },
    };

    const amount = amounts[plan][cycle];
    const currency = paymentMethod === 'stripe' ? 'USD' : 'VND';
    const amountValue = paymentMethod === 'stripe' ? amount.usd : amount.vnd;

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan,
        cycle,
        payment_method: paymentMethod,
        amount: amountValue / (paymentMethod === 'stripe' ? 100 : 1), // Convert cents to dollars
        currency,
        status: 'pending',
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('Failed to create transaction:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Stripe payment
    if (paymentMethod === 'stripe') {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeSecretKey) {
        return new Response(
          JSON.stringify({ error: 'Stripe not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create Stripe checkout session
      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          mode: 'subscription',
          line_items: JSON.stringify([{
            price_data: {
              currency: 'usd',
              product_data: { name: `ZenHabit ${plan === 'pro' ? 'Pro' : 'Master'}` },
              unit_amount: amount.usd,
              recurring: { interval: cycle === 'monthly' ? 'month' : 'year' },
            },
            quantity: '1',
          }]),
          customer_email: userEmail,
          success_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}&transaction_id=${transaction.id}`,
          cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/checkout?cancelled=true`,
          metadata: JSON.stringify({
            transaction_id: transaction.id,
            user_id: user.id,
            plan,
            cycle,
          }),
        }),
      });

      const stripeSession = await stripeResponse.json();

      if (!stripeResponse.ok) {
        // Update transaction status
        await supabase
          .from('payment_transactions')
          .update({ status: 'failed', provider_response: stripeSession })
          .eq('id', transaction.id);

        return new Response(
          JSON.stringify({ error: stripeSession.error?.message || 'Stripe error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update transaction with Stripe session ID
      await supabase
        .from('payment_transactions')
        .update({
          provider_transaction_id: stripeSession.id,
          provider_response: stripeSession,
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          transactionId: transaction.id,
          paymentUrl: stripeSession.url,
          clientSecret: stripeSession.client_secret,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle MoMo payment (placeholder - implement based on MoMo API)
    if (paymentMethod === 'momo') {
      // TODO: Implement MoMo payment creation
      // This is a placeholder structure
      return new Response(
        JSON.stringify({
          error: 'MoMo integration not yet implemented',
          transactionId: transaction.id,
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle ZaloPay payment (placeholder - implement based on ZaloPay API)
    if (paymentMethod === 'zalopay') {
      // TODO: Implement ZaloPay payment creation
      return new Response(
        JSON.stringify({
          error: 'ZaloPay integration not yet implemented',
          transactionId: transaction.id,
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid payment method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
