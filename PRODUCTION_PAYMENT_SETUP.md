# Production Payment Setup Checklist

## Current Status: ⚠️ **SIMULATION MODE**

The payment flow is currently **simulated** - no real payments are processed. The checkout shows a processing animation and calls `onConfirm()` after 2.5 seconds.

**⚠️ DO NOT RELEASE TO PRODUCTION** until all items below are completed.

---

## Critical Requirements Before Production

### 1. Backend Infrastructure ⚠️ **REQUIRED**

#### 1.1 Payment API Endpoints
Create secure backend endpoints (never expose secrets in frontend):

- [ ] **POST `/api/payments/create-intent`**
  - Creates payment intent for Stripe/MoMo/ZaloPay
  - Validates user authentication
  - Returns payment URL or client secret
  - Stores transaction record

- [ ] **POST `/api/payments/confirm`**
  - Confirms payment completion
  - Updates user subscription status
  - Handles webhook verification

- [ ] **GET `/api/payments/status/:transactionId`**
  - Checks payment status
  - Used for polling if needed

- [ ] **POST `/api/webhooks/stripe`**
  - Handles Stripe webhook events
  - Verifies webhook signatures
  - Updates subscription status

- [ ] **POST `/api/webhooks/momo`**
  - Handles MoMo payment callbacks
  - Verifies callback signatures
  - Updates subscription status

- [ ] **POST `/api/webhooks/zalopay`**
  - Handles ZaloPay payment callbacks
  - Verifies callback signatures
  - Updates subscription status

#### 1.2 Secure Credential Storage
- [ ] Store payment provider secrets in environment variables (backend only)
- [ ] Never commit secrets to version control
- [ ] Use secure secret management (e.g., AWS Secrets Manager, Vercel Environment Variables)

**Required Environment Variables (Backend)**:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MoMo
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...

# ZaloPay
ZALOPAY_APP_ID=...
ZALOPAY_KEY1=...
ZALOPAY_KEY2=...
```

---

### 2. Payment Provider Setup

#### 2.1 Stripe ⚠️ **REQUIRED for International Users**

- [ ] **Create Stripe Account**
  - Sign up at https://dashboard.stripe.com/register
  - Complete business verification
  - Enable live mode

- [ ] **Create Products & Prices**
  - Create "ZenHabit Pro" product
  - Create monthly price: `price_monthly_pro`
  - Create yearly price: `price_yearly_pro`
  - Note the Price IDs for backend

- [ ] **Configure Webhooks**
  - Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
  - Subscribe to events:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
  - Copy webhook signing secret

- [ ] **Get API Keys**
  - Copy **Publishable Key** (`pk_live_...`) → Frontend env var
  - Copy **Secret Key** (`sk_live_...`) → Backend env var (NEVER expose to frontend)

- [ ] **Test Mode First**
  - Complete all testing in Stripe test mode
  - Use test cards: `4242 4242 4242 4242`
  - Verify webhook delivery in test mode
  - Only switch to live mode after thorough testing

#### 2.2 MoMo ⚠️ **REQUIRED for Vietnamese Users**

- [ ] **Register MoMo Developer Account**
  - Sign up at https://developers.momo.vn/
  - Complete business registration
  - Get Partner Code, Access Key, Secret Key

- [ ] **Configure Payment Environment**
  - Set up production environment
  - Configure callback URL: `https://yourdomain.com/api/webhooks/momo`
  - Configure return URL: `https://yourdomain.com/payment-success`

- [ ] **Test in Sandbox**
  - Complete sandbox testing
  - Verify callback handling
  - Test payment flow end-to-end

- [ ] **Production Approval**
  - Submit for production approval
  - Wait for MoMo approval (can take 1-2 weeks)
  - Get production credentials

#### 2.3 ZaloPay ⚠️ **OPTIONAL (Secondary for VN Users)**

- [ ] **Register ZaloPay Developer Account**
  - Sign up at https://developers.zalopay.vn/
  - Complete business registration
  - Get App ID, Key1, Key2

- [ ] **Configure Payment Environment**
  - Set up production environment
  - Configure callback URL: `https://yourdomain.com/api/webhooks/zalopay`
  - Configure return URL: `https://yourdomain.com/payment-success`

- [ ] **Test in Sandbox**
  - Complete sandbox testing
  - Verify callback handling

- [ ] **Production Approval**
  - Submit for production approval
  - Get production credentials

---

### 3. Frontend Integration

#### 3.1 Replace Simulation with Real Payment Flow

