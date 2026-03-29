import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../../firebase';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * useCart — Firestore-backed cart (/users/{uid}/cart/{productId}).
 * Falls back to localStorage when the user is signed out so guest browsing
 * still works. On sign-in the localStorage cart is merged into Firestore.
 */
const LOCAL_KEY = 'cart';

const localGet = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
};

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [uid, setUid] = useState(null);

  /* ── Watch auth state ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid || null));
    return () => unsub();
  }, []);

  /* ── Firestore real-time listener (signed-in) ── */
  useEffect(() => {
    if (!uid) {
      // Signed-out: use localStorage
      setCartItems(localGet());
      return;
    }

    const cartRef = collection(db, 'users', uid, 'cart');
    const unsub = onSnapshot(cartRef, (snap) => {
      // Firestore cart doc id acts as the productId for cart operations.
      // Keep both `id` and `firestoreId` for compatibility with existing UI.
      const items = snap.docs.map(d => ({ id: d.id, firestoreId: d.id, ...d.data() }));
      setCartItems(items);
      // Keep localStorage in sync for Navbar badge (no auth needed there)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('cartUpdated'));
    });

    // Migrate any existing localStorage cart into Firestore on first sign-in
    const pending = localGet();
    if (pending.length > 0) {
      const batch = writeBatch(db);
      pending.forEach(item => {
        const ref = doc(db, 'users', uid, 'cart', item.id);
        batch.set(ref, item, { merge: true });
      });
      batch.commit().then(() => localStorage.removeItem(LOCAL_KEY)).catch(() => {});
    }

    return () => { try { unsub(); } catch (_) {} };
  }, [uid]);

  /* ── Helpers ── */
  const cartDocRef = useCallback(
    (productId) => (uid ? doc(db, 'users', uid, 'cart', productId) : null),
    [uid]
  );

  const addToCart = useCallback(async (product, quantity = 1) => {
    if (!uid) {
      // Guest: localStorage only
      const items = localGet();
      const idx = items.findIndex(i => i.id === product.id);
      if (idx >= 0) items[idx].quantity += quantity;
      else items.push({ ...product, quantity, status: 'active' });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
      setCartItems([...items]);
      window.dispatchEvent(new Event('cartUpdated'));
      return;
    }
    const existing = cartItems.find(i => i.id === product.id);
    const newQty = (existing?.quantity || 0) + quantity;
    await setDoc(cartDocRef(product.id), { ...product, quantity: newQty, status: 'active' }, { merge: true });
    // Dispatch immediate event for Navbar responsiveness
    window.dispatchEvent(new Event('cartUpdated'));
  }, [uid, cartItems, cartDocRef]);

  const removeFromCart = useCallback(async (productId) => {
    if (!uid) {
      const items = localGet().filter(i => i.id !== productId);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
      setCartItems(items);
      window.dispatchEvent(new Event('cartUpdated'));
      return;
    }
    await deleteDoc(cartDocRef(productId));
    window.dispatchEvent(new Event('cartUpdated'));
  }, [uid, cartDocRef]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    if (!uid) {
      const items = localGet().map(i => i.id === productId ? { ...i, quantity: newQuantity } : i);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
      setCartItems([...items]);
      window.dispatchEvent(new Event('cartUpdated'));
      return;
    }
    const items = cartItems.map(i => i.id === productId ? { ...i, quantity: newQuantity } : i);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    await setDoc(cartDocRef(productId), { quantity: newQuantity }, { merge: true });
    window.dispatchEvent(new Event('cartUpdated'));
  }, [uid, cartItems, removeFromCart, cartDocRef]);

  const updateItemStatus = useCallback(async (productId, status = 'active') => {
    if (!uid) {
      const items = localGet().map(i => i.id === productId ? { ...i, status } : i);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
      setCartItems([...items]);
      window.dispatchEvent(new Event('cartUpdated'));
      return;
    }
    const items = cartItems.map(i => i.id === productId ? { ...i, status } : i);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    await setDoc(cartDocRef(productId), { status }, { merge: true });
    window.dispatchEvent(new Event('cartUpdated'));
  }, [uid, cartItems, cartDocRef]);

  const clearCart = useCallback(async () => {
    if (!uid) {
      localStorage.removeItem(LOCAL_KEY);
      setCartItems([]);
      window.dispatchEvent(new Event('cartUpdated'));
      return;
    }
    const snap = await getDocs(collection(db, 'users', uid, 'cart'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }, [uid]);

  const getTotalPrice = () =>
    cartItems.reduce((t, i) => t + ((i.pricePerKg || i.price || 0) * i.quantity), 0);

  const getTotalItems = () =>
    cartItems.reduce((t, i) => t + i.quantity, 0);

  const isInCart = (productId) => cartItems.some(i => i.id === productId);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemStatus,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isInCart,
  };
};
