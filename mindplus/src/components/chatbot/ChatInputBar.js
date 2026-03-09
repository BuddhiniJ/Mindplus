import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { speechToText } from "../../services/speechToText";

// Chat input with optional voice input using react-native-voice.
//
// Props:
// - input: string               Current text value.
// - onChangeInput: (text) => {} Updates the parent input state.
// - onSend: (text?) => {}       Sends a message; if text is provided it
//                                should be sent instead of the current input.
// - onTyping: () => {}          Optional callback fired when user types.
// - sending: boolean            Whether a message is currently being sent.
export default function ChatInputBar({
  input,
  onChangeInput,
  onSend,
  onTyping,
  sending,
}) {
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [recording, setRecording] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const voiceErrorTimeoutRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const showVoiceError = (message) => {
    setVoiceError(message);
    if (voiceErrorTimeoutRef.current) {
      clearTimeout(voiceErrorTimeoutRef.current);
    }
    voiceErrorTimeoutRef.current = setTimeout(() => {
      setVoiceError(null);
      voiceErrorTimeoutRef.current = null;
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (voiceErrorTimeoutRef.current) {
        clearTimeout(voiceErrorTimeoutRef.current);
      }
    };
  }, []);

  // Start recording the user's voice using expo-av, then
  // send it to the existing Google Speech-to-Text helper.
  const startRecording = async () => {
    try {
      setVoiceError(null);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission required",
          "Please enable microphone access in Settings to use voice input.",
        );
        showVoiceError("Microphone permission is required to use voice input.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: ".amr",
          outputFormat: Audio.AndroidOutputFormat.AMR_WB,
          audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".caf",
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      setRecording(recording);
      setListening(true);
    } catch (error) {
      console.log("startRecording error", error);
      setListening(false);
      showVoiceError("Sorry, I couldn't start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      setListening(false);
      return;
    }

    try {
      setListening(false);
      setTranscribing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        setTranscribing(false);
        showVoiceError(
          "Sorry, I couldn't capture your voice. Please try again.",
        );
        return;
      }

      const text = await speechToText(uri);

      setTranscribing(false);

      if (!text || text.startsWith("No speech detected")) {
        showVoiceError(
          "Sorry, I couldn't hear that clearly. Please try again.",
        );
        return;
      }

      onChangeInput(text);
      onSend?.(text);
    } catch (error) {
      console.log("stopRecording error", error);
      setTranscribing(false);
      showVoiceError(
        "Sorry, something went wrong while processing your voice. Please try again.",
      );
    }
  };

  const canSend = input.trim().length > 0 && !sending;

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 0,
        paddingBottom: 22,
        borderTopWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOpacity: isFocused ? 0.08 : 0.04,
        shadowRadius: 8,
        elevation: isFocused ? 4 : 2,
        marginBottom: -27, // Compensate for extra padding when keyboard is open
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextInput
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: "#F1F5F9",
            color: "#0F172A",
            fontWeight: "600",
            borderWidth: isFocused ? 1 : 0,
            borderColor: isFocused ? "#3B82F6" : "transparent",
            marginTop: 16,
          }}
          value={input}
          onChangeText={(text) => {
            onChangeInput(text);
            if (text && text.length > 0) {
              onTyping?.();
            }
          }}
          placeholder="Type how you're feeling…"
          placeholderTextColor="#94A3B8"
          multiline
          blurOnSubmit={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Microphone button for voice input */}
        <Pressable
          onPress={listening ? stopRecording : startRecording}
          style={({ pressed }) => ({
            marginLeft: 8,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: listening ? "#F97373" : "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 16,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons
            name={listening ? "mic" : "mic-outline"}
            size={22}
            color={listening ? "#FFFFFF" : "#1d77f5"}
          />
        </Pressable>

        {/* Send button for manual text input */}
        <Pressable
          onPress={() => onSend?.()}
          disabled={!canSend}
          style={({ pressed }) => ({
            marginLeft: 8,
            backgroundColor: canSend ? "#3B82F6" : "#d9dde2",
            paddingHorizontal: 16,
            borderRadius: 20,
            justifyContent: "center",
            marginTop: 16,
            height: 40,
            opacity: !canSend ? 1 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed && canSend ? 0.97 : 1 }],
          })}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>Send</Text>
          )}
        </Pressable>
      </View>

      {/* Voice UX indicators */}
      {(listening || transcribing) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <ActivityIndicator size="small" color="#F97373" />
          <Text
            style={{
              marginLeft: 8,
              color: "#EF4444",
              fontSize: 13,
            }}
          >
            {listening ? "Listening..." : "Transcribing..."}
          </Text>
        </View>
      )}

      {voiceError && !listening && (
        <Text
          style={{
            marginTop: 6,
            color: "#DC2626",
            fontSize: 13,
          }}
        >
          {voiceError}
        </Text>
      )}
    </View>
  );
}
