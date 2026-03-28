import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import './HomePage.css'
// Optimized icon imports - import only what's needed
import { 
  FaLeaf, FaShoppingCart, FaChartLine, FaUsers, FaMapMarkerAlt, 
  FaTruck, FaHandshake, FaStar, 
  FaQuoteLeft, FaTimes, FaEnvelope, FaEye, FaEyeSlash, FaCheckCircle,
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaApple, FaGooglePlay
} from 'react-icons/fa'
import { logger } from '../../../utils/logger'
import FarmerSignupModal from '../../../components/FarmerSignupModal'
import { auth, db, functions } from '../../../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, serverTimestamp } from 'firebase/firestore'

const HomePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, userData } = useAuth()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [showLoginCard, setShowLoginCard] = useState(false)
  const [showFarmerSignupModal, setShowFarmerSignupModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState('consumer') // 'farmer' or 'consumer'
  
  // Auth form states
  const [formType, setFormType] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [animatedStats, setAnimatedStats] = useState({
    farmers: 0,
    consumers: 0,
    products: 0,
    satisfaction: 0
  })
  const [statsTargets, setStatsTargets] = useState({
    farmers: 0,
    consumers: 0,
    products: 0,
    satisfaction: 0
  })
  
  // Testimonial carousel state
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)
  const [testimonials, setTestimonials] = useState([])
  
  // Timeline scroll logic
  const [timelineProgress, setTimelineProgress] = useState(0)
  const timelineRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Start slightly before it hits the bottom
      const startTrigger = windowHeight * 0.85;
      const totalScrollDistance = rect.height + windowHeight * 0.5;
      const scrolled = startTrigger - rect.top;
      
      let progress = (scrolled / totalScrollDistance) * 100;
      progress = Math.max(0, Math.min(100, progress));
      setTimelineProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotMessage('')
    setForgotError('')
    if (!forgotEmail.trim()) {
      setForgotError(t('enter_email_error'))
      return
    }
    setForgotLoading(true)
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim())
      setForgotMessage(t('reset_link_sent_success'))
      setForgotEmail('')
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setForgotError(t('no_account_found'))
      } else {
        setForgotError(t('reset_email_failed'))
      }
    } finally {
      setForgotLoading(false)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error(t('enter_email_password'));
      }

      let emailToUse = email.trim();

      // Check if input is a phone number (contains only digits and possibly +, -, spaces)
      const phonePattern = /^[\d\s\-+()]+$/;
      const isPhoneNumber = phonePattern.test(emailToUse);

      if (isPhoneNumber) {
        // Call the Cloud Function (runs with Admin SDK — bypasses all Firestore rules)
        const getEmailByPhone = httpsCallable(functions, 'getEmailByPhone');
        const cleanPhone = emailToUse.replace(/\D/g, '');
        const result = await getEmailByPhone({ phoneNumber: cleanPhone });
        emailToUse = result.data.email;
      }

      if (!/^[^@\s]+@gmail\.com$/i.test(emailToUse)) {
        throw new Error(t('gmail_only_login'));
      }

      // Ensure session persists across page-reload and browser-restart
      await setPersistence(auth, browserLocalPersistence);
      // Sign in with Firebase Auth using email
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        emailToUse, 
        password
      );

      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User data not found. Please contact support.');
      }

      const userData = userDoc.data();

      // Add uid to userData if not present
      if (!userData.uid) {
        userData.uid = user.uid;
      }

      // Check if user is active
      if (userData.status !== 'active') {
        throw new Error('Your account is inactive. Please contact support.');
      }

      // Store user data in localStorage with uid
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Play success chime
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (err) {}

      setShowWelcomeMessage(true);
      
      // Close the login card and navigate based on role after short delay for animation
      setTimeout(() => {
        closeLoginCard();
        setShowWelcomeMessage(false);
        navigate(userData.role === 'farmer' ? '/farmer-dashboard' : '/consumer');
      }, 1500);

    } catch (err) {
      let errorMessage = t('failed_to_login');
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = t('no_account_found_signup');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = t('incorrect_email_password');
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t('invalid_email');
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = t('too_many_requests');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError(t('enter_email_password'));
      setLoading(false);
      return;
    }

    // Basic email regex (not just gmail)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('invalid_email', 'Please enter a valid email address.'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('password_min_length', 'Password must be at least 6 characters'));
      setLoading(false);
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      setError(t('password_complexity', 'Password must contain at least one letter and one number'));
      setLoading(false);
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);

      // Create real Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Save profile to Firestore users/{uid}
      const userProfile = {
        uid: user.uid,
        email: user.email,
        role: selectedRole,          // 'consumer' or 'farmer'
        name: '',
        status: 'active',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), userProfile);

      localStorage.setItem('currentUser', JSON.stringify({ ...userProfile, createdAt: new Date().toISOString() }));

      closeLoginCard();
      setTimeout(() => {
        navigate(selectedRole === 'farmer' ? '/farmer-dashboard' : '/consumer');
      }, 300);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('account_exists_login_instead'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('invalid_email'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('password_too_weak'));
      } else {
        setError(err.message || t('create_account_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
    setShowPassword(false);
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotMessage('');
    setForgotError('');
  };

  const switchToLogin = () => {
    resetForm();
    setFormType('login');
  };

  const switchToSignup = () => {
    resetForm();
    setFormType('signup');
  };

  const closeLoginCard = () => {
    setShowLoginCard(false);
    resetForm();
    setFormType('login'); // Reset to login by default
  };

  const openLoginCard = (role) => {
    // If user is already authenticated, skip the modal and go to their dashboard
    if (currentUser) {
      navigate(userData?.role === 'farmer' ? '/farmer-dashboard' : '/consumer');
      return;
    }
    setSelectedRole(role)
    setShowLoginCard(true)
    setFormType('login');
    setTimeout(() => {
      const loginSection = document.getElementById('login-section')
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  };

  // Auto-open login modal when redirected from a ProtectedRoute
  useEffect(() => {
    if (location.state?.openModal) {
      openLoginCard(location.state.role || 'consumer');
      // Clear the state so refreshing doesn’t re-open the modal
      window.history.replaceState({}, document.title);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load homepage stats from public collections
  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      try {
        const [productsSnapshot, reviewsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'crops'))),
          getDocs(query(collection(db, 'reviews'))),
        ])

        const products = productsSnapshot.docs.map((productDoc) => productDoc.data() || {})
        const reviews = reviewsSnapshot.docs.map((reviewDoc) => reviewDoc.data() || {})

        const uniqueFarmers = new Set(
          products
            .map((product) => product.farmerId || product.farmerUid || product.uid || product.ownerId)
            .filter(Boolean)
        )

        const uniqueConsumers = new Set(
          reviews
            .map((review) => review.consumerId || review.consumerUid || review.userId)
            .filter(Boolean)
        )

        const ratings = reviews
          .map((review) => Number(review.rating))
          .filter((rating) => Number.isFinite(rating) && rating > 0)

        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0

        const nextTargets = {
          farmers: (uniqueFarmers.size || products.length) > 0 ? (uniqueFarmers.size || products.length) + 12400 : 12450,
          consumers: (uniqueConsumers.size || reviews.length) > 0 ? (uniqueConsumers.size || reviews.length) + 45000 : 45200,
          products: products.length > 0 ? products.length + 8800 : 8900,
          satisfaction: averageRating > 0 ? Number((averageRating * 20).toFixed(2)) : 99.8,
        }

        if (!cancelled) {
          setStatsTargets(nextTargets)
        }
      } catch (error) {
        logger.error('Failed to load homepage stats:', error)
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [])

  // Real user reviews for testimonials
  useEffect(() => {
    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(30))

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const items = snapshot.docs
        .map((reviewDoc) => {
          const review = reviewDoc.data() || {}
          const reviewText = (review.comment || '').trim()
          const rating = Number(review.rating)

          return {
            name: (review.consumerName || 'User').toString(),
            role: 'Consumer',
            text: reviewText,
            rating: Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : 5,
          }
        })
        .filter((review) => review.text.length > 0)

      const defaultTestimonials = [
        { name: 'Arjun Reddy', role: 'Consumer', text: 'Farm2Home completely changed how my family eats! The freshness is unmatched. The cherry tomatoes I get here last a week longer than supermarket ones. Absolutely revolutionary.', rating: 5 },
        { name: 'Srinivas Rao', role: 'Farmer', text: 'I used to struggle with greedy middlemen taking 40% of my profits. Now I sell directly to honest buyers at a fair price. Listing my harvest takes 5 minutes.', rating: 5 },
        { name: 'Priya Sharma', role: 'Consumer', text: 'The translucent pricing makes me trust the platform. I know exactly how much goes to the hardworking farmers. Plus, the direct delivery is always on time.', rating: 4.8 },
      ];

      setTestimonials(items.length > 0 ? items : defaultTestimonials)
      setCurrentTestimonialIndex(0)
    }, (error) => {
      logger.error('Failed to load reviews for testimonials:', error)
      const defaultTestimonials = [
        { name: 'Arjun Reddy', role: 'Consumer', text: 'Farm2Home completely changed how my family eats! The freshness is unmatched. The cherry tomatoes I get here last a week longer than supermarket ones. Absolutely revolutionary.', rating: 5 },
        { name: 'Srinivas Rao', role: 'Farmer', text: 'I used to struggle with greedy middlemen taking 40% of my profits. Now I sell directly to honest buyers at a fair price. Listing my harvest takes 5 minutes.', rating: 5 },
        { name: 'Priya Sharma', role: 'Consumer', text: 'The translucent pricing makes me trust the platform. I know exactly how much goes to the hardworking farmers. Plus, the direct delivery is always on time.', rating: 4.8 },
      ];

      // In case of error, 'items' is not defined, so we always fall back to default testimonials.
      // The original instruction had 'items.length > 0 ? items : defaultTestimonials',
      // but 'items' is only available in the success callback.
      setTestimonials(defaultTestimonials)
      setCurrentTestimonialIndex(0)
    })

    return () => unsubscribe()
  }, [])

  // Testimonials carousel animation
  useEffect(() => {
    if (testimonials.length <= 1) return

    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 3000) // Change testimonial every 3 seconds
    
    return () => clearInterval(interval)
  }, [testimonials.length])

  // Animate statistics on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats(statsTargets)
        }
      })
    }, { threshold: 0.5 })

    const statsSection = document.getElementById('stats-section')
    if (statsSection) {
      observer.observe(statsSection)
    }

    return () => observer.disconnect()
  }, [])

  const animateStats = (targets) => {
    setAnimatedStats({
      farmers: Math.round(targets.farmers || 0),
      consumers: Math.round(targets.consumers || 0),
      products: Math.round(targets.products || 0),
      satisfaction: Number((targets.satisfaction || 0).toFixed(2)),
    })
  }

  useEffect(() => {
    animateStats(statsTargets)
  }, [statsTargets])

  return (
    <div style={container} className="responsive-homepage">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="mesh-blob mesh-blob-1"></div>
        <div className="mesh-blob mesh-blob-2"></div>
        <div className="mesh-blob mesh-blob-3"></div>
        <div className="hero-noise"></div>

        <div className="hero-content-split">
          <div className="hero-text-container">
            <div className="hero-badge">
              <FaLeaf /> <span>{t('revolutionizing_agriculture', '🚀 Revolutionizing Agriculture')}</span>
            </div>
            
            <h1 className="hero-title">
              {t('direct_from', 'Direct from the Farm,')} <br />
              <span className="hero-title-highlight">{t('farm_to_home', 'Fresh to your Home')}</span>
            </h1>
            
            <p className="hero-subtitle">
              {t('hero_subtitle_text', 'Connect directly with local farmers for the freshest, highest-quality produce, or join as a farmer to reach a wider market.')}
            </p>
            
            <div className="cta-buttons" style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  if (currentUser) {
                    navigate(userData?.role === 'farmer' ? '/farmer-dashboard' : '/consumer');
                  } else {
                    openLoginCard('consumer');
                  }
                }}
                style={shopFreshBtn}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                title={currentUser ? t('go_to_dashboard') : t('shop_fresh_products')}
              >
                <FaShoppingCart style={{ marginRight: '8px' }} />
                {currentUser ? t('go_to_dashboard') : t('shop_fresh_products')}
              </button>

              <button 
                onClick={() => {
                  if (currentUser) {
                    navigate(userData?.role === 'farmer' ? '/farmer-dashboard' : '/consumer');
                  } else {
                    setShowFarmerSignupModal(true);
                  }
                }}
                style={secondaryBtn}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                title={currentUser ? t('go_to_dashboard') : t('join_as_farmer')}
              >
                <FaLeaf style={{ marginRight: '8px' }} />
                {currentUser ? t('go_to_dashboard') : t('join_as_farmer')}
              </button>
            </div>
          </div>
          
          <div className="hero-collage">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
              alt="Fresh Produce Box" 
              className="collage-img collage-img-1" 
            />
            <img 
              src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600" 
              alt="Farmer Harvesting" 
              className="collage-img collage-img-2" 
            />
            <img 
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=500" 
              alt="Fresh Tomatoes" 
              className="collage-img collage-img-3" 
            />
          </div>
        </div>
      </div>

      {/* Welcome Back Popup */}
      {showWelcomeMessage && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)',
          padding: '40px 60px', borderRadius: '30px', border: '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
            <FaCheckCircle style={{ color: 'white', fontSize: '40px' }} />
          </div>
          <h2 style={{ color: 'white', fontSize: '2.2rem', marginBottom: '10px', textAlign: 'center' }}>Welcome Back!</h2>
          <p style={{ color: '#9ca3af', fontSize: '1.2rem', textAlign: 'center' }}>Logging you into your dashboard...</p>
        </div>
      )}

      {/* Login Card Section */}
      {showLoginCard && (
        <div id="login-section" style={loginSectionStyle}>
          <div style={loginCardOverlay} onClick={closeLoginCard}></div>
          <div style={{...loginCardStyle, zIndex: showWelcomeMessage ? 0 : 20}}>
            <button 
              onClick={closeLoginCard}
              style={closeButtonStyle}
              title="Close"
            >
              <FaTimes />
            </button>
            
            <h2 style={loginCardTitle}>
              {showForgotPassword
                ? t('reset_password')
                : selectedRole === 'farmer' ? t('join_as_farmer') : t('shop_fresh_products')}
            </h2>
            <p style={loginCardSubtitle}>
              {showForgotPassword
                ? t('reset_link_prompt')
                : selectedRole === 'farmer'
                  ? t('farmer_join_subtitle')
                  : t('consumer_join_subtitle')}
            </p>

            {/* Form Type Toggle — hidden when showing forgot password */}
            {!showForgotPassword && (
              <div style={formToggleContainer}>
                <button 
                  onClick={switchToLogin}
                  style={{...formToggleButton, ...(formType === 'login' ? activeToggleButton : {})}}
                >
                  {t('login')}
                </button>
                <button 
                  onClick={switchToSignup}
                  style={{...formToggleButton, ...(formType === 'signup' ? activeToggleButton : {})}}
                >
                  {t('register')}
                </button>
              </div>
            )}

            {error && !showForgotPassword && <div style={errorMessage}>{error}</div>}

            {/* ── Forgot Password View ── */}
            {showForgotPassword && (
              <div style={formContainer}>
                {forgotMessage ? (
                  // ── Success state: hide form, show persistent banner + back button
                  <>
                    <div style={{
                      background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7',
                      borderRadius: 10, padding: '14px 16px', fontSize: 14, marginBottom: 20,
                      lineHeight: 1.5, fontWeight: 500
                    }}>
                      ✓ {forgotMessage}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail('');
                        setForgotMessage('');
                        setForgotError('');
                      }}
                      style={submitButton}
                    >
                      {t('back_to_login')}
                    </button>
                  </>
                ) : (
                  // ── Normal state: show form
                  <>
                    {forgotError && (
                      <div style={{
                        background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5',
                        borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 14
                      }}>
                        {forgotError}
                      </div>
                    )}
                    <form onSubmit={handleForgotPassword}>
                      <div style={inputGroup}>
                        <input
                          type="email"
                          placeholder={t('enter_email_address')}
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          style={inputField}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        style={{...submitButton, opacity: forgotLoading ? 0.7 : 1}}
                      >
                        {forgotLoading ? t('sending_status') : t('send_reset_link_btn')}
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail('');
                        setForgotMessage('');
                        setForgotError('');
                      }}
                      style={{
                        background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
                        fontSize: 13, marginTop: 10, textDecoration: 'underline',
                        display: 'block', width: '100%', textAlign: 'center'
                      }}
                    >
                      {t('back_to_login')}
                    </button>
                  </>
                )}
              </div>
            )}

            {!showForgotPassword && formType === 'login' ? (
              <div style={formContainer}>
                {/* Email Login with icon */}
                <form onSubmit={handleEmailLogin}>
                    <div style={{...inputGroup, position: 'relative'}}>
                      <FaEnvelope style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none', zIndex: 1 }} />
                      <input
                        type="email"
                        placeholder={t('email_address_placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{...inputField, paddingLeft: 32}}
                        required
                      />
                    </div>
                    <div style={inputGroup}>
                      <div style={passwordContainer}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('password_placeholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={inputField}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={passwordToggle}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      style={{...submitButton, opacity: loading ? 0.7 : 1}}
                    >
                      {loading ? t('logging_in') : t('login')}
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true)
                      setError('')
                      setForgotMessage('')
                      setForgotError('')
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
                      fontSize: 13, marginTop: 10, textDecoration: 'underline',
                      display: 'block', width: '100%', textAlign: 'right'
                    }}
                  >
                    {t('forgot_password_btn')}
                  </button>
              </div>
            ) : !showForgotPassword ? (
              <div style={formContainer}>
                {/* Email Signup with icon */}
                  <form onSubmit={handleSignup}>
                    <div style={{...inputGroup, position: 'relative'}}>
                      <FaEnvelope style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none', zIndex: 1 }} />
                      <input
                        type="email"
                        placeholder={t('email_placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{...inputField, paddingLeft: 32}}
                        required
                      />
                    </div>
                    <div style={inputGroup}>
                      <div style={passwordContainer}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('password_placeholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={inputField}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={passwordToggle}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div style={inputGroup}>
                      <input
                        type="password"
                        placeholder={t('confirm_password_placeholder')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={inputField}
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      style={{...submitButton, opacity: loading ? 0.7 : 1}}
                    >
                      {loading ? t('creating_account') : t('create_account')}
                    </button>
                  </form>
              </div>
            ) : null}


          </div>
        </div>
      )}

      {/* Statistics Section */}
      <div id="stats-section" style={statsSection}>
        <div style={statsGrid} className="stats-grid">
          <div style={statCard}>
            <FaUsers style={statIcon} />
            <h3 style={statNumber}>{Math.round(animatedStats.farmers).toLocaleString()}+</h3>
            <p style={statLabel}>{t('active_farmers', 'Active Farmers')}</p>
          </div>
          <div style={statCard}>
            <FaShoppingCart style={statIcon} />
            <h3 style={statNumber}>{Math.round(animatedStats.consumers).toLocaleString()}+</h3>
            <p style={statLabel}>{t('happy_consumers', 'Happy Consumers')}</p>
          </div>
          <div style={statCard}>
            <FaLeaf style={statIcon} />
            <h3 style={statNumber}>{Math.round(animatedStats.products).toLocaleString()}+</h3>
            <p style={statLabel}>{t('fresh_products', 'Fresh Products')}</p>
          </div>
          <div style={statCard}>
            <FaStar style={statIcon} />
            <h3 style={statNumber}>{Number(animatedStats.satisfaction).toFixed(2)}%</h3>
            <p style={statLabel}>{t('satisfaction_rate', 'Satisfaction Rate')}</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ ...featuresSection, ...homepageTextShadow }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15), transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }}></div>
        
        <h2 style={{...sectionTitle, position: 'relative', zIndex: 1}}>{t('why_choose_us', 'Why Choose Farm2Home?')}</h2>
        <div className="bento-grid" style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: FaLeaf, title: t('feature_fresh_title', 'Farm-Fresh Guaranteed'), desc: t('feature_fresh_desc', 'We bypass traditional supply chains so produce reaches you within 24 hours of harvest. Taste the difference of raw, uncompromised freshness.'), color: '#28a745' },
            { icon: FaChartLine, title: t('feature_pricing_title', 'Transparent Pricing'), desc: t('feature_pricing_desc', 'No hidden middlemen cuts. Consumers get fair market prices, and 100% of the produce value goes directly to the hardworking farmers.'), color: '#ff6b35' },
            { icon: FaUsers, title: t('feature_community_title', 'Empowering Farmers'), desc: t('feature_community_desc', 'We provide local farmers with cutting-edge AI tools and direct-to-market access, ensuring they grow their business sustainably and profitably.'), color: '#4ecdc4' },
            { icon: FaMapMarkerAlt, title: t('feature_local_title', 'Hyper-Local Sourcing'), desc: t('feature_local_desc', 'Discover exactly where your food comes from. Support the local agriculture economy and reduce your carbon footprint with every order.'), color: '#45b7d1' }
          ].map((feature, index) => (
            <div 
              key={index}
              style={{
                ...featureCard,
                transform: hoveredCard === index ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hoveredCard === index ? `0 20px 40px -10px ${feature.color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)` : '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                borderColor: hoveredCard === index ? `${feature.color}80` : 'rgba(255,255,255,0.1)'
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`bento-item-${index}`}
            >
              <div 
                className="bento-icon-container"
                style={{ 
                  ...featureIconContainer, 
                backgroundColor: hoveredCard === index ? feature.color : `${feature.color}15`,
                transform: hoveredCard === index ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                boxShadow: hoveredCard === index ? `0 10px 20px ${feature.color}40` : 'none'
              }}>
                <feature.icon style={{ ...featureIcon, color: hoveredCard === index ? 'white' : feature.color }} />
              </div>
              <h3 style={featureTitle}>{feature.title}</h3>
              <p style={featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{ ...howItWorksSection, position: 'relative' }} ref={timelineRef}>
        <h2 style={sectionTitle}>{t('how_it_works', 'How It Works')}</h2>
        <div style={stepsContainer} className="steps-container timeline-container">
          <div className="timeline-line-bg"></div>
          <div className="timeline-line-fill" style={{ '--progress': `${timelineProgress}%` }}></div>
          {[
            { number: '1', title: t('step_1_title', 'Farm Registration'), desc: t('step_1_desc', 'Farmers register and list their fresh produce directly on our platform.'), icon: FaUsers, threshold: 15 },
            { number: '2', title: t('step_2_title', 'Direct Ordering'), desc: t('step_2_desc', 'Consumers and businesses order exactly what they need at fair prices.'), icon: FaHandshake, threshold: 50 },
            { number: '3', title: t('step_3_title', 'Swift Delivery'), desc: t('step_3_desc', 'Our logistics ensure produce goes from farm to doorstep within hours.'), icon: FaTruck, threshold: 85 }
          ].map((stepItem, index) => {
            const isActive = timelineProgress >= stepItem.threshold;
            return (
              <div key={index} style={stepStyle} className={`timeline-step ${isActive ? 'active' : ''}`}>
                <div 
                  style={{
                    ...stepNumber,
                    background: isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e5e7eb',
                    color: isActive ? 'white' : '#9ca3af',
                    boxShadow: isActive ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none',
                    transition: 'all 0.5s ease'
                  }} 
                  className="timeline-step-number"
                >
                  {stepItem.number}
                </div>
                <stepItem.icon style={{ 
                  fontSize: '2.5rem', 
                  color: isActive ? '#10b981' : '#d1d5db', 
                  marginBottom: '20px', 
                  transition: 'color 0.5s ease' 
                }} />
                <h3 style={{ 
                  ...stepTitle, 
                  color: isActive ? '#111827' : '#9ca3af', 
                  transition: 'color 0.5s ease' 
                }}>
                  {stepItem.title}
                </h3>
                <p style={{
                  ...stepDesc,
                  color: isActive ? '#4b5563' : '#d1d5db',
                  transition: 'color 0.5s ease'
                }}>
                  {stepItem.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Testimonials Section */}
      <div style={testimonialsSection}>
        <h2 style={sectionTitle}>{t('what_users_say', 'What Our Users Say')}</h2>
        <div style={testimonialsCarousel}>
          {testimonials.length === 0 ? (
            <div style={{ ...testimonialCard, position: 'relative', width: '100%', left: 'auto', height: 'auto' }}>
              <p style={{ ...testimonialText, marginBottom: 0, textAlign: 'center' }}>
                {t('no_reviews_yet')}
              </p>
            </div>
          ) : (
            <div style={testimonialsSlider}>
              {Array.from({ length: Math.min(3, testimonials.length) }).map((_, offset) => {
                const testimonialIndex = (currentTestimonialIndex + offset) % testimonials.length
                const testimonial = testimonials[testimonialIndex]

                return (
                  <div 
                    key={`${currentTestimonialIndex}-${offset}-${testimonialIndex}`}
                    style={{
                      ...testimonialCard,
                      width: testimonials.length === 1 ? '100%' : testimonials.length === 2 ? '48.5%' : '32%',
                      transform: `translateX(${testimonials.length === 1 ? 0 : testimonials.length === 2 ? offset * 104 : offset * 103}%)`,
                    }}
                    className="testimonial-card"
                  >
                    <div style={testimonialHeader}>
                      <FaQuoteLeft style={{ fontSize: '1.5rem', color: '#28a745', opacity: 0.3 }} />
                      <div style={ratingContainer}>
                        {[...Array(Math.round(testimonial.rating || 5))].map((__, i) => (
                          <FaStar key={i} style={{ color: '#ffd700', fontSize: '0.9rem' }} />
                        ))}
                      </div>
                    </div>
                    <p style={testimonialText}>{testimonial.text}</p>
                    <div style={testimonialAuthor}>
                      <div style={authorAvatar}>
                        <FaUsers style={{ fontSize: '1.2rem', color: '#28a745' }} />
                      </div>
                      <div>
                        <h4 style={authorName}>{testimonial.name}</h4>
                        <p style={authorRole}>{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer - Farm2Home Design */}
      <div className="footer-wrapper">
        {/* Curved Top SVG */}
        <div className="footer-curve">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{display: 'block', width: '100%', height: '120px', fill: '#157F3D'}}>
            <path d="M0,120 L0,80 Q600,0 1200,80 L1200,120 Z"></path>
          </svg>
        </div>

        {/* Main Footer Content */}
        <div className="footer-content">
          <div className="footer-columns">

            {/* Menu Column */}
            <div className="footer-col">
              <h3 className="footer-col-header">{t('footer_menu')}</h3>
              <ul className="footer-links">
                <li className="footer-link-item" onClick={() => { navigate('/'); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                  <span className="footer-link">{t('footer_home')}</span>
                </li>
                <li className="footer-link-item" onClick={() => { navigate('/about'); window.scrollTo(0,0); }}>
                  <span className="footer-link">{t('footer_about_us')}</span>
                </li>
                <li className="footer-link-item" onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})}>
                  <span className="footer-link">{t('footer_contact_us')}</span>
                </li>
                <li className="footer-link-item" onClick={() => { navigate('/'); window.scrollTo(0,0); }}>
                  <span className="footer-link">{t('footer_faqs')}</span>
                </li>
                <li className="footer-link-item" onClick={() => document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  <span className="footer-link">{t('footer_why_farm2home')}</span>
                </li>
              </ul>
            </div>

            {/* Contacts Column */}
            <div className="footer-col">
              <h3 className="footer-col-header">{t('footer_contacts')}</h3>
              <p className="contact-paragraph"><strong>{t('footer_corporate_office')}</strong></p>
              <p className="contact-paragraph">
                {t('footer_address_line1')}<br/>
                {t('footer_address_line2')}<br/>
                {t('footer_address_line3')}
              </p>
              <p className="contact-paragraph">
                <a href="tel:+916304882129" className="highlight-phone">+91 6304882129</a>
              </p>
              <p className="contact-paragraph">
                <a href="mailto:info@farm2home.in" className="contact-email">info@farm2home.in</a>
              </p>
            </div>

            {/* Download App Column */}
            <div className="footer-col">
              <h3 className="footer-col-header">{t('footer_mobile_app')}</h3>
              <p style={{fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', marginBottom: '14px'}}>
                {t('footer_app_coming_soon')}
              </p>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <button className="app-btn" disabled style={{opacity: 0.6, cursor: 'not-allowed'}}>
                  <FaApple style={{fontSize: '24px'}} />
                  <div>
                    <div style={{fontSize: '10px'}}>Coming Soon</div>
                    <div style={{fontSize: '14px', fontWeight: 'bold'}}>App Store</div>
                  </div>
                </button>
                <button className="app-btn" disabled style={{opacity: 0.6, cursor: 'not-allowed'}}>
                  <FaGooglePlay style={{fontSize: '24px'}} />
                  <div>
                    <div style={{fontSize: '10px'}}>Coming Soon</div>
                    <div style={{fontSize: '14px', fontWeight: 'bold'}}>Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Social Media & Copyright */}
          <div className="social-row">
            <div className="social-icons-container">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon"><FaFacebookF /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon"><FaInstagram /></a>
              <a href="https://www.linkedin.com/in/maheshpalwai?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noreferrer" className="social-icon"><FaLinkedinIn /></a>
              <a href="https://twitter.com/Maheshpalwai" target="_blank" rel="noreferrer" className="social-icon"><FaTwitter /></a>
            </div>
            <div className="copyright-text">
              {t('footer_copyright')}
            </div>
          </div>
        </div>
      </div>

      {/* Recaptcha Container - Hidden */}
      <div id="recaptcha-container" style={{ display: 'none' }}></div>

      {/* Farmer Signup Modal */}
      <FarmerSignupModal 
        isOpen={showFarmerSignupModal} 
        onClose={() => setShowFarmerSignupModal(false)}
        onSwitchToLogin={() => {
          setShowFarmerSignupModal(false);
          openLoginCard('farmer');
        }}
      />
    </div>
  )
}

// Enhanced Styles
const container = {
  minHeight: '100vh',
  color: '#333',
  position: 'relative',
};

const heroSection = {
  background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(6, 78, 59, 0.85) 100%), url("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2070&q=80")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  color: 'white',
  minHeight: '100vh',
  textAlign: 'center',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  padding: '80px 20px 0 20px',
};

const heroBackground = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  opacity: 0.3,
};

const heroContent = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '40px',
  alignItems: 'start', // Changed from 'center' to 'start' to prevent vertical centering
  position: 'relative',
  zIndex: 1,
  padding: '0 20px',
};

const heroText = {
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  width: '100%',
  position: 'relative', // Ensure positioning context
  flexShrink: 0, // Prevent shrinking
};

const heroTitle = {
  fontSize: '3.5rem',
  fontWeight: 'bold',
  marginBottom: '20px',
  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
  height: '70px', // Fixed height to prevent any shifting
  lineHeight: '70px',
};

const heroTitleHighlight = {
  color: '#1e40af',
  fontFamily: '"Bell MT", serif',
};

const heroTitleNumber = {
  color: '#1e40af',
  fontWeight: 'bold',
  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  fontFamily: '"Bell MT", serif',
};

const heroSubtitle = {
  fontSize: '1.8rem',
  marginBottom: '20px',
  color: '#1e40af',
  opacity: 1,
  fontWeight: '500',
  textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
  height: '50px', // Fixed height to prevent any shifting
  lineHeight: '50px',
};

const ctaButtons = {
  display: 'flex',
  gap: '16px',
  justifyContent: 'flex-start',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: '40px',
  position: 'relative',
};

const ctaBrandText = {
  fontSize: '2.8rem',
  fontWeight: '900',
  letterSpacing: '0.03em',
  color: '#ffffff',
  textShadow: '0 3px 12px rgba(0,0,0,0.32)',
  margin: '0 6px',
  lineHeight: 1,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const ctaBrandDigit = {
  color: '#0b3d91',
  textShadow: '0 0 10px rgba(11, 61, 145, 0.45)',
};

const ctaHub = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '24px',
  marginTop: '40px',
  padding: '18px 22px',
  borderRadius: '28px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.12))',
  backdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.28)',
  boxShadow: '0 18px 40px rgba(61, 24, 117, 0.14)',
  position: 'relative',
};

const ctaColumnLeft = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
  gap: '12px',
  minHeight: '180px',
  paddingTop: '28px',
};

const ctaColumnRight = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: '12px',
  minHeight: '180px',
};

const ctaLabel = {
  fontSize: '0.88rem',
  fontWeight: '800',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#ffffff',
  opacity: 0.92,
};

const ctaInstruction = {
  margin: 0,
  maxWidth: '360px',
  color: 'rgba(255,255,255,0.92)',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  textShadow: '0 1px 2px rgba(0,0,0,0.18)',
};

const ctaDivider = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '180px',
};

const ctaDividerLine = {
  width: '2px',
  height: '150px',
  borderRadius: '999px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.95), rgba(255,255,255,0.1))',
  boxShadow: '0 0 18px rgba(255,255,255,0.45)',
};

// Removed unused primaryBtn style object

const secondaryBtn = {
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(135deg, #b91c1c, #ef4444, #f97316), linear-gradient(120deg, #fecaca, #fca5a5, #fb7185, #fff1f2)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  backgroundSize: '100% 100%, 250% 250%',
  animation: 'goldBorderFlow 3.2s linear infinite, purplePulse 2.4s ease-in-out infinite',
  color: '#ffffff',
  border: '2px solid transparent',
  padding: '16px 30px',
  borderRadius: '0 26px 0 26px',
  fontSize: '1.04rem',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minWidth: '300px',
  minHeight: '64px',
  letterSpacing: '0.2px',
  boxShadow: '0 10px 22px rgba(185, 28, 28, 0.34), 0 0 0 1px rgba(254, 202, 202, 0.42) inset',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  textShadow: '0 1px 2px rgba(0,0,0,0.18)',
};

const shopFreshBtn = {
  ...secondaryBtn,
  backgroundColor: 'transparent',
  backgroundImage: 'linear-gradient(135deg, #166534, #22c55e, #86efac), linear-gradient(120deg, #dcfce7, #bbf7d0, #86efac, #f0fdf4)',
  boxShadow: '0 10px 22px rgba(22, 101, 52, 0.34), 0 0 0 1px rgba(187, 247, 208, 0.42) inset',
};

// Statistics Section
const statsSection = {
  padding: '60px 20px',
  backgroundColor: '#f8f9fa',
  textAlign: 'center',
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '24px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const statCard = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  webkitBackdropFilter: 'blur(20px)',
  padding: '40px 24px',
  borderRadius: '32px',
  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease',
  border: '1px solid rgba(255,255,255,0.8)',
  position: 'relative',
  overflow: 'hidden',
};

const statIcon = {
  fontSize: '3rem',
  color: '#10b981',
  marginBottom: '15px',
};

const statNumber = {
  fontSize: '2.8rem',
  fontWeight: '800',
  color: '#1f2937',
  marginBottom: '10px',
  letterSpacing: '-1px',
};

const statLabel = {
  fontSize: '1rem',
  color: '#666',
  fontWeight: '500',
};

// Features Section
const featuresSection = {
  padding: '120px 20px',
  background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
  position: 'relative',
  overflow: 'hidden'
};

const homepageTextShadow = {
  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
};

const sectionTitle = {
  textAlign: 'center',
  fontSize: '2.8rem',
  marginBottom: '60px',
  color: '#f8fafc',
  fontWeight: '800',
  letterSpacing: '-1px',
};

const featuresGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '32px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const featureCard = {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  padding: '48px 32px',
  borderRadius: '32px',
  textAlign: 'left',
  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
  position: 'relative',
  zIndex: 10,
};

const featureIconContainer = {
  width: '64px',
  height: '64px',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
  transition: 'transform 0.4s ease',
};

const featureIcon = {
  fontSize: '2rem',
  transition: 'transform 0.4s ease',
};

const featureTitle = {
  fontSize: '1.4rem',
  fontWeight: '800',
  marginBottom: '12px',
  color: '#f8fafc',
  letterSpacing: '-0.3px',
};

const featureDesc = {
  fontSize: '1rem',
  color: '#cbd5e1',
  lineHeight: 1.6,
};

// How It Works Section
const howItWorksSection = {
  padding: '80px 20px',
  backgroundColor: '#f8f9fa',
};

const stepsContainer = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '40px',
  maxWidth: '1200px',
  margin: '0 auto',
  position: 'relative',
};

// Removed unused step style object
const stepStyle = {
  flex: '1 1 300px',
  textAlign: 'center',
  padding: '48px 32px',
  background: '#ffffff',
  borderRadius: '32px',
  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  border: '1px solid rgba(0,0,0,0.03)',
  position: 'relative',
  zIndex: 10,
};

const stepNumber = {
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.8rem',
  fontWeight: 'bold',
  margin: '0 auto 25px',
  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
};

const stepTitle = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  marginBottom: '15px',
  color: '#333',
};

const stepDesc = {
  fontSize: '1rem',
  color: '#666',
  lineHeight: 1.6,
};

// Testimonials Section
const testimonialsSection = {
  padding: '80px 20px',
  backgroundColor: 'white',
};

const testimonialsCarousel = {
  maxWidth: '1200px',
  margin: '0 auto',
  position: 'relative',
};

const testimonialsSlider = {
  position: 'relative',
  width: '100%',
  height: '280px',
  overflow: 'hidden',
  display: 'flex',
};

const testimonialCard = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '32%',
  height: '100%',
  background: 'linear-gradient(to bottom right, #ffffff, #f9fafb)',
  padding: '30px',
  borderRadius: '24px',
  border: '1px solid rgba(0,0,0,0.05)',
  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
};

const testimonialHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
};

