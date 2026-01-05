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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatScreen({ route, navigation }) {
  const { user, currentUserId } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load initial messages
    loadMessages();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Set header title
    navigation.setOptions({
      title: user.name,
    });
  }, []);

  const loadMessages = () => {
    // Hard-coded initial messages
    const initialMessages = [
      {
        id: '1',
        text: `Hi! I'm ${user.name}. I'm here to support you on your wellness journey. 🌸`,
        sender: user.id,
        timestamp: Date.now() - 3600000,
      },
      {
        id: '2',
        text: 'How are you feeling today?',
        sender: user.id,
        timestamp: Date.now() - 3500000,
      },
    ];
    setMessages(initialMessages);
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: currentUserId,
      timestamp: Date.now(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate response after 1-2 seconds
    setTimeout(() => {
      const responses = [
        "Thank you for sharing that with me. I'm here to listen. 🌿",
        "That sounds challenging. Remember, you're not alone in this. 💙",
        "I understand. Taking one step at a time is all we can do. 🌸",
        "Your feelings are valid. It's okay to feel this way. 🦋",
        "That's a great perspective! Keep that positive mindset. ✨",
        "I'm proud of you for opening up. That takes courage. 🌺",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: user.id,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, responseMessage]);
    }, 1000 + Math.random() * 1000);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <LinearGradient
      colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Chat Header Info */}
        <Animated.View style={[styles.chatHeader, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FBFF']}
            style={styles.chatHeaderGradient}
          >
            <View style={[styles.headerAvatar, { backgroundColor: user.color + '20' }]}>
              <Text style={styles.headerAvatarEmoji}>{user.avatar}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{user.name}</Text>
              <Text style={styles.headerStatus}>
                {user.lastSeen === 'Online' ? '🟢 Online' : user.lastSeen}
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
          {messages.map((message) => {
            const isCurrentUser = message.sender === currentUserId;
            
            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isCurrentUser ? styles.messageRowRight : styles.messageRowLeft
                ]}
              >
                {!isCurrentUser && (
                  <View style={[styles.messageAvatar, { backgroundColor: user.color + '20' }]}>
                    <Text style={styles.messageAvatarEmoji}>{user.avatar}</Text>
                  </View>
                )}
                
                <View
                  style={[
                    styles.messageBubble,
                    isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft
                  ]}
                >
                  {isCurrentUser ? (
                    <LinearGradient
                      colors={['#7CB9E8', '#5777AD']}
                      style={styles.messageBubbleGradient}
                    >
                      <Text style={styles.messageTextRight}>{message.text}</Text>
                      <Text style={styles.messageTimeRight}>{formatTime(message.timestamp)}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.messageBubbleLeft}>
                      <Text style={styles.messageTextLeft}>{message.text}</Text>
                      <Text style={styles.messageTimeLeft}>{formatTime(message.timestamp)}</Text>
                    </View>
                  )}
                </View>

                {isCurrentUser && (
                  <View style={styles.currentUserAvatar}>
                    <Text style={styles.currentUserAvatarText}>You</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FBFF']}
            style={styles.inputGradient}
          >
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#B8D8E8"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() === '' && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={inputText.trim() === ''}
            >
              <LinearGradient
                colors={inputText.trim() === '' ? ['#B8D8E8', '#D4E4F7'] : ['#7CB9E8', '#5777AD']}
                style={styles.sendButtonGradient}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  chatHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chatHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarEmoji: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 14,
    color: '#7CB9E8',
    fontWeight: '500',
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatarEmoji: {
    fontSize: 18,
  },
  currentUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 185, 232, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  currentUserAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5777AD',
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messageBubbleGradient: {
    padding: 14,
    paddingBottom: 8,
  },
  messageBubbleLeft: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    paddingBottom: 8,
  },
  messageBubbleRight: {
    backgroundColor: 'transparent',
  },
  messageTextLeft: {
    fontSize: 15,
    color: '#5777AD',
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTextRight: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTimeLeft: {
    fontSize: 11,
    color: '#B8D8E8',
    alignSelf: 'flex-end',
  },
  messageTimeRight: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#5777AD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});