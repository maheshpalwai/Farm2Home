import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'
import Navbar from '../components/Navbar'
import { logger } from '../utils/logger'
import { FaBox, FaTruck, FaCheckCircle, FaClock, FaMapMarkerAlt, FaPhone, FaCalendar, FaRupeeSign, FaArrowLeft, FaShoppingBag } from 'react-icons/fa'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    // Real-time listener — list updates instantly when farmer changes order status
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAtMs: d.data().createdAt?.toMillis?.() || Date.now(),
        }))
        setOrders(fetchedOrders)
        setLoading(false)
      },
      (error) => {
        logger.error('Error fetching orders:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: <FaClock />, color: '#ffc107', text: t('pending') || 'Pending' }
      case 'confirmed':
        return { icon: <FaCheckCircle />, color: '#28a745', text: t('confirmed') || 'Confirmed' }
      case 'shipped':
        return { icon: <FaTruck />, color: '#17a2b8', text: t('shipped') || 'Shipped' }
      case 'delivered':
        return { icon: <FaCheckCircle />, color: '#28a745', text: t('delivered') || 'Delivered' }
      default:
        return { icon: <FaClock />, color: '#999', text: status }
    }
  }

  const formatDate = (ms) => {
    if (!ms) return ''
    return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (ms) => {
    if (!ms) return ''
    return new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const OrderCard = ({ order }) => {
    const statusInfo = getStatusInfo(order.status)

    return (
      <div
        style={{ ...orderCard, borderLeft: `5px solid ${statusInfo.color}` }}
        onClick={() => setSelectedOrder(order)}
      >
        <div style={orderHeader}>
          <div>
            <h3 style={orderId}>{t('order') || 'Order'} #{order.id.slice(0, 8).toUpperCase()}</h3>
            <p style={orderDate}>
              <FaCalendar /> {formatDate(order.createdAtMs)} at {formatTime(order.createdAtMs)}
            </p>
          </div>
          <div style={{ ...statusBadge, backgroundColor: statusInfo.color + '20', color: statusInfo.color }}>
            {statusInfo.icon} {statusInfo.text}
          </div>
        </div>

        <div style={orderItems}>
          <div style={itemRow}>
            <span>{order.cropName || 'Product'} × {order.quantity} {order.unit || 'kg'}</span>
            <span>₹{parseFloat(order.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div style={orderFooter}>
          <strong>Total: ₹{parseFloat(order.totalPrice || order.totalAmount || 0).toFixed(2)}</strong>
          <button style={viewDetailsBtn}>View Details</button>
        </div>
      </div>
    )
  }

  const OrderDetails = ({ order }) => {

    // ── Step config ─────────────────────────────────────────────────────────
    // statusOrder drives which steps are "done" vs "future".
    const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered'];
    const currentIndex = STATUS_ORDER.indexOf(order.status);

    const STEPS = [
      {
        key:   'pending',
        label: 'Pending',
        icon:  <FaClock />,
        // The exact pulse spec: rgba(255,191,0,0.7) → rgba(255,191,0,0)
        pulseColor: 'rgba(255,191,0,0.7)',
        activeColor: '#f59e0b',          // amber — active/current
        doneColor:   '#16a34a',          // green  — completed
        pillStyle: { color: '#92400e', background: '#fef3c7' },
        subtitle: `${formatDate(order.createdAtMs)} at ${formatTime(order.createdAtMs)}`,
        futureSubtitle: 'Awaiting order',
      },
      {
        key:   'confirmed',
        label: 'Admin Confirmed',
        icon:  <FaCheckCircle />,
        pulseColor: 'rgba(22,163,74,0.6)',
        activeColor: '#16a34a',
        doneColor:   '#16a34a',
        pillStyle: { color: '#166534', background: '#dcfce7' },
        subtitle: `${formatDate(order.createdAtMs)} at ${formatTime(order.createdAtMs)}`,
        futureSubtitle: 'Awaiting confirmation',
      },
      {
        key:   'shipped',
        label: 'Shipped',
        icon:  <FaTruck />,
        pulseColor: 'rgba(8,145,178,0.6)',
        activeColor: '#0891b2',
        doneColor:   '#16a34a',
        pillStyle: { color: '#155e75', background: '#cffafe' },
        subtitle: `${formatDate(order.createdAtMs)} at ${formatTime(order.createdAtMs)}`,
        futureSubtitle: 'Not yet shipped',
      },
      {
        key:   'delivered',
        label: 'Delivered',
        icon:  <FaCheckCircle />,
        pulseColor: 'rgba(22,163,74,0.6)',
        activeColor: '#16a34a',
        doneColor:   '#16a34a',
        pillStyle: { color: '#166534', background: '#dcfce7' },
        subtitle: `${formatDate(order.createdAtMs)} at ${formatTime(order.createdAtMs)}`,
        futureSubtitle: 'Pending delivery',
      },
    ];

    return (
      <div style={detailsModal} onClick={() => setSelectedOrder(null)}>
        <div style={detailsContent} onClick={(e) => e.stopPropagation()}>
          <button style={closeBtn} onClick={() => setSelectedOrder(null)}>×</button>

          {/* ── Header ── */}
          <div style={{ marginBottom: 8 }}>
            <h2 style={detailsHeading}>Order Details</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>
              Order ID: <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
            </p>
          </div>

          {/* ── Vertical Timeline ─────────────────────────────────────── */}
          <div style={detailsSection}>

            {/* Inject the keyframes once — spec-exact rgba values */}
            <style>{`
              @keyframes pulse {
                0%   { box-shadow: 0 0 0 0   rgba(255, 191, 0, 0.7); }
                70%  { box-shadow: 0 0 0 10px rgba(255, 191, 0, 0);   }
                100% { box-shadow: 0 0 0 0   rgba(255, 191, 0, 0);   }
              }
              @keyframes pulse-green {
                0%   { box-shadow: 0 0 0 0   rgba(22, 163, 74, 0.6); }
                70%  { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0);   }
                100% { box-shadow: 0 0 0 0   rgba(22, 163, 74, 0);   }
              }
              @keyframes pulse-cyan {
                0%   { box-shadow: 0 0 0 0   rgba(8, 145, 178, 0.6); }
                70%  { box-shadow: 0 0 0 10px rgba(8, 145, 178, 0);   }
                100% { box-shadow: 0 0 0 0   rgba(8, 145, 178, 0);   }
              }
            `}</style>

            <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tracking Status
            </h3>

            {/* Stepper — position:relative so the connector line is absolutely placed */}
            <div style={{ position: 'relative' }}>
              {STEPS.map((step, idx) => {
                const stepStatusIndex = STATUS_ORDER.indexOf(step.key);
                const isDone    = stepStatusIndex < currentIndex;   // completed past step
                const isCurrent = stepStatusIndex === currentIndex;  // active now
                const isFuture  = stepStatusIndex > currentIndex;    // not yet reached

                // Circle color: amber if current, green if done, grey if future
                const circleColor = isCurrent ? step.activeColor
                                  : isDone    ? step.doneColor
                                  :             '#d1d5db';

                // Connector line color: green if this step is already done, grey if future
                const lineColor = isDone ? '#16a34a' : '#e5e7eb';
                const isLastStep = idx === STEPS.length - 1;

                // Pulse animation name per step color
                const pulseAnimation =
                  step.key === 'pending'  ? 'pulse 1.8s ease-in-out infinite' :
                  step.key === 'shipped'  ? 'pulse-cyan 1.8s ease-in-out infinite' :
                                            'pulse-green 1.8s ease-in-out infinite';

                return (
                  <div key={step.key} style={{ display: 'flex', gap: 0, opacity: isFuture ? 0.5 : 1, transition: 'opacity 0.3s' }}>

                    {/* ── Left Column: circle + vertical line ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 20, flexShrink: 0 }}>

                      {/* Circle indicator */}
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: circleColor,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                        zIndex: 1,
                        position: 'relative',
                        // Spec-exact pulsing amber ring when current
                        animation: isCurrent ? pulseAnimation : 'none',
                        transition: 'background-color 0.4s',
                      }}>
                        {step.icon}
                      </div>

                      {/* Connector line — stretches to next step */}
                      {!isLastStep && (
                        <div style={{
                          width: 2,
                          flex: 1,
                          minHeight: 40,
                          backgroundColor: lineColor,
                          marginTop: 4,
                          marginBottom: 4,
                          borderRadius: 2,
                          transition: 'background-color 0.4s',
                        }} />
                      )}
                    </div>

                    {/* ── Right Column: label + subtitle ── */}
                    <div style={{ paddingTop: 10, paddingBottom: isLastStep ? 0 : 32, flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: isFuture ? '#9ca3af' : '#111827', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        {step.label}

                        {/* "Current" pill — amber for pending, green/cyan for others */}
                        {isCurrent && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 10px',
                            borderRadius: 50,
                            letterSpacing: '0.3px',
                            ...step.pillStyle,
                          }}>
                            ● Current
                          </span>
                        )}

                        {/* Tick badge for completed steps */}
                        {isDone && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 50 }}>
                            ✓ Done
                          </span>
                        )}
                      </p>

                      <p style={{ margin: 0, fontSize: 12, color: isFuture ? '#d1d5db' : '#6b7280' }}>
                        {(isCurrent || isDone) ? step.subtitle : step.futureSubtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={detailsSection}>
            <h3>Item</h3>
            <div style={detailItem}>
              <div>
                <p style={itemName}>{order.cropName || 'Product'}</p>
                <p style={itemQty}>{order.quantity} {order.unit || 'kg'}</p>
              </div>
              <p style={itemTotal}>₹{parseFloat(order.totalPrice || order.totalAmount || 0).toFixed(2)}</p>
            </div>
          </div>

          <div style={detailsSection}>
            <h3><FaMapMarkerAlt /> Delivery Address</h3>
            {order.shippingAddress && (
              <div style={addressBox}>
                <p><strong>{order.shippingAddress.fullName}</strong></p>
                <p><FaPhone /> {order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.area || order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city} - {order.shippingAddress.pincode}</p>
              </div>
            )}
          </div>

          <div style={detailsSection}>
            <h3>Payment Summary</h3>
            <div style={summaryBox}>
              <div style={{ ...summaryRow, ...summaryTotal }}>
                <strong>Total:</strong>
                <strong>₹{parseFloat(order.totalPrice || order.totalAmount || 0).toFixed(2)}</strong>
              </div>
              <div style={paymentMethodBox}>
                <span>Payment:</span>
                <span style={paymentBadge}>Direct to Farmer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={container}>
      <Navbar />
      <div style={contentWrapper}>
        <h2 style={heading}>
          <FaBox /> {t('orders') || 'My Orders'}
        </h2>
        
        {loading ? (
          <div style={loadingBox}>
            <div style={{ width: 40, height: 40, border: '4px solid #d1fae5', borderTop: '4px solid #16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#6b7280' }}>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={emptyBox}>
            <FaShoppingBag size={64} color="#d1fae5" />
            <p style={emptyText}>No orders yet. Start shopping!</p>
            <p style={{ color: '#9ca3af', fontSize: 15, marginBottom: 24 }}>Browse products and place your first order!</p>
            <button
              onClick={() => navigate('/consumer')}
              style={{ padding: '12px 28px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
            >
              <FaArrowLeft /> Go Shopping
            </button>
          </div>
        ) : (
          <div style={orderList}>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {selectedOrder && <OrderDetails order={selectedOrder} />}
    </div>
  )
}

const container = {
  paddingTop: '80px',
  backgroundColor: '#f5f5f5',
  minHeight: '100vh'
}

const contentWrapper = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px'
}

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  marginBottom: '30px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: '#333'
}

const loadingBox = {
  textAlign: 'center',
  padding: '60px',
  backgroundColor: 'white',
  borderRadius: '12px'
}

const emptyBox = {
  textAlign: 'center',
  padding: '60px',
  backgroundColor: 'white',
  borderRadius: '12px'
}

const emptyText = {
  fontSize: '20px',
  color: '#666',
  margin: '20px 0 8px'
}

const orderList = {
  display: 'grid',
  gap: '20px'
}

const orderCard = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }
}

const orderHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid #eee'
}

const orderId = {
  margin: '0 0 8px 0',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333'
}

const orderDate = {
  margin: 0,
  fontSize: '14px',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const statusBadge = {
  padding: '8px 16px',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const orderItems = {
  marginBottom: '16px'
}

const itemRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  fontSize: '14px'
}

const moreItems = {
  fontSize: '12px',
  color: '#666',
  fontStyle: 'italic',
  margin: '4px 0 0'
}

const orderFooter = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '16px',
  borderTop: '1px solid #eee'
}

const viewDetailsBtn = {
  padding: '8px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
}

const detailsModal = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  overflowY: 'auto'
}

const detailsContent = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '30px',
  maxWidth: '700px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative'
}