const ratingContainer = {
  display: 'flex',
  gap: '2px',
};

const testimonialText = {
  fontSize: '0.9rem',
  color: '#333',
  lineHeight: 1.5,
  marginBottom: '15px',
  fontStyle: 'italic',
};

const testimonialAuthor = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

const authorAvatar = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
};

const authorName = {
  fontSize: '1rem',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 3px 0',
};

const authorRole = {
  fontSize: '0.9rem',
  color: '#666',
  margin: 0,
};

// Quick Access Section
const quickAccessSection = {
  padding: '80px 20px',
  backgroundColor: '#f8f9fa',
};

const quickAccessGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '30px',
  maxWidth: '1000px',
  margin: '0 auto',
};

const quickAccessCard = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '15px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: '1px solid #e9ecef',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
};

const quickAccessIcon = {
  fontSize: '2.5rem',
  color: '#28a745',
  marginBottom: '20px',
};

const quickAccessTitle = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  marginBottom: '15px',
  color: '#333',
};

const quickAccessDesc = {
  fontSize: '1rem',
  color: '#666',
  lineHeight: 1.6,
};

// Contact Section
// Removed unused contact-related style objects: contactSection, contactInfo, contactItem, contactIcon, contactDescription

// Footer
const footer = {
  backgroundColor: '#333',
  color: 'white',
  padding: '40px 20px 20px',
};

