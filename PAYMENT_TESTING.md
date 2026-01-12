# Payment Testing Guide

## ⚠️ **CURRENT STATE: SIMULATION MODE**

The payment flow is currently **simulated** - it shows a processing animation and then calls `onConfirm()` after 2.5 seconds. No actual payment processing occurs yet.

**⚠️ DO NOT RELEASE TO PRODUCTION** until all requirements in `PRODUCTION_PAYMENT_SETUP.md` are completed.

---

## 📋 Production Readiness

See **[PRODUCTION_PAYMENT_SETUP.md](./PRODUCTION_PAYMENT_SETUP.md)** for a comprehensive checklist of what needs to be set up before releasing the app to production, including:

- Backend API endpoints
- Payment provider integrations (Stripe, MoMo, ZaloPay)
- Webhook handling
- Security & compliance
- Database schema updates
- Testing requirements
- Monitoring & logging

---

## Testing the Payment UI/UX Flow

### 1. Test Payment Method Selection

The app automatically selects payment methods based on user context. Test different scenarios:

#### Test Case 1: Developer (International)
```typescript
// In App.tsx, pass userContext to Checkout:
<Checkout
  userEmail={profile.email}
  plan={pendingPlan || 'pro'}
  onConfirm={finalizeSubscription}
  onCancel={() => { setView('pricing'); setPendingPlan(null); }}
  userContext={{
    country: 'US',
    language: 'en',
    profession: 'dev',
    device: 'desktop'
  }}
/>
```
**Expected**: Stripe only

#### Test Case 2: Vietnamese General User
```typescript
userContext={{
  country: 'VN',
  language: 'vi',
  profession: 'general_user',
  device: 'desktop',
  hasInternationalCard: 'unknown'
}}
```
**Expected**: MoMo (primary) + ZaloPay (secondary)

#### Test Case 3: Vietnamese User with International Card
```typescript
userContext={{
  country: 'VN',
  language: 'vi',
  profession: 'general_user',
  device: 'desktop',
  hasInternationalCard: 'true'
}}
```
**Expected**: MoMo (primary) + Stripe (secondary)

### 2. Test Payment Method Caching

1. Open checkout page → payment methods are selected
2. Check browser DevTools → Application → Local Storage
3. Look for key: `zenhabit_payment_methods_{userId}_{device}_{language}`
4. Close and reopen checkout → should use cached selection (no recalculation)

### 3. Test UI States

- [ ] Payment method selection buttons work
- [ ] Active payment method shows checkmark
- [ ] Tone hints display correctly
- [ ] Monthly/Yearly toggle works
- [ ] Price updates correctly
- [ ] Processing animation shows 3 steps
- [ ] Success navigation works after payment

## Testing Payment Method Selection Logic

### Quick Test Script

Add this to browser console when on checkout page:

```javascript
// Test different contexts
import { selectPaymentMethods } from './services/paymentMethodService';

// Case 1: Dev, EN
selectPaymentMethods({
  platform: 'web',
  country: 'US',
  language: 'en',
  profession: 'dev',
  device: 'desktop'
});
// Should return: { primaryMethod: { id: 'stripe' } }

// Case 2: VN General User
selectPaymentMethods({
  platform: 'web',
  country: 'VN',
  language: 'vi',
  profession: 'general_user',
  device: 'desktop',
  hasInternationalCard: 'unknown'
});
// Should return: { primaryMethod: { id: 'momo' }, secondaryMethod: { id: 'zalopay' } }
```

## Preparing for Real Payment Integration

### Stripe Testing

When you integrate Stripe, use **test mode**:

1. **Get Test API Keys**
   - Dashboard: https://dashboard.stripe.com/test/apikeys
   - Use `pk_test_...` for publishable key
   - Use `sk_test_...` for secret key (backend only)

