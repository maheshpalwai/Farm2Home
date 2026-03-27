import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const SignupPage = () => {
  const [userType, setUserType] = useState('consumer'); // 'consumer' or 'farmer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[^@\s]+@gmail\.com$/i.test(email.trim())) {
      setError(t('gmail_only_signup'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    if (password.length < 6) {
      setError(t('password_min_length'));
      return;
    }

    const trimmedName = name.trim();
    const nameRegex = /^[a-zA-Z\s'\-]+$/;
    if (!trimmedName || trimmedName.length < 2) {
      setError(t('full_name_min_length'));
      return;
    }
    if (trimmedName.length > 60) {
      setError(t('full_name_max_length'));
      return;
    }
    if (!nameRegex.test(trimmedName)) {
      setError(t('name_characters_only'));
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError(t('valid_10_digit_phone'));
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user profile to Firestore
      const userData = {
        uid: user.uid,
        email: email,
        name: name || 'User',
        phoneNumber: phone.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, ''),
        role: userType,
        status: 'active',
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      localStorage.setItem('currentUser', JSON.stringify({ ...userData, createdAt: new Date().toISOString() }));
      navigate(userType === 'farmer' ? '/farmer-dashboard' : '/consumer');

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('account_exists_login_instead'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('invalid_email'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('password_min_length'));
      } else {
        setError(err.message || t('create_account_failed'));
      }
    } finally {
      setLoading(false);
    }
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
          title={t('back_to_home')}
        >
          <FaArrowLeft />
          {t('home')}
        </button>
        
        <h2 style={{ textAlign: 'center', marginBottom: '20px', marginTop: '20px' }}>{t('create_account')}</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button onClick={() => setUserType('consumer')} style={{ padding: '10px 20px', background: userType === 'consumer' ? '#28a745' : 'grey', border: 'none', borderRadius: '5px 0 0 5px', cursor: 'pointer', color: 'white' }}>{t('consumer')}</button>
          <button onClick={() => setUserType('farmer')} style={{ padding: '10px 20px', background: userType === 'farmer' ? '#28a745' : 'grey', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer', color: 'white' }}>{t('farmer')}</button>
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder={t('full_name')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="tel"
              placeholder={t('phone_number_10_digits')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              maxLength={15}
              style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="password"
              placeholder={t('password_min_6')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder={t('confirm_password_placeholder')}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '5px' }}
            />
          </div>
          
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
          
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
            {loading ? t('creating_account') : (userType === 'farmer' ? t('sign_up_as_farmer') : t('sign_up_as_consumer'))}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          {t('already_have_account')} <Link to="/" style={{ color: '#28a745', textDecoration: 'none' }}>{t('login')}</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
