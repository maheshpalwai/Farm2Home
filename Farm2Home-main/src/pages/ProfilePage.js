import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes, FaCamera, FaLock, FaSpinner, FaCheckCircle, FaExclamationCircle, FaMapPin, FaPlusCircle, FaLeaf } from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
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
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [newAddress, setNewAddress] = useState({
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  const showPasswordMessage = useCallback((type, text) => {
    setPasswordMessage({ type, text });
    setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000);
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
      
      // Cache busting for the image
      const photoURL = firestoreData.photoURL || user.photoURL || '';
      const displayPhotoURL = photoURL ? `${photoURL}${photoURL.includes('?') ? '&' : '?'}t=${Date.now()}` : '';

      const data = {
        fullName: firestoreData.name || user.displayName || '',
        email: user.email || '',
        phone: firestoreData.phoneNumber || firestoreData.phone || '',
        role: firestoreData.role || '',
        photoURL: displayPhotoURL
      };
      setUserData(data);
      setOriginalData(data);
      setAddresses(firestoreData.savedAddresses || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      showMessage('error', t('profile_load_error'));
      setLoading(false);
    }
  }, [showMessage, t]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
      });
      await updateDoc(doc(db, 'users', user.uid), {
        name: userData.fullName,
        phone: userData.phone,
        phoneNumber: userData.phone,
        updatedAt: new Date().toISOString()
      });
      setOriginalData(userData);
      setEditing(false);
      showMessage('success', t('profile_updated', 'Profile updated successfully!'));
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', t('profile_update_error', 'Failed to update profile'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.currentPassword === '') {
      showPasswordMessage('error', 'Please enter your current password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showPasswordMessage('error', t('passwords_dont_match'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showPasswordMessage('error', t('password_too_short'));
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
      showPasswordMessage('success', t('password_changed'));
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showPasswordMessage('error', t('current_password_wrong') || 'Current password is incorrect');
      } else {
        showPasswordMessage('error', t('password_change_error'));
      }
    }
  };

  const handleCancel = () => {
    setUserData(originalData);
    setEditing(false);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.addressLine || !newAddress.city || !newAddress.pincode) {
      showMessage('error', 'Please fill all required address fields');
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const updatedAddresses = [...addresses, newAddress];
      if (newAddress.isDefault) {
        updatedAddresses.forEach((addr, idx) => {
          if (idx !== updatedAddresses.length - 1) addr.isDefault = false;
        });
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        savedAddresses: updatedAddresses
      });
      
      setAddresses(updatedAddresses);
      setShowAddressForm(false);
      setNewAddress({ addressLine: '', city: '', state: '', pincode: '', isDefault: false });
      showMessage('success', t('address_added', 'Address added successfully!'));
    } catch (err) {
      console.error('Error adding address:', err);
      showMessage('error', t('address_add_error', 'Failed to add address'));
    }
  };

  const deleteAddress = async (index) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const updated = addresses.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'users', user.uid), { savedAddresses: updated });
      setAddresses(updated);
      showMessage('success', t('address_deleted', 'Address removed'));
    } catch (err) {
      showMessage('error', t('address_delete_error', 'Failed to remove address'));
    }
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
      showMessage('error', t('file_too_large', 'File is too large. Max size 5MB.'));
      return;
    }

    // 1. Immediate local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserData(prev => ({ ...prev, photoURL: event.target.result }));
    };
    reader.readAsDataURL(file);

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
          console.error('Upload Error:', error);
          showMessage('error', t('photo_upload_failed', 'Photo upload failed. Please check your connection.'));
          setUploadingPhoto(false);
          // Revert preview on failure
          setUserData(prev => ({ ...prev, photoURL: originalData.photoURL }));
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const finalPhotoURL = `${downloadURL}${downloadURL.includes('?') ? '&' : '?'}t=${Date.now()}`;
          console.log('Setting final photo URL:', finalPhotoURL);

          setUserData((prev) => ({ ...prev, photoURL: finalPhotoURL }));
          setOriginalData((prev) => ({ ...prev, photoURL: finalPhotoURL }));

          await updateProfile(user, { photoURL: downloadURL });
          console.log('Auth profile updated');
          await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
          console.log('Firestore doc updated');

          // Sync with localStorage if it exists (for other components)
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem('currentUser', JSON.stringify({ ...parsed, photoURL: downloadURL }));
            console.log('localStorage updated');
          }

          showMessage('success', t('photo_updated', 'Profile photo updated!'));
          setUploadingPhoto(false);
        }
      );
    } catch (err) {
      console.error('Outer upload error:', err);
      showMessage('error', t('photo_upload_failed', 'Photo upload failed.'));
      setUploadingPhoto(false);
      setUserData(prev => ({ ...prev, photoURL: originalData.photoURL }));
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
    <div className="profile-page-container" key={i18n.language}>
      {/* Visual Background Blobs are handled in CSS */}
      <div className="profile-header">
        <h1>{t('profile_settings', 'Profile Settings')}</h1>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`message alert ${message.type === 'success' ? 'success' : 'error'}`}>
          {message.type === 'success' ? <FaCheckCircle style={{fontSize:18}}/> : <FaExclamationCircle style={{fontSize:18}}/>}
          <span>{message.text}</span>
        </div>
      )}

      <div className="profile-content">
        {/* Profile Sidebar Info Section */}
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

            <label 
              htmlFor="photo-upload-input"
              className={`photo-upload-btn ${uploadingPhoto ? 'disabled' : ''}`}
              title={t('change_photo', 'Change Profile Photo')}
            >
              <FaCamera />
            </label>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              disabled={uploadingPhoto}
            />
          </div>
          <div className="profile-name">
            <h2>{userData.fullName || t('profile_user_placeholder', 'User')}</h2>
            <p className="user-role">
              {userData.role === 'farmer' ? (
                <><FaLeaf style={{marginRight:6, fontSize:12}}/> {t('farmer', 'Farmer')}</>
              ) : (
                <><FaUser style={{marginRight:6, fontSize:12}}/> {t('consumer', 'Consumer')}</>
              )}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="profile-main-area">
          {/* Personal Information */}
          <div className="profile-info-section">
            <div className="section-header">
              <h3><FaUser /> {t('personal_info', 'Personal Information')}</h3>
              {!editing ? (
                <button className="edit-btn" onClick={() => setEditing(true)}>
                  <FaEdit /> {t('edit', 'Edit Profile')}
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={handleCancel}>
                    <FaTimes /> {t('cancel', 'Cancel')}
                  </button>
                  <button className="save-btn" onClick={handleSaveProfile}>
                    <FaSave /> {t('save', 'Save Changes')}
                  </button>
                </div>
              )}
            </div>

            <div className="info-grid">
              <div className="info-field">
                <label><FaUser /> {t('full_name', 'Full Name')}</label>
                <input
                  type="text"
                  name="fullName"
                  value={userData.fullName}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder={t('profile_placeholder_name', 'Your full name')}
                />
              </div>

              <div className="info-field">
                <label><FaEnvelope /> {t('email', 'Email Address')}</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  disabled
                  className="disabled-field"
                />
              </div>

              <div className="info-field">
                <label><FaPhone /> {t('phone', 'Phone Number')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder={t('profile_placeholder_phone', '10-digit mobile number')}
                />
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="password-section">
            <div className="section-header">
              <h3><FaLock /> {t('profile_security_heading', 'Security & Password')}</h3>
              {!changingPassword ? (
                <button className="edit-btn secondary-btn" onClick={() => setChangingPassword(true)}>
                  <FaEdit /> {t('change_password', 'Change Password')}
                </button>
              ) : (
                <button className="cancel-password-btn cancel-btn" onClick={() => setChangingPassword(false)}>
                  <FaTimes /> {t('cancel', 'Cancel')}
                </button>
              )}
            </div>

            {passwordMessage.text && (
              <div className={`message alert ${passwordMessage.type === 'success' ? 'success' : 'error'}`} style={{margin: '10px 0'}}>
                {passwordMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            {changingPassword && (
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="info-field">
                  <label>{t('current_password', 'Current Password')}</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="info-field">
                  <label>{t('new_password', 'New Password')}</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                    placeholder="••••••••"
                  />
                </div>

                <div className="info-field">
                  <label>{t('confirm_password', 'Confirm New Password')}</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="edit-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setChangingPassword(false)}
                  >
                    <FaTimes /> {t('cancel', 'Cancel')}
                  </button>
                  <button type="submit" className="save-btn">
                    <FaSave /> {t('save', 'Update Password')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Saved Addresses */}
          <div className="saved-addresses-section">
            <div className="section-header">
              <h3><FaMapPin /> {t('saved_addresses', 'Saved Addresses')}</h3>
              {!showAddressForm && (
                <button className="add-address-btn save-btn" onClick={() => setShowAddressForm(true)} style={{padding:'8px 16px', fontSize:'0.75rem'}}>
                  <FaPlusCircle /> {t('add_address', 'Add New Address')}
                </button>
              )}
            </div>

            {showAddressForm && (
              <div className="address-form-container" style={{background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e2e8f0'}}>
                <h4 style={{marginBottom: '15px'}}>{t('add_address_details', 'Address Details')}</h4>
                <div className="info-grid">
                  <div className="info-field full-width">
                    <label>{t('address', 'Address Line')}</label>
                    <input
                      type="text"
                      placeholder={t('profile_placeholder_address', 'Flat/House No, Street, Locality')}
                      value={newAddress.addressLine}
                      onChange={(e) => setNewAddress({...newAddress, addressLine: e.target.value})}
                      required
                    />
                  </div>
                  <div className="info-field">
                    <label>{t('city', 'City')}</label>
                    <input
                      type="text"
                      placeholder={t('enter_city', 'City')}
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                      required
                    />
                  </div>
                  <div className="info-field">
                    <label>{t('state', 'State')}</label>
                    <input
                      type="text"
                      placeholder={t('enter_state', 'State')}
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                      required
                    />
                  </div>
                  <div className="info-field">
                    <label>{t('pincode', 'Pincode')}</label>
                    <input
                      type="text"
                      placeholder={t('enter_pincode', 'Pincode')}
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                      required
                    />
                  </div>
                  <div className="info-field" style={{flexDirection:'row', alignItems:'center', gap: '10px', paddingTop: '10px'}}>
                    <input
                      type="checkbox"
                      id="default-check"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                      style={{width:'18px', height:'18px'}}
                    />
                    <label htmlFor="default-check" style={{marginTop:0}}>{t('set_as_default', 'Set as default address')}</label>
                  </div>
                </div>
                <div className="edit-actions" style={{marginTop: '20px'}}>
                  <button className="cancel-btn" onClick={() => setShowAddressForm(false)}>
                    <FaTimes /> {t('cancel', 'Cancel')}
                  </button>
                  <button className="save-btn" onClick={handleAddAddress}>
                    <FaSave /> {t('save', 'Save Address')}
                  </button>
                </div>
              </div>
            )}
            
            {addresses.length > 0 ? (
              <div className="addresses-grid">
                {addresses.map((address, index) => (
                  <div key={index} className="address-card">
                    <div className="address-content">
                      <p className="address-line">{address.addressLine}</p>
                      <p style={{fontSize:'0.85rem'}}>{address.city}, {address.state} - {address.pincode}</p>
                      {address.isDefault && (
                        <span className="default-badge"><FaCheckCircle style={{marginRight:4}}/> {t('default_address', 'Default Delivery Address')}</span>
                      )}
                    </div>
                    <div className="address-actions">
                      <button className="icon-btn" title={t('edit', 'Edit')}><FaEdit /></button>
                      <button className="icon-btn" title={t('delete', 'Delete')} onClick={() => deleteAddress(index)}><FaTimes /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center', padding:'32px', color:'#94a3b8', border:'2px dashed #e2e8f0', borderRadius:'16px'}}>
                <FaMapPin style={{fontSize:32, marginBottom:12, opacity:0.3}} />
                <p className="no-data" style={{padding:0, fontSize:'0.9rem'}}>{t('profile_no_addresses_sub', 'No saved addresses found. Add one to speed up your checkout process.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