**Current Code** (`components/Checkout.tsx:56-64`):
```typescript
const handlePayNow = () => {
  setIsProcessing(true);
  // Simulate multi-step production payment processing
  setTimeout(() => setProcessStep(1), 800);
  setTimeout(() => setProcessStep(2), 1600);
  setTimeout(() => {
    onConfirm();
  }, 2500);
};
```

**Required Changes**:

- [ ] **Install Stripe.js** (if using Stripe)
  ```bash
  npm install @stripe/stripe-js
  ```

- [ ] **Replace `handlePayNow` with real payment logic**:
  ```typescript
  const handlePayNow = async () => {
    setIsProcessing(true);
    setProcessStep(0);

    try {
      // Call backend API to create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          cycle,
          paymentMethod,
          userEmail
        })
      });

      const { paymentUrl, clientSecret, transactionId } = await response.json();

      setProcessStep(1);

      // Redirect based on payment method
      if (paymentMethod === 'stripe') {
        // Use Stripe.js to handle payment
        const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: paymentUrl });
      } else if (paymentMethod === 'momo' || paymentMethod === 'zalopay') {
        // Redirect to payment provider
        window.location.href = paymentUrl;
      }

      setProcessStep(2);
    } catch (error) {
      setError(error.message);
      setIsProcessing(false);
    }
  };
  ```

- [ ] **Add Error Handling**
  - [ ] Display user-friendly error messages
  - [ ] Handle network failures
  - [ ] Handle payment cancellations
  - [ ] Handle payment failures

- [ ] **Add Payment Status Polling** (if needed)
  - [ ] Poll backend for payment status
  - [ ] Update UI based on status
  - [ ] Handle timeout scenarios

#### 3.2 Environment Variables (Frontend)