const closeBtn = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  background: 'none',
  border: 'none',
  fontSize: '32px',
  cursor: 'pointer',
  color: '#999',
  lineHeight: '1'
}

const detailsHeading = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '24px',
  color: '#333'
}

const detailsSection = {
  marginBottom: '24px',
  paddingBottom: '24px',
  borderBottom: '1px solid #eee'
}

const detailItem = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderBottom: '1px solid #f5f5f5'
}

const itemName = {
  margin: '0 0 4px 0',
  fontSize: '16px',
  fontWeight: 'bold'
}

const itemQty = {
  margin: 0,
  fontSize: '14px',
  color: '#666'
}

const itemTotal = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#28a745'
}

const addressBox = {
  backgroundColor: '#f9f9f9',
  padding: '16px',
  borderRadius: '8px',
  lineHeight: '1.8'
}

const summaryBox = {
  backgroundColor: '#f9f9f9',
  padding: '16px',
  borderRadius: '8px'
}

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0'
}

const summaryTotal = {
  fontSize: '18px',
  paddingTop: '12px',
  marginTop: '8px',
  borderTop: '2px solid #ddd'
}

const paymentMethodBox = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #eee'
}

const paymentBadge = {
  padding: '4px 12px',
  backgroundColor: '#007bff',
  color: 'white',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold'
}

const otpBox = {
  backgroundColor: '#fff3cd',
  border: '2px solid #ffc107',
  padding: '16px',
  borderRadius: '8px',
  textAlign: 'center'
}

const otpNote = {
  margin: '8px 0 0',
  fontSize: '12px',
  color: '#856404'
}

export default OrdersPage
