/**
 * Payment Service
 *
 * No online payment integration — farmers and consumers settle
 * payment directly (cash / bank transfer outside the app).
 */

/**
 * Create a pending order record (no payment gateway involved).
 */
export const createOrder = async (orderData) => {
  try {
    const order = {
      ...orderData,
      id: 'order_' + Date.now(),
      status: 'pending',
      paymentMethod: 'direct',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, orderId: order.id, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

// Legacy no-op exports kept so existing imports don't break
export const loadRazorpayScript = async () => false;
export const updateOrderPayment  = async () => ({ success: true });
export const initiatePayment     = async () => ({ success: false, error: 'Online payments are not enabled.' });
export const processCODOrder     = createOrder;
export const getUserOrders       = async () => ({ success: true, orders: [] });
export const cancelOrder         = async () => ({ success: true });
export const initiateUPIPayment  = async () => ({ success: false, error: 'Online payments are not enabled.' });