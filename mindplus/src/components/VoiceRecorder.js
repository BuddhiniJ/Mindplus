import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';

export default function VoiceRecorder() {
  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // ✅ FIX: useRef instead of useState
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ---------------------------
  // Recording animation + timer
  // ---------------------------
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

  // ---------------------------
  // Helpers
  // ---------------------------
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // ---------------------------
  // Start Recording
  // ---------------------------
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('Microphone permission is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();

      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      setRecordedUri(null);
    } catch (error) {
      console.error('Start recording error:', error);
      alert('Failed to start recording');
    }
  };

  // ---------------------------
  // Stop Recording
  // ---------------------------
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setIsRecording(false);
      setRecordedUri(uri);

      console.log('Recording saved at:', uri);
    } catch (error) {
      console.error('Stop recording error:', error);
      alert('Failed to stop recording');
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Voice Recorder</Text>

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
            <Text style={styles.recordingText}>Recording...</Text>
          )}
        </View>

        <View style={styles.controls}>
          {!isRecording ? (
            <TouchableOpacity
              style={[styles.button, styles.recordButton]}
              onPress={startRecording}
            >
              <Text style={styles.buttonText}>Start Recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopRecording}
            >
              <Text style={styles.buttonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}
        </View>

        {recordedUri && !isRecording && (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>
              Recording saved successfully!
            </Text>
            <Text style={styles.uriText} numberOfLines={1}>
              {recordedUri.split('/').pop()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------
// Styles
// ---------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  recordingArea: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 180,
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
  },
  recordingText: {
    fontSize: 16,
    color: '#ef4444',
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
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  successCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 32,
    color: '#22c55e',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 8,
  },
  uriText: {
    fontSize: 12,
    color: '#16a34a',
  },
});