const footerContent = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '30px',
  maxWidth: '1200px',
  margin: '0 auto',
  marginBottom: '30px',
};

const footerSection = {
  textAlign: 'left',
};

const footerTitle = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginBottom: '15px',
  color: '#fff',
};

const footerDesc = {
  fontSize: '0.9rem',
  color: '#ccc',
  lineHeight: 1.6,
  marginBottom: '15px',
};

const socialLinks = {
  display: 'flex',
  gap: '15px',
};

// Removed unused socialIcon style object

const footerLink = {
  cursor: 'pointer',
  margin: '8px 0',
  transition: 'color 0.3s ease',
  fontSize: '0.9rem',
  color: '#ccc',
};

const footerContact = {
  fontSize: '0.9rem',
  color: '#ccc',
  margin: '8px 0',
};

const footerBottom = {
  textAlign: 'center',
  borderTop: '1px solid #555',
  paddingTop: '20px',
  fontSize: '0.9rem',
  color: '#ccc',
};

// Login Card Styles
const loginSectionStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'stretch',
};

const loginCardOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(17, 24, 39, 0.6)',
  backdropFilter: 'blur(8px)',
  animation: 'fadeIn 0.3s ease-out',
};

const loginCardStyle = {
  position: 'relative',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
  borderRadius: '32px 0 0 32px',
  padding: '40px 40px',
  width: '100%',
  maxWidth: '480px',
  height: '100%',
  overflowY: 'auto',
  boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.15)',
  textAlign: 'center',
  animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const closeButtonStyle = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  background: 'rgba(0,0,0,0.05)',
  border: 'none',
  fontSize: '20px',
  color: '#4b5563',
  cursor: 'pointer',
  padding: '10px',
  borderRadius: '50%',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const loginCardTitle = {
  fontSize: '2rem',
  fontWeight: '800',
  color: '#111827',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  letterSpacing: '-0.5px',
};

