import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../../../firebase';
import { doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const LOCAL_KEY = 'favorites';

const localGet = () => {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
};

/**
 * useFavorites — Firestore-backed favourites (/users/{uid}/favorites/{productId}).
 * Falls back to localStorage for guests.
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]); // array of productId strings
  const [uid, setUid] = useState(null);

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid || null));
    return () => unsub();
  }, []);

  // Firestore real-time listener (signed-in) / localStorage (guest)
  useEffect(() => {
    if (!uid) {
      setFavorites(localGet());
      return;
    }

    // Double-check auth token is present before attaching listener
    if (!auth.currentUser) {
      setFavorites(localGet());
      return;
    }

    const favRef = collection(db, 'users', uid, 'favorites');
    const unsub = onSnapshot(
      favRef,
      (snap) => {
        const ids = snap.docs.map(d => d.id);
        setFavorites(ids);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
      },
      (err) => {
        console.warn('useFavorites snapshot error:', err.message);
        // Fall back to localStorage on any permission / network error
        setFavorites(localGet());
      }
    );
    return () => { try { unsub(); } catch (_) {} };
  }, [uid]);

  const toggleFavorite = useCallback(async (productId) => {
    const isFav = favorites.includes(productId);
    if (!uid) {
      // Guest: localStorage only
      const updated = isFav
        ? favorites.filter(id => id !== productId)
        : [...favorites, productId];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      setFavorites(updated);
      return;
    }
    const ref = doc(db, 'users', uid, 'favorites', String(productId));
    if (isFav) await deleteDoc(ref);
    else await setDoc(ref, { productId, savedAt: new Date() });
  }, [uid, favorites]);

  const isFavorite = useCallback((productId) => favorites.includes(productId), [favorites]);

  const clearFavorites = useCallback(async () => {
    if (!uid) {
      localStorage.removeItem(LOCAL_KEY);
      setFavorites([]);
      return;
    }
    // onSnapshot will update state automatically after each delete
    favorites.forEach(id => deleteDoc(doc(db, 'users', uid, 'favorites', String(id))));
  }, [uid, favorites]);

  return { favorites, toggleFavorite, isFavorite, clearFavorites };
};
