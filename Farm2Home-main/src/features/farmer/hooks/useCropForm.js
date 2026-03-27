import { useState, useEffect } from 'react';

/**
 * Custom hook for managing crop form state
 * Handles form inputs, validation, and row management
 * @param {Object} userLocation - User's location data with state and district
 */
const getDefault10Days = () => {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  return d.toISOString().split('T')[0];
};

export const useCropForm = (userLocation = {}) => {
  const [rows, setRows] = useState([{
    crop: '',
    quantity: '',
    price: '',
    organic: false,
    status: 'available',
    notes: '',
    availableUntil: getDefault10Days()
  }]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedState, setSelectedState] = useState(userLocation.state || 'telangana');
  const [selectedDistrict, setSelectedDistrict] = useState(userLocation.district || '');

  // Update location when userLocation changes
  useEffect(() => {
    if (userLocation.state) {
      setSelectedState(userLocation.state);
    }
    if (userLocation.district) {
      setSelectedDistrict(userLocation.district);
    }
  }, [userLocation]);

  // Add a new empty row to the form
  const addRow = () => {
    setRows([...rows, {
      crop: '',
      quantity: '',
      price: '',
      organic: false,
      status: 'available',
      notes: '',
      availableUntil: getDefault10Days()
    }]);
  };

  // Update a specific field in a row
  const updateField = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  // Reset form to initial state
  const resetForm = () => {
    setRows([{
      crop: '',
      quantity: '',
      price: '',
      organic: false,
      status: 'available',
      notes: '',
      availableUntil: getDefault10Days()
    }]);
    setShowAddForm(false);
  };

  // Validate form data
  const validateRow = (row) => {
    if (!row.crop || !row.quantity || !row.price) {
      return { valid: false, message: 'Please fill in all required fields' };
    }
    if (isNaN(row.price) || parseFloat(row.price) <= 0) {
      return { valid: false, message: 'Please enter a valid price' };
    }
    return { valid: true };
  };

  // Get form data for a row with location
  const getRowData = (index) => {
    const row = rows[index];
    return {
      cropName: row.crop,
      quantity: row.quantity,
      price: parseFloat(row.price),
      organic: !!row.organic,
      status: row.status,
      notes: row.notes,
      availableUntil: row.availableUntil || '',
      state: selectedState,
      district: selectedDistrict
    };
  };

  return {
    rows,
    setRows,
    showAddForm,
    selectedState,
    selectedDistrict,
    setShowAddForm,
    setSelectedState,
    setSelectedDistrict,
    addRow,
    updateField,
    resetForm,
    validateRow,
    getRowData
  };
};
