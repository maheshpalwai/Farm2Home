import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaTimes, FaEnvelope, FaLock, FaUser, FaPhone } from 'react-icons/fa';

const FarmerSignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formType, setFormType] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber) {
        throw new Error('Please fill in all fields');
      }

      if (!/^[^@\s]+@gmail\.com$/i.test(formData.email.trim())) {
        throw new Error('Only Gmail addresses are allowed for registration.');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate phone number (basic validation)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\D/g, ''))) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: formData.name
      });

      // Create user document in Firestore with uid as document ID
      const userDocRef = doc(db, 'users', user.uid);
      const userData = {
        id: user.uid,
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: 'farmer', // Auto-set to farmer in background
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await setDoc(userDocRef, userData);

      console.log('✅ Farmer account created successfully with UID:', user.uid);
      setSuccess('Account created successfully! Redirecting to dashboard...');

      // Store user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Wait a bit for auth state to propagate before redirecting
      setTimeout(() => {
        console.log('🔄 Redirecting to farmer dashboard...');
        navigate('/farmer-dashboard');
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = 'Failed to create account. Please try again.';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const emailToUse = formData.email.trim();

      // Validate inputs
      if (!emailToUse || !formData.password) {
        throw new Error('Please enter your email and password');
      }

      // Ensure session persists across page-reload and browser-restart
      await setPersistence(auth, browserLocalPersistence);
      // Sign in with Firebase Auth using email
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        emailToUse, 
        formData.password
      );
      
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User data not found.');
      }

      const userData = userDoc.data();
      
      // Add uid to userData if not present
      if (!userData.uid) {
        userData.uid = user.uid;
      }
      
      // Block only explicitly inactive/suspended accounts (legacy users may not have status)
      const normalizedStatus = (userData.status || '').toLowerCase();
      if (normalizedStatus === 'inactive' || normalizedStatus === 'suspended') {
        throw new Error('Your account is inactive. Please contact support.');
      }

      if (userData.role !== 'farmer') {
        throw new Error('This login is for farmers only.');
      }

      console.log('✅ Login successful with UID:', user.uid);
      setSuccess('Login successful! Redirecting...');

      // Store user data in localStorage with uid
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Redirect to farmer dashboard
      setTimeout(() => {
        navigate('/farmer-dashboard');
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Failed to login. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found. Please sign up.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    if (formType === 'register') {
      handleRegister(e);
    } else {
      handleLogin(e);
    }
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Inline styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px'
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
    maxWidth: '420px',
    width: '100%',
    position: 'relative',
    animation: 'fadeIn 0.3s ease-out'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px',
    transition: 'color 0.2s',
    zIndex: 1
  };

  const titleStyle = {
    fontSize: '26px',
    fontWeight: '600',
    textAlign: 'center',
    margin: '0',
    color: '#1f2937',
    paddingTop: '40px',
    paddingBottom: '8px'
  };

  const subtitleStyle = {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: '14px',
    margin: '0 0 32px 0'
  };

  const formStyle = {
    padding: '0 40px 40px 40px'
  };

  const errorStyle = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px'
  };

  const successStyle = {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px'
  };

  const fieldStyle = {
    marginBottom: '20px'
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    backgroundColor: '#fafafa'
  };

  const submitButtonStyle = {
    width: '100%',
    background: loading ? '#9CA3AF' : 'linear-gradient(to right, #16a34a, #15803d)',
    color: 'white',
    padding: '14px',
    borderRadius: '8px',
    fontWeight: '600',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '15px',
    transition: 'all 0.2s',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const loginLinkStyle = {
    textAlign: 'center',
    fontSize: '14px',
    color: '#6B7280',
    marginTop: '20px',
    margin: '20px 0 0 0'
  };

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    fontSize: '14px',
    textDecoration: 'none'
  };

  const tabContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0',
    marginBottom: '20px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb'
  };

  const tabButtonStyle = (isActive) => ({
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isActive ? '#16a34a' : 'white',
    color: isActive ? 'white' : '#6b7280'
  });

  const inputMethodContainerStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  };

  const inputMethodButtonStyle = (isActive) => ({
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    border: `2px solid ${isActive ? '#16a34a' : '#e5e7eb'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isActive ? '#f0fdf4' : 'white',
    color: isActive ? '#16a34a' : '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  });

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={closeButtonStyle}
          aria-label="Close"
          onMouseOver={(e) => e.target.style.color = '#4B5563'}
          onMouseOut={(e) => e.target.style.color = '#9CA3AF'}
        >
          <FaTimes />
        </button>

        {/* Title */}
        <h2 style={titleStyle}>Join as Farmer</h2>
        <p style={subtitleStyle}>Start selling your fresh produce directly to consumers</p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Login/Register Tabs */}
          <div style={tabContainerStyle}>
            <button
              type="button"
              style={tabButtonStyle(formType === 'login')}
              onClick={() => {
                setFormType('login');
                setError('');
                setSuccess('');
              }}
            >
              Login
            </button>
            <button
              type="button"
              style={tabButtonStyle(formType === 'register')}
              onClick={() => {
                setFormType('register');
                setError('');
                setSuccess('');
              }}
            >
              Register
            </button>
          </div>



          {/* Error Message */}
          {error && <div style={errorStyle}>{error}</div>}

          {/* Success Message */}
          {success && <div style={successStyle}>{success}</div>}

          {/* Conditional Fields Based on Form Type */}
          {formType === 'register' && (
            <>
              {/* Name Field - Only for Register */}
              <div style={fieldStyle}>
                <div style={{ position: 'relative' }}>
                  <FaUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    disabled={loading}
                    onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.backgroundColor = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fafafa'; }}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div style={fieldStyle}>
                <div style={{ position: 'relative' }}>
                  <FaEnvelope style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    disabled={loading}
                    onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.backgroundColor = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fafafa'; }}
                    required
                  />
                </div>
              </div>

              {/* Phone Number Field */}
              <div style={fieldStyle}>
                <div style={{ position: 'relative' }}>
                  <FaPhone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none' }} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Phone Number (10 digits)"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    disabled={loading}
                    onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.backgroundColor = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fafafa'; }}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Login Fields - Email only */}
          {formType === 'login' && (
            <>
              <div style={fieldStyle}>
                <div style={{ position: 'relative' }}>
                  <FaEnvelope style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    style={{ ...inputStyle, paddingLeft: 38 }}
                    disabled={loading}
                    onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.backgroundColor = 'white'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fafafa'; }}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Password Field - Always shown */}
          <div style={fieldStyle}>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none' }} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                style={{ ...inputStyle, paddingLeft: 38 }}
                disabled={loading}
                onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.backgroundColor = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fafafa'; }}
                required
              />
            </div>
          </div>

          {/* Confirm Password Field - Only for Register */}
          {formType === 'register' && (
            <div style={fieldStyle}>
              <div style={{ position: 'relative' }}>
                <FaLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none' }} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  disabled={loading}
                  onFocus={(e) => { e.target.style.borderColor = '#16a34a'; e.target.style.backgroundColor = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fafafa'; }}
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={submitButtonStyle}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ animation: 'spin 1s linear infinite', marginRight: '12px', height: '18px', width: '18px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {formType === 'login' ? 'Logging in...' : 'Creating Account...'}
              </span>
            ) : (
              formType === 'login' ? 'Login' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmerSignupModal;
