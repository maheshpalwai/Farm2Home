import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebase';
import { findCropByKeyword } from '../../../data/cropData';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  FaLeaf, FaHandshake, FaRupeeSign, FaTruck,
  FaShieldAlt, FaHeart, FaBox,
  FaUsers, FaCheckCircle, FaSearch, FaThLarge,
  FaSlidersH, FaPlusCircle, FaMapMarkerAlt, FaCoins,
  FaStar, FaPhone, FaRobot, FaBell, FaChevronRight,
  FaRegClock, FaLock, FaFlag, FaEdit, FaTrash, FaSave, FaTimes as FaX, FaComments, FaCalendarAlt,
} from 'react-icons/fa';
import ChatModal from '../../../shared/components/ChatModal/ChatModal';
import ProductCard from '../components/ProductCard/ProductCard';
import SearchBar from '../components/Filters/SearchBar';
import FilterSection from '../components/Filters/FilterSection';
import RequestCropModal from '../components/RequestCropModal/RequestCropModal';
import ComplaintModal from '../../../shared/components/ComplaintModal/ComplaintModal';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../hooks/useFavorites';
import { useFilters } from '../hooks/useFilters';
import { useProducts } from '../hooks/useProducts';
import { useMarketDemands } from '../hooks/useMarketDemands';
import { useToast } from '../../../context/ToastContext';
import './ConsumerDashboard.css';

