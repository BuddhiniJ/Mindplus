import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen({ route, navigation }) {
  const { user } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [myUserId, setMyUserId] = useState(null);         // ← renamed to avoid confusion
  const [myNickname, setMyNickname] = useState('');
  const [theirNickname, setTheirNickname] = useState(user.name || '');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const unsubscribeRef = useRef(null);
  const prevLastMsgIdRef = useRef(null);

  // Keep a ref of myUserId so handleSend can always read the latest value
  // without depending on state timing
  const myUserIdRef = useRef(null);
  const chatIdRef = useRef(null);

  const db = getFirestore();
  const auth = getAuth();

  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Resolve MY uid
      const authUid = auth.currentUser?.uid || null;
      const storedUid = await AsyncStorage.getItem('userId');
      let myId = authUid || storedUid || null;

      // If we have both an auth UID and a different stored UID, prefer auth and sync storage.
      if (authUid && storedUid && authUid !== storedUid) {
        console.warn('[ChatScreen] Detected UID mismatch — using Firebase auth UID and updating AsyncStorage.', { authUid, storedUid });
        try {
          await AsyncStorage.setItem('userId', authUid);
          console.log('[ChatScreen] AsyncStorage userId updated to auth UID');
        } catch (e) {
          console.warn('[ChatScreen] Failed to update AsyncStorage userId', e);
        }
        myId = authUid;
      }

      if (!myId) {
        Alert.alert('Error', 'Could not identify you. Please restart the app.');
        navigation.goBack();
        return;
      }

      // 2. Validate the OTHER user's id
      const theirId = user?.id;
      if (!theirId || theirId === myId) {
        Alert.alert('Error', 'Invalid chat target.');
        navigation.goBack();
        return;
      }

      // 3. Build chatId — SORTED so both sides always get the same string
      //    e.g. ["zzz","aaa"].sort() → "aaa_zzz" on BOTH devices
      const chatId = [myId, theirId].sort().join('_');

      // ── Critical debug log ─────────────────────────────────────────────
      console.log('╔══════════════════════════════════');
      console.log('║ MY  uid :', myId);
      console.log('║ THEIR id:', theirId);
      console.log('║ chatId  :', chatId);
      console.log('╚══════════════════════════════════');
      // ── If the chatId differs between the two devices, that is the bug ──

      if (!mounted) return;

      // Store in refs so async callbacks always have the current value
      myUserIdRef.current = myId;
      chatIdRef.current = chatId;

      // Update state for renders
      setMyUserId(myId);

      // 4. Fetch display names
      const me = await fetchNickname(myId);
      const them = await fetchNickname(theirId);
      if (!mounted) return;
      setMyNickname(me);
      setTheirNickname(them);
      navigation.setOptions({ title: them });

      // 5. Subscribe — pass everything as arguments, never read state inside
      subscribeMessages(myId, chatId);

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    };

    init();
    return () => {
      mounted = false;
      unsubscribeRef.current?.();
    };
  }, []);

  // ── Fetch nickname ────────────────────────────────────────────────────────
  const fetchNickname = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'profile', 'basic'));
      if (snap.exists()) return snap.data().nickname || `User_${uid.slice(-4)}`;
      const usnap = await getDoc(doc(db, 'users', uid));
      if (usnap.exists()) return usnap.data().nickname || `User_${uid.slice(-4)}`;
    } catch (_) {}
    return `User_${uid.slice(-4)}`;
  };

  // ── Subscribe to ALL messages in the shared chat ──────────────────────────
  const subscribeMessages = (myId, chatId) => {
    const messagesCol = collection(db, 'chats', chatId, 'messages');

    // ORDER BY timestamp only — NO where() filter.
    // Both users read ALL messages; the UI decides left vs right alignment.
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    console.log('[ChatScreen] Subscribing to:', `chats/${chatId}/messages`);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().timestamp?.toDate?.() ?? new Date(),
        }));

        console.log(`[ChatScreen] snapshot: ${msgs.length} messages`);
        msgs.forEach((m) =>
          console.log(`  ↳ [${m.senderId?.slice(-4)}] "${m.text?.slice(0, 30)}"`)
        );

        setMessages(msgs);
        setLoadingMessages(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);

        // Notify user on new incoming message (simple alert for demo/viva)
        try {
          const last = msgs[msgs.length - 1];
          if (last && last.id && last.senderId && last.senderId !== myId) {
            // Only alert once per message id
            if (prevLastMsgIdRef.current !== last.id) {
              prevLastMsgIdRef.current = last.id;
              const fromName = last.senderName || (theirNickname || user.name);
              const preview = last.text?.length > 120 ? `${last.text.slice(0, 120)}...` : last.text;
              // Lightweight notification — suitable for demo. Replace with push notifications in production.
              Alert.alert(`New message from ${fromName}`, preview, [{ text: 'Open', onPress: () => {} }, { text: 'Dismiss' }]);
            }
          }
        } catch (e) {
          console.warn('[ChatScreen] notify error', e);
        }
      },
      (err) => {
        console.error('[ChatScreen] snapshot error:', err.code, err.message);
        setLoadingMessages(false);
        Alert.alert('Error', `Could not load messages:\n${err.message}`);
      }
    );

    unsubscribeRef.current = unsub;
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    // Use refs — guaranteed to have the value even if state hasn't updated
    const myId = myUserIdRef.current;
    const chatId = chatIdRef.current;

    if (!text || !myId || !chatId || sending) return;

    setInputText('');
    setSending(true);

    try {
      // Write the message — NO senderId filter on reads, so both users will see it
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: myId,
        senderName: myNickname,
        recipientId: user.id,
        timestamp: serverTimestamp(),
        read: false,
      });

      // Keep the chat list preview up to date
      await setDoc(
        doc(db, 'chats', chatId),
        {
          participantIds: [myId, user.id].sort(),
          lastMessage: text.substring(0, 80),
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('[ChatScreen] send error:', err.code, err.message);
      setInputText(text);
      Alert.alert('Send Failed', err.message);
    } finally {
      setSending(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStressIcon = (type) =>
    ({ Academic: '📚', Financial: '💰', Social: '👥', Emotional: '💭' }[type] || '🌟');

  const formatTime = (date) => {
    if (!date) return '';
    try {
      const t = date instanceof Date ? date : new Date(date);
      const mins = Math.floor((Date.now() - t) / 60000);
      if (mins < 1) return 'now';
      if (mins < 60) return `${mins}m ago`;
      if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
      return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <Animated.View style={[styles.chatHeader, { opacity: fadeAnim }]}>
          <LinearGradient colors={['#FFFFFF', '#F8FBFF']} style={styles.chatHeaderGradient}>
            <View style={[styles.headerAvatar, { backgroundColor: '#5777AD20' }]}>
              <Text style={styles.headerAvatarEmoji}>{getStressIcon(user.stressType)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{theirNickname || user.name}</Text>
              <Text style={styles.headerStatus}>
                🟢 {messages.length} message{messages.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loadingMessages ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#5777AD" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Say hello to {theirNickname || user.name}!</Text>
            </View>
          ) : (
            messages.map((message) => {
              // ✅ Compare against myUserId STATE (set before first render of messages)
              // If myUserId is somehow null, fall back to ref
              const effectiveMyId = myUserId || myUserIdRef.current;
              const isMe = message.senderId === effectiveMyId;

              return (
                <View
                  key={message.id}
                  style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}
                >
                  {!isMe && (
                    <View style={[styles.messageAvatar, { backgroundColor: '#E9EAEB' }]}>
                      <Text style={styles.messageAvatarEmoji}>{getStressIcon(user.stressType)}</Text>
                    </View>
                  )}

                  <View style={[styles.messageBubble, isMe ? styles.bubbleRight : styles.bubbleLeftOuter]}>
                    {!isMe && (
                      <Text style={styles.senderName}>{theirNickname || user.name}</Text>
                    )}
                    {isMe ? (
                      <LinearGradient colors={['#7CB9E8', '#5777AD']} style={styles.bubbleGradient}>
                        <Text style={styles.messageTextRight}>{message.text}</Text>
                        <Text style={styles.messageTimeRight}>{formatTime(message.timestamp)}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.bubbleLeftInner}>
                        <Text style={styles.messageTextLeft}>{message.text}</Text>
                        <Text style={styles.messageTimeLeft}>{formatTime(message.timestamp)}</Text>
                      </View>
                    )}
                  </View>

                  {isMe && (
                    <View style={styles.currentUserAvatar}>
                      <Text style={styles.currentUserAvatarText}>📤</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <LinearGradient colors={['#FFFFFF', '#F8FBFF']} style={styles.inputGradient}>
            <TextInput
              style={[styles.input, sending && { opacity: 0.6 }]}
              placeholder="Type your message..."
              placeholderTextColor="#B8D8E8"
              value={inputText}
              onChangeText={setInputText}
              editable={!sending}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <LinearGradient
                colors={!inputText.trim() || sending ? ['#B8D8E8', '#D4E4F7'] : ['#7CB9E8', '#5777AD']}
                style={styles.sendButtonGradient}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.sendButtonText}>Send</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#5777AD', fontWeight: '500' },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#5777AD', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#7CB9E8', textAlign: 'center' },
  chatHeader: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 12 },
  chatHeaderGradient: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 20, elevation: 4,
    shadowColor: '#5777AD', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
  headerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerAvatarEmoji: { fontSize: 24 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: '700', color: '#5777AD', marginBottom: 2 },
  headerStatus: { fontSize: 14, color: '#7CB9E8', fontWeight: '500' },
  messagesContainer: { padding: 20, paddingBottom: 10, flexGrow: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  messageAvatarEmoji: { fontSize: 18 },
  currentUserAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(124, 185, 232, 0.2)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  currentUserAvatarText: { fontSize: 14, fontWeight: '700', color: '#5777AD' },
  messageBubble: {
    maxWidth: '70%', borderRadius: 20, overflow: 'hidden',
    elevation: 2, shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  bubbleGradient: { padding: 14, paddingBottom: 8 },
  bubbleRight: { backgroundColor: 'transparent' },
  bubbleLeftOuter: { backgroundColor: 'transparent' },
  bubbleLeftInner: { backgroundColor: '#FFFFFF', padding: 14, paddingBottom: 8, borderRadius: 20 },
  messageTextLeft: { fontSize: 15, color: '#5777AD', lineHeight: 22, marginBottom: 4 },
  messageTextRight: { fontSize: 15, color: '#FFFFFF', lineHeight: 22, marginBottom: 4 },
  messageTimeLeft: { fontSize: 11, color: '#B8D8E8', alignSelf: 'flex-end' },
  messageTimeRight: { fontSize: 11, color: 'rgba(255,255,255,0.8)', alignSelf: 'flex-end' },
  senderName: { fontSize: 14, fontWeight: '600', color: '#5777AD', marginBottom: 4, paddingHorizontal: 14, paddingTop: 8 },
  inputContainer: {
    paddingHorizontal: 20, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  inputGradient: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 8,
    borderRadius: 24, elevation: 6, shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  input: { flex: 1, fontSize: 16, color: '#5777AD', paddingHorizontal: 16, paddingVertical: 12, maxHeight: 100 },
  sendButton: { borderRadius: 20, overflow: 'hidden', marginLeft: 8 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { paddingHorizontal: 24, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  sendButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
