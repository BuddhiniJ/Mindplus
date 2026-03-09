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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import GreetingContainer from "../../components/GreetingContainer";

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
    const initializeApp = async () => {
      try {
        await initializeStorage();
        await signInAnonymously(); // Sign in first to ensure auth.currentUser exists
        await loadUserId();        // Then get and resolve the UID
        loadLastAnalysis();        // Then load last analysis
      } catch (error) {
        console.error('[VoiceRecorder] Initialization error:', error);
      }
    };
    
    initializeApp();
    
    // Gentle breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.04,
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
          toValue: -12,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Reload last analysis when navigating back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadLastAnalysis();
    });
    return unsubscribe;
  }, [navigation]);

  const ensureAuthReady = async (timeout = 3000) => {
    const start = Date.now();
    while (!auth.currentUser && Date.now() - start < timeout) {
      console.log('[VoiceRecorder] Waiting for auth to be ready...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!auth.currentUser) {
      throw new Error('Authentication not available after timeout');
    }
  };

  const signInAnonymously = async () => {
    try {
      if (!auth.currentUser) {
        await firebaseSignInAnonymously(auth);
        console.log('✅ Signed in to Firebase anonymously');
      } else {
        console.log('✅ Already authenticated as:', auth.currentUser.uid);
      }
    } catch (error) {
      console.log('⚠️ Firebase sign-in failed (community features disabled):', error.message);
    }
  };

  const saveUserProfileToFirebase = async (userId, analysis) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        userId: userId,
        nickname: `User_${userId.slice(-4)}`, // Simple nickname, can be customized
        dominantType: analysis.dominant_type,
        overallScore: analysis.overall_score || 0,
        lastAnalysis: serverTimestamp(),
        stressScores: analysis.stress_scores,
        keywordCounts: analysis.keyword_counts,
        lastStressAnalysisId: analysis.id || Date.now().toString(), // Track latest analysis
      }, { merge: true });
      console.log('✅ Saved user profile to Firebase');
    } catch (error) {
      console.log('⚠️ Failed to save to Firebase:', error.message);
    }
  };

  const loadUserId = async () => {
    try {
      // Step 1: Ensure auth is ready (wait for anonymous sign-in if needed)
      await ensureAuthReady();
      
      // Step 2: Use Firebase auth UID (now guaranteed to exist)
      const id = auth.currentUser?.uid;
      if (!id) {
        throw new Error('Failed to establish user identity');
      }
      
      console.log('[VoiceRecorder] Resolved userId:', id);
      
      // Step 3: Sync to AsyncStorage for consistency
      await AsyncStorage.setItem('userId', id);
      setUserId(id);
    } catch (error) {
      console.error('❌ Error loading user ID:', error);
      Alert.alert('Authentication Error', 'Failed to establish user identity. Please restart the app.');
    }
  };

  const loadLastAnalysis = async () => {
    try {
      const lastAnalysisJson = await AsyncStorage.getItem('lastStressAnalysis');
      if (lastAnalysisJson) {
        const lastAnalysis = JSON.parse(lastAnalysisJson);
        setStressAnalysis(lastAnalysis);
        console.log('✅ Loaded last analysis from storage');
      }
    } catch (error) {
      console.error('Error loading last analysis:', error);
    }
  };

  useEffect(() => {
    let interval;

    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2200,
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

      // Use the authenticated Firebase UID (should already be set by loadUserId init)
      let currentUserId = userId || auth.currentUser?.uid;
      if (!currentUserId) {
        // Critical: Should not reach here if loadUserId ran successfully
        currentUserId = await AsyncStorage.getItem('userId');
        if (!currentUserId) {
          Alert.alert('Error', 'User identity could not be established');
          return;
        }
      }
      console.log('🔍 [VoiceRecorder] Using userId for saving:', currentUserId);
      setUserId(currentUserId);

      // Save audio file locally with user ID
      const savedAudio = await saveAudioFile(uri, currentUserId);

      setLoadingAnalysis(true);
      const analysis = await analyzeStress(currentUserId, text, null);
      setStressAnalysis(analysis);
      setLoadingAnalysis(false);

      // Save to local storage with audio path
      await saveAnalysisLocally({
        text: text,
        localAudioPath: savedAudio.uri,
        timestamp: Date.now(),
        stress_scores: analysis.stress_scores,
        stress_levels: analysis.stress_levels,
        stressType: analysis.dominant_type,
        total_stress_score: analysis.total_stress_score,
        overall_level: analysis.overall_level,
        confidence: analysis.confidence,
      }, currentUserId);

      console.log('✅ Saved stress analysis locally for user:', currentUserId);

      // Save last analysis to AsyncStorage for quick access on screen
      await AsyncStorage.setItem('lastStressAnalysis', JSON.stringify(analysis));

      // Save user profile to Firebase for community features
      await saveUserProfileToFirebase(currentUserId, analysis);

      // Show confirmation dialog asking about stress level
      const overallLevel = analysis.overall_level || 'Unknown';
      const isHighStress = overallLevel === 'High' || overallLevel === 'Moderate';
      
      Alert.alert(
        '🎯 Stress Level Analysis',
        `We detected ${overallLevel} stress levels from your voice.\n\nDo you agree with this assessment?`,
        [
          {
            text: 'I\'m Not Stressed - Re-record',
            onPress: () => {
              // User can re-record if they disagree
              setStressAnalysis(null);
              setTranscript("");
            },
            style: 'destructive',
          },
          {
            text: 'View Analysis',
            onPress: () => navigation.navigate('StressMindMap', { analysis: analysis }),
            style: 'default',
          },
          {
            text: 'Save & Continue',
            onPress: () => {
              Alert.alert(
                '✅ Saved',
                'Your stress analysis has been saved to your history. You can listen to your voice again later.',
                [{ text: 'OK' }]
              );
            },
            style: 'default',
          },
        ],
        { cancelable: false }
      );

      // Also save to Firebase if authenticated
      try {
        if (auth.currentUser) {
          const stressAnalysesRef = collection(db, 'users', auth.currentUser.uid, 'stressAnalyses');
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
          console.log('✅ Saved to Firebase');
        }
      } catch (fbError) {
        console.log('⚠️ Firebase save failed (continuing with local storage):', fbError.message);
      }

    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', error.message || 'Failed to process recording');
      setLoadingTranscript(false);
      setLoadingAnalysis(false);
    }
  };

  const handleViewAnalysis = () => {
    if (stressAnalysis) {
      navigation.navigate('StressMindMap', { analysis: stressAnalysis });
    }
  };

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.8],
  });

  return (
    <LinearGradient
      colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
       <View style={{width: '100%', paddingHorizontal: 10, marginTop: 40}}>
          <GreetingContainer prefix="Hey, you are free to talk now," />
        </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
       
        <View style={styles.container}>

         
          {/* Decorative floating elements */}
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
          <Animated.View 
            style={[
              styles.floatingCircle,
              styles.circle3,
              { transform: [{ translateY: floatAnim }] }
            ]} 
          />
          
          <View style={styles.card}>
            <View style={styles.headerContainer}>
              {/* <Text style={styles.emoji}>🕊️</Text> */}
              <Text style={styles.title}>Tell Your Story</Text>
              <Text style={styles.subtitle}>Let your thoughts settle</Text>
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
                      colors={['#7CB9E8', '#9DB4C0']}
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
                    colors={['#7CB9E8', '#B8D8E8']}
                    style={styles.micGradient}
                  >
                    <Text style={styles.micEmoji}>🎙️</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              <Text style={styles.timer}>{formatTime(duration)}</Text>

              {isRecording && (
                <>
                  <Text style={styles.recordingText}> </Text>
                  {duration < 3 && (
                    <Text style={styles.hintText}>
                      Breathe deeply, speak your truth
                    </Text>
                  )}
                </>
              )}

              {!isRecording && !loadingTranscript && !loadingAnalysis && (
                <Text style={styles.inspiringText}>
                  {/* Your words hold the key to tranquility */}
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
                      colors={['#93bafabb', '#73addbea']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>Just Say It</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.historyButton]}
                    onPress={() => navigation.navigate('HistoryScreen')}
                  >
                    <Text style={styles.historyButtonText}>My Journey</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <LinearGradient
                    colors={['#9DB4C0', '#B8D8E8']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>STOP</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading States */}
          {loadingTranscript && (
            <View style={styles.loadingCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F0F4F8']}
                style={styles.loadingGradient}
              >
                <ActivityIndicator size="small" color="#5777AD" />
                <Text style={styles.loadingText}>✨ Translating your essence...</Text>
              </LinearGradient>
            </View>
          )}

          {loadingAnalysis && (
            <View style={styles.loadingCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F0F4F8']}
                style={styles.loadingGradient}
              >
                <ActivityIndicator size="small" color="#7CB9E8" />
                <Text style={styles.loadingText}>🌿 Reading your emotional landscape...</Text>
              </LinearGradient>
            </View>
          )}

          {/* Transcript */}
          {transcript && !loadingTranscript && !transcript.includes("No speech") && (
            <View style={styles.transcriptCard}>
              {/* <LinearGradient
                colors={['#FFFFFF', '#F8FBFF']}
                style={styles.transcriptGradient}
              >
                <Text style={styles.cardTitle}>💭 Your Sacred Words</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </LinearGradient> */}
            </View>
          )}

          {/* Analysis Ready Button */}
          {stressAnalysis && !loadingAnalysis && (
            <TouchableOpacity
              style={styles.viewAnalysisButton}
              onPress={handleViewAnalysis}
            >
              <LinearGradient
                colors={['#7CB9E8', '#5777AD']}
                style={styles.viewAnalysisGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.viewAnalysisText}>View Full Analysis</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    opacity: 0.12,
  },
  circle1: {
    width: 320,
    height: 320,
    backgroundColor: '#7CB9E8',
    top: -120,
    right: -100,
  },
  circle2: {
    width: 240,
    height: 240,
    backgroundColor: '#5777AD',
    bottom: 80,
    left: -80,
  },
  circle3: {
    width: 180,
    height: 180,
    backgroundColor: '#B8D8E8',
    top: 200,
    left: -50,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(87, 119, 173, 0.1)',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#5777AD',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#7CB9E8',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
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
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#B8D8E8',
    borderWidth: 2,
    borderColor: '#7CB9E8',
  },
  micIcon: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  micGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  micEmoji: {
    fontSize: 60,
  },
  recordingIndicator: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#7CB9E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  recordingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  recordingDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5777AD',
  },
  timer: {
    fontSize: 42,
    fontWeight: '300',
    marginBottom: 12,
    color: '#5777AD',
    letterSpacing: 3,
  },
  recordingText: {
    fontSize: 17,
    color: '#7CB9E8',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 14,
    color: '#9DB4C0',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inspiringText: {
    fontSize: 15,
    color: '#7CB9E8',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  controls: {
    gap: 16,
  },
  button: {
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#6a94dd36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  recordButton: {},
  stopButton: {},
  historyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#7CB9E8',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#5777AD',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingCard: {
    marginTop: 20,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  loadingGradient: {
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#5777AD',
    fontWeight: '500',
  },
  transcriptCard: {
    marginTop: 20,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#5777AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  transcriptGradient: {
    padding: 28,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5777AD',
    marginBottom: 16,
  },
  transcriptText: {
    fontSize: 16,
    color: '#5777AD',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  viewAnalysisButton: {
    marginTop: 20,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7CB9E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  viewAnalysisGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  viewAnalysisText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});