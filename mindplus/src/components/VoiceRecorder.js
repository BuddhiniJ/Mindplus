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
import { speechToText } from '../services/speechToText';
import { analyzeStress } from '../services/stressService';
// import { saveUserProfile } from '../firebase/firebaseConfig';
import { saveAudioFile, initializeStorage } from '../services/localStorageService';
import { saveAnalysisLocally } from '../services/historyStorageService';
import StressMindMap from '../components/StressMindMap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
  
  // Loading states
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get or create user ID
  useEffect(() => {
    loadUserId();
    initializeStorage(); // Initialize audio storage directory
    signInAnonymously(); // Sign in to Firebase
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

  // Recording animation
  useEffect(() => {
    let interval;

    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
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

      // Store timestamp when recording starts
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

      // Process the recording
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

    // Save audio locally if needed
    const savedAudio = await saveAudioFile(uri, auth.currentUser.uid);

    setLoadingAnalysis(true);
    const analysis = await analyzeStress(auth.currentUser.uid, text, null);
    setStressAnalysis(analysis);
    setLoadingAnalysis(false);

    // --------------------------
    // Save to Firestore
    // --------------------------
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

  const getStressColor = (level) => {
    const colors = ['#22c55e', '#f59e0b', '#ef4444'];
    return colors[level] || '#6b7280';
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Voice Stress Analysis</Text>

          <View style={styles.recordingArea}>
            {isRecording ? (
              <Animated.View
                style={[
                  styles.recordingIndicator,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.recordingDot} />
              </Animated.View>
            ) : (
              <View style={styles.micIcon}>
                <Text style={styles.micEmoji}>🎤</Text>
              </View>
            )}

            <Text style={styles.timer}>{formatTime(duration)}</Text>

            {isRecording && (
              <>
                <Text style={styles.recordingText}>Recording...</Text>
                {duration < 3 && (
                  <Text style={styles.hintText}>
                    Speak clearly for at least 3 seconds
                  </Text>
                )}
              </>
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
                  <Text style={styles.buttonText}>Start Recording</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.historyButton]}
                  onPress={() => navigation.navigate('HistoryScreen')}
                >
                  <Text style={styles.historyButtonText}>📜 View History</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={stopRecording}
              >
                <Text style={styles.buttonText}>Stop Recording</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Loading States */}
        {loadingTranscript && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingText}>Converting speech to text...</Text>
          </View>
        )}

        {loadingAnalysis && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingText}>Analyzing stress level...</Text>
          </View>
        )}

        {/* Transcript */}
        {transcript && !loadingTranscript && !transcript.includes("No speech") && (
          <View style={styles.transcriptCard}>
            <Text style={styles.cardTitle}>📝 Transcript</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        {/* Stress Analysis Mind Map */}
        {stressAnalysis && (
          <StressMindMap 
            stressAnalysis={stressAnalysis}
            onJoinCommunity={handleJoinCommunity}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
    color: '#1f2937',
  },
  recordingArea: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 200,
    justifyContent: 'center',
  },
  micIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micEmoji: {
    fontSize: 48,
  },
  recordingIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  timer: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  recordingText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  controls: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#3b82f6',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  historyButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  historyButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    elevation: 3,
  },
  loadingText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  transcriptCard: {
    marginTop: 16,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  transcriptText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});