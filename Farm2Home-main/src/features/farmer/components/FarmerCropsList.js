import { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { useToast } from '../../../context/ToastContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy 
} from 'firebase/firestore';
import { FaSeedling, FaRupeeSign, FaEdit, FaTrash, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa';

const FarmerCropsList = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCrop, setEditingCrop] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', quantity: '' });

  // Fetch farmer's crops
  const fetchCrops = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to view crops');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const cropsRef = collection(db, 'crops');
      const q = query(
        cropsRef, 
        where('farmerId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const cropsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCrops(cropsData);
      console.log('✅ Fetched', cropsData.length, 'crops');
    } catch (err) {
      console.error('Error fetching crops:', err);
      setError('Failed to load crops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  // Handle delete crop
  const handleDelete = async (cropId, cropName) => {
    if (!window.confirm(`Are you sure you want to delete "${cropName}"?`)) {
      return;
    }

    try {
      const cropDocRef = doc(db, 'crops', cropId);
      await deleteDoc(cropDocRef);
      
      // Remove from state
      setCrops(crops.filter(crop => crop.id !== cropId));
      toastSuccess('Crop deleted successfully!');
    } catch (err) {
      console.error('Error deleting crop:', err);
      toastError('Failed to delete crop. Please try again.');
    }
  };

  // Handle edit click
  const handleEditClick = (crop) => {
    setEditingCrop(crop.id);
    setEditForm({
      price: crop.price || '',
      quantity: crop.quantity || ''
    });
  };

  // Handle edit form change
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  // Handle save edit
  const handleSaveEdit = async (cropId) => {
    try {
      // Validate inputs
      if (!editForm.price || parseFloat(editForm.price) <= 0) {
        toastError('Please enter a valid price');
        return;
      }
      if (!editForm.quantity.trim()) {
        toastError('Please enter quantity');
        return;
      }

      const cropDocRef = doc(db, 'crops', cropId);
      await updateDoc(cropDocRef, {
        price: parseFloat(editForm.price),
        quantity: editForm.quantity.trim(),
        updatedAt: new Date().toISOString()
      });

      // Update state
      setCrops(crops.map(crop => 
        crop.id === cropId 
          ? { ...crop, price: parseFloat(editForm.price), quantity: editForm.quantity.trim() }
          : crop
      ));

      setEditingCrop(null);
      toastSuccess('Crop updated successfully!');
    } catch (err) {
      console.error('Error updating crop:', err);
      toastError('Failed to update crop. Please try again.');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCrop(null);
    setEditForm({ price: '', quantity: '' });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    
    if (statusLower === 'verified' || statusLower === 'approved') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          <FaClock className="mr-1" />
          Pending
        </span>
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 font-medium">Loading your crops...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <FaSeedling className="text-green-600 mr-3" />
            My Crops
          </h1>
          <p className="text-gray-600">
            {crops.length === 0 
              ? 'You haven\'t added any crops yet' 
              : `You have ${crops.length} crop${crops.length !== 1 ? 's' : ''} listed`
            }
          </p>
        </div>

        {/* Empty State */}
        {crops.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaSeedling className="text-green-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Crops Yet</h2>
            <p className="text-gray-600 mb-6">Start by adding your first crop to reach consumers</p>
            <button 
              onClick={() => window.location.href = '/farmer/add-crop'}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all"
            >
              Add Your First Crop
            </button>
          </div>
        ) : (
          /* Crops Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crops.map(crop => (
              <div key={crop.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Crop Image */}
                <div className="relative h-48 bg-gradient-to-br from-green-400 to-emerald-500">
                  {crop.imageURL ? (
                    <img 
                      src={crop.imageURL} 
                      alt={crop.cropName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaSeedling className="text-white text-6xl opacity-50" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(crop.status)}
                  </div>
                </div>

                {/* Crop Details */}
                <div className="p-5">
                  {/* Crop Name */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                    {crop.cropName}
                  </h3>

                  {/* Edit Mode */}
                  {editingCrop === crop.id ? (
                    <div className="space-y-3 mb-4">
                      {/* Edit Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <div className="flex items-center">
                          <FaRupeeSign className="text-gray-400 mr-2" />
                          <input
                            type="number"
                            name="price"
                            value={editForm.price}
                            onChange={handleEditChange}
                            min="0"
                            step="0.01"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Edit Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <input
                          type="text"
                          name="quantity"
                          value={editForm.quantity}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      {/* Edit Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSaveEdit(crop.id)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="space-y-2 mb-4">
                      {/* Price */}
                      <div className="flex items-center text-gray-700">
                        <FaRupeeSign className="text-green-600 mr-2" />
                        <span className="font-semibold text-lg">
                          {crop.price} / {crop.unit || 'kg'}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center text-gray-600">
                        <span className="text-sm">
                          <strong>Available:</strong> {crop.quantity}
                        </span>
                      </div>

                      {/* District */}
                      {crop.district && (
                        <div className="flex items-center text-gray-600">
                          <span className="text-sm">
                            <strong>Location:</strong> {crop.district}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {editingCrop !== crop.id && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEditClick(crop)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-all"
                      >
                        <FaEdit className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(crop.id, crop.cropName)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all"
                      >
                        <FaTrash className="mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerCropsList;
