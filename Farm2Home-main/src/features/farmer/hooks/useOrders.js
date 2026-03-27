import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Fetches all orders placed for this farmer's crops in real-time.
 * Also exposes `updateOrderStatus(orderId, newStatus)` so the farmer
 * can advance an order through: pending → confirmed → shipped → delivered.
 */
export const useOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let unsubSnap = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnap) { try { unsubSnap(); } catch (_) {} unsubSnap = null; }
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'orders'),
        where('farmerId', '==', user.uid)
      );

      // Real-time listener — order status changes appear instantly
      unsubSnap = onSnapshot(
        q,
        (snapshot) => {
          const fetched = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAtMs: d.data().createdAt?.toMillis?.() || Date.now(),
          }));
          // Sort newest-first client-side (no composite index needed)
          fetched.sort((a, b) => b.createdAtMs - a.createdAtMs);
          setOrders(fetched);
          setLoading(false);
        },
        (err) => {
          console.warn('useOrders snapshot error:', err.message);
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      try { unsubAuth(); } catch (_) {}
      if (unsubSnap) { try { unsubSnap(); } catch (_) {} }
    };
  }, []);

  const updateOrderStatus = useCallback(async (orderId, newStatus, farmerId) => {
    try {
      const user = auth.currentUser;
      if (!user) return { success: false, error: 'Not authenticated' };
      // Safety: ensure the order belongs to the signed-in farmer
      if (farmerId && farmerId !== user.uid) {
        return { success: false, error: 'Unauthorized: this order does not belong to you.' };
      }
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return { orders, loading, error, updateOrderStatus };
};
