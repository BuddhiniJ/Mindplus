import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';

const db = getFirestore();
const BLOCKED_KEY = (userId) => `blocked_users_${userId}`;

export async function blockUser(myUserId, blockedUserId) {
  if (!myUserId || !blockedUserId) return;
  try {
    const key = BLOCKED_KEY(myUserId);
    const raw = await AsyncStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : [];
    if (!existing.includes(blockedUserId)) {
      await AsyncStorage.setItem(key, JSON.stringify([...existing, blockedUserId]));
    }
    await setDoc(
      doc(db, 'users', myUserId, 'settings', 'blocked'),
      { blockedIds: arrayUnion(blockedUserId) },
      { merge: true }
    );
    console.log('[blockService] Blocked user:', blockedUserId);
  } catch (err) {
    console.error('[blockService] Failed to block user:', err);
  }
}

export async function getBlockedUsers(myUserId) {
  if (!myUserId) return [];
  try {
    const key = BLOCKED_KEY(myUserId);
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    const snap = await getDoc(doc(db, 'users', myUserId, 'settings', 'blocked'));
    if (snap.exists()) {
      const ids = snap.data().blockedIds || [];
      await AsyncStorage.setItem(key, JSON.stringify(ids));
      return ids;
    }
  } catch (err) {
    console.error('[blockService] Failed to get blocked users:', err);
  }
  return [];
}

export async function isUserBlocked(myUserId, targetUserId) {
  const blocked = await getBlockedUsers(myUserId);
  return blocked.includes(targetUserId);
}