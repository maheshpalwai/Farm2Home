import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FaSeedling, FaRupeeSign, FaWeight, FaMapMarkerAlt, FaImage, FaCheckCircle } from 'react-icons/fa';
import { resolveCanonicalCropName } from '../../../utils/cropValidation';

const AddCropForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const [formData, setFormData] = useState({
    cropName: '',
    price: '',
    unit: 'kg',
    quantity: '',
    district: '',
    imageURL: ''
  });

  // Wait for Firebase Auth to fully initialize
  useEffect(() => {
    console.log('🔐 AddCropForm: Waiting for Firebase Auth to initialize...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticatedUser(user);
        setAuthReady(true);
      } else {
        setAuthReady(true);
        setAuthenticatedUser(null);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  // Validate form
  const validateForm = () => {
    if (!formData.cropName.trim()) {
      setError('Please enter crop name');
      return false;
    }
    if (!resolveCanonicalCropName(formData.cropName)) {
      setError('Not a valid crop name. Please enter the correct crop name.');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return false;
    }
    if (!formData.quantity.trim()) {
      setError('Please enter quantity');
      return false;
    }
    if (!formData.district.trim()) {
      setError('Please enter district');
      return false;
    }
    if (!formData.imageURL.trim()) {
      setError('Please enter image URL');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Ensure auth state is ready
    if (!authReady) {
      setError('Authentication is still loading. Please wait a moment...');
      return;
    }

    // Check if user is authenticated using Firebase Auth directly
    if (!authenticatedUser) {
      setError('Please log in first to add crops.');
      setTimeout(() => navigate('/', { state: { openModal: true, role: 'farmer' } }), 2000);
      return;
    }

    // Get uid directly from Firebase Auth user object
    const userId = authenticatedUser.uid;
    const userEmail = authenticatedUser.email || '';

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare crop data with exact schema: farmerId (uid), status: 'pending'
      const canonicalCropName = resolveCanonicalCropName(formData.cropName)
      const cropData = {
        cropName: canonicalCropName,
        price: parseFloat(formData.price),
        unit: formData.unit,
        quantity: formData.quantity.trim(),
        district: formData.district.trim(),
        imageURL: formData.imageURL.trim(),
        farmerId: userId,  // Use uid from authenticated user
        farmerEmail: userEmail,
        status: 'pending',  // Exactly as required
        createdAt: serverTimestamp()
      };

      const cropsRef = collection(db, 'crops');
      const docRef = await addDoc(cropsRef, cropData);

      setSuccess('Crop added successfully! Redirecting...');

      // Reset form
      setFormData({
        cropName: '',
        price: '',
        unit: 'kg',
        quantity: '',
        district: '',
        imageURL: ''
      });

      // Redirect to farmer dashboard after 2 seconds
      setTimeout(() => {
        navigate('/farmer');
      }, 2000);

    } catch (err) {
      let errorMessage = 'Failed to save crop: ';
      if (err.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please ensure you are logged in.';
      } else if (err.code === 'unauthenticated') {
        errorMessage += 'User not authenticated. Please log in again.';
      } else {
        errorMessage += err.message || 'Unknown error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (!authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <FaSeedling className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading Authentication...</h1>
            <p className="text-gray-600">Please wait while we verify your login status.</p>
            <div className="mt-8">
              <svg className="animate-spin h-12 w-12 mx-auto text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <FaSeedling className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Crop</h1>
          <p className="text-gray-600">List your crop for consumers to purchase</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Crop Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Crop Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSeedling className="text-green-500" />
                </div>
                <input
                  type="text"
                  name="cropName"
                  value={formData.cropName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g., Tomato, Rice, Wheat"
                />
              </div>
            </div>

            {/* Price and Unit Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaRupeeSign className="text-green-500" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaWeight className="text-green-500" />
                  </div>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                  >
                    <option value="kg">Per Kilogram (kg)</option>
                    <option value="quintal">Per Quintal (100kg)</option>
                    <option value="ton">Per Ton (1000kg)</option>
                    <option value="piece">Per Piece</option>
                    <option value="dozen">Per Dozen</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity and District Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity Available <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaWeight className="text-green-500" />
                  </div>
                  <input
                    type="text"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g., 100 kg, 5 quintals"
                  />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  District <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-green-500" />
                  </div>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="e.g., Warangal, Guntur"
                  />
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaImage className="text-green-500" />
                </div>
                <input
                  type="url"
                  name="imageURL"
                  value={formData.imageURL}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="https://example.com/crop-image.jpg"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter a valid image URL for your crop
              </p>
            </div>

            {/* Image Preview */}
            {formData.imageURL && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                <img 
                  src={formData.imageURL} 
                  alt="Crop preview" 
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
                <FaCheckCircle className="w-5 h-5 mr-2 mt-0.5" />
                {success}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/farmer')}
                className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-6 font-semibold rounded-lg text-white transition-all duration-300 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Crop...
                  </span>
                ) : (
                  'Add Crop'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Note</h4>
              <p className="text-sm text-blue-700">
                Your crop will be reviewed by admin and marked as 'approved' before it appears to consumers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCropForm;
