import { useState } from 'react';
import { createOrder } from '../../../services/paymentService';

/**
 * Custom hook for order placement.
 * No online payment — farmers and consumers settle payment directly.
 */
export const usePayment = () => {
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Place an order with direct (offline) payment.
   */
  const processPayment = async (_method, orderDetails, customerDetails) => {
    setProcessing(true);
    setError(null);
    setPaymentStatus(null);

    try {
      const result = await createOrder({ ...orderDetails, customer: customerDetails });
      if (result.success) {
        setPaymentStatus('success');
      } else {
        setError(result.error || 'Failed to place order');
      }
      setProcessing(false);
      return result;
    } catch (err) {
      setError(err.message);
      setProcessing(false);
      return { success: false, error: err.message };
    }
  };

  const resetPayment = () => {
    setProcessing(false);
    setPaymentStatus(null);
    setError(null);
  };

  return { processing, paymentStatus, error, processPayment, resetPayment };
};
