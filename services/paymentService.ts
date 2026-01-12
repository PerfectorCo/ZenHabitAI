// Payment Service - Frontend API client for payment operations

import { supabase } from './supabaseClient';

export interface CreatePaymentIntentRequest {
  plan: 'pro' | 'master';
  cycle: 'monthly' | 'yearly';
  paymentMethod: 'stripe' | 'momo' | 'zalopay';
  userEmail: string;
}

export interface CreatePaymentIntentResponse {
  transactionId: string;
  paymentUrl?: string;
  clientSecret?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Create a payment intent via Supabase Edge Function
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  try {
    // Get Supabase session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Not authenticated. Please log in to continue.');
    }

    // Get Supabase URL from environment or construct from client
    const env = import.meta.env as any;
    const supabaseUrl = env.VITE_SUPABASE_URL || (supabase as any).supabaseUrl;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY || (supabase as any).supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    // Call Supabase Edge Function
    const functionUrl = `${supabaseUrl}/functions/v1/create-payment-intent`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Payment request failed: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    throw new Error(error.message || 'Failed to create payment intent. Please try again.');
  }
}

/**
 * Check payment status
 */
export async function getPaymentStatus(
  transactionId: string
): Promise<PaymentStatusResponse> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Not authenticated');
    }

    // Query payment_transactions table
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('status, id')
      .eq('id', transactionId)
      .single();

    if (error || !data) {
      throw new Error('Transaction not found');
    }

    return {
      status: data.status,
      transactionId: data.id,
    };
  } catch (error: any) {
    console.error('Failed to get payment status:', error);
    throw new Error(error.message || 'Failed to check payment status');
  }
}

/**
 * Poll payment status until completion or timeout
 */
export async function pollPaymentStatus(
  transactionId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<PaymentStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await getPaymentStatus(transactionId);

      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error(`Poll attempt ${attempt + 1} failed:`, error);
    }
  }

  throw new Error('Payment status check timed out');
}