2. **Test Cards**
   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   3D Secure: 4000 0025 0000 3155
   ```
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

3. **Install Stripe.js**
   ```bash
   npm install @stripe/stripe-js
   ```

4. **Example Integration** (for future implementation)
   ```typescript
   import { loadStripe } from '@stripe/stripe-js';

   const stripe = await loadStripe('pk_test_...');

   const handlePayNow = async () => {
     setIsProcessing(true);
     const { error } = await stripe.redirectToCheckout({
       lineItems: [{ price: 'price_xxx', quantity: 1 }],
       mode: 'subscription',
       successUrl: `${window.location.origin}/payment-success`,
       cancelUrl: `${window.location.origin}/checkout`,
     });
   };
   ```

### MoMo Testing

1. **Sandbox Environment**
   - Register at: https://developers.momo.vn/
   - Get Partner Code, Access Key, Secret Key
   - Use sandbox endpoints for testing

2. **Test Flow**
   - Generate payment URL
   - Redirect to MoMo payment page
   - Use test account to complete payment
   - Handle callback

### ZaloPay Testing

1. **Sandbox Environment**
   - Register at: https://developers.zalopay.vn/
   - Get App ID, Key1, Key2
   - Use sandbox environment

2. **Test Flow**
   - Create order
   - Generate payment URL
   - Redirect to ZaloPay
   - Handle callback

## Manual Testing Checklist

### Payment Method Selection
- [ ] Dev user (EN) sees Stripe only
- [ ] Dev user (VN) sees Stripe + MoMo
- [ ] General VN user sees MoMo + ZaloPay
- [ ] VN user with intl card sees MoMo + Stripe
- [ ] Non-VN user sees Stripe only

### Caching
- [ ] First visit calculates payment methods
- [ ] Second visit uses cached methods
- [ ] Cache key includes userId + device + language
- [ ] Changing language clears/updates cache

### UI/UX
- [ ] Payment method buttons are clickable
- [ ] Selected method shows visual feedback
- [ ] Tone hints display correctly
- [ ] Monthly/Yearly prices update
- [ ] Processing animation shows
- [ ] Success page appears after payment

### Error Handling
- [ ] Invalid user context handled gracefully
- [ ] Missing cache doesn't break flow
- [ ] Network errors show appropriate messages

## Testing Different User Contexts

### Method 1: Pass userContext prop

In `App.tsx`, modify the Checkout component:

```typescript
case 'checkout':
  return <Checkout
    userEmail={profile.email}
    plan={pendingPlan || 'pro'}
    onConfirm={finalizeSubscription}
    onCancel={() => { setView('pricing'); setPendingPlan(null); }}
    userContext={{
      country: 'VN', // or 'US', etc.
      language: 'vi', // or 'en'
      profession: 'dev', // or 'knowledge_worker', 'general_user'
      hasInternationalCard: 'true', // or 'false', 'unknown'
      device: 'desktop' // or 'mobile'
    }}
  />;
```

### Method 2: Browser DevTools

1. Open checkout page
2. Open DevTools Console
3. Run:
   ```javascript
   // Clear cache to test fresh selection
   localStorage.removeItem('zenhabit_payment_methods_mock-user-123_desktop_vi');
   // Reload page
   location.reload();
   ```

## Next Steps for Real Payment Integration

1. **Backend Setup**
   - Create payment API endpoints
   - Store Stripe/MoMo/ZaloPay credentials securely
   - Implement webhook handlers

2. **Frontend Integration**
   - Replace `handlePayNow` simulation with real API calls
   - Add error handling
   - Implement payment status polling (if needed)

3. **Testing**
   - Use test mode for all providers
   - Test success flows
   - Test failure flows
   - Test webhook handling

4. **Production**
   - Switch to live API keys
   - Enable webhook signature verification
   - Monitor payment logs

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Build for production testing
npm run build
npm run preview
```

## Debugging Tips

1. **Check localStorage** for cached payment methods
2. **Check console** for any errors in payment method selection
3. **Use React DevTools** to inspect component state
4. **Network tab** to see API calls (when integrated)
