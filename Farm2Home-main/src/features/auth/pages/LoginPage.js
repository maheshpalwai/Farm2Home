import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { auth, db, functions } from '../../../firebase';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
  const [isFarmer, setIsFarmer] = useState(true);
  const [loginMethod, setLoginMethod] = useState('email'); // 'phone' or 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleEmailLogin = async (emailInput = email, passwordInput = password) => {
    setError('');
    setLoading(true);

    if (!emailInput || !passwordInput) {
      setError(t('enter_email_phone_password'));
      setLoading(false);
      return;
    }

    try {
      let emailToUse = emailInput.trim();

      // Detect phone number: only digits (with optional +, spaces, dashes)
      const isPhoneNumber = /^[\d\s\-+()]+$/.test(emailToUse);

      if (isPhoneNumber) {
        // Call the Cloud Function (runs with Admin SDK — bypasses all Firestore rules)
        const getEmailByPhone = httpsCallable(functions, 'getEmailByPhone');
        const cleanPhone = emailToUse.replace(/\D/g, '');
        const result = await getEmailByPhone({ phoneNumber: cleanPhone });
        emailToUse = result.data.email;
      }

      // Ensure session persists across page-reload and browser-restart
      await setPersistence(auth, browserLocalPersistence);
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, passwordInput);
      const user = userCredential.user;

      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error(t('user_profile_not_found'));
      }

      const userData = { uid: user.uid, ...userDocSnap.data() };

      if (userData.status && userData.status !== 'active') {
        throw new Error(t('account_inactive'));
      }

      // Role validation — make sure they're logging in through the correct portal
      const selectedRole = isFarmer ? 'farmer' : 'consumer';
      if (userData.role && userData.role !== selectedRole) {
        throw new Error(
          t('account_registered_as_role', { role: userData.role })
        );
      }

      localStorage.setItem('currentUser', JSON.stringify(userData));
      navigate(userData.role === 'farmer' ? '/farmer-dashboard' : '/consumer');
    } catch (err) {
      let errorMessage = t('failed_to_login');
      if (err.code === 'auth/user-not-found') {
        errorMessage = t('no_account_found_email');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = t('incorrect_password');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginMethod === 'phone') return handleEmailLogin(phone, password);
    return handleEmailLogin(email, password);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#181818', minHeight: '100vh', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#2a2a2a', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', width: '400px', position: 'relative' }}>
        {/* Back to Home Button */}
        <button 
          onClick={handleBackToHome}
          style={{ 
            position: 'absolute', 
            top: '15px', 
            left: '15px', 
            background: 'transparent', 
            border: 'none', 
            color: '#28a745', 
            cursor: 'pointer', 
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            borderRadius: '5px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#333'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          title="Back to Home"
        >
          <FaArrowLeft />
          {t('home')}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '20px' }}>
          <button onClick={() => setIsFarmer(true)} style={{ padding: '10px 20px', background: isFarmer ? '#28a745' : 'grey', border: 'none', borderRadius: '5px 0 0 5px', cursor: 'pointer', color: 'white' }}>{t('farmer')}</button>
          <button onClick={() => setIsFarmer(false)} style={{ padding: '10px 20px', background: !isFarmer ? '#28a745' : 'grey', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer', color: 'white' }}>{t('consumer')}</button>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{isFarmer ? t('farmer_login') : t('consumer_login')}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button onClick={() => setLoginMethod('phone')} style={{ padding: '8px 15px', background: loginMethod === 'phone' ? '#444' : '#2a2a2a', border: '1px solid #555', cursor: 'pointer', color: 'white' }}>{t('phone_login')}</button>
          <button onClick={() => setLoginMethod('email')} style={{ padding: '8px 15px', background: loginMethod === 'email' ? '#444' : '#2a2a2a', border: '1px solid #555', cursor: 'pointer', color: 'white' }}>{t('email_login')}</button>
        </div>
        <form onSubmit={handleSubmit}>
          {loginMethod === 'phone' ? (
            <>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder={t('enter_phone_country_code')}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="password"
                  placeholder={t('password_placeholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder={t('email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="password"
                  placeholder={t('password_placeholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
                />
              </div>
            </>
          )}
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: loading ? '#666' : '#28a745', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              color: 'white', 
              fontSize: '16px' 
            }}
          >
            {loading ? t('loading') : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
