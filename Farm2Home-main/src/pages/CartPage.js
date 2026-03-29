import { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { FaCheckCircle, FaTruck, FaShoppingBag, FaShieldAlt, FaPlus, FaMinus, FaTrash, FaRegHeart, FaArrowLeft, FaShoppingCart, FaMapMarkerAlt, FaReceipt, FaSpinner } from 'react-icons/fa'
import { GiCarrot, GiCoolSpices, GiGrain, GiFruitTree, GiGreenhouse } from 'react-icons/gi'
import { useCart } from '../features/consumer/hooks/useCart'
import { findCropByKeyword } from '../data/cropData'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../context/ToastContext'
import { auth, db } from '../firebase'
import './CartPage.css'

const CartPage = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    updateItemStatus,
    clearCart 
  } = useCart()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { success, error, warning } = useToast()
  
  const [checkoutStep, setCheckoutStep] = useState('cart') // 'cart', 'address', 'confirmation'
  const [loading, setLoading] = useState(false)
  const [batchOrderId, setBatchOrderId] = useState(null)
  const [activeItems, setActiveItems] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [checkoutItems, setCheckoutItems] = useState([]) // To support single item checkout

  // Local state for snappy UI updates before Firestore syncs
  useEffect(() => {
    setActiveItems(cartItems.filter(i => i.status !== 'saved'))
    setSavedItems(cartItems.filter(i => i.status === 'saved'))
  }, [cartItems])

  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  })

  // Synchronize Navbar badge by calculating sum of quantities
  const totalQuantity = useMemo(() => {
    return activeItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 1), 0)
  }, [activeItems])

  const calculateTotal = useCallback(() => {
    const target = checkoutStep === 'cart' ? activeItems : checkoutItems
    return target.reduce((acc, item) => acc + (parseFloat(item.pricePerKg || item.price || 0) * (parseInt(item.quantity) || 1)), 0)
  }, [activeItems, checkoutItems, checkoutStep])

  const calculateDeliveryCharge = useCallback(() => {
    return calculateTotal() > 500 ? 0 : 40
  }, [calculateTotal])

  const calculateGrandTotal = useCallback(() => {
    return calculateTotal() + calculateDeliveryCharge()
  }, [calculateTotal, calculateDeliveryCharge])

  const generateOrderId = () => {
    return 'ORD' + Date.now() + Math.floor(Math.random() * 1000)
  }

  const handleQtyChange = async (item, delta) => {
    const currentQty = parseInt(item.quantity) || 1
    const newQty = Math.max(0, currentQty + delta)
    console.log(`[Cart] Changing Qty for ${item.id}: ${currentQty} -> ${newQty}`)
    
    if (newQty === 0) {
      console.log(`[Cart] Removing ${item.id} due to zero qty`)
      await removeFromCart(item.id)
      return
    }
    
    // Optimistic UI for immediate feedback
    setActiveItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i))
    
    try {
      await updateQuantity(item.id, newQty)
      // Immediate Navbar sync is handled by useCart dispatching the event
    } catch (err) {
      console.error('[Cart] Qty update fail:', err)
      setActiveItems(cartItems.filter(i => i.status !== 'saved'))
      error(t('update_failed', 'Failed to update quantity'))
    }
  }

  const handleToggleSaved = async (item, status) => {
    setLoading(true)
    try {
      await updateItemStatus(item.id, status)
      success(status === 'saved' ? t('cart_move_to_saved', 'Moved to Saved') : t('cart_move_to_bag', 'Moved to Bag'))
    } catch (err) {
      error(t('error', 'An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  const proceedToAddress = (items = null) => {
    const target = items || activeItems
    if (target.length === 0) {
      warning(t('cart_empty', 'Your cart is empty!'))
      return
    }
    setCheckoutItems(target)
    setCheckoutStep('address')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validateAndPlaceOrder = () => {
    if (!deliveryAddress.fullName || !deliveryAddress.phone || !deliveryAddress.addressLine ||
        !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
      warning(t('fill_address', 'Please fill all address fields'))
      return
    }
    if (deliveryAddress.phone.length !== 10) {
      warning(t('valid_phone') || 'Please enter a valid 10-digit phone number')
      return
    }
    placeOrder()
  }

  const placeOrder = async () => {
    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) {
        warning(t('please_sign_in_to_place_order'))
        setLoading(false)
        return
      }

      const orderId = generateOrderId()
      const batchOrder = {
        orderId,
        customerId: user.uid,
        items: checkoutItems.map(i => ({ ...i, firestoreId: i.id })),
        address: deliveryAddress,
        total: calculateGrandTotal(),
        status: 'Confirmed',
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, 'batch_orders'), batchOrder)
      
      for (const item of checkoutItems) {
        await removeFromCart(item.id)
      }

      setBatchOrderId(orderId)
      setCheckoutStep('confirmation')
    } catch (err) {
      console.error('placeOrder error:', err)
      error(t('order_failed'))
    } finally {
      setLoading(false)
    }
  }

  const renderStepper = () => (
    <div className="progress-stepper">
      <div className={`step-item ${checkoutStep === 'cart' || checkoutStep === 'address' || checkoutStep === 'confirmation' ? 'active' : ''}`}>
        <div className="step-num">1</div>
        <span>{t('cart')}</span>
      </div>
      <div className={`step-line ${checkoutStep === 'address' || checkoutStep === 'confirmation' ? 'active' : ''}`}></div>
      <div className={`step-item ${checkoutStep === 'address' || checkoutStep === 'confirmation' ? 'active' : ''}`}>
        <div className="step-num">2</div>
        <span>{t('address')}</span>
      </div>
      <div className={`step-line ${checkoutStep === 'confirmation' ? 'active' : ''}`}></div>
      <div className={`step-item ${checkoutStep === 'confirmation' ? 'active' : ''}`}>
        <div className="step-num">3</div>
        <span>{t('confirmation')}</span>
      </div>
    </div>
  )

  const getProductIcon = (name) => {
    const entry = (name || '').toLowerCase()
    if (entry.includes('carrot') || entry.includes('veg')) return <GiCarrot />
    if (entry.includes('spice')) return <GiCoolSpices />
    if (entry.includes('rice') || entry.includes('wheat')) return <GiGrain />
    if (entry.includes('fruit') || entry.includes('apple')) return <GiFruitTree />
    return <GiGreenhouse />
  }

  const renderCart = () => {
    const totalItems = activeItems.length
    const rawTotal = calculateTotal()
    const originalTotal = rawTotal * 1.25
    const savings = originalTotal - rawTotal

    return (
      <div className="cart-content-wrapper">
        {renderStepper()}
        {totalItems === 0 && savedItems.length === 0 ? (
          <div className="empty-view" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <FaShoppingBag size={120} color="#e5e7eb" />
            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: '20px 0 10px' }}>{t('cart_empty')}</h3>
            <button onClick={() => navigate('/consumer')} className="place-order-btn-full" style={{ maxWidth: 300, margin: '30px auto' }}>
              {t('shop_now', 'Explore Marketplace')}
            </button>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items-panel">
              {totalItems > 0 ? (
                <>
                  <div className="billing-head" style={{ marginBottom: '25px' }}>
                    {t('cart_title')} ({totalQuantity} {t('cd_items')})
                  </div>
                  
                  {activeItems.map((item, index) => {
                    const itemId = item.id || index
                    const unitPrice = parseFloat(item.pricePerKg || item.price) || 0
                    const quantity = parseInt(item.quantity) || 1
                    const itemTotal = unitPrice * quantity
                    const farmer = item.farmerName || t('local_farmer')
                    const unit = item.unit || 'kg'
                    const cropMatch = findCropByKeyword(item.name || item.cropName || '')
                    const img = cropMatch?.image || item.photoURL || item.image

                    return (
                      <div key={itemId} className="cart-item-modern">
                        <div className="item-visual">
                          <div className="item-img-frame">
                            {img ? <img src={img} alt={item.name} /> : <div className="placeholder-icon">{getProductIcon(item.name || item.cropName)}</div>}
                          </div>
                          <div className="modern-qty-pod">
                            <button onClick={() => handleQtyChange(item, -1)} className="qty-btn-minimal" disabled={loading}><FaMinus /></button>
                            <span className="qty-display">{quantity}</span>
                            <button onClick={() => handleQtyChange(item, 1)} className="qty-btn-minimal" disabled={loading}><FaPlus /></button>
                          </div>
                        </div>
                        
                        <div className="item-copy">
                          <h3 style={{ color: '#2563eb' }}>{item.name || item.cropName || item.crop}</h3>
                          <div className="meta-info">
                            <div style={{ marginBottom: '4px' }}>
                               <span className="meta-label">{t('farmer_name')}: </span> 
                               <span className="meta-value" style={{ fontWeight: 700, color: '#1e293b' }}>{farmer}</span>
                            </div>
                            <div><span className="meta-label">{t('quantity')}: </span> <span className="meta-unit">{unit}</span></div>
                          </div>
                          <div className="pricing">
                            <span className="price-main">₹{itemTotal.toFixed(0)}</span>
                            <span className="price-strike">₹{(itemTotal * 1.25).toFixed(0)}</span>
                            <span className="price-off">25% {t('off', 'OFF')}</span>
                          </div>
                          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '15px', paddingTop: '15px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <button onClick={() => proceedToAddress([item])} className="buy-individual-btn">
                              {t('cart_buy_btn')}
                            </button>
                            <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FaTrash size={10} /> {t('cart_remove_btn')}
                            </button>
                            <button 
                              onClick={() => {
                                handleToggleSaved(item, 'saved')
                              }} 
                              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              <FaRegHeart size={10} /> {t('cart_save_btn')}
                            </button>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="meta-label" style={{fontSize: '11px', textTransform: 'uppercase'}}>{t('unit_price')}</div>
                            <div style={{ fontSize: '18px', fontWeight: 800 }}>₹{unitPrice}</div>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <FaShoppingCart size={40} color="#e2e8f0" style={{ marginBottom: '15px' }} />
                  <p style={{ color: '#64748b', fontWeight: 600 }}>{t('basket_is_empty')}</p>
                </div>
              )}

              {savedItems.length > 0 && (
                <div className="saved-section">
                   <div className="saved-head"><FaRegHeart color="#ec4899" /> {t('saved_for_later')} ({savedItems.length})</div>
                   {savedItems.map((item) => (
                      <div key={item.id} className="cart-item-modern saved">
                        <div className="item-visual">
                          <div className="item-img-frame">
                            <img src={findCropByKeyword(item.name)?.image || item.photoURL} alt={item.name} />
                          </div>
                        </div>
                        <div className="item-copy">
                          <h3>{item.name}</h3>
                          <div className="meta-info">
                            <span className="meta-value">₹{item.pricePerKg || item.price} / {item.unit}</span>
                          </div>
                          <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                            <button onClick={() => handleToggleSaved(item, 'active')} className="place-order-btn-full" style={{ padding: '8px 20px', fontSize: '12px', width: 'auto', marginTop: 0 }}>
                              {t('cart_move_to_bag')}
                            </button>
                            <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              {t('cart_remove_btn')}
                            </button>
                          </div>
                        </div>
                      </div>
                   ))}
                </div>
              )}
            </div>

            <div className="billing-card">
              <div className="billing-head">{t('cart_billing_summary')}</div>
              <div className="bill-line">
                <span className="bill-label">{t('cart_item_count')}</span>
                <span className="bill-val">{totalQuantity} {t('cd_items')}</span>
              </div>
              <div className="bill-line">
                <span className="bill-label">{t('cart_gross')}</span>
                <span className="bill-val strike">₹{originalTotal.toFixed(0)}</span>
              </div>
              <div className="bill-line">
                <span className="bill-label">{t('cart_savings')}</span>
                <span className="bill-val green">- ₹{savings.toFixed(0)}</span>
              </div>
              <div className="bill-line">
                <span className="bill-label">{t('cart_shipping')}</span>
                <span className="bill-val green">{calculateDeliveryCharge() === 0 ? t('free') : `₹${calculateDeliveryCharge()}`}</span>
              </div>
              
              <div className="bill-total-row">
                <span>{t('cart_total')}</span>
                <span>₹{calculateGrandTotal().toFixed(0)}</span>
              </div>
              
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', color: '#059669', fontSize: '13px', fontWeight: 700, textAlign: 'center', marginTop: '20px', border: '1px solid #dcfce7' }}>
                 🌟 {t('cart_savings_summary')}: ₹{savings.toFixed(0)} 🌟
              </div>

              <button onClick={() => proceedToAddress()} className="place-order-btn-full" disabled={totalItems === 0}>
                {t('place_order')}
              </button>
              
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                <FaShieldAlt color="#059669" /> {t('cart_secure_msg')}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderAddress = () => (
    <div className="cart-content-wrapper">
      {renderStepper()}
      <div className="address-layout">
          <div className="billing-head" style={{ marginBottom: '30px' }}>
            <FaMapMarkerAlt /> {t('shipping_info', 'Secure Checkout: Shipping Information')}
          </div>
          <div className="address-grid">
              <div className="field-group">
                <label>{t('full_name')}</label>
                <input type="text" className="field-input" placeholder="Full Name" value={deliveryAddress.fullName} onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})} />
              </div>
              <div className="field-group">
                <label>{t('phone_number')}</label>
                <input type="tel" className="field-input" placeholder="Contact number" value={deliveryAddress.phone} onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})} maxLength="10" />
              </div>
          </div>
          <div className="field-group">
            <label>{t('detailed_address', 'Apartment, Street, Area')}</label>
            <textarea className="field-input" style={{ minHeight: '100px', resize: 'none' }} placeholder="Full delivery address" value={deliveryAddress.addressLine} onChange={(e) => setDeliveryAddress({...deliveryAddress, addressLine: e.target.value})} />
          </div>
          <div className="address-grid">
              <div className="field-group">
                <label>{t('city')}</label>
                <input type="text" className="field-input" placeholder="City" value={deliveryAddress.city} onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})} />
              </div>
              <div className="field-group">
                <label>{t('state')}</label>
                <input type="text" className="field-input" placeholder="State/Region" value={deliveryAddress.state} onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})} />
              </div>
              <div className="field-group">
                <label>{t('pincode')}</label>
                <input type="text" className="field-input" placeholder="6-digit Pin" value={deliveryAddress.pincode} onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})} maxLength="6" />
              </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
              <button onClick={() => setCheckoutStep('cart')} className="place-order-btn-full" style={{ background: '#f1f5f9', color: '#1e293b', boxShadow: 'none' }}>
                <FaArrowLeft /> {t('back')}
              </button>
              <button onClick={validateAndPlaceOrder} className="place-order-btn-full">
                <FaCheckCircle /> {t('place_order', 'Place Order')}
              </button>
          </div>
      </div>
    </div>
  )

  const renderConfirmation = () => (
    <div className="cart-content-wrapper">
      {renderStepper()}
      <div className="address-layout" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ background: '#f0fdf4', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
            <FaCheckCircle size={50} color="#059669" />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b' }}>{t('cart_order_success')}</h2>
          <p style={{ color: '#64748b', fontSize: '18px', margin: '20px 0 40px' }}>#{batchOrderId}</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/orders')} className="place-order-btn-full" style={{ maxWidth: 220, background: '#f1f5f9', color: '#1e293b', boxShadow: 'none' }}>
                <FaReceipt /> {t('cart_view_orders')}
              </button>
              <button onClick={() => navigate('/consumer')} className="place-order-btn-full" style={{ maxWidth: 220 }}>
                {t('cart_continue')}
              </button>
          </div>
      </div>
    </div>
  )

  return (
    <div className="cart-page-container">
      {checkoutStep === 'cart' && renderCart()}
      {checkoutStep === 'address' && renderAddress()}
      {checkoutStep === 'confirmation' && renderConfirmation()}
    </div>
  )
}

export default CartPage
