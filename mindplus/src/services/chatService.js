import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = getFirestore();
const auth = getAuth();

/**
 * Create a unique chat ID from two user IDs
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Unique chat ID
 */
export function getChatId(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
}

/**
 * Get current user ID from Firebase auth or AsyncStorage
 * @returns {string|null} - Current user ID
 */
export async function getCurrentUserId() {
  try {
    return auth.currentUser?.uid || (await AsyncStorage.getItem('userId'));
  } catch (error) {
    console.error('[chatService] Error getting current user ID:', error);
    return null;
  }
}

/**
 * Get user profile data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export async function getUserProfile(userId) {
  try {
    // Try to get from profile subcollection first
    const profileRef = doc(db, 'users', userId, 'profile', 'basic');
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data();
    }

    // Fallback to main user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }

    return null;
  } catch (error) {
    console.error('[chatService] Error getting user profile:', error);
    return null;
  }
}

/**
 * Send a message in a chat
 * @param {string} recipientId - Recipient user ID
 * @param {string} text - Message text
 * @param {string} currentUserId - Current user ID
 * @returns {Promise<string>} - Message document ID
 */
export async function sendMessage(recipientId, text, currentUserId) {
  try {
    if (!text.trim() || !recipientId || !currentUserId) {
      throw new Error('Missing required parameters');
    }

    const chatId = getChatId(currentUserId, recipientId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    // Get user profile for display
    const userProfile = await getUserProfile(currentUserId);
    const senderName = userProfile?.nickname || `User_${currentUserId.slice(-4)}`;

    const messageData = {
      text: text.trim(),
      senderId: currentUserId,
      senderName: senderName,
      recipientId: recipientId,
      timestamp: serverTimestamp(),
      read: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update chat metadata
    await updateChatMetadata(chatId, recipientId, text, senderName);

    console.log('[chatService] Message sent with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[chatService] Error sending message:', error);
    throw error;
  }
}

/**
 * Update chat metadata with last message
 * @private
 */
async function updateChatMetadata(chatId, recipientId, lastMessage, senderName) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(
      chatRef,
      {
        lastMessage: lastMessage.substring(0, 50),
        lastMessageTime: serverTimestamp(),
        participantIds: chatId.split('_'),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[chatService] Error updating chat metadata:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Subscribe to messages in a chat
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @param {Function} callback - Callback when messages change
 * @param {Function} errorCallback - Error callback
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToMessages(userId1, userId2, callback, errorCallback) {
  try {
    const chatId = getChatId(userId1, userId2);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    console.log('[chatService] Subscribing to messages for chat:', chatId);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const messages = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
            });
          });
          console.log('[chatService] Received', messages.length, 'messages');
          callback(messages);
        } catch (error) {
          console.error('[chatService] Error processing messages:', error);
          errorCallback?.(error);
        }
      },
      (error) => {
        console.error('[chatService] Error in onSnapshot:', error);
        errorCallback?.(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[chatService] Error subscribing to messages:', error);
    errorCallback?.(error);
    return () => {}; // Return no-op function
  }
}

/**
 * Mark messages as read
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID who is reading
 */
export async function markMessagesAsRead(chatId, userId) {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('recipientId', '==', userId), where('read', '==', false));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await updateDoc(doc.ref, { read: true, readAt: serverTimestamp() });
    });

    console.log('[chatService] Marked messages as read');
  } catch (error) {
    console.error('[chatService] Error marking messages as read:', error);
  }
}

/**
 * Get all active chats for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of chat objects
 */
export async function getUserChats(userId) {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participantIds', 'array-contains', userId)
    );

    const querySnapshot = await getDocs(q);
    const chats = [];

    querySnapshot.forEach((doc) => {
      chats.push({
        id: doc.id,
        ...doc.data(),
        lastMessageTime: doc.data().lastMessageTime?.toDate?.() || new Date(),
      });
    });

    // Sort by last message time
    chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    console.log('[chatService] Found', chats.length, 'active chats');
    return chats;
  } catch (error) {
    console.error('[chatService] Error getting user chats:', error);
    return [];
  }
}

/**
 * Delete a message
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID to delete
 */
export async function deleteMessage(chatId, messageId) {
  try {
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: '🗑️ Message deleted',
      deleted: true,
      deletedAt: serverTimestamp(),
    });
    console.log('[chatService] Message deleted:', messageId);
  } catch (error) {
    console.error('[chatService] Error deleting message:', error);
    throw error;
  }
}

/**
 * Format time difference for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted time string
 */
export function formatTime(date) {
  if (!date) return '';

  try {
    const time = date instanceof Date ? date : new Date(date);
    if (time.toString() === 'Invalid Date') return '';

    const now = new Date();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('[chatService] Error formatting time:', error);
    return '';
  }
}
