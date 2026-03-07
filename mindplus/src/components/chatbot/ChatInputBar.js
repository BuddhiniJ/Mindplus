import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
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
// - sending: boolean            Whether a message is currently being sent.
export default function ChatInputBar({
  input,
  onChangeInput,
  onSend,
  sending,
}) {
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [recording, setRecording] = useState(null);
  const [transcribing, setTranscribing] = useState(false);

  // Start recording the user's voice using expo-av, then
  // send it to the existing Google Speech-to-Text helper.
  const startRecording = async () => {
    try {
      setVoiceError(null);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission required",
          "Please enable microphone access in Settings to use voice input."
        );
        setVoiceError("Microphone permission is required to use voice input.");
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
      setVoiceError("Sorry, I couldn't start recording. Please try again.");
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
        setVoiceError(
          "Sorry, I couldn't capture your voice. Please try again."
        );
        return;
      }

      const text = await speechToText(uri);

      setTranscribing(false);

      if (!text || text.startsWith("No speech detected")) {
        setVoiceError("Sorry, I couldn't hear that clearly. Please try again.");
        return;
      }

      onChangeInput(text);
      onSend?.(text);
    } catch (error) {
      console.log("stopRecording error", error);
      setTranscribing(false);
      setVoiceError(
        "Sorry, something went wrong while processing your voice. Please try again."
      );
    }
  };

  const canSend = input.trim().length > 0 && !sending;

  return (
    <View
      style={{
        padding: 12,
        borderTopWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
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
            minHeight: 44,
            maxHeight: 120,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: "#F1F5F9",
            color: "#0F172A",
          }}
          value={input}
          onChangeText={onChangeInput}
          placeholder="Type how you're feeling… or tap the mic"
          placeholderTextColor="#94A3B8"
          multiline
          blurOnSubmit={false}
        />

        {/* Microphone button for voice input */}
        <TouchableOpacity
          onPress={listening ? stopRecording : startRecording}
          style={{
            marginLeft: 8,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: listening ? "#F97373" : "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={listening ? "mic" : "mic-outline"}
            size={22}
            color={listening ? "#FFFFFF" : "#4B5563"}
          />
        </TouchableOpacity>

        {/* Send button for manual text input */}
        <TouchableOpacity
          onPress={() => onSend?.()}
          disabled={!canSend}
          style={{
            marginLeft: 8,
            backgroundColor: canSend ? "#6366F1" : "#CBD5E1",
            paddingHorizontal: 16,
            borderRadius: 20,
            justifyContent: "center",
            height: 40,
          }}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Send</Text>
          )}
        </TouchableOpacity>
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
