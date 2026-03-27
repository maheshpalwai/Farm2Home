import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaCamera, FaLock, FaSpinner } from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    role: '',
    photoURL: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const firestoreData = userDoc.exists() ? userDoc.data() : {};
      const data = {
        fullName: firestoreData.name || user.displayName || '',
        email: user.email || '',
        phone: firestoreData.phoneNumber || firestoreData.phone || '',
        addressLine: firestoreData.addressLine || '',
        city: firestoreData.city || '',
        state: firestoreData.state || '',
        pincode: firestoreData.pincode || '',
        role: firestoreData.role || '',
        photoURL: user.photoURL || firestoreData.photoURL || ''
      };
      setUserData(data);
      setOriginalData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      showMessage('error', t('profile_load_error'));
      setLoading(false);
    }
  }, [showMessage, t]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSaveProfile = async () => {
    if (!userData.fullName.trim()) {
      showMessage('error', 'Name cannot be empty');
      return;
    }
    if (userData.phone && !/^[6-9]\d{9}$/.test(userData.phone.replace(/\s+/g, ''))) {
      showMessage('error', 'Enter a valid 10-digit Indian phone number');
      return;
    }
    if (userData.pincode && !/^\d{6}$/.test(userData.pincode)) {
      showMessage('error', 'Enter a valid 6-digit pincode');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateProfile(user, {
        displayName: userData.fullName,
        photoURL: userData.photoURL || null
      });
      await updateDoc(doc(db, 'users', user.uid), {
        name: userData.fullName,
        phone: userData.phone,
        phoneNumber: userData.phone,
        addressLine: userData.addressLine,
        city: userData.city,
        state: userData.state,
        pincode: userData.pincode,
        photoURL: userData.photoURL || '',
        updatedAt: new Date().toISOString()
      });
      setOriginalData(userData);
      setEditing(false);
      showMessage('success', t('profile_updated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', t('profile_update_error'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', t('passwords_dont_match'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', t('password_too_short'));
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
      showMessage('success', t('password_changed'));
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showMessage('error', t('current_password_wrong') || 'Current password is incorrect');
      } else {
        showMessage('error', t('password_change_error'));
      }
    }
  };

  const handleCancel = () => {
    setUserData(originalData);
    setEditing(false);
  };

  /* ── Avatar colour helper ─────────────────────── */
  const getAvatarColor = (name) => {
    const palette = [
      '#FFBF00', '#FF6B6B', '#4ECDC4', '#45B7D1',
      '#96CEB4', '#BE6DB7', '#F7A738', '#2ECC71'
    ];
    const idx = ((name || 'U').charCodeAt(0) - 65 + 26) % palette.length;
    return palette[idx];
  };

  /* ── Firebase Storage upload ───────────────────── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) { showMessage('error', 'Please log in first'); return; }

    // Client-side size guard (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image too large. Maximum size is 5 MB.');
      return;
    }

    setUploadingPhoto(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `profile_photos/${user.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (error) => {
          console.error('Upload error:', error);
          showMessage('error', 'Photo upload failed. Please try again.');
          setUploadingPhoto(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Update Firebase Auth profile
          await updateProfile(user, { photoURL: downloadURL });

          // Persist to Firestore so it survives page refresh
          await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });

          setUserData((prev) => ({ ...prev, photoURL: downloadURL }));
          setOriginalData((prev) => ({ ...prev, photoURL: downloadURL }));
          showMessage('success', 'Profile photo updated!');
          setUploadingPhoto(false);
        }
      );
    } catch (err) {
      console.error('Upload error:', err);
      showMessage('error', 'Photo upload failed. Please try again.');
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-container">
        <div className="loading-spinner">{t('loading')}...</div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1>{t('profile_settings')}</h1>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`message alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        {/* Profile Photo Section */}
        <div className="profile-photo-section">
          <div className="photo-container">
            {userData.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="profile-photo" />
            ) : (
              <div
                className="profile-avatar-letter"
                style={{ background: getAvatarColor(userData.fullName) }}
              >
                {(userData.fullName || 'U')[0].toUpperCase()}
              </div>
            )}

            {/* Upload progress ring overlay */}
            {uploadingPhoto && (
              <div className="photo-upload-overlay">
                <FaSpinner className="spin-icon" />
                <span>{uploadProgress}%</span>
              </div>
            )}

            {/* Camera button — always visible, not just during editing */}
            <label className={`photo-upload-btn ${uploadingPhoto ? 'disabled' : ''}`}>
              <FaCamera />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="profile-name">
            <h2>{userData.fullName || 'User'}</h2>
            <p className="user-role">{userData.role === 'farmer' ? t('farmer') : t('consumer')}</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="profile-info-section">
          <div className="section-header">
            <h3>{t('personal_info')}</h3>
            {!editing ? (
              <button className="edit-btn" onClick={() => setEditing(true)}>
                <FaEdit /> {t('edit')}
              </button>
            ) : (
              <div className="edit-actions">
                <button className="cancel-btn" onClick={handleCancel}>
                  <FaTimes /> {t('cancel')}
                </button>
                <button className="save-btn" onClick={handleSaveProfile}>
                  <FaSave /> {t('save')}
                </button>
              </div>
            )}
          </div>

          <div className="info-grid">
            <div className="info-field">
              <label><FaUser /> {t('full_name')}</label>
              <input
                type="text"
                name="fullName"
                value={userData.fullName}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder={t('enter_full_name')}
              />
            </div>

            <div className="info-field">
              <label><FaEnvelope /> {t('email')}</label>
              <input
                type="email"
                name="email"
                value={userData.email}
                disabled
                className="disabled-field"
              />
            </div>

            <div className="info-field">
              <label><FaPhone /> {t('phone')}</label>
              <input
                type="tel"
                name="phone"
                value={userData.phone}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder={t('enter_phone')}
              />
            </div>

            <div className="info-field full-width">
              <label><FaMapMarkerAlt /> {t('address')}</label>
              <input
                type="text"
                name="addressLine"
                value={userData.addressLine}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder={t('enter_address')}
              />
            </div>

            <div className="info-field">
              <label>{t('city')}</label>
              <input
                type="text"
                name="city"
                value={userData.city}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder={t('enter_city')}
              />
            </div>

            <div className="info-field">
              <label>{t('state')}</label>
              <input
                type="text"
                name="state"
                value={userData.state}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder={t('enter_state')}
              />
            </div>

            <div className="info-field">
              <label>{t('pincode')}</label>
              <input
                type="text"
                name="pincode"
                value={userData.pincode}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder={t('enter_pincode')}
              />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="password-section">
          <div className="section-header">
            <h3><FaLock /> {t('change_password')}</h3>
            {!changingPassword && (
              <button className="edit-btn" onClick={() => setChangingPassword(true)}>
                {t('change_password')}
              </button>
            )}
          </div>

          {changingPassword && (
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="info-field">
                <label>{t('current_password')}</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="info-field">
                <label>{t('new_password')}</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                />
              </div>

              <div className="info-field">
                <label>{t('confirm_password')}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="edit-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setChangingPassword(false)}
                >
                  <FaTimes /> {t('cancel')}
                </button>
                <button type="submit" className="save-btn">
                  <FaSave /> {t('save')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Saved Addresses */}
        <div className="saved-addresses-section">
          <div className="section-header">
            <h3>{t('saved_addresses')}</h3>
            <button className="edit-btn">
              {t('add_address')}
            </button>
          </div>
          
          {addresses.length > 0 ? (
            <div className="addresses-grid">
              {addresses.map((address, index) => (
                <div key={index} className="address-card">
                  <div className="address-content">
                    <p className="address-line">{address.addressLine}</p>
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                    {address.isDefault && (
                      <span className="default-badge">{t('default_address')}</span>
                    )}
                  </div>
                  <div className="address-actions">
                    <button className="icon-btn"><FaEdit /></button>
                    <button className="icon-btn"><FaTimes /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t('no_saved_addresses')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