const AVATAR_PALETTE = ['#FFBF00','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#BE6DB7','#F7A738','#2ECC71'];
const getAvatarColor = (name) => AVATAR_PALETTE[((name||'U').charCodeAt(0)-65+26)%AVATAR_PALETTE.length];
const getGreeting = () => { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };
const formatRelTime = (ts) => {
  if (!ts) return null;
  const date = ts?.toDate ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const getDemandUnit = (demand) => demand?.quantityUnit || 'kg';

const ConsumerDashboard = () => {
  const navigate = useNavigate();
  const { products: firestoreProducts, loading } = useProducts({ realtime: true });
  const productsToUse = firestoreProducts;
  const { addToCart, getTotalItems } = useCart();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, sortBy, setSortBy, organicOnly, setOrganicOnly, filteredProducts, resetFilters } = useFilters(productsToUse);
  const [userProfile, setUserProfile] = useState({ name:'', photoURL:'', email:'', phone:'' });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ name:'', phone:'' });
  const [editProfileSaving, setEditProfileSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedProductForRequest, setSelectedProductForRequest] = useState(null);
  const [editingDemand, setEditingDemand] = useState(null);
  const { myDemands, submitDemand, rejectOffer, acceptOffer, preponePickupDate, markReceived, submitReview, deleteDemand, updateDemand, cancelDeal } = useMarketDemands();
  const { success: toastSuccess, error: toastError } = useToast();
  const [complaintTarget, setComplaintTarget] = useState(null);
  const [reportedDemandIds, setReportedDemandIds] = useState(new Set());
  const [reviewData, setReviewData] = useState({}); // { [demandId]: { rating, comment, submitting, error } }
  const [activeChatDemand, setActiveChatDemand] = useState(null);
  // Accept date modal
  const [acceptDateModal, setAcceptDateModal] = useState(null); // demandId or null
  const [pickupDateInput, setPickupDateInput] = useState('');
  // Prepone date modal
  const [preponeDealId, setPreponeDealId] = useState(null);
  const [preponeDate, setPreponeDate] = useState('');
  const categorySectionRef = useRef(null);
  const prevDemandsRef = useRef({});

  // Fetch already-reported demand IDs for this user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDocs(query(collection(db, 'complaints'), where('reporterId', '==', user.uid)))
      .then(snap => {
        const ids = new Set();
        snap.forEach(d => { if (d.data().contextId) ids.add(d.data().contextId); });
        setReportedDemandIds(ids);
      })
      .catch(() => {});
  }, []);

  // Notify consumer when farmer submits an offer
  useEffect(() => {
    myDemands.forEach(d => {
      const prev = prevDemandsRef.current[d.id];
      if (prev && prev.status === 'open' && d.status === 'quoted') {
        toastSuccess(`🎉 A farmer submitted an offer for your "${d.cropName}" request! Review it below.`);
      }
      prevDemandsRef.current[d.id] = { status: d.status };
    });
  }, [myDemands]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let unsubSnap = null;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubSnap) { try { unsubSnap(); } catch (_) {} unsubSnap = null; }
      if (!user) return;
      unsubSnap = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          const d = snap.data() || {};
          setUserProfile({ name: d.name||user.displayName||user.email?.split('@')[0]||'there', photoURL: d.photoURL||user.photoURL||'', email: user.email||'', phone: d.phoneNumber||d.phone||'' });
        },
        (err) => console.warn('ConsumerDashboard profile snapshot error:', err.message)
      );
    });
    return () => {
      try { unsubAuth(); } catch (_) {}
      if (unsubSnap) { try { unsubSnap(); } catch (_) {} }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!categorySectionRef.current) return;
      const catBottom = categorySectionRef.current.getBoundingClientRect().bottom;
      const footer = document.querySelector('.cd-footer');
      const footerVisible = footer ? footer.getBoundingClientRect().top <= window.innerHeight - 60 : false;
      setShowSidebar(catBottom <= 100 && !footerVisible);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { name:'All',             image:'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400', id:'all' },
    { name:'Fruits',          image:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400', id:'fruits' },
    { name:'Grains & Pulses', image:'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', id:'grains-pulses' },
    { name:'Leafy Greens',    image:'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400', id:'leafy-greens' },
    { name:'Spices',          image:'https://images.unsplash.com/photo-1596040033229-a0b83fd2f6dd?w=400', id:'spices' },
    { name:'Vegetables',      image:'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400', id:'vegetables' },
  ];

  const handleOpenEditProfile = () => {
    setEditProfileData({ name: userProfile.name, phone: userProfile.phone });
    setShowEditProfile(true);
  };

  const handleSaveEditProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const cleanPhone = editProfileData.phone.replace(/\D/g, '');
    if (!editProfileData.name.trim()) { toastError('Name cannot be empty'); return; }
    if (!cleanPhone || cleanPhone.length !== 10) { toastError('Enter a valid 10-digit phone number'); return; }
    setEditProfileSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editProfileData.name.trim(),
        phoneNumber: cleanPhone,
        phone: cleanPhone,
        updatedAt: new Date().toISOString(),
      });
      toastSuccess('Profile updated successfully!');
      setShowEditProfile(false);
    } catch (err) {
      toastError('Failed to save profile: ' + err.message);
    } finally {
      setEditProfileSaving(false);
    }
  };

  const cartCount    = getTotalItems();
  const favCount     = favorites.length;
  const organicCount = productsToUse.filter(p => p.organic).length;
  const firstName    = (userProfile.name||'').split(' ')[0] || 'there';
  const activeDemandsCount = myDemands.filter(d => d.status === 'open' || d.status === 'quoted' || d.status === 'in_progress').length;

  const STATUS_CONFIG = {
    open:        { label:'Waiting for Offer',     bg:'#eff6ff', color:'#1d4ed8', dot:'#3b82f6', icon:'', step:1 },
    quoted:      { label:'Offer Received',        bg:'#fef3c7', color:'#b45309', dot:'#f59e0b', icon:'', step:2 },
    deal_closed: { label:'Deal Accepted',         bg:'#d1fae5', color:'#065f46', dot:'#10b981', icon:'', step:3 },
    in_progress: { label:'On the Way',            bg:'#ede9fe', color:'#6d28d9', dot:'#7c3aed', icon:'', step:4 },
    completed:   { label:'Received & Completed',  bg:'#dcfce7', color:'#15803d', dot:'#16a34a', icon:'', step:5 },
  };

  return (
    <div className="cd-root">
      {showRequestModal && <RequestCropModal onClose={() => { setShowRequestModal(false); setSelectedProductForRequest(null); }} onSubmit={submitDemand} initialProduct={selectedProductForRequest} />}
      {editingDemand && (
        <RequestCropModal
          editMode
          initialData={editingDemand}
          onClose={() => setEditingDemand(null)}
          onSubmit={async (formData) => {
            const res = await updateDemand(editingDemand.id, formData);
            if (res.success) setEditingDemand(null);
            return res;
          }}
        />
      )}
      {complaintTarget && (
        <ComplaintModal
          reportedUser={{ id: complaintTarget.id, name: complaintTarget.name, role: 'farmer' }}
          contextId={complaintTarget.demandId}
          onClose={() => setComplaintTarget(null)}
          onSuccess={(demandId) => setReportedDemandIds(prev => new Set([...prev, demandId]))}
        />
      )}
      {activeChatDemand && (
        <ChatModal demand={activeChatDemand} currentRole="consumer" onClose={() => setActiveChatDemand(null)} />
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditProfile && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setShowEditProfile(false)}>
          <div style={{ background:'white', borderRadius:16, padding:28, width:'100%', maxWidth:420, boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1f2937' }}>Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:18 }}><FaX /></button>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5, color:'#374151' }}>Email (read-only)</label>
              <input type="email" value={userProfile.email} readOnly style={{ width:'100%', padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:14, background:'#f9fafb', color:'#6b7280', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5, color:'#374151' }}>Full Name</label>
              <input
                type="text"
                value={editProfileData.name}
                onChange={e => setEditProfileData(p => ({ ...p, name: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }}
                placeholder="Your full name"
              />
            </div>
            <div style={{ marginBottom:22 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5, color:'#374151' }}>Phone Number <span style={{color:'#dc2626'}}>*</span></label>
              <input
                type="tel"
                value={editProfileData.phone}
                onChange={e => setEditProfileData(p => ({ ...p, phone: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }}
                placeholder="10-digit mobile number"
                maxLength={15}
              />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={handleSaveEditProfile}
                disabled={editProfileSaving}
                style={{ flex:1, padding:'10px', background: editProfileSaving ? '#9ca3af' : '#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor: editProfileSaving ? 'not-allowed' : 'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                <FaSave style={{ fontSize:13 }} /> {editProfileSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setShowEditProfile(false)} style={{ padding:'10px 16px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY NAVBAR */}
      {/* HERO */}
      <section className="cd-hero">
        <div className="cd-hero-bg"></div>
        <div className="cd-hero-overlay"></div>
        <div className="cd-hero-content">
          <h1 className="cd-hero-title">
            Fresh from the Farm,<br />
            <span className="cd-hero-highlight">Straight to Your Door</span>
          </h1>
          <p className="cd-hero-sub">
            {getGreeting()}, <strong>{firstName}</strong>! Discover locally-sourced produce from farmers near you -- no middlemen, pure freshness.
          </p>
          <div className="cd-hero-search">
            <FaSearch className="cd-hs-icon" />
            <input className="cd-hs-input" placeholder="Search rice, tomato, mango, wheat..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="cd-hero-pills">
            {['Tomato','Onion','Rice','Mango','Wheat'].map(q => (
              <button key={q} className="cd-hero-pill" onClick={() => setSearchTerm(q)}>{q}</button>
            ))}
          </div>
        </div>
        <div className="cd-hero-stats">
          <div className="cd-hs-stat"><span className="cd-hs-num">{productsToUse.length}+</span><span className="cd-hs-lbl">Products</span></div>
          <div className="cd-hs-divider"></div>
          <div className="cd-hs-stat"><span className="cd-hs-num">{organicCount}</span><span className="cd-hs-lbl">Organic</span></div>
          <div className="cd-hs-divider"></div>
          <div className="cd-hs-stat"><span className="cd-hs-num">150+</span><span className="cd-hs-lbl">Farmers</span></div>
          <div className="cd-hs-divider"></div>
          <div className="cd-hs-stat"><span className="cd-hs-num">Rs.500+</span><span className="cd-hs-lbl">Free Delivery</span></div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="cd-trust">
        {[
          {icon:<FaShieldAlt/>, label:'Safe & Hygienic',   color:'#16a34a'},
          {icon:<FaLeaf/>,      label:'Farm Fresh Daily',  color:'#16a34a'},
          {icon:<FaHandshake/>, label:'Support Farmers',   color:'#7c3aed'},
          {icon:<FaStar/>,      label:'Quality Assured',   color:'#d97706'},
        ].map((t,i) => (
          <div key={i} className="cd-trust-item">
            <span className="cd-trust-icon" style={{color:t.color}}>{t.icon}</span>
            <span className="cd-trust-label">{t.label}</span>
          </div>
        ))}
      </div>

      <div className="cd-container">

        {/* CROP REQUEST SECTION */}
        <section className="cd-request-section">
          <div className="cd-section-header">
            <div className="cd-section-title-wrap">
              <div>
                <h2 className="cd-section-title">Request a Crop</h2>
                <p className="cd-section-sub">Can't find what you need? Ask farmers directly</p>
              </div>
            </div>
            <button className="cd-request-btn" onClick={() => setShowRequestModal(true)}>
              <FaPlusCircle /> New Request
            </button>
          </div>

          {myDemands.length === 0 ? (
            <div className="cd-empty-requests">
              <h3>No requests yet</h3>
              <p>Submit your first request -- farmers in your area will bid with their best price.</p>
              <button className="cd-request-btn cd-request-btn--lg" onClick={() => setShowRequestModal(true)}>
                <FaPlusCircle /> Request a Crop Now
              </button>
            </div>
          ) : (
            (() => {
              const PRIORITY = {3:0, 2:1, 1:2, 4:3, 5:4};
              const GROUP_LABELS = {
                3: { label:'Deal Accepted', color:'#065f46', bg:'#d1fae5', border:'#6ee7b7' },
                2: { label:'Offer Received', color:'#b45309', bg:'#fef3c7', border:'#fde68a' },
                1: { label:'Waiting for Offer', color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe' },
                4: { label:'In Progress / Completed', color:'#6d28d9', bg:'#ede9fe', border:'#c4b5fd' },
              };
              const getStep = d => (STATUS_CONFIG[d.status] || {step:0}).step;
              const getGroup = d => { const s = getStep(d); return s >= 4 ? 4 : s; };
              const sorted = [...myDemands].sort((a,b) => {
                const pa = PRIORITY[getGroup(a)] ?? 99;
                const pb = PRIORITY[getGroup(b)] ?? 99;
                return pa - pb;
              });
              const groups = [3,2,1,4].map(g => ({
                key: g,
                meta: GROUP_LABELS[g],
                items: sorted.filter(d => getGroup(d) === g),
              })).filter(g => g.items.length > 0);
              return groups.map((group, gi) => (
                <div key={group.key}>
                  <div style={{display:'flex', alignItems:'center', gap:10, margin: gi===0 ? '0 0 10px 0' : '18px 0 10px 0'}}>
                    <div style={{flex:1, height:1.5, background: group.meta.border, borderRadius:2}}></div>
                    <span style={{fontSize:11, fontWeight:700, color: group.meta.color, background: group.meta.bg, border:`1px solid ${group.meta.border}`, borderRadius:20, padding:'3px 12px', whiteSpace:'nowrap'}}>
                      {group.meta.label} ({group.items.length})
                    </span>
                    <div style={{flex:1, height:1.5, background: group.meta.border, borderRadius:2}}></div>
                  </div>
                  <div className="cd-demand-cards">
                    {group.items.map(demand => {
                const sc = STATUS_CONFIG[demand.status] || {label:demand.status, bg:'#f3f4f6', color:'#374151', dot:'#9ca3af', icon:'•', step:0};
                return (
                  <div key={demand.id} className={`cd-demand-card cd-demand-card--${demand.status}`}>

                    {/* Progress bar */}
                    <div className="cd-demand-progress">
                      {[1,2,3,4].map(s => (
                        <div key={s} className={`cd-dp-step ${sc.step >= s ? 'cd-dp-step--done' : ''}`}>
                          <div className="cd-dp-dot"></div>
                          {s < 4 && <div className={`cd-dp-line ${sc.step > s ? 'cd-dp-line--done' : ''}`}></div>}
                        </div>
                      ))}
                    </div>

                    {/* Header */}
                    {demand.status !== 'quoted' && <div className="cd-demand-head">
                      {demand.status === 'open' ? (
                        /* Open card: full-width structured layout */
                        <div style={{width:'100%'}}>
                          {/* Row 1: crop image + name | status chip */}
                          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6}}>
                            <div style={{display:'flex', alignItems:'center', gap:10}}>
                              <div className="cd-demand-icon">
                                {(() => {
                                  const cropEntry = findCropByKeyword(demand.cropName?.toLowerCase?.() || '');
                                  const imgSrc = cropEntry?.image;
                                  return imgSrc
                                    ? <img src={imgSrc} alt={demand.cropName} style={{width:44,height:44,borderRadius:10,objectFit:'cover',display:'block'}} />
                                    : <FaLeaf style={{color:'#16a34a',fontSize:22}} />;
                                })()}
                              </div>
                              <div className="cd-demand-name">{demand.cropName}</div>
                            </div>
                            <div className="cd-demand-chip" style={{background:sc.bg, color:sc.color}}>
                              <span>{sc.icon}</span> {sc.label}
                            </div>
                          </div>
                          {/* Row 2: qty left | location right */}
                          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'#6b7280', marginBottom:8, paddingLeft:54}}>
                            <span style={{display:'flex',alignItems:'center',gap:3}}><FaBox style={{fontSize:9}}/>{demand.quantityKg} {getDemandUnit(demand)}</span>
                            {demand.location && <span style={{display:'flex',alignItems:'center',gap:3}}><FaMapMarkerAlt style={{fontSize:9, color:'#ef4444'}}/>{demand.location}</span>}
                          </div>
                          {/* Row 3: edit + delete */}
                          <div style={{display:'flex', alignItems:'center', gap:6, paddingLeft:54}}>
                            <button
                              title="Edit Request"
                              onClick={() => setEditingDemand(demand)}
                              style={{display:'flex',alignItems:'center',gap:3,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#2563eb',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}
                            >
                              <FaEdit style={{fontSize:10}}/> Edit
                            </button>
                            <button
                              title="Delete Request"
                              onClick={async () => {
                                if (!window.confirm('Delete this request?')) return;
                                const res = await deleteDemand(demand.id);
                                if (!res.success) toastError(res.error || 'Failed to delete');
                              }}
                              style={{display:'flex',alignItems:'center',gap:3,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}
                            >
                              <FaTrash style={{fontSize:10}}/> Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Other statuses: original layout */
                        <>
                          <div className="cd-demand-crop-info">
                            <div className="cd-demand-icon">
                              {(() => {
                                const cropEntry = findCropByKeyword(demand.cropName?.toLowerCase?.() || '');
                                const imgSrc = cropEntry?.image;
                                return imgSrc
                                  ? <img src={imgSrc} alt={demand.cropName} style={{width:44,height:44,borderRadius:10,objectFit:'cover',display:'block'}} />
                                  : <FaLeaf style={{color:'#16a34a',fontSize:22}} />;
                              })()}
                            </div>
                            <div>
                              <div className="cd-demand-name">{demand.cropName}</div>
                              <div style={{fontSize:11, color:'#6b7280', marginTop:2, display:'flex', alignItems:'center', gap:6}}>
                                <span><FaBox style={{fontSize:9, marginRight:3}}/>{demand.quantityKg} {getDemandUnit(demand)}</span>
                                {demand.location && <span><FaMapMarkerAlt style={{fontSize:9, marginRight:2, color:'#ef4444'}}/>{demand.location}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="cd-demand-chip" style={{background:sc.bg, color:sc.color}}>
                            <span>{sc.icon}</span> {sc.label}
                          </div>
                        </>
                      )}
                    </div>}

                    {/* AI price */}
                    {demand.suggestedPriceMin && demand.suggestedPriceMax && (
                      <div className="cd-ai-badge">
                        <FaRobot className="cd-ai-icon" />
                        <span>AI Fair Price: <strong>Rs.{demand.suggestedPriceMin}--Rs.{demand.suggestedPriceMax}/{getDemandUnit(demand)}</strong></span>
                        {demand.suggestedPriceNote && <span className="cd-ai-note"> · {demand.suggestedPriceNote}</span>}
                      </div>
                    )}

                    {/* Farmer offer box */}
                    {demand.status === 'quoted' && demand.farmerOfferPrice && (
                      <div style={{ marginTop:12, background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:12, padding:'12px' }}>

                        {/* Row 0: crop image + name (left) | location (right) */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', background:'#f0fdf4', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {(() => {
                                const cropEntry = findCropByKeyword(demand.cropName?.toLowerCase?.() || '');
                                return cropEntry?.image
                                  ? <img src={cropEntry.image} alt={demand.cropName} style={{width:44,height:44,objectFit:'cover',display:'block'}} />
                                  : <FaLeaf style={{color:'#16a34a',fontSize:20}} />;
                              })()}
                            </div>
                            <span style={{ fontSize:15, fontWeight:700, color:'#111827', textTransform:'capitalize' }}>{demand.cropName}</span>
                          </div>
                          <span style={{ fontSize:12, color:'#6b7280', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                            <FaMapMarkerAlt style={{ color:'#ef4444', fontSize:11 }} />{demand.location}
                          </span>
                        </div>

                        {/* Row 2: farmer name (left) | phone (right) */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:'#0ea5e9' }}>{demand.committedFarmerName || 'A Farmer'}</span>
                            {(demand.farmerTotalDeals || 0) >= 5 && (
                              <span className="cd-verified-badge">✓ Verified</span>
                            )}
                          </div>
                          <a href={`tel:${demand.farmerPhone}`} style={{ fontSize:12, fontWeight:600, color:'#b45309', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                            <FaPhone style={{ fontSize:11 }} />{demand.farmerPhone || 'Not provided'}
                          </a>
                        </div>
                        {/* Row 3: QTY | RATE | TOTAL */}
                        {demand.farmerAvailableUntil && (
                          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:'#7c3aed', background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:7, padding:'5px 9px', marginBottom:8 }}>
                            <FaCalendarAlt style={{ fontSize:10 }} />
                            Farmer has crop until: <strong>{new Date(demand.farmerAvailableUntil + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</strong>
                          </div>
                        )}
                        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                          <div style={{ flex:1, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                            <div style={{ fontSize:10, color:'#1e40af', fontWeight:600, marginBottom:2 }}>QTY</div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#1d4ed8' }}>{demand.quantityKg}<span style={{ fontSize:10 }}> {getDemandUnit(demand)}</span></div>
                          </div>
                          <div style={{ flex:1, background:'#fefce8', border:'1px solid #fde68a', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                            <div style={{ fontSize:10, color:'#92400e', fontWeight:600, marginBottom:2 }}>RATE</div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#b45309' }}>₹{demand.farmerOfferDisplay || demand.farmerOfferPrice}<span style={{ fontSize:10 }}>/{demand.farmerOfferUnit || getDemandUnit(demand)}</span></div>
                          </div>
                          <div style={{ flex:1, background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
                            <div style={{ fontSize:10, color:'#166534', fontWeight:600, marginBottom:2 }}>TOTAL</div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>₹{(demand.quantityKg * demand.farmerOfferPrice).toLocaleString()}</div>
                          </div>
                        </div>
                        {/* Row 4: Accept | Chat */}
                        <div style={{ display:'flex', gap:6 }}>
                          <button
                            onClick={() => {
                              setAcceptDateModal(demand.id);
                              setPickupDateInput('');
                            }}
                            style={{ flex:1, padding:'8px 4px', background:'#f0fdf4', color:'#15803d', border:'1.5px solid #86efac', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}
                          >
                            <FaCheckCircle style={{fontSize:11}}/> Accept
                          </button>
                          <button
                            className="chat-trigger-btn"
                            style={{ flex:1, justifyContent:'center', padding:'8px 4px', fontSize:12 }}
                            onClick={() => setActiveChatDemand(demand)}
                          >
                            <FaComments style={{ fontSize:11, marginRight:3 }} /> Chat
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Contact reveal — shown once deal is accepted */}
                    {['deal_closed','in_progress','completed'].includes(demand.status) && (
                      <div className="cd-contact-panel">
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:8}}>
                          <div style={{display:'flex', alignItems:'center', gap:6}}>
                            <div className="cd-contact-farmer" style={{margin:0, color:'#0ea5e9', fontWeight:700, fontSize:14}}>{demand.committedFarmerName}</div>
                            {(demand.farmerTotalDeals || 0) >= 5 && (
                              <span className="cd-verified-badge">✓ Verified</span>
                            )}
                          </div>
                          <a className="cd-contact-phone" href={`tel:${demand.farmerPhone}`} style={{margin:0, color:'#b45309', fontWeight:600, fontSize:12}}>
                            <FaPhone style={{marginRight:6}}/>{demand.farmerPhone || 'Not provided'}
                          </a>
                        </div>
                        {/* Agreed price partitions */}
                        <div style={{display:'flex', gap:6, marginBottom:8}}>
                          <div style={{flex:1, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'6px 10px', textAlign:'center'}}>
                            <div style={{fontSize:10, color:'#1e40af', fontWeight:600, marginBottom:2}}>QTY</div>
                            <div style={{fontSize:14, fontWeight:700, color:'#1d4ed8'}}>{demand.quantityKg}<span style={{fontSize:10, fontWeight:500}}> {getDemandUnit(demand)}</span></div>
                          </div>
                          <div style={{flex:1, background:'#fefce8', border:'1px solid #fde68a', borderRadius:8, padding:'6px 10px', textAlign:'center'}}>
                            <div style={{fontSize:10, color:'#92400e', fontWeight:600, marginBottom:2}}>RATE</div>
                            <div style={{fontSize:14, fontWeight:700, color:'#b45309'}}>₹{demand.farmerOfferDisplay || demand.farmerOfferPrice}<span style={{fontSize:10, fontWeight:500, color:'#78350f'}}>/{demand.farmerOfferUnit || getDemandUnit(demand)}</span></div>
                          </div>
                          <div style={{flex:1, background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'6px 10px', textAlign:'center'}}>
                            <div style={{fontSize:10, color:'#166534', fontWeight:600, marginBottom:2}}>TOTAL</div>
                            <div style={{fontSize:14, fontWeight:700, color:'#15803d'}}>₹{((demand.quantityKg||0)*(demand.farmerOfferPrice||0)).toLocaleString()}</div>
                          </div>
                        </div>
                        {/* Pickup Date + Prepone */}
                        {['deal_closed','in_progress'].includes(demand.status) && (
                          <div style={{background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:9, padding:'9px 12px', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap'}}>
                            <div style={{display:'flex', alignItems:'center', gap:6}}>
                              <FaCalendarAlt style={{color:'#15803d', fontSize:12}}/>
                              <span style={{fontSize:12, fontWeight:600, color:'#166534'}}>Pickup Date:</span>
                              <span style={{fontSize:13, fontWeight:700, color:'#15803d'}}>
                                {demand.pickupDate
                                  ? new Date(demand.pickupDate + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                                  : 'Not set'}
                              </span>
                            </div>
                            {demand.status === 'deal_closed' && (
                              <button
                                onClick={() => { setPreponeDealId(demand.id); setPreponeDate(''); }}
                                style={{fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:7, border:'1.5px solid #0369a1', background:'#e0f2fe', color:'#0369a1', cursor:'pointer'}}
                              >
                                ⏰ Prepone
                              </button>
                            )}
                          </div>
                        )}
                        {demand.status === 'deal_closed' && (
                        <div style={{display:'flex', gap:6, marginTop:8}}>
                          <button
                            onClick={async () => {
                              const res = await markReceived(demand.id);
                              if (res.success) toastSuccess('Order marked as received!');
                              else toastError(res.error || 'Failed');
                            }}
                            style={{flex:1, padding:'8px 4px', background:'#f0fdf4', color:'#15803d', border:'1.5px solid #86efac', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4}}
                          >
                            <FaBox style={{fontSize:11}}/> Received
                          </button>
                          <button
                            onClick={async () => {
                              const res = await cancelDeal(demand.id);
                              if (res.success) toastSuccess('Deal cancelled. Request is open again.');
                              else toastError(res.error || 'Failed to cancel deal');
                            }}
                            style={{flex:1, padding:'8px 4px', background:'#fef2f2', color:'#dc2626', border:'1.5px solid #fca5a5', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4}}
                          >
                            <FaX style={{fontSize:11}}/> Reject
                          </button>
                          <button className="chat-trigger-btn" style={{flex:1, justifyContent:'center', padding:'8px 4px', fontSize:12}} onClick={() => setActiveChatDemand(demand)}>
                            <FaComments style={{fontSize:11, marginRight:3}}/> Chat
                          </button>
                        </div>
                        )}
                      </div>
                    )}

                    {/* Mark as Received — shown when farmer marks in_progress */}
                    {demand.status === 'in_progress' && (
                      <button
                        className="cd-received-btn"
                        onClick={async () => {
                          const res = await markReceived(demand.id);
                          if (res.success) toastSuccess('Order marked as received!');
                          else toastError(res.error || 'Failed to update status');
                        }}
                      >
                        <FaCheckCircle style={{marginRight:8}}/> Mark as Received
                      </button>
                    )}

                    {/* Review form — shown only after completed */}
                    {demand.status === 'completed' && !demand.reviewed && (() => {
                      const rd = reviewData[demand.id] || {};
                      return (
                        <div className="cd-review-panel">
                          <div className="cd-review-title">Rate Your Experience</div>
                          <div className="cd-review-stars">
                            {[1,2,3,4,5].map(star => (
                              <button
                                key={star}
                                className={`cd-star-btn ${(rd.rating || 0) >= star ? 'cd-star-btn--active' : ''}`}
                                onClick={() => setReviewData(prev => ({ ...prev, [demand.id]: { ...prev[demand.id], rating: star } }))}
                              >
                                <FaStar />
                              </button>
                            ))}
                          </div>
                          <textarea
                            className="cd-review-textarea"
                            placeholder="How was the crop quality and farmer's service? (optional)"
                            rows={3}
                            value={rd.comment || ''}
                            onChange={e => setReviewData(prev => ({ ...prev, [demand.id]: { ...prev[demand.id], comment: e.target.value } }))}
                          />
                          {rd.error && <div className="cd-review-error">{rd.error}</div>}
                          <button
                            className="cd-review-submit-btn"
                            disabled={rd.submitting}
                            onClick={async () => {
                              if (!rd.rating) return setReviewData(prev => ({ ...prev, [demand.id]: { ...prev[demand.id], error: 'Please select a star rating.' } }));
                              setReviewData(prev => ({ ...prev, [demand.id]: { ...prev[demand.id], submitting: true, error: '' } }));
                              const res = await submitReview(
                                demand.id,
                                demand.committedFarmerId,
                                demand.committedFarmerName,
                                demand.cropName,
                                rd.rating,
                                rd.comment || ''
                              );
                              setReviewData(prev => ({ ...prev, [demand.id]: { ...prev[demand.id], submitting: false, error: res.success ? '' : (res.error || 'Failed') } }));
                            }}
                          >
                            {rd.submitting ? <span className="cd-spinner"/> : <><FaStar style={{marginRight:6}}/> Submit Review</>}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Review submitted badge */}
                    {demand.status === 'completed' && demand.reviewed && (
                      <div className="cd-review-submitted">
                        <FaCheckCircle style={{marginRight:6, color:'#16a34a'}}/>
                        Review submitted — {'\u2605'.repeat(demand.reviewRating)}
                        {demand.reviewComment && <div className="cd-review-submitted-comment">"{demand.reviewComment}"</div>}
                      </div>
                    )}

                    {/* Footer meta */}
                    <div className="cd-demand-foot">
                      <FaRegClock style={{marginRight:5,fontSize:10}}/>
                      {demand.createdAt?.seconds ? new Date(demand.createdAt.seconds*1000).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : 'Just now'}
                      {formatRelTime(demand.updatedAt || demand.createdAt) && (
                        <span className="cd-last-updated">· Updated {formatRelTime(demand.updatedAt || demand.createdAt)}</span>
                      )}
                      {demand.committedFarmerId && ['deal_closed', 'in_progress', 'completed'].includes(demand.status) && (
                        reportedDemandIds.has(demand.id)
                          ? <span style={{ marginLeft:'auto', fontSize:11, fontWeight:600, color:'#9ca3af', display:'flex', alignItems:'center', gap:4, padding:'3px 8px', background:'#f3f4f6', borderRadius:6, border:'1px solid #e5e7eb' }}>
                              <FaFlag style={{ fontSize:10 }} /> Reported
                            </span>
                          : <button
                              className="report-trigger-btn"
                              style={{ marginLeft: 'auto' }}
                              title="Report this farmer"
                              onClick={() => setComplaintTarget({
                                id: demand.committedFarmerId,
                                name: demand.committedFarmerName || 'Farmer',
                                role: 'farmer',
                                demandId: demand.id,
                              })}
                            >
                              <FaFlag style={{ fontSize: 10 }} /> Report Farmer
                            </button>
                      )}
                    </div>
                  </div>
                );
                    })}
                  </div>
                </div>
              ));
            })()
          )}
        </section>

        {/* PRODUCTS */}
        <section className="cd-products-section">
          <div className="cd-products-area">
            {/* Products toolbar */}
            <div className="cd-products-toolbar">
              <div className="cd-pt-left">
                <h3 className="cd-pt-title">
                  {selectedCategory==='all' ? 'All Products' : (categories.find(c=>c.id===selectedCategory)?.name ?? 'Products')}
                </h3>
                <span className="cd-pt-count">{filteredProducts.length} items</span>
                {organicOnly && <span className="cd-pt-tag cd-pt-tag--organic"><FaLeaf /> Organic Only</span>}
              </div>
              <div className="cd-pt-right">
                <div className="cd-pt-search">
                  <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Filter results..." />
                </div>
                <div className="cd-view-btns">
                  <button className="cd-view-btn active" title="Grid"><FaThLarge /></button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="products-grid-modern">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="cd-skeleton-card" aria-hidden="true">
                    <div className="cd-sk-img" />
                    <div className="cd-sk-body">
                      <div className="cd-sk-line cd-sk-title" />
                      <div className="cd-sk-line cd-sk-sub" />
                      <div className="cd-sk-line cd-sk-price" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="products-grid-modern">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={p => addToCart(p,1)} onToggleFavorite={toggleFavorite} isFavorite={isFavorite(product.id)} onRequestNow={(prod) => { setSelectedProductForRequest(prod); setShowRequestModal(true); }} isAlreadyRequested={myDemands.some(d => d.cropName?.toLowerCase() === product.name?.toLowerCase() && d.status === 'open')} />
                ))}
              </div>
            ) : (
              <div className="cd-no-products">
                <div className="cd-no-products-art"><FaLeaf style={{fontSize:48,color:'#16a34a'}}/></div>
                {productsToUse.length === 0 ? (
                  <><h3>No Crops Listed Yet</h3><p>Farmers haven't added crops yet -- check back soon, or request one above!</p></>
                ) : (
                  <><h3>No Products Found</h3><p>Try adjusting your filters or search term.</p><button className="cd-reset-btn" onClick={resetFilters}>Reset Filters</button></>
                )}
              </div>
            )}
          </div>
        </section>



      </div>{/* /cd-container */}

      {/* FOOTER */}
      <footer className="cd-footer">

        {/* Main columns */}
        <div className="cd-footer-inner">

          {/* Brand */}
          <div className="cd-footer-brand">
            <div className="cd-footer-logo"><FaLeaf /><span>Farm2Home</span></div>
            <p className="cd-footer-tagline">Connecting farmers and consumers for a healthier, sustainable India -- no middlemen, pure freshness.</p>

            <div className="cd-footer-contact">
              <div className="cd-fc-row"><FaPhone className="cd-fc-icon"/><span>+91 98765 43210</span></div>
              <div className="cd-fc-row"><FaMapMarkerAlt className="cd-fc-icon"/><span>Hyderabad, Telangana, India</span></div>
            </div>

            <div className="cd-footer-badges">
              <div className="cd-fb-badge"><FaShieldAlt className="cd-fb-icon"/><span>100% Secure</span></div>
              <div className="cd-fb-badge"><FaStar className="cd-fb-icon cd-fb-star"/><span>Rated 4.8/5</span></div>
              <div className="cd-fb-badge"><FaUsers className="cd-fb-icon"/><span>10k+ Users</span></div>
            </div>
          </div>

          {/* Shop */}
          <div className="cd-footer-col">
            <h4><FaLeaf className="cd-fcol-icon"/> Shop</h4>
            <ul>
              <li><a href="#vegetables"><FaChevronRight className="cd-flink-arr"/>Vegetables</a></li>
              <li><a href="#fruits"><FaChevronRight className="cd-flink-arr"/>Fruits</a></li>
              <li><a href="#grains"><FaChevronRight className="cd-flink-arr"/>Grains &amp; Pulses</a></li>
              <li><a href="#spices"><FaChevronRight className="cd-flink-arr"/>Spices</a></li>
              <li><a href="#organic"><FaChevronRight className="cd-flink-arr"/>Organic</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="cd-footer-col">
            <h4><FaHandshake className="cd-fcol-icon"/> Company</h4>
            <ul>
              <li><a href="#about"><FaChevronRight className="cd-flink-arr"/>About Us</a></li>
              <li><a href="#farmers"><FaChevronRight className="cd-flink-arr"/>Our Farmers</a></li>
              <li><a href="#careers"><FaChevronRight className="cd-flink-arr"/>Careers</a></li>
              <li><a href="#blog"><FaChevronRight className="cd-flink-arr"/>Blog</a></li>
              <li><a href="#contact"><FaChevronRight className="cd-flink-arr"/>Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="cd-footer-col">
            <h4><FaShieldAlt className="cd-fcol-icon"/> Support</h4>
            <ul>
              <li><a href="#faq"><FaChevronRight className="cd-flink-arr"/>FAQ</a></li>
              <li><a href="#shipping"><FaChevronRight className="cd-flink-arr"/>Shipping Policy</a></li>
              <li><a href="#returns"><FaChevronRight className="cd-flink-arr"/>Returns</a></li>
              <li><a href="#privacy"><FaChevronRight className="cd-flink-arr"/>Privacy Policy</a></li>
              <li><a href="#terms"><FaChevronRight className="cd-flink-arr"/>Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="cd-footer-bottom">
          <p className="cd-fb-copy">&copy; 2026 Farm2Home. All rights reserved.</p>
          <div className="cd-fb-links">
            <a href="#privacy">Privacy</a>
            <span className="cd-fb-dot"></span>
            <a href="#terms">Terms</a>
            <span className="cd-fb-dot"></span>
            <a href="#sitemap">Sitemap</a>
          </div>
        </div>

      </footer>

      {/* ── Accept Offer Date Modal ── */}
      {acceptDateModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:18, padding:24, width:340, maxWidth:'96vw', boxShadow:'0 10px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>📅</div>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#15803d', marginBottom:4 }}>Select Pickup Date</h3>
            <p style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.5 }}>
              When are you planning to visit / collect your order? The farmer will be notified.
            </p>
            <input
              type="date"
              value={pickupDateInput}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setPickupDateInput(e.target.value)}
              style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:'2px solid #86efac', fontSize:14, boxSizing:'border-box', marginBottom:18, outline:'none' }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <button
                onClick={() => { setAcceptDateModal(null); setPickupDateInput(''); }}
                style={{ flex:1, padding:'10px', borderRadius:9, border:'1.5px solid #d1d5db', background:'#f9fafb', color:'#374151', fontWeight:600, cursor:'pointer', fontSize:13 }}
              >Cancel</button>
              <button
                onClick={async () => {
                  if (!pickupDateInput) { toastError('Please select a pickup date'); return; }
                  const res = await acceptOffer(acceptDateModal, pickupDateInput);
                  if (res.success) {
                    toastSuccess('Offer accepted! Farmer has been notified.');
                    setAcceptDateModal(null);
                    setPickupDateInput('');
                  } else {
                    toastError(res.error || 'Failed to accept offer');
                  }
                }}
                style={{ flex:2, padding:'10px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:13 }}
              >✓ Confirm &amp; Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prepone Date Modal ── */}
      {preponeDealId && (() => {
        const deal = myDemands.find(d => d.id === preponeDealId);
        return (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:18, padding:24, width:340, maxWidth:'96vw', boxShadow:'0 10px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>⏰</div>
              <h3 style={{ fontSize:17, fontWeight:800, color:'#0369a1', marginBottom:4 }}>Prepone Pickup Date</h3>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:6, lineHeight:1.5 }}>
                You can only <strong>prepone</strong> (select an earlier date than current). The farmer will be notified.
              </p>
              <div style={{ fontSize:12, color:'#0369a1', background:'#e0f2fe', borderRadius:8, padding:'6px 10px', marginBottom:14 }}>
                Current pickup date: <strong>{deal?.pickupDate ? new Date(deal.pickupDate + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'Not set'}</strong>
              </div>
              <input
                type="date"
                value={preponeDate}
                min={new Date().toISOString().split('T')[0]}
                max={deal?.pickupDate ? (() => { const d = new Date(deal.pickupDate + 'T00:00:00'); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })() : undefined}
                onChange={e => setPreponeDate(e.target.value)}
                style={{ width:'100%', padding:'11px 13px', borderRadius:9, border:'2px solid #7dd3fc', fontSize:14, boxSizing:'border-box', marginBottom:18, outline:'none' }}
              />
              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={() => { setPreponeDealId(null); setPreponeDate(''); }}
                  style={{ flex:1, padding:'10px', borderRadius:9, border:'1.5px solid #d1d5db', background:'#f9fafb', color:'#374151', fontWeight:600, cursor:'pointer', fontSize:13 }}
                >Cancel</button>
                <button
                  onClick={async () => {
                    if (!preponeDate) { toastError('Please select a date'); return; }
                    const res = await preponePickupDate(preponeDealId, deal?.pickupDate, preponeDate);
                    if (res.success) {
                      toastSuccess('Pickup date preponed!');
                      setPreponeDealId(null);
                      setPreponeDate('');
                    } else {
                      toastError(res.error || 'Failed to update date');
                    }
                  }}
                  style={{ flex:2, padding:'10px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#0284c7,#0369a1)', color:'#fff', fontWeight:800, cursor:'pointer', fontSize:13 }}
                >⏰ Confirm Prepone</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ConsumerDashboard;
