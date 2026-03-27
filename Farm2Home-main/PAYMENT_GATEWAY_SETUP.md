# 💳 Payment Gateway Integration Guide

## 🚀 Setup Instructions

### 1. **Razorpay Setup** (Recommended)

#### Step 1: Create Razorpay Account
1. Go to [https://razorpay.com](https://razorpay.com)
2. Click **Sign Up** and create an account
3. Complete KYC verification for production use

#### Step 2: Get API Keys
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Generate **Test Keys** for development
4. Note down:
   - **Key ID**: `rzp_test_xxxxx`
   - **Key Secret**: `rzp_test_xxxxx` (Keep this secret!)

#### Step 3: Configure Environment Variables
Create a `.env` file in project root:
```env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
REACT_APP_RAZORPAY_KEY_SECRET=rzp_test_YOUR_KEY_SECRET
```

#### Step 4: Add Razorpay Script
Already added in `public/index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

### 2. **Usage in Components**

#### Example: CartPage Payment Integration

```javascript
import { usePayment } from '../features/consumer/hooks/usePayment';

const CartPage = () => {
  const { processing, paymentStatus, error, processPayment } = usePayment();

  const handleCheckout = async (paymentMethod) => {
    const orderDetails = {
      amount: totalPrice,
      description: 'Farm2Home Purchase',
      items: cartItems,
      onSuccess: (response, orderId) => {
        console.log('Payment successful!', orderId);
        // Clear cart, show success message, redirect to orders
        navigate('/orders');
      },
      onCancel: (orderId) => {
        console.log('Payment cancelled', orderId);
      }
    };

    const customerDetails = {
      userId: user.uid,
      name: user.displayName,
      email: user.email,
      phone: user.phone,
      address: deliveryAddress
    };

    await processPayment(paymentMethod, orderDetails, customerDetails);
  };

  return (
    <button onClick={() => handleCheckout('razorpay')}>
      {processing ? 'Processing...' : 'Pay with Razorpay'}
    </button>
  );
};
```

---

### 3. **Payment Methods**

#### A. Razorpay (Cards, UPI, Netbanking, Wallets)
```javascript
await processPayment('razorpay', orderDetails, customerDetails);
```
**Features:**
- ✅ All payment methods in one
- ✅ Automatic payment verification
- ✅ Refund support
- ✅ Best for production

#### B. Direct UPI
```javascript
await processPayment('upi', orderDetails, customerDetails);
```
**Features:**
- ✅ Opens UPI apps directly (GPay, PhonePe, Paytm)
- ✅ No payment gateway fees
- ⚠️ Manual verification needed

#### C. Cash on Delivery
```javascript
await processPayment('cod', orderDetails, customerDetails);
```
**Features:**
- ✅ No online payment needed
- ✅ Good for rural areas
- ⚠️ Higher risk

---

### 4. **Test Payment**

#### Test Cards (Razorpay Test Mode)
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
Name: Any name
```

#### Test UPI
```
UPI ID: success@razorpay
```

---

### 5. **Firestore Orders Structure**

Orders are stored in `orders` collection:

```javascript
{
  orderId: "auto-generated",
  customer: {
    userId: "user123",
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 9876543210",
    address: "123 Main St, City"
  },
  items: [
    {
      productId: "prod1",
      name: "Fresh Apples",
      quantity: 2,
      price: 120
    }
  ],
  amount: 240,
  paymentMethod: "razorpay",
  paymentStatus: "completed", // pending | completed | failed
  paymentId: "pay_xxxxx",
  status: "confirmed", // pending | confirmed | shipped | delivered | cancelled
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 6. **Security Best Practices**

1. **Never expose Key Secret in frontend**
   - Only use Key ID in frontend
   - Key Secret should be in backend only

2. **Verify payments on backend**
   - Use Razorpay webhooks
   - Verify payment signature

3. **Use HTTPS in production**
   - Required for payment processing

4. **Enable payment verification**
   ```javascript
   // Add webhook in Razorpay Dashboard
   // Webhook URL: https://yourdomain.com/api/payment/verify
   ```

---

### 7. **Going Live (Production)**

1. **Complete KYC** on Razorpay
2. **Get Live API Keys** from Dashboard
3. Update `.env`:
   ```env
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
   ```
4. **Test thoroughly** with real cards (₹1 transactions)
5. **Enable webhooks** for payment verification
6. **Setup backend API** for server-side verification

---

### 8. **Troubleshooting**

#### Payment popup not opening?
- Check if Razorpay script is loaded
- Verify Key ID is correct
- Check browser console for errors

#### Payment succeeds but order not updating?
- Check Firestore rules
- Verify user permissions
- Check browser console

#### Payment fails?
- Test with test cards first
- Check internet connection
- Verify account is active

---

### 9. **Cost (Razorpay)**

- **Transaction Fee**: 2% per transaction
- **UPI**: ₹0 for first 50L, then 2%
- **Cards**: 2% (Domestic), 3% (International)
- **Setup**: Free
- **Maintenance**: Free

---

### 10. **Support**

- **Razorpay Docs**: https://razorpay.com/docs/
- **Integration Help**: https://razorpay.com/docs/payment-gateway/web-integration/
- **Support**: support@razorpay.com

---

## ✅ Quick Testing

1. Start the app: `npm start`
2. Add items to cart
3. Go to checkout
4. Click "Pay with Razorpay"
5. Use test card: `4111 1111 1111 1111`
6. Check Firestore for order

---

## 📦 Files Created

1. `src/services/paymentService.js` - Payment functions
2. `src/features/consumer/hooks/usePayment.js` - Payment hook
3. `PAYMENT_GATEWAY_SETUP.md` - This guide

---

## 🎯 Next Steps

1. ✅ Setup Razorpay account
2. ✅ Get API keys
3. ✅ Add to `.env`
4. ✅ Test with test cards
5. ⏳ Integrate in CartPage
6. ⏳ Setup backend verification
7. ⏳ Go live with real keys

---

**Status**: Integration code ready! Just need Razorpay account setup. 🚀
