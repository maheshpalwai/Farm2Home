import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { auth } from '../../../firebase';
import './ShowCrops.css';
import { FaSearch, FaMapMarkerAlt, FaSort, FaLeaf, FaRupeeSign, FaCalendarAlt, FaEdit, FaTrash } from 'react-icons/fa';

const ShowCrops = ({ showAdminInfo = false, enableEdit = false }) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(true);
  const [editingCrop, setEditingCrop] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uid, setUid] = useState(null);

  // Districts list (South Indian districts)
  const districts = [
    'All Districts',
    'Warangal',
    'Guntur',
    'Karimnagar',
    'Nizamabad',
    'Hyderabad',
    'Visakhapatnam',
    'Vijayawada',
    'Nalgonda',
    'Khammam',
    'Medak',
    'Rangareddy',
    'Adilabad',
    'Mahbubnagar',
    'Nellore',
    'Kurnool',
    'Anantapur',
    'Chittoor'
  ];

  // Fetch crops from localStorage
  const fetchCrops = async () => {
    try {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const farmerId = currentUser.uid || '';
      
      console.log('📥 Fetching crops from localStorage for farmer:', farmerId);
      setLoading(true);
      
      // Get all crops from localStorage
      const allCrops = JSON.parse(localStorage.getItem('crops') || '[]');
      
      // Filter crops for current farmer
      const farmerCrops = allCrops.filter(crop => crop.farmerId === farmerId);
      
      // Sort by createdAt (newest first)
      farmerCrops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('✅ Successfully fetched', farmerCrops.length, 'crops from localStorage');
      setCrops(farmerCrops);
      setFilteredCrops(farmerCrops);
    } catch (error) {
      console.error('❌ Error fetching crops:', error);
      toastError('Error fetching crops: ' + error.message);
      setCrops([]);
      setFilteredCrops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setUid(user?.uid || null));
    return () => unsub();
  }, []);

  // Handle edit crop
  const handleEditCrop = (crop) => {
    setEditingCrop(crop.id);
    setEditForm({
      cropName: crop.cropName || '',
      price: crop.price || '',
      quantity: crop.quantity || '',
      district: crop.district || '',
      status: crop.status || 'pending'
    });
  };

  // Handle save edit
  const handleSaveEdit = async (cropId) => {
    try {
      console.log('📝 Updating crop:', cropId);
      console.log('Updated data:', editForm);
      
      // Get all crops and update the specified one
      const allCrops = JSON.parse(localStorage.getItem('crops') || '[]');
      const updatedCrops = allCrops.map(crop => 
        crop.id === cropId ? {
          ...crop,
          cropName: editForm.cropName,
          price: Number(editForm.price),
          quantity: editForm.quantity,
          district: editForm.district,
          status: editForm.status,
          updatedAt: new Date().toISOString()
        } : crop
      );
      localStorage.setItem('crops', JSON.stringify(updatedCrops));
      
      console.log('Crop updated successfully');
      toastSuccess('Crop updated successfully!');
      setEditingCrop(null);
      setEditForm({});
      fetchCrops();
    } catch (error) {
      console.error('Error updating crop:', error);
      toastError('Failed to update crop: ' + error.message);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingCrop(null);
    setEditForm({});
  };

  // Handle delete crop
  const handleDeleteCrop = async (cropId, cropName) => {
    if (!window.confirm(`Are you sure you want to delete "${cropName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting crop:', cropId);
      
      // Get all crops and remove the specified one
      const allCrops = JSON.parse(localStorage.getItem('crops') || '[]');
      const updatedCrops = allCrops.filter(crop => crop.id !== cropId);
      localStorage.setItem('crops', JSON.stringify(updatedCrops));
      
      console.log('Crop deleted successfully');
      toastSuccess('Crop deleted successfully!');
      fetchCrops();
    } catch (error) {
      console.error('Error deleting crop:', error);
      toastError('Failed to delete crop: ' + error.message);
    }
  };

  // Filter and sort crops whenever filters change
  useEffect(() => {
    let filtered = [...crops];

    // Search filter (case-insensitive)
    if (searchTerm) {
      filtered = filtered.filter(crop =>
        crop.cropName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // District filter
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(crop =>
        crop.district?.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }

    // Sort
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
    }

    setFilteredCrops(filtered);
  }, [searchTerm, selectedDistrict, sortBy, crops]);

  return (
    <div className="show-crops-container">
      {/* Sticky Header with Search and Filters */}
      <div className="crops-header-sticky">
        <div className="crops-header-content">
          <h2 className="crops-title">
            <FaLeaf className="title-icon" />
            Available Crops
          </h2>

          <div className="filters-bar">
            {/* Search Input */}
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search for crops like Rice, Tomato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* District Filter */}
            <div className="filter-group">
              <FaMapMarkerAlt className="filter-icon" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Districts</option>
                {districts.slice(1).map((district) => (
                  <option key={district} value={district.toLowerCase()}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="filter-group">
              <FaSort className="filter-icon" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="default">Sort By</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Crops Grid */}
      <div className="crops-content">
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading crops...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="no-crops-message">
            <FaLeaf className="no-crops-icon" />
            <h3>No crops found in this area</h3>
            <p>Try adjusting your filters or search for different crops</p>
          </div>
        ) : (
          <div className="crops-grid">
            {filteredCrops.map((crop) => (
              <div key={crop.id} className="crop-card">
                <div className="crop-image-container">
                  <img 
                    src={crop.imageURL || 'https://cdn-icons-png.flaticon.com/512/6008/6008522.png'} 
                    alt={crop.cropName}
                    className="crop-image"
                  />
                  {crop.status === 'available' && (
                    <span className="badge-available">Available</span>
                  )}
                </div>

                <div className="crop-details">
                  <h3 className="crop-name">{crop.cropName}</h3>
                  
                  <div className="crop-location">
                    <FaMapMarkerAlt className="location-icon" />
                    <span>{crop.district || 'Unknown'}</span>
                  </div>

                  <div className="crop-price">
                    <FaRupeeSign className="rupee-icon" />
                    <span className="price-value">{crop.price || 'N/A'}</span>
                    <span className="price-unit">per kg</span>
                  </div>

                  <div className="crop-quantity">
                    <strong>Quantity:</strong> {crop.quantity || 'N/A'}
                  </div>

                  {/* Admin-only: Show creation date */}
                  {showAdminInfo && crop.createdAt && (
                    <div className="crop-date" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <FaCalendarAlt style={{ marginRight: '4px' }} />
                      <strong>Added:</strong> {crop.createdAt?.toDate ? crop.createdAt.toDate().toLocaleDateString() : new Date(crop.createdAt).toLocaleDateString()}
                    </div>
                  )}

                  {crop.farmerId && (
                    <div className="farmer-info">
                      <small>Farmer ID: {crop.farmerId}</small>
                    </div>
                  )}

                  {enableEdit && editingCrop === crop.id ? (
                    <div className="edit-form" style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        value={editForm.cropName}
                        onChange={(e) => setEditForm({...editForm, cropName: e.target.value})}
                        placeholder="Crop Name"
                        style={{ width: '100%', padding: '5px', marginBottom: '5px', borderRadius: '3px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                        placeholder="Price"
                        style={{ width: '100%', padding: '5px', marginBottom: '5px', borderRadius: '3px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="text"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                        placeholder="Quantity"
                        style={{ width: '100%', padding: '5px', marginBottom: '5px', borderRadius: '3px', border: '1px solid #ddd' }}
                      />
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button onClick={() => handleSaveEdit(crop.id)} style={{ flex: 1, padding: '5px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                          Save
                        </button>
                        <button onClick={handleCancelEdit} style={{ flex: 1, padding: '5px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {enableEdit && (() => {
                        return uid && crop.farmerId === uid;
                      })() && (
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                          <button onClick={() => handleEditCrop(crop)} style={{ flex: 1, padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <FaEdit /> Edit
                          </button>
                          <button onClick={() => handleDeleteCrop(crop.id, crop.cropName)} style={{ flex: 1, padding: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                      {!enableEdit && (
                        <button className="buy-button">
                          Buy Now
                        </button>
                      )}
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

export default ShowCrops;
