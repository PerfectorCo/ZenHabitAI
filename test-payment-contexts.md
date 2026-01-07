# Quick Payment Context Testing

## Test Scenarios

Copy these into browser console to test different payment method selections:

### 1. Test Dev User (International)
```javascript
// In App.tsx checkout case, add:
userContext={{
  country: 'US',
  language: 'en',
  profession: 'dev',
  device: 'desktop'
}}
// Expected: Stripe only
```

### 2. Test Dev User (Vietnamese)
```javascript
userContext={{
  country: 'VN',
  language: 'vi',
  profession: 'dev',
  device: 'desktop'
}}
// Expected: Stripe (primary) + MoMo (secondary)
```

### 3. Test General Vietnamese User
```javascript
userContext={{
  country: 'VN',
  language: 'vi',
  profession: 'general_user',
  device: 'desktop',
  hasInternationalCard: 'unknown'
}}
// Expected: MoMo (primary) + ZaloPay (secondary)
```

### 4. Test Vietnamese User with International Card
```javascript
userContext={{
  country: 'VN',
  language: 'vi',
  profession: 'general_user',
  device: 'desktop',
  hasInternationalCard: 'true'
}}
// Expected: MoMo (primary) + Stripe (secondary)
```

### 5. Test Mobile Device
```javascript
userContext={{
  country: 'VN',
  language: 'vi',
  profession: 'general_user',
  device: 'mobile',
  hasInternationalCard: 'unknown'
}}
// Expected: MoMo (primary) + ZaloPay (secondary)
// Note: Cache key will be different for mobile
```

## Clear Cache for Testing

```javascript
// In browser console:
const userId = 'mock-user-123'; // or your actual userId
['desktop_vi', 'desktop_en', 'mobile_vi', 'mobile_en'].forEach(suffix => {
  localStorage.removeItem(`zenhabit_payment_methods_${userId}_${suffix}`);
});
console.log('Payment method cache cleared');
```

## Verify Cache

```javascript
// Check what's cached:
const userId = 'mock-user-123';
const device = 'desktop';
const language = 'vi';
const key = `zenhabit_payment_methods_${userId}_${device}_${language}`;
console.log('Cached:', localStorage.getItem(key));
```
