export type Platform = 'web' | 'mobile';
export type Country = 'VN' | 'US' | 'GB' | string;
export type Language = 'vi' | 'en';
export type Profession = 'dev' | 'knowledge_worker' | 'general_user';
export type HasInternationalCard = 'true' | 'false' | 'unknown';
export type Device = 'desktop' | 'mobile';

export interface PaymentMethodConfig {
  id: 'stripe' | 'momo' | 'zalopay';
  label: {
    vi: string;
    en: string;
  };
  toneHint: {
    vi: string;
    en: string;
  };
}

export interface PaymentMethodSelection {
  primaryMethod: PaymentMethodConfig;
  secondaryMethod?: PaymentMethodConfig;
}

export interface UserContext {
  platform: Platform;
  country: Country;
  language: Language;
  profession?: Profession;
  hasInternationalCard?: HasInternationalCard;
  device?: Device;
}

const PAYMENT_METHODS: Record<'stripe' | 'momo' | 'zalopay', PaymentMethodConfig> = {
  stripe: {
    id: 'stripe',
    label: {
      vi: 'Thanh toán bằng thẻ',
      en: 'Pay with card'
    },
    toneHint: {
      vi: 'Hỗ trợ Visa, MasterCard, Apple Pay',
      en: 'Supports Visa, MasterCard, Apple Pay'
    }
  },
  momo: {
    id: 'momo',
    label: {
      vi: 'Thanh toán qua MoMo',
      en: 'Pay with MoMo'
    },
    toneHint: {
      vi: 'Quét mã hoặc xác nhận trong ứng dụng MoMo',
      en: 'Scan QR or confirm in the MoMo app'
    }
  },
  zalopay: {
    id: 'zalopay',
    label: {
      vi: 'ZaloPay',
      en: 'ZaloPay'
    },
    toneHint: {
      vi: 'Phù hợp nếu bạn dùng Zalo thường xuyên',
      en: 'If you often use Zalo'
    }
  }
};

export function selectPaymentMethods(context: UserContext): PaymentMethodSelection {
  const { country, language, profession, hasInternationalCard } = context;

  // Developer or knowledge worker → prioritize Stripe
  if (profession === 'dev' || profession === 'knowledge_worker') {
    if (country === 'VN') {
      // Vietnamese dev/knowledge worker: Stripe primary, MoMo secondary
      return {
        primaryMethod: PAYMENT_METHODS.stripe,
        secondaryMethod: PAYMENT_METHODS.momo
      };
    }
    // International dev/knowledge worker: Stripe only
    return {
      primaryMethod: PAYMENT_METHODS.stripe
    };
  }

  // General Vietnamese user
  if (country === 'VN') {
    // Has international card → Stripe + MoMo
    if (hasInternationalCard === 'true') {
      return {
        primaryMethod: PAYMENT_METHODS.momo,
        secondaryMethod: PAYMENT_METHODS.stripe
      };
    }

    // No international card or unknown → MoMo + ZaloPay
    return {
      primaryMethod: PAYMENT_METHODS.momo,
      secondaryMethod: PAYMENT_METHODS.zalopay
    };
  }

  // Non-Vietnamese users → Stripe only
  return {
    primaryMethod: PAYMENT_METHODS.stripe
  };
}

/**
 * Cache key generator based on user_id + device + language
 */
function getCacheKey(userId: string, device: Device, language: Language): string {
  return `zenhabit_payment_methods_${userId}_${device}_${language}`;
}

/**
 * Cached payment method selection.
 * Cache is stored in localStorage and keyed by user_id + device + language.
 * Only call this when user opens paywall or clicks "Continue", not every time UI opens.
 */
export function getCachedPaymentMethods(
  userId: string,
  context: UserContext
): PaymentMethodSelection {
  const cacheKey = getCacheKey(userId, context.device || 'desktop', context.language);

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // Cache read failed, continue to generate fresh
  }

  const selection = selectPaymentMethods(context);

  try {
    localStorage.setItem(cacheKey, JSON.stringify(selection));
  } catch (e) {
    // Cache write failed, but return selection anyway
  }

  return selection;
}

/**
 * Clear cached payment methods for a user.
 * Useful when user context changes significantly.
 */
export function clearPaymentMethodsCache(userId: string): void {
  const keys = ['zenhabit_payment_methods_' + userId + '_desktop_vi',
                 'zenhabit_payment_methods_' + userId + '_desktop_en',
                 'zenhabit_payment_methods_' + userId + '_mobile_vi',
                 'zenhabit_payment_methods_' + userId + '_mobile_en'];
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
}

/**
 * Returns payment method selection as JSON in the format requested for API responses.
 * This function can be used to generate structured JSON output based on user context.
 */
export function getPaymentMethodsJSON(context: UserContext): PaymentMethodSelection {
  return selectPaymentMethods(context);
}
