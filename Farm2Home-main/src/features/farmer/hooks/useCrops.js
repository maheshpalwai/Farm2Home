import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Custom hook for managing crop operations with Firebase Firestore
 * Handles CRUD operations for crops and analytics calculation
 */
export const useCrops = () => {
  const [savedCrops, setSavedCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalCrops: 0,
    totalValue: 0,
    availableCrops: 0,
    soldCrops: 0
  });

  // Calculate analytics from saved crops
  const calculateAnalytics = useCallback(() => {
    const totalCrops = savedCrops.length;
    const totalValue = savedCrops.reduce((sum, crop) => sum + (parseFloat(crop.price) || 0), 0);
    const availableCrops = savedCrops.filter(crop => crop.status === 'available').length;
    const soldCrops = savedCrops.filter(crop => crop.status === 'sold').length;

    setAnalytics({
      totalCrops,
      totalValue,
      availableCrops,
      soldCrops
    });
  }, [savedCrops]);

  // Real-time Firestore listener — replaces loadCrops + getDocs
  const subscribeToCrops = useCallback((userId) => {
    setLoading(true);
    const q = query(
      collection(db, 'crops'),
      where('farmerId', '==', userId)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const farmerCrops = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort newest-first client-side (no composite index needed)
        farmerCrops.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tb = b.createdAt?.toMillis?.() ?? (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tb - ta;
        });
        setSavedCrops(farmerCrops);
        setLoading(false);
      },
      () => {
        setSavedCrops([]);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Add new crop to Firebase Firestore
  const addCrop = async (cropData) => {
    setLoading(true);
    try {
      // Get current authenticated user directly from Firebase Auth
      const user = auth.currentUser;
      
      if (!user) {
        return { success: false, error: 'Please log in first to add crops.' };
      }

      // Use uid directly from Firebase Auth user
      const userId = user.uid;
      const userEmail = user.email || '';


      // Validate required fields
      const cropNameField = cropData.cropName || cropData.crop;
      if (!cropNameField || !cropData.price || !cropData.quantity) {
        return { success: false, error: 'Please fill in all required fields: Crop Name, Price, and Quantity' };
      }
      
      // Create new crop data with exact schema: farmerId (uid), status: 'pending'
      const newCropData = {
        cropName: cropNameField,
        crop: cropNameField, // For backwards compatibility
        price: parseFloat(cropData.price) || 0,
        quantity: cropData.quantity,
        organic: !!cropData.organic,
        category: cropData.category || '',
        notes: cropData.notes || '',
        status: 'pending',  // Exactly as required
        farmerId: userId,   // Use uid from Firebase Auth
        farmerEmail: userEmail,
        state: cropData.state || '',
        district: cropData.district || '',
        image: cropData.image || '',   // Farmer-selected image from CROP_DICTIONARY
        availableUntil: cropData.availableUntil || '',
        createdAt: serverTimestamp()
      };
      

      const cropsRef = collection(db, 'crops');
      const docRef = await addDoc(cropsRef, newCropData);
      
      // Add to local state with the new document ID
      const newCrop = {
        id: docRef.id,
        ...newCropData,
        createdAt: new Date().toISOString() // For immediate display
      };
      
      setSavedCrops([newCrop, ...savedCrops]);
      return { success: true, crop: newCrop };
    } catch (error) {
      let errorMessage = 'Failed to add crop: ';
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Make sure you are properly authenticated.';
      } else if (error.code === 'unauthenticated') {
        errorMessage += 'User not authenticated. Please log in again.';
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete crop from Firebase Firestore
  const deleteCrop = async (cropId, isAdminDelete = false, reason = '') => {
    try {
      const cropDocRef = doc(db, 'crops', cropId);
      await deleteDoc(cropDocRef);
      setSavedCrops(savedCrops.filter(crop => crop.id !== cropId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Update crop status in Firebase Firestore
  const updateCropStatus = async (cropId, newStatus) => {
    try {
      const cropDocRef = doc(db, 'crops', cropId);
      await updateDoc(cropDocRef, { status: newStatus, updatedAt: serverTimestamp() });
      setSavedCrops(savedCrops.map(crop =>
        crop.id === cropId ? { ...crop, status: newStatus } : crop
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Update entire crop in Firebase Firestore
  const updateCrop = async (cropId, cropData) => {
    try {
      const cropDocRef = doc(db, 'crops', cropId);
      await updateDoc(cropDocRef, { ...cropData, updatedAt: serverTimestamp() });
      setSavedCrops(savedCrops.map(crop =>
        crop.id === cropId ? { ...crop, ...cropData } : crop
      ));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Mount: wait for auth then subscribe to real-time crops
  useEffect(() => {
    let cropUnsub = null;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      // Clean up previous crop listener before attaching a new one
      if (cropUnsub) { cropUnsub(); cropUnsub = null; }
      if (user) {
        cropUnsub = subscribeToCrops(user.uid);
      } else {
        setSavedCrops([]);
        setLoading(false);
      }
    });
    return () => {
      try { authUnsub(); } catch (_) {}
      if (cropUnsub) { try { cropUnsub(); } catch (_) {} }
    };
  }, [subscribeToCrops]);

  // Recalculate analytics when crops change
  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  return {
    savedCrops,
    loading,
    analytics,
    addCrop,
    deleteCrop,
    updateCropStatus,
    updateCrop,
  };
};