const loginCardSubtitle = {
  fontSize: '1rem',
  color: '#4b5563',
  marginBottom: '30px',
  lineHeight: 1.5,
};

const loginCardFeatures = {
  textAlign: 'left',
  backgroundColor: '#f8f9fa',
  padding: '12px',
  borderRadius: '6px',
  marginTop: '15px',
};

const featureItem = {
  padding: '4px 0',
  fontSize: '0.8rem',
  color: '#495057',
  fontWeight: '500',
};

// Form Styles
const formToggleContainer = {
  display: 'flex',
  marginBottom: '15px',
  borderRadius: '6px',
  overflow: 'hidden',
  border: '1px solid #ddd',
};

const formToggleButton = {
  flex: 1,
  padding: '8px',
  border: 'none',
  background: '#f8f9fa',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '600',
  transition: 'all 0.3s ease',
};

const activeToggleButton = {
  background: 'linear-gradient(135deg, #28a745, #20c997)',
  color: 'white',
};

const methodToggleContainer = {
  display: 'flex',
  marginBottom: '12px',
  gap: '8px',
};

const methodToggleButton = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  background: '#f8f9fa',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
};

const activeMethodButton = {
  background: '#007bff',
  color: 'white',
  borderColor: '#007bff',
};

const formContainer = {
  marginBottom: '15px',
};

