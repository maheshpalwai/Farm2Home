import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import {
  FaCheckCircle,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaRoad,
  FaCity,
  FaHashtag,
  FaShoppingBag,
  FaLeaf,
  FaArrowLeft,
  FaArrowRight,
  FaEdit,
} from 'react-icons/fa';

/* ─────────────────────────────────────────────
   Inline Styles
───────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    paddingBottom: 60,
  },
  container: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '40px 20px 0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 8,
    transition: 'background 0.2s',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#14532d',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 24,
    alignItems: 'start',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 28,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#15803d',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #d1fae5',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.2s',
    boxSizing: 'border-box',
    background: '#f9fafb',
  },
  inputFocus: {
    border: '1.5px solid #16a34a',
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  // Order summary
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0fdf4',
  },
  itemName: {
    fontWeight: 600,
    fontSize: 14,
    color: '#1f2937',
  },
  itemMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemPrice: {
    fontWeight: 700,
    color: '#15803d',
  },
  divider: {
    border: 'none',
    borderTop: '2px dashed #d1fae5',
    margin: '12px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 700,
    fontSize: 16,
    color: '#14532d',
    marginTop: 8,
  },
  confirmBtn: {
    width: '100%',
    padding: '14px 0',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.2s',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  // Success Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    padding: '48px 40px',
    maxWidth: 400,
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  modalIcon: {
    fontSize: 64,
    color: '#16a34a',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#14532d',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  modalBtn: {
    padding: '12px 32px',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
};

/* ─────────────────────────────────────────────
   Validation helpers
───────────────────────────────────────────── */
const validate = (form) => {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Name is required';
  if (!/^\d{10}$/.test(form.phone)) errors.phone = 'Enter a valid 10-digit phone number';
  if (!form.area.trim()) errors.area = 'Area/Colony is required';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!/^\d{6}$/.test(form.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
  return errors;
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const OrderCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: toastError } = useToast();

  // Items can be passed via route state (from cart or Buy Now)
  const passedItems = location.state?.items || [];
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (passedItems.length > 0) {
      setCartItems(passedItems);
    } else {
      // Fallback: read from localStorage cart
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    city: '',
    pincode: '',
    landmark: '',
  });
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [step, setStep] = useState(1); // 1 = address, 2 = review + confirm
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const calculateTotal = () =>
    cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 1;
      return sum + price * qty;
    }, 0);

  const handleContinueToReview = () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmOrder = async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      navigate('/', { state: { openModal: true, role: 'consumer' } });
      return;
    }

    setLoading(true);
    try {
      const shippingAddress = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        landmark: form.landmark.trim() || '',
      };

      // Write one Firestore document per cart item (or a single doc for single-item checkout)
      const orderRefs = [];
      for (const item of cartItems) {
        const docRef = await addDoc(collection(db, 'orders'), {
          customerId: user.uid,               // satisfies Firestore rules
          farmerId: item.farmerId || item.farmer?.id || null,
          cropId: item.id || item.cropId || null,
          cropName: item.name || item.crop || 'Unknown',
          quantity: parseInt(item.quantity) || 1,
          totalAmount:
            (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
          status: 'pending',
          shippingAddress,
          createdAt: serverTimestamp(),
        });
        orderRefs.push(docRef.id);
      }

      // Clear cart from localStorage after successful order
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));

      setPlacedOrderId(orderRefs[0]);
      setShowSuccess(true);
    } catch (err) {
      toastError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToOrders = () => {
    setShowSuccess(false);
    navigate('/orders');
  };

  const inputStyle = (field) => ({
    ...styles.input,
    ...(focusedField === field ? styles.inputFocus : {}),
  });

  /* ── Empty Cart State ── */
  if (!loading && cartItems.length === 0 && !showSuccess) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={{ ...styles.container, ...styles.emptyState }}>
          <FaShoppingBag size={64} color="#d1d5db" />
          <h2 style={{ color: '#374151', marginTop: 16 }}>No items to checkout</h2>
          <p style={{ color: '#6b7280' }}>Add some products to your cart first.</p>
          <button
            style={{ ...styles.confirmBtn, width: 'auto', padding: '12px 28px', marginTop: 20 }}
            onClick={() => navigate('/consumer')}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  /* ── Step indicator ── */
  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {[{ n: 1, label: 'Delivery Address' }, { n: 2, label: 'Review & Confirm' }].map(({ n, label }, i) => (
        <React.Fragment key={n}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 700,
              background: step >= n ? '#16a34a' : '#e5e7eb',
              color: step >= n ? '#fff' : '#6b7280',
            }}>{step > n ? '✓' : n}</div>
            <span style={{ fontSize: 13, fontWeight: step === n ? 700 : 400, color: step >= n ? '#15803d' : '#9ca3af' }}>{label}</span>
          </div>
          {i < 1 && <div style={{ flex: 1, height: 2, background: step > 1 ? '#16a34a' : '#e5e7eb', borderRadius: 2 }} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => step === 2 ? setStep(1) : navigate(-1)}>
            <FaArrowLeft /> {step === 2 ? 'Edit Address' : 'Back'}
          </button>
          <h1 style={styles.pageTitle}>
            {step === 1 ? 'Delivery Address' : 'Review Order'}
          </h1>
        </div>

        <StepBar />

        {/* ════════════════ STEP 1: Address Form ════════════════ */}
        {step === 1 && (
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><FaMapMarkerAlt /> Where should we deliver?</h2>

              {/* Full Name */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="fullName"><FaUser /> Full Name *</label>
                <input id="fullName" name="fullName" type="text" placeholder="Enter your full name"
                  value={form.fullName} onChange={handleChange}
                  onFocus={() => setFocusedField('fullName')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('fullName')} />
                {errors.fullName && <p style={styles.errorText}>{errors.fullName}</p>}
              </div>

              {/* Phone */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="phone"><FaPhone /> Phone Number *</label>
                <input id="phone" name="phone" type="tel" placeholder="10-digit mobile number"
                  value={form.phone} onChange={handleChange} maxLength={10}
                  onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('phone')} />
                {errors.phone && <p style={styles.errorText}>{errors.phone}</p>}
              </div>

              {/* Area / Colony */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="area"><FaRoad /> Area / Colony *</label>
                <input id="area" name="area" type="text" placeholder="House No., Street, Area, Colony"
                  value={form.area} onChange={handleChange}
                  onFocus={() => setFocusedField('area')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('area')} />
                {errors.area && <p style={styles.errorText}>{errors.area}</p>}
              </div>

              {/* City + Pincode */}
              <div style={styles.inputRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="city"><FaCity /> City *</label>
                  <input id="city" name="city" type="text" placeholder="City"
                    value={form.city} onChange={handleChange}
                    onFocus={() => setFocusedField('city')} onBlur={() => setFocusedField(null)}
                    style={inputStyle('city')} />
                  {errors.city && <p style={styles.errorText}>{errors.city}</p>}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="pincode"><FaHashtag /> Pincode *</label>
                  <input id="pincode" name="pincode" type="text" placeholder="6-digit pincode"
                    value={form.pincode} onChange={handleChange} maxLength={6}
                    onFocus={() => setFocusedField('pincode')} onBlur={() => setFocusedField(null)}
                    style={inputStyle('pincode')} />
                  {errors.pincode && <p style={styles.errorText}>{errors.pincode}</p>}
                </div>
              </div>

              {/* Landmark (optional) */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="landmark"><FaMapMarkerAlt /> Landmark <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input id="landmark" name="landmark" type="text" placeholder="Nearby landmark (e.g., Near SBI Bank)"
                  value={form.landmark} onChange={handleChange}
                  onFocus={() => setFocusedField('landmark')} onBlur={() => setFocusedField(null)}
                  style={inputStyle('landmark')} />
              </div>

              <button style={styles.confirmBtn} onClick={handleContinueToReview}>
                Continue to Review <FaArrowRight style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 2: Review + Confirm ════════════════ */}
        {step === 2 && (
          <div style={styles.grid}>
            {/* Address Summary */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><FaMapMarkerAlt /> Delivery Address</h2>
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '16px 18px', lineHeight: 1.7, fontSize: 14, color: '#1f2937' }}>
                <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{form.fullName}</p>
                <p style={{ margin: 0 }}>{form.area}</p>
                {form.landmark && <p style={{ margin: 0, color: '#6b7280' }}>Near: {form.landmark}</p>}
                <p style={{ margin: 0 }}>{form.city} – {form.pincode}</p>
                <p style={{ margin: '4px 0 0', color: '#374151' }}>📞 {form.phone}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                style={{ background: 'none', border: '1.5px solid #16a34a', color: '#16a34a', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FaEdit /> Change Address
              </button>
            </div>

            {/* Order Summary + Confirm */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><FaLeaf /> Order Summary</h2>

              {cartItems.map((item, idx) => {
                const qty = parseInt(item.quantity) || 1;
                const price = parseFloat(item.price) || 0;
                return (
                  <div key={item.id || idx} style={styles.orderItem}>
                    <div>
                      <p style={styles.itemName}>{item.name || item.crop || 'Product'}</p>
                      <p style={styles.itemMeta}>₹{price.toFixed(2)} × {qty} {item.unit || 'kg'}</p>
                    </div>
                    <p style={styles.itemPrice}>₹{(price * qty).toFixed(2)}</p>
                  </div>
                );
              })}

              <hr style={styles.divider} />

              <div style={styles.totalRow}>
                <span>Total</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>

              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
                💵 Pay directly to the farmer upon delivery
              </p>

              <button
                style={{ ...styles.confirmBtn, ...(loading ? styles.confirmBtnDisabled : {}) }}
                onClick={handleConfirmOrder}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : <><FaCheckCircle /> Confirm Order</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <FaCheckCircle style={styles.modalIcon} />
            <h2 style={styles.modalTitle}>Order Placed!</h2>
            <p style={styles.modalSub}>
              Your order has been confirmed. Please arrange payment directly with the farmer upon delivery.
              {placedOrderId && (
                <>
                  <br />
                  <strong>Order ID:</strong> {placedOrderId}
                </>
              )}
            </p>
            <button style={styles.modalBtn} onClick={handleGoToOrders}>
              View My Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCheckout;
