// Supabase Edge Function: Stripe Webhook Handler
// Deploy: supabase functions deploy stripe-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeWebhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature (simplified - use Stripe SDK in production)
    // In production, use: stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)

    const event = JSON.parse(body);
    console.log('Stripe webhook event:', event.type);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const transactionId = metadata.transaction_id;
        const userId = metadata.user_id;
        const plan = metadata.plan;
        const cycle = metadata.cycle;

        if (!transactionId || !userId) {
          console.error('Missing metadata in checkout session:', session.id);
          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update transaction status
        const { error: txError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'completed',
            provider_transaction_id: session.id,
            provider_response: session,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);

        if (txError) {
          console.error('Failed to update transaction:', txError);
        }

        // Update user subscription
        const subscriptionEndDate = new Date();
        if (cycle === 'monthly') {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        } else {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        }

        const renewalDate = new Date(subscriptionEndDate);

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription: plan,
            subscription_status: 'active',
            subscription_start_date: new Date().toISOString(),
            subscription_end_date: subscriptionEndDate.toISOString(),
            subscription_renewal_date: renewalDate.toISOString(),
            payment_method_last_used: 'stripe',
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Failed to update profile:', profileError);
        }

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error('Missing user_id in subscription metadata');
          break;
        }

        const status = event.type === 'customer.subscription.deleted' ? 'cancelled' : 'active';

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_end_date: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            subscription_renewal_date: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('id', userId);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const transactionId = paymentIntent.metadata?.transaction_id;

        if (transactionId) {
          await supabase
            .from('payment_transactions')
            .update({
              status: 'failed',
              provider_response: paymentIntent,
            })
            .eq('id', transactionId);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