Add to `.env.production`:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://yourdomain.com/api
```

**⚠️ NEVER expose secret keys in frontend code or environment variables.**

---

### 4. Database Schema Updates

#### 4.1 Payment Transactions Table

- [ ] **Create `payment_transactions` table**:
  ```sql
  CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    plan VARCHAR(20) NOT NULL, -- 'pro' | 'master'
    cycle VARCHAR(20) NOT NULL, -- 'monthly' | 'yearly'
    payment_method VARCHAR(20) NOT NULL, -- 'stripe' | 'momo' | 'zalopay'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- 'pending' | 'completed' | 'failed' | 'cancelled'
    provider_transaction_id VARCHAR(255),
    provider_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
  CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
  ```

#### 4.2 Subscription Management

- [ ] **Update `profiles` table** to track subscription:
  - [ ] `subscription_status` (active, cancelled, expired)
  - [ ] `subscription_start_date`
  - [ ] `subscription_end_date`
  - [ ] `subscription_renewal_date`
  - [ ] `payment_method_last_used`

- [ ] **Create subscription renewal logic**
  - [ ] Auto-renewal for active subscriptions
  - [ ] Handle failed renewals
  - [ ] Send renewal reminders

---

### 5. Security & Compliance

#### 5.1 PCI DSS Compliance

- [ ] **Never store card details** on your servers
- [ ] **Use payment provider tokenization** (Stripe handles this)
- [ ] **Implement HTTPS** (required for all payment pages)
- [ ] **Verify webhook signatures** (prevent fraud)

#### 5.2 Data Protection

- [ ] **Encrypt sensitive payment data** in transit (HTTPS)
- [ ] **Log payment events** securely (for debugging)
- [ ] **Implement rate limiting** on payment endpoints
- [ ] **Add CSRF protection** to payment forms

#### 5.3 Fraud Prevention

- [ ] **Implement payment amount validation**
- [ ] **Add duplicate payment detection**
- [ ] **Monitor for suspicious activity**
- [ ] **Set up alerts for failed payments**

---

### 6. Testing Checklist

#### 6.1 Test Mode Testing

- [ ] **Stripe Test Mode**
  - [ ] Test successful payment flow
  - [ ] Test payment failure scenarios
  - [ ] Test 3D Secure authentication
  - [ ] Verify webhook delivery
  - [ ] Test subscription creation

- [ ] **MoMo Sandbox**
  - [ ] Test successful payment flow
  - [ ] Test payment cancellation
  - [ ] Verify callback handling
  - [ ] Test error scenarios

- [ ] **ZaloPay Sandbox** (if enabled)
  - [ ] Test successful payment flow
  - [ ] Verify callback handling

#### 6.2 Integration Testing

- [ ] **End-to-end payment flow**
  - [ ] User selects plan → Checkout → Payment → Success
  - [ ] Verify subscription is activated
  - [ ] Verify user profile updated

- [ ] **Error Scenarios**
  - [ ] Network failure during payment
  - [ ] Payment cancellation
  - [ ] Payment failure
  - [ ] Webhook delivery failure

- [ ] **Edge Cases**
  - [ ] Concurrent payment attempts
  - [ ] Payment timeout
  - [ ] Browser back button during payment
  - [ ] Multiple tabs open

#### 6.3 User Experience Testing

- [ ] **Payment method selection** works correctly
- [ ] **Loading states** display properly
- [ ] **Error messages** are user-friendly
- [ ] **Success page** shows correct information
- [ ] **Mobile responsiveness** works

---

### 7. Monitoring & Logging

#### 7.1 Payment Monitoring

- [ ] **Set up payment success rate monitoring**
- [ ] **Track payment method usage** (Stripe vs MoMo vs ZaloPay)
- [ ] **Monitor payment failures** and reasons
- [ ] **Set up alerts** for payment issues

#### 7.2 Logging

- [ ] **Log all payment attempts** (with transaction IDs)
- [ ] **Log webhook events** (for debugging)
- [ ] **Log payment errors** (with context)
- [ ] **Never log sensitive data** (card numbers, CVV)

---

### 8. Legal & Business Requirements

#### 8.1 Terms & Conditions

- [ ] **Update Terms of Service** to include payment terms
- [ ] **Add refund policy**
- [ ] **Add cancellation policy**
- [ ] **Add subscription terms**

#### 8.2 Business Setup

- [ ] **Set up business bank account** for receiving payments
- [ ] **Configure payout schedules** in payment providers
- [ ] **Set up tax handling** (if required)
- [ ] **Configure currency conversion** (if multi-currency)

---

### 9. Production Deployment Checklist

#### 9.1 Pre-Deployment

- [ ] All backend endpoints implemented and tested
- [ ] All payment providers configured in production
- [ ] Webhook endpoints configured and tested
- [ ] Database schema updated
- [ ] Environment variables set in production
- [ ] SSL certificate installed and valid
- [ ] Error handling implemented
- [ ] Monitoring set up

#### 9.2 Deployment Steps

1. [ ] **Deploy backend API** first
2. [ ] **Verify webhook endpoints** are accessible
3. [ ] **Test webhook delivery** from payment providers
4. [ ] **Deploy frontend** with production API URLs
5. [ ] **Test end-to-end** with small test payment
6. [ ] **Monitor logs** for first 24 hours
7. [ ] **Gradually enable** for all users

#### 9.3 Post-Deployment

- [ ] **Monitor payment success rate**
- [ ] **Check webhook delivery**
- [ ] **Verify subscription activations**
- [ ] **Monitor error logs**
- [ ] **Test customer support** flow

---

### 10. Rollback Plan

If issues occur:

- [ ] **Disable payment buttons** in frontend
- [ ] **Revert to simulation mode** (temporary)
- [ ] **Investigate issues** using logs
- [ ] **Fix and redeploy**
- [ ] **Re-enable payments**

---

## Priority Order

### Phase 1: Critical (Must Have)
1. ✅ Backend API endpoints
2. ✅ Stripe integration (for international users)
3. ✅ Webhook handling
4. ✅ Error handling
5. ✅ Database schema

### Phase 2: Important (Should Have)
6. ✅ MoMo integration (for Vietnamese users)
7. ✅ Payment status tracking
8. ✅ Monitoring & logging
9. ✅ Security measures

### Phase 3: Nice to Have (Can Add Later)
10. ✅ ZaloPay integration
11. ✅ Advanced fraud prevention
12. ✅ Subscription management UI
13. ✅ Payment analytics dashboard

---

## Estimated Timeline

- **Backend Setup**: 1-2 weeks
- **Stripe Integration**: 3-5 days
- **MoMo Integration**: 1-2 weeks (including approval)
- **Testing**: 1 week
- **Total**: 4-6 weeks

---

## Resources

- **Stripe Docs**: https://stripe.com/docs
- **MoMo Docs**: https://developers.momo.vn/
- **ZaloPay Docs**: https://developers.zalopay.vn/
- **Supabase Docs**: https://supabase.com/docs

---

## Notes

- ⚠️ **Never commit payment secrets** to version control
- ⚠️ **Always test in sandbox/test mode** before production
- ⚠️ **Verify webhook signatures** to prevent fraud
- ⚠️ **Monitor payment success rates** closely after launch
- ⚠️ **Have a rollback plan** ready

---

**Last Updated**: [Current Date]
**Status**: ⚠️ **NOT PRODUCTION READY** - Payment flow is simulated