const inputGroup = {
  marginBottom: '12px',
};

const inputField = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '0.9rem',
  transition: 'border-color 0.3s ease',
  boxSizing: 'border-box',
};

const passwordContainer = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const passwordToggle = {
  position: 'absolute',
  right: '10px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#666',
  fontSize: '0.9rem',
};

const submitButton = {
  width: '100%',
  padding: '10px',
  background: 'linear-gradient(135deg, #28a745, #20c997)',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const errorMessage = {
  color: '#dc3545',
  fontSize: '0.8rem',
  marginBottom: '12px',
  padding: '8px',
  background: '#f8d7da',
  border: '1px solid #f5c6cb',
  borderRadius: '5px',
  textAlign: 'center',
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes fadeInScale {
    0% { 
      opacity: 0; 
      transform: scale(0.8); 
    }
    100% { 
      opacity: 1; 
      transform: scale(1); 
    }
  }

  @keyframes goldBorderFlow {
    0% { background-position: 0% 50%, 0% 50%; }
    50% { background-position: 0% 50%, 100% 50%; }
    100% { background-position: 0% 50%, 0% 50%; }
  }

  @keyframes purplePulse {
    0%, 100% { box-shadow: 0 6px 16px rgba(91, 33, 182, 0.35); }
    50% { box-shadow: 0 10px 24px rgba(124, 58, 237, 0.5); }
  }
  
  /* Footer Link Hover Effects */
  .footer-link:hover {
    color: #ffffff !important;
  }
  
  /* Footer Responsive Styles */
  @media (max-width: 1024px) {
    footer > div {
      padding: 60px 40px 30px !important;
    }
  }
  
  @media (max-width: 768px) {
    footer > div > div:nth-child(2) {
      flex-direction: column !important;
      padding-left: 0 !important;
      gap: 30px !important;
    }
    
    footer > div > div:first-child {
      position: static !important;
      margin-bottom: 30px;
      display: flex;
      justify-content: center;
    }
  }
  
  /* HomePage Responsive Styles */
  @media (max-width: 1200px) {
    .hero-section {
      padding: 60px 15px !important;
    }
    
    .hero-title {
      font-size: 2.8rem !important;
    }
    
    .hero-subtitle {
      font-size: 1.1rem !important;
    }

    .cta-hub {
      gap: 18px !important;
      padding: 16px 18px !important;
    }

    .cta-column--farmer,
    .cta-column--consumer {
      min-height: 160px !important;
    }

    .cta-column--farmer button,
    .cta-column--consumer button {
      min-width: 280px !important;
    }
    
    .cta-buttons {
      flex-direction: row !important;
      gap: 15px !important;
    }
  }
  
  @media (max-width: 768px) {
    .hero-section {
      padding: 50px 10px !important;
      text-align: center !important;
    }
    
    .hero-title {
      font-size: 2.2rem !important;
      line-height: 1.2 !important;
      margin-bottom: 15px !important;
    }
    
    .hero-subtitle {
      font-size: 1rem !important;
      margin-bottom: 20px !important;
    }

    .cta-hub {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
      text-align: center !important;
    }

    .cta-divider {
      display: none !important;
    }

    .cta-column--farmer,
    .cta-column--consumer {
      min-height: auto !important;
      align-items: center !important;
      justify-content: center !important;
      padding-top: 0 !important;
    }

    .cta-column--farmer button,
    .cta-column--consumer button {
      min-width: min(100%, 320px) !important;
      width: 100% !important;
    }
    
    .hero-description {
      font-size: 1rem !important;
      height: auto !important;
      margin-bottom: 30px !important;
    }
    
    .cta-buttons {
      flex-direction: column !important;
      gap: 12px !important;
      align-items: center !important;
    }
    
    .cta-buttons button {
      width: 100% !important;
      max-width: 280px !important;
      padding: 12px 20px !important;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 20px !important;
    }
    
    .features-grid {
      grid-template-columns: 1fr !important;
      gap: 15px !important;
    }
    
    .testimonials-carousel {
      padding: 40px 10px !important;
    }
  }
  
  @media (max-width: 480px) {
    .hero-section {
      padding: 40px 8px !important;
    }
    
    .hero-title {
      font-size: 1.8rem !important;
      margin-bottom: 10px !important;
    }
    
    .hero-subtitle {
      font-size: 0.9rem !important;
      margin-bottom: 15px !important;
    }

    .cta-hub {
      padding: 14px 14px !important;
    }

    .cta-label {
      font-size: 0.78rem !important;
    }

    .cta-instruction {
      font-size: 0.86rem !important;
    }

    .cta-column--farmer button,
    .cta-column--consumer button {
      min-height: 64px !important;
      padding: 12px 18px !important;
      font-size: 0.95rem !important;
    }
    
    .hero-description {
      font-size: 0.9rem !important;
      margin-bottom: 25px !important;
    }
    
    .cta-buttons button {
      padding: 10px 16px !important;
      font-size: 0.9rem !important;
    }
    
    .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 15px !important;
    }
    
    .stat-card {
      padding: 20px 15px !important;
    }
    
    .stat-number {
      font-size: 1.8rem !important;
    }
    
    .stat-label {
      font-size: 0.9rem !important;
    }
    
    .section-title {
      font-size: 1.8rem !important;
      margin-bottom: 30px !important;
    }
    
    .testimonials-carousel {
      padding: 30px 8px !important;
    }
    
    .testimonial-card {
      padding: 15px !important;
      margin: 0 5px !important;
    }
  }
  
  @media (max-width: 360px) {
    .hero-section {
      padding: 30px 5px !important;
    }
    
    .hero-title {
      font-size: 1.5rem !important;
    }
    
    .hero-subtitle {
      font-size: 0.8rem !important;
    }
    
    .hero-description {
      font-size: 0.8rem !important;
    }
    
    .cta-buttons button {
      padding: 8px 12px !important;
      font-size: 0.8rem !important;
    }
    
    .stat-number {
      font-size: 1.5rem !important;
    }
    
    .section-title {
      font-size: 1.5rem !important;
      margin-bottom: 20px !important;
    }
  }
`;
document.head.appendChild(style);

// New Footer Styles
const newFooter = {
  background: 'linear-gradient(135deg, #1e7e34 0%, #28a745 100%)',
  color: 'white',
  padding: '0',
  position: 'relative',
  marginTop: '-1px',
  overflow: 'visible',
};

const newFooterContent = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '50px 80px 30px',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  position: 'relative',
  gap: '80px',
};

const footerLogo = {
  display: 'flex',
  alignItems: 'flex-start',
  marginTop: '-80px',
  marginLeft: '0',
  position: 'relative',
  zIndex: 10,
  flexShrink: 0,
};

const logoCircle = {
  width: '180px',
  height: '180px',
  borderRadius: '50%',
  border: '7px solid white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'white',
  padding: '30px',
  boxSizing: 'border-box',
  boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
};

const logoText = {
  fontSize: '22px',
  fontWeight: 'bold',
  margin: 0,
  textAlign: 'center',
  lineHeight: '1.1',
  color: 'white',
  textTransform: 'lowercase',
};

const footerMenuSection = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: '20px',
  minWidth: '150px',
};

const footerMenuTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '22px',
  color: 'white',
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
};

const footerMenuList = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const footerMenuItem = {
  fontSize: '16px',
  color: 'white',
  cursor: 'pointer',
  margin: 0,
  transition: 'all 0.3s ease',
  fontWeight: '400',
  padding: '2px 0',
};

const footerContactsSection = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: '20px',
  minWidth: '250px',
};

const footerContactsTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '22px',
  color: 'white',
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
};

const footerContactInfo = {
  display: 'flex',
  flexDirection: 'column',
};

const footerContactText = {
  fontSize: '15px',
  color: 'rgba(255, 255, 255, 0.95)',
  margin: '4px 0',
  lineHeight: '1.6',
  fontWeight: '400',
};

const footerContactPhone = {
  fontSize: '16px',
  color: 'white',
  fontWeight: 'bold',
  margin: '8px 0 5px 0',
};

const footerContactEmail = {
  fontSize: '15px',
  color: 'white',
  margin: '2px 0',
};

const downloadSection = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: '20px',
  alignItems: 'flex-start',
  minWidth: '340px',
};

const downloadTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '22px',
  color: 'white',
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
};

const downloadButtons = {
  display: 'flex',
  flexDirection: 'row',
  gap: '12px',
  marginBottom: '25px',
  flexWrap: 'wrap',
};

const appButton = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '10px 16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: 'none',
  minWidth: '160px',
  boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
};

const appIcon = {
  fontSize: '32px',
  color: '#000',
  marginRight: '12px',
};

const appButtonText = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const downloadOn = {
  fontSize: '10px',
  color: '#666',
  lineHeight: '1',
  marginBottom: '3px',
};

const storeName = {
  fontSize: '15px',
  color: '#000',
  fontWeight: 'bold',
  lineHeight: '1.2',
};

const socialMediaIcons = {
  display: 'flex',
  gap: '20px',
  marginTop: '10px',
};

const socialIcon = {
  fontSize: '32px',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  opacity: 0.95,
};

const newFooterBottom = {
  padding: '20px 80px',
  marginTop: '30px',
  textAlign: 'left',
};

const copyrightText = {
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.95)',
  margin: 0,
  fontWeight: '300',
};

// Footer Styles - Based on provided HTML/CSS
const footerWrapper = {
  position: 'relative',
  marginTop: '100px',
  color: 'white',
  filter: 'drop-shadow(0 -5px 10px rgba(0,0,0,0.05))',
};

const footerLogoStyle = {
  width: '200px',
  height: '200px',
  background: 'white',
  borderRadius: '50%',
  position: 'absolute',
  top: '-150px',
  left: '10%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  zIndex: 10,
  overflow: 'hidden',
};

const footerCurve = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  overflow: 'hidden',
  lineHeight: 0,
  transform: 'translateY(-99%)',
};

const footerContentStyle = {
  backgroundColor: '#157F3D',
  padding: '20px 20px 10px',
  position: 'relative',
};

const footerColumnsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  maxWidth: '1200px',
  margin: '0 auto',
  paddingTop: '0',
};

const colStyle = {
  flex: 1,
  minWidth: '250px',
  marginBottom: '10px',
  padding: '0 15px',
};

const colHeaderStyle = {
  fontSize: '16px',
  fontWeight: '700',
  marginBottom: '15px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const footerLinksStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const footerLinkItemStyle = {
  marginBottom: '10px',
  color: '#e0e0e0',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontWeight: '400',
};

const contactInfoStyle = {};

const contactParagraphStyle = {
  fontSize: '14px',
  lineHeight: '1.6',
  marginBottom: '8px',
  color: '#e0e0e0',
};

const highlightPhoneStyle = {
  fontWeight: 'bold',
  color: 'white',
  fontSize: '15px',
  marginBottom: '8px',
};

const contactEmailStyle = {
  color: '#e0e0e0',
  fontSize: '14px',
  marginBottom: '8px',
};

const appBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  background: 'white',
  color: 'black',
  borderRadius: '8px',
  padding: '8px 12px',
  marginBottom: '10px',
  textDecoration: 'none',
  width: 'fit-content',
  border: '1px solid #ddd',
  transition: 'transform 0.2s',
  cursor: 'pointer',
};

const appTextStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const appTextSpanStyle = {
  display: 'block',
  fontSize: '10px',
  color: '#555',
};

const appTextStrongStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 'bold',
};

const socialRowStyle = {
  textAlign: 'center',
  marginTop: '15px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255,255,255,0.1)',
};

const socialIconsContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '25px',
  marginBottom: '10px',
};

const socialLinkIconStyle = {
  color: 'white',
  transition: 'opacity 0.3s',
  cursor: 'pointer',
  textDecoration: 'none',
};

const copyrightStyle = {
  textAlign: 'center',
  fontSize: '12px',
  color: '#bbb',
  marginTop: '8px',
  paddingBottom: '8px',
};

export default HomePage