# Phase 1: Critical Payment Infrastructure - Deployment Guide

This guide walks you through deploying Phase 1 payment infrastructure.

## Prerequisites

- [ ] Supabase project created and configured
- [ ] Stripe account created (test mode for now)
- [ ] Supabase CLI installed: `npm install -g supabase`

## Step 1: Database Migration

1. **Run the payment migration SQL**:
   ```bash
   # Option 1: Via Supabase Dashboard
   # Go to SQL Editor → New Query → Paste contents of supabase-payment-migration.sql → Run

   # Option 2: Via Supabase CLI
   supabase db push
   ```

2. **Verify tables created**:
   - Check `payment_transactions` table exists
   - Verify `profiles` table has new subscription columns

## Step 2: Install Stripe.js (Frontend)

```bash
npm install @stripe/stripe-js
```

## Step 3: Configure Environment Variables

### Frontend (.env.local or production env vars)

```bash
# Supabase (if not already set)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe (get from Stripe Dashboard → Developers → API keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Use pk_test_ for testing, pk_live_ for production
```

### Supabase Edge Functions (set in Supabase Dashboard → Edge Functions → Secrets)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...  # Use sk_test_ for testing, sk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard → Webhooks

# App URL (for redirects)
APP_URL=http://localhost:3000  # Development
# APP_URL=https://yourdomain.com  # Production

# Supabase (usually auto-configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For webhook handler
```

## Step 4: Deploy Supabase Edge Functions

### Initialize Supabase (if not already done)

```bash
supabase login
supabase link --project-ref your-project-ref
```

### Deploy Functions

```bash
# Deploy create-payment-intent function
supabase functions deploy create-payment-intent

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

### Set Function Secrets

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Set webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Set app URL
supabase secrets set APP_URL=http://localhost:3000
```

## Step 5: Configure Stripe Webhook

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**:
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.payment_failed`
3. **Copy webhook signing secret** → Add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Step 6: Test the Integration

### Test in Development

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test payment flow**:
   - Navigate to Pricing page
   - Select Pro plan
   - Choose Stripe payment method
   - Click "Subscribe Now"
   - Should redirect to Stripe Checkout

3. **Use Stripe test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

4. **Verify**:
   - Payment completes
   - Redirects to payment-success page
   - User subscription updated in database
   - Transaction recorded in `payment_transactions` table

### Test Webhook

1. **Check Stripe Dashboard** → Webhooks → Recent events
2. **Verify webhook delivered** successfully
3. **Check Supabase logs**:
   ```bash
   supabase functions logs stripe-webhook
   ```

## Step 7: Update ENV_VARIABLES.md

Add payment-related environment variables to your documentation.

## Troubleshooting

### Payment Intent Creation Fails

- **Check**: Supabase Edge Function logs
  ```bash
  supabase functions logs create-payment-intent
  ```
- **Verify**: Environment variables set correctly
- **Check**: User is authenticated (Supabase session exists)

### Webhook Not Receiving Events

- **Verify**: Webhook URL is correct in Stripe Dashboard
- **Check**: Webhook secret matches in Supabase secrets
- **Test**: Use Stripe CLI to test webhook locally
  ```bash
  stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
  ```

### Stripe Redirect Not Working

- **Check**: `VITE_STRIPE_PUBLISHABLE_KEY` is set
- **Verify**: Key matches Stripe account (test vs live)
- **Check**: Browser console for errors

### Database Errors

- **Verify**: Migration SQL ran successfully
- **Check**: RLS policies allow access
- **Verify**: User ID format matches your auth setup

## Next Steps

After Phase 1 is working:

1. ✅ Test all payment flows thoroughly
2. ✅ Monitor error logs
3. ✅ Set up production Stripe account
4. ✅ Move to Phase 2: MoMo integration (for Vietnamese users)

## Security Checklist

- [ ] Never commit `.env.local` or secrets to Git
- [ ] Use test keys for development
- [ ] Verify webhook signatures (implemented in webhook handler)
- [ ] Use HTTPS in production
- [ ] Rotate keys if exposed

## Support

- **Stripe Docs**: https://stripe.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Payment Testing Guide**: See `PAYMENT_TESTING.md`
