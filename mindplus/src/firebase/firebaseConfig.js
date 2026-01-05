import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ✅ Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYrVKFHekfHTFQtgEwBNiiw9JXWk5lrkU",
  authDomain: "mindplus-368e3.firebaseapp.com",
  projectId: "mindplus-368e3",
  storageBucket: "mindplus-368e3.firebasestorage.app",
  messagingSenderId: "775907809751",
  appId: "1:775907809751:web:9ab32f0ea5bd1f6ae9d392",
  measurementId: "G-JEJECVRN3G"
};

// ✅ Your Firebase Configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCYrVKFHekfHTFQtgEwBNiiw9JXWk5lrkU",
//   authDomain: "mindplus-368e3.firebaseapp.com",
//   projectId: "mindplus-368e3",
//   storageBucket: "mindplus-368e3.firebasestorage.app",
//   messagingSenderId: "775907809751",
//   appId: "1:775907809751:web:9ab32f0ea5bd1f6ae9d392",
//   measurementId: "G-JEJECVRN3G"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Save stress analysis to Firestore with timestamp
 * @param {object} analysisData - Analysis results from backend
 * @param {string} localAudioPath - Local file path
 * @param {number} timestamp - Recording timestamp
 * @returns {Promise<string>} - Document ID
 */
export async function saveAnalysisToFirestore(analysisData, localAudioPath, timestamp) {
  try {
    // Use timestamp as document ID for easy querying
    const docId = `${analysisData.user_id}_${timestamp}`;
    const docRef = doc(db, 'stress_analyses', docId);
    
    const data = {
      userId: analysisData.user_id,
      text: analysisData.text,
      localAudioPath: localAudioPath,
      stressLevel: analysisData.stress_level,
      confidence: analysisData.confidence,
      insights: analysisData.insights,
      timestamp: new Date(timestamp), // Use recording timestamp
      recordedAt: new Date(timestamp),
      analyzedAt: new Date(), // When analysis was done
      createdAt: new Date()
    };
    
    await setDoc(docRef, data);
    
    console.log('✅ Analysis saved with timestamp:', timestamp);
    return docId;
  } catch (error) {
    console.error('Firestore save error:', error);
    throw new Error('Failed to save analysis');
  }
}

/**
 * Get user's stress analysis history ordered by timestamp
 * @param {string} userId - User identifier
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} - Array of analysis documents
 */
export async function getUserHistory(userId, limit = 20) {
  try {
    // First, try with ordering (requires index)
    const q = query(
      collection(db, 'stress_analyses'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to JS Date
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
        recordedAt: data.recordedAt?.toDate ? data.recordedAt.toDate() : new Date(data.recordedAt),
        analyzedAt: data.analyzedAt?.toDate ? data.analyzedAt.toDate() : new Date(data.analyzedAt)
      });
    });
    
    console.log(`📊 Loaded ${history.length} history records`);
    return history;
    
  } catch (error) {
    console.error('Error fetching history:', error);
    
    // If index error, try without ordering
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      console.log('📝 Index not found, fetching without ordering...');
      
      try {
        // Fallback: query without orderBy (doesn't need index)
        const simpleQuery = query(
          collection(db, 'stress_analyses'),
          where('userId', '==', userId)
        );
        
        const snapshot = await getDocs(simpleQuery);
        const history = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          history.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
            recordedAt: data.recordedAt?.toDate ? data.recordedAt.toDate() : new Date(data.recordedAt),
            analyzedAt: data.analyzedAt?.toDate ? data.analyzedAt.toDate() : new Date(data.analyzedAt)
          });
        });
        
        // Sort in JavaScript instead
        history.sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`📊 Loaded ${history.length} records (sorted locally)`);
        console.log('⚠️ Create Firestore index for better performance');
        
        return history.slice(0, limit);
        
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new Error('Failed to fetch history');
      }
    }
    
    throw new Error('Failed to fetch history');
  }
}

/**
 * Save or update user profile with stress info
 * @param {object} userProfile - User profile data
 * @returns {Promise<void>}
 */
export async function saveUserProfile(userProfile) {
  try {
    const userRef = doc(db, 'users', userProfile.userId);
    await setDoc(userRef, {
      ...userProfile,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('User profile saved');
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw new Error('Failed to save user profile');
  }
}

/**
 * Find users with similar stress types for community matching
 * @param {string} stressType - Current user's stress type (Academic, Financial, Social, Emotional)
 * @param {string} currentUserId - Current user's ID to exclude from results
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} - Array of matched users
 */
export async function findSimilarStressUsers(stressType, currentUserId, limit = 10) {
  try {
    const q = query(
      collection(db, 'users'),
      where('currentStressType', '==', stressType),
      where('isAvailableForChat', '==', true),
      orderBy('lastActive', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      // Exclude current user
      if (doc.id !== currentUserId) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error finding similar users:', error);
    throw new Error('Failed to find similar users');
  }
}

/**
 * Send a chat message in a community thread
 * @param {string} threadId - Community thread ID
 * @param {string} userId - Sender's user ID
 * @param {string} message - Message content
 * @returns {Promise<string>} - Message ID
 */
export async function sendCommunityMessage(threadId, userId, message) {
  try {
    const messageRef = await addDoc(collection(db, 'community_threads', threadId, 'messages'), {
      userId: userId,
      message: message,
      timestamp: new Date(),
      createdAt: new Date()
    });
    
    // Update thread's last activity
    await updateDoc(doc(db, 'community_threads', threadId), {
      lastMessageAt: new Date(),
      messageCount: increment(1)
    });
    
    console.log('Message sent:', messageRef.id);
    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

/**
 * Get or create a community thread for a stress type
 * @param {string} stressType - Stress type (Academic, Financial, Social, Emotional)
 * @returns {Promise<object>} - Thread data
 */
export async function getCommunityThread(stressType) {
  try {
    const threadId = `stress_type_${stressType.toLowerCase()}`;
    const threadRef = doc(db, 'community_threads', threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      // Create new thread
      const threadData = {
        stressType: stressType,
        title: getThreadTitle(stressType),
        description: getThreadDescription(stressType),
        createdAt: new Date(),
        messageCount: 0,
        activeUsers: 0
      };
      
      await setDoc(threadRef, threadData);
      return { id: threadId, ...threadData };
    }
    
    return { id: threadSnap.id, ...threadSnap.data() };
  } catch (error) {
    console.error('Error getting community thread:', error);
    throw new Error('Failed to get community thread');
  }
}

/**
 * Listen to community messages in real-time
 * @param {string} threadId - Thread ID
 * @param {function} callback - Callback function for new messages
 * @returns {function} - Unsubscribe function
 */
export function listenToCommunityMessages(threadId, callback) {
  const messagesRef = collection(db, 'community_threads', threadId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
}

function getThreadTitle(stressType) {
  const titles = {
    'Academic': '📚 Academic Stress Support',
    'Financial': '💰 Financial Stress Support',
    'Social': '👥 Social Stress Support',
    'Emotional': '💭 Emotional Stress Support'
  };
  return titles[stressType] || 'Community Support';
}

function getThreadDescription(stressType) {
  const descriptions = {
    'Academic': 'Connect with students facing similar academic pressures. Share study tips and support each other.',
    'Financial': 'A safe space to discuss financial concerns and share budgeting strategies.',
    'Social': 'Build connections and discuss social challenges in a supportive environment.',
    'Emotional': 'Share your feelings and find emotional support from understanding peers.'
  };
  return descriptions[stressType] || 'Community support space';
}