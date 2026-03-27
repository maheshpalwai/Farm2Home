import { db } from '../firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';

const cropsRef = collection(db, 'crops');

// Get all products
export const getAllProducts = async () => {
  try {
    const q = query(cropsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const q = query(cropsRef, where('category', '==', category), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get products by state
export const getProductsByState = async (state) => {
  try {
    const q = query(cropsRef, where('state', '==', state), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add new product
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(cropsRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, productId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update product
export const updateProduct = async (productId, productData) => {
  try {
    await updateDoc(doc(db, 'crops', productId), {
      ...productData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'crops', productId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time listener for products using Firestore onSnapshot
export const subscribeToProducts = (callback) => {
  const q = query(cropsRef, orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(products);
  });
  return unsubscribe;
};

// Search products (client-side filter after Firestore fetch)
export const searchProducts = async (searchTerm) => {
  try {
    const { products } = await getAllProducts();
    const lower = searchTerm.toLowerCase();
    const filtered = (products || []).filter(p =>
      p.name?.toLowerCase().includes(lower) ||
      p.cropName?.toLowerCase().includes(lower) ||
      p.description?.toLowerCase().includes(lower) ||
      p.category?.toLowerCase().includes(lower)
    );
    return { success: true, products: filtered };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get featured products
export const getFeaturedProducts = async () => {
  try {
    const q = query(cropsRef, where('featured', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get trending products
export const getTrendingProducts = async () => {
  try {
    const q = query(cropsRef, where('trending', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, products };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
