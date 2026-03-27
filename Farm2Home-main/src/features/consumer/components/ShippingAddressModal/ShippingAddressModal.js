import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../firebase';
import {
  FaTimes, FaUser, FaPhone, FaMapMarkerAlt, FaCity,
  FaHashtag, FaRupeeSign, FaCheckCircle, FaBoxOpen, FaMinus, FaPlus,
} from 'react-icons/fa';
import './ShippingAddressModal.css';

/**
 * ShippingAddressModal
 * Opens when a consumer clicks "Buy Now" on a product.
 * Collects delivery address → saves order to Firestore orders/{orderId}.
 */
const ShippingAddressModal = ({ product, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    area: '',
    city: '',
    pincode: '',
  });
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  const maxQty = product?.maxOrder || product?.quantity || 100;
  const price = product?.pricePerKg || product?.price || 0;
  const total = (qty * price).toFixed(2);

  /* ── Validation ────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.area.trim()) e.area = 'Area / Street is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    return e;
  };

  /* ── Handlers ──────────────────────────────────── */
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleQty = (delta) => {
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setErrors({ _global: 'You must be logged in to place an order.' });
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customerId: user.uid,
        customerEmail: user.email,
        farmerId: product.farmerId || product.uid || product.farmerUid || '',
        cropId: product.id,
        cropName: product.name || product.cropName,
        quantity: qty,
        unit: product.unit || 'kg',
        pricePerKg: price,
        totalPrice: parseFloat(total),
        totalAmount: parseFloat(total),   // keep for backward compat
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          area: form.area.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
        },
        status: 'pending',
        paymentMethod: 'COD',
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(ref.id);
      setPlaced(true);
    } catch (err) {
      setErrors({ _global: 'Failed to place order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ────────────────────────────── */
  if (placed) {
    return (
      <div className="sam-overlay" onClick={onClose}>
        <div className="sam-modal sam-success" onClick={(e) => e.stopPropagation()}>
          <div className="sam-success-icon"><FaCheckCircle /></div>
          <h2 className="sam-success-title">🎉 Order Placed Successfully!</h2>
          <p className="sam-success-sub">
            Your order for <strong>{product.name}</strong> has been placed successfully.
          </p>
          <div className="sam-success-oid">
            Order ID: <strong>#{orderId.slice(0, 8).toUpperCase()}</strong>
          </div>
          <p className="sam-success-note">
            The farmer will confirm your order soon. You can track it in <strong>My Orders</strong>.
          </p>
          <button className="sam-btn sam-btn-primary" onClick={() => { onSuccess && onSuccess(); onClose(); }}>
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────── */
  return (
    <div className="sam-overlay" onClick={onClose}>
      <div className="sam-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sam-header">
          <div className="sam-header-left">
            <FaMapMarkerAlt className="sam-header-icon" />
            <div>
              <h2 className="sam-title">Shipping Address</h2>
              <p className="sam-subtitle">Tell us where to deliver</p>
            </div>
          </div>
          <button className="sam-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </div>

        {/* Product summary pill */}
        <div className="sam-product-pill">
          <FaBoxOpen className="sam-pill-icon" />
          <span className="sam-pill-name">{product.name}</span>
          <span className="sam-pill-sep">·</span>
          <FaRupeeSign className="sam-pill-rs" />
          <span className="sam-pill-price">{price}</span>
          <span className="sam-pill-unit">/{product.unit || 'kg'}</span>
        </div>

        <form className="sam-form" onSubmit={handleSubmit} noValidate>

          {/* Quantity row */}
          <div className="sam-qty-row">
            <span className="sam-qty-label">Quantity</span>
            <div className="sam-qty-controls">
              <button type="button" className="sam-qty-btn" onClick={() => handleQty(-1)} disabled={qty <= 1}>
                <FaMinus />
              </button>
              <span className="sam-qty-val">{qty} {product.unit || 'kg'}</span>
              <button type="button" className="sam-qty-btn" onClick={() => handleQty(+1)} disabled={qty >= maxQty}>
                <FaPlus />
              </button>
            </div>
            <span className="sam-total"><FaRupeeSign />{total}</span>
          </div>

          <div className="sam-divider" />

          {/* Full Name */}
          <div className="sam-field">
            <label className="sam-label"><FaUser /> Full Name</label>
            <input
              className={`sam-input ${errors.fullName ? 'sam-input-err' : ''}`}
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={form.fullName}
              onChange={handleChange('fullName')}
            />
            {errors.fullName && <p className="sam-err">{errors.fullName}</p>}
          </div>

          {/* Phone */}
          <div className="sam-field">
            <label className="sam-label"><FaPhone /> Phone Number</label>
            <input
              className={`sam-input ${errors.phone ? 'sam-input-err' : ''}`}
              type="tel"
              placeholder="e.g. 9876543210"
              maxLength={10}
              value={form.phone}
              onChange={handleChange('phone')}
            />
            {errors.phone && <p className="sam-err">{errors.phone}</p>}
          </div>

          {/* Area / Street */}
          <div className="sam-field">
            <label className="sam-label"><FaMapMarkerAlt /> Area / Street</label>
            <input
              className={`sam-input ${errors.area ? 'sam-input-err' : ''}`}
              type="text"
              placeholder="e.g. 12 Gandhi Nagar, Near Bus Stand"
              value={form.area}
              onChange={handleChange('area')}
            />
            {errors.area && <p className="sam-err">{errors.area}</p>}
          </div>

          {/* City + Pincode */}
          <div className="sam-row-2">
            <div className="sam-field">
              <label className="sam-label"><FaCity /> City</label>
              <input
                className={`sam-input ${errors.city ? 'sam-input-err' : ''}`}
                type="text"
                placeholder="e.g. Hyderabad"
                value={form.city}
                onChange={handleChange('city')}
              />
              {errors.city && <p className="sam-err">{errors.city}</p>}
            </div>
            <div className="sam-field">
              <label className="sam-label"><FaHashtag /> Pincode</label>
              <input
                className={`sam-input ${errors.pincode ? 'sam-input-err' : ''}`}
                type="text"
                placeholder="e.g. 500001"
                maxLength={6}
                value={form.pincode}
                onChange={handleChange('pincode')}
              />
              {errors.pincode && <p className="sam-err">{errors.pincode}</p>}
            </div>
          </div>

          {/* Global error */}
          {errors._global && <p className="sam-global-err">{errors._global}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="sam-btn sam-btn-primary sam-btn-full"
            disabled={submitting}
          >
            {submitting ? 'Placing Order…' : `Confirm Order · ₹${total}`}
          </button>

          <p className="sam-cod-note">
            💳 Cash on Delivery · No advance payment required
          </p>
        </form>
      </div>
    </div>
  );
};

export default ShippingAddressModal;
