import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { speechToText } from '../../services/speechToText';
import { analyzeStress } from '../../services/stressService';
import { saveAudioFile, initializeStorage } from '../../services/localStorageService';
import { saveAnalysisLocally } from '../../services/historyStorageService';
import StressMindMap from '../Voice/StressMindMap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function VoiceRecorder({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [recordingTimestamp, setRecordingTimestamp] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [stressAnalysis, setStressAnalysis] = useState(null);
  const [userId, setUserId] = useState(null);
  const db = getFirestore();
  const auth = getAuth();
  
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserId();
    initializeStorage();
    signInAnonymously();
    
    // Gentle breathing animation for background
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.05,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const signInAnonymously = async () => {
    try {
      const { signInAnonymously: signIn } = await import('../firebase/firebaseConfig');
      await signIn();
      console.log('✅ Signed in to Firebase anonymously');
    } catch (error) {
      console.log('⚠️ Firebase sign-in failed (community features disabled):', error.message);
    }
  };

  const loadUserId = async () => {
    try {
      let id = await AsyncStorage.getItem('userId');
      if (!id) {
        id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('userId', id);
      }
      setUserId(id);
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  useEffect(() => {
    let interval;

    if (isRecording) {
      // Gentle pulse for recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Ripple effect
      Animated.loop(
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      rippleAnim.setValue(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone permission is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();

      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.amr',
          outputFormat: Audio.AndroidOutputFormat.AMR_WB,
          audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.caf',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await newRecording.startAsync();

      const timestamp = Date.now();
      
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      setRecordedUri(null);
      setRecordingTimestamp(timestamp);
      setTranscript("");
      setStressAnalysis(null);

    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setIsRecording(false);
      setRecordedUri(uri);

      await processRecording(uri);

    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const processRecording = async (uri) => {
    try {
      setLoadingTranscript(true);
      const text = await speechToText(uri);
      setTranscript(text);
      setLoadingTranscript(false);

      if (!text || text.includes("No speech detected")) {
        Alert.alert('Notice', 'No clear speech detected. Please try again.');
        return;
      }

      const savedAudio = await saveAudioFile(uri, auth.currentUser.uid);

      setLoadingAnalysis(true);
      const analysis = await analyzeStress(auth.currentUser.uid, text, null);
      setStressAnalysis(analysis);
      setLoadingAnalysis(false);

      const userId = auth.currentUser.uid;
      const stressAnalysesRef = collection(db, 'users', userId, 'stressAnalyses');

      await addDoc(stressAnalysesRef, {
        text: text,
        audio_url: savedAudio.uri,
        timestamp: serverTimestamp(),
        stress_scores: analysis.stress_scores,
        stress_levels: analysis.stress_levels,
        dominant_type: analysis.dominant_type,
        total_stress_score: analysis.total_stress_score,
        overall_level: analysis.overall_level,
        confidence: analysis.confidence,
      });

      console.log('✅ Saved stress analysis to Firebase for user:', userId);

    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', error.message || 'Failed to process recording');
      setLoadingTranscript(false);
      setLoadingAnalysis(false);
    }
  };

  const handleJoinCommunity = (stressType) => {
    navigation.navigate('Community', { stressType });
  };

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  return (
    <LinearGradient
      colors={['#E8F5E9', '#E1F5FE', '#F3E5F5', '#FFF9C4']}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Decorative elements */}
          <Animated.View 
            style={[
              styles.floatingCircle,
              styles.circle1,
              { transform: [{ scale: breatheAnim }, { translateY: floatAnim }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.floatingCircle,
              styles.circle2,
              { transform: [{ scale: breatheAnim }] }
            ]} 
          />
          
          <View style={styles.card}>
            <View style={styles.headerContainer}>
              <Text style={styles.emoji}>🌸</Text>
              <Text style={styles.title}>Healing Space</Text>
              <Text style={styles.subtitle}>Breathe. Speak. Release.</Text>
            </View>

            <View style={styles.recordingArea}>
              {isRecording ? (
                <View style={styles.recordingContainer}>
                  <Animated.View
                    style={[
                      styles.ripple,
                      {
                        opacity: rippleOpacity,
                        transform: [{ scale: rippleScale }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.recordingIndicator,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#FF9A9E', '#FAD0C4']}
                      style={styles.recordingGradient}
                    >
                      <View style={styles.recordingDot} />
                    </LinearGradient>
                  </Animated.View>
                </View>
              ) : (
                <Animated.View 
                  style={[
                    styles.micIcon,
                    { transform: [{ translateY: floatAnim }] }
                  ]}
                >
                  <LinearGradient
                    colors={['#A8E6CF', '#84D8E8']}
                    style={styles.micGradient}
                  >
                    <Text style={styles.micEmoji}>🎙️</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              <Text style={styles.timer}>{formatTime(duration)}</Text>

              {isRecording && (
                <>
                  <Text style={styles.recordingText}>✨ Listening to your heart...</Text>
                  {duration < 3 && (
                    <Text style={styles.hintText}>
                      Take your time, speak from within
                    </Text>
                  )}
                </>
              )}

              {!isRecording && !loadingTranscript && !loadingAnalysis && (
                <Text style={styles.inspiringText}>
                  Your voice has power to heal
                </Text>
              )}
            </View>

            <View style={styles.controls}>
              {!isRecording ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.recordButton]}
                    onPress={startRecording}
                    disabled={loadingTranscript || loadingAnalysis}
                  >
                    <LinearGradient
                      colors={['#84FAB0', '#8FD3F4']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>Begin Release 🌊</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.historyButton]}
                    onPress={() => navigation.navigate('HistoryScreen')}
                  >
                    <Text style={styles.historyButtonText}>📖 Journey Log</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <LinearGradient
                    colors={['#FFA8B8', '#FFDDE1']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Complete ✓</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading States */}
          {loadingTranscript && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#81C784" />
              <Text style={styles.loadingText}>✨ Capturing your words...</Text>
            </View>
          )}

          {loadingAnalysis && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#64B5F6" />
              <Text style={styles.loadingText}>🌿 Understanding your emotions...</Text>
            </View>
          )}

          {/* Transcript */}
          {transcript && !loadingTranscript && !transcript.includes("No speech") && (
            <View style={styles.transcriptCard}>
              <Text style={styles.cardTitle}>💭 Your Expression</Text>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          )}

          {/* Stress Analysis */}
          {stressAnalysis && (
            <StressMindMap 
              stressAnalysis={stressAnalysis}
              onJoinCommunity={handleJoinCommunity}
            />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.15,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#81C784',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: '#64B5F6',
    bottom: 50,
    left: -50,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#66BB6A',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recordingArea: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 220,
    justifyContent: 'center',
  },
  recordingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFB6C1',
    borderWidth: 2,
    borderColor: '#FFA8B8',
  },
  micIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micEmoji: {
    fontSize: 56,
  },
  recordingIndicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#FF9A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  recordingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
  },
  timer: {
    fontSize: 40,
    fontWeight: '300',
    marginBottom: 12,
    color: '#2E7D32',
    letterSpacing: 2,
  },
  recordingText: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 14,
    color: '#81C784',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inspiringText: {
    fontSize: 16,
    color: '#66BB6A',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controls: {
    gap: 16,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  recordButton: {},
  stopButton: {},
  historyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#81C784',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#2E7D32',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingCard: {
    marginTop: 20,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  loadingText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  transcriptCard: {
    marginTop: 20,
    padding: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 16,
  },
  transcriptText: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 26,
    fontStyle: 'italic',
  },
});