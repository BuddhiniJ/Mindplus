import React, { useRef } from "react";
import { View, Text, Pressable, Linking, Animated } from "react-native";
import styles from "./chatbotStyles";
import { Ionicons } from "@expo/vector-icons";

export const TECHNIQUE_DETAILS = {
  "5-4-3-2-1 grounding":
    "Look around and gently notice: 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, and 1 you can taste.",
  "Box breathing (4-4-4-4)":
    "Inhale through your nose for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat this slow rhythm a few times.",
  "Self-compassion check-in":
    "Pause and speak to yourself as you would to a kind friend. Acknowledge that what you feel is valid and understandable.",
  "Small activation task":
    "Pick one tiny, doable task (like opening your notes or writing a title) to gently move things forward.",
  "4-7-8 breathing":
    "Breathe in for 4 seconds, hold for 7, and exhale slowly for 8. This can calm your nervous system.",
  "Cognitive defusion":
    "Notice your thoughts as mental events, not facts. You might say: 'I am having the thought that…' instead of 'This is true'.",
  "5-minute micro-break":
    "Step away for 5 minutes: stretch, drink water, or look out of a window. Let your body reset a little.",
  "Energy audit":
    "Gently scan your day and notice what activities drain you and what restores you. Adjust one small thing in your favour.",
  "Task chunking (25/5 Pomodoro)":
    "Work for 25 minutes on a single task, then rest for 5. Repeat a few cycles and keep tasks small and specific.",
  "Two-minute small start":
    "Commit to only 2 minutes of a task. Often, starting is the hardest step and momentum will carry you afterwards.",
  "Mindful breathing":
    "Bring attention to your breath. Notice the air moving in and out, and gently return your focus when your mind wanders.",
};

export default function TechniqueDetailCard({
  technique,
  emergencyContact,
  emergencyName,
  onClose,
  onStart,
}) {
  if (!technique) return null;

  const normalized = String(technique).trim().toLowerCase();
  const isEmergencyService = /call\s*emergency/.test(normalized);
  const isContactTrusted = /contact\s*(some\s*)?one\s*you\s*trust/.test(
    normalized,
  );

  const handleCall = async (phoneNumber) => {
    if (!phoneNumber) return;
    const url = `tel:${phoneNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      // No-op: if device can't place calls, silently ignore.
    }
  };

  const completionAnim = useRef(new Animated.Value(0)).current;

  const triggerStartAnimation = () => {
    completionAnim.setValue(0);
    Animated.timing(completionAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      completionAnim.setValue(0);
    });
  };

  const handleStartPress = () => {
    triggerStartAnimation();
    onStart?.();
  };

  return (
    <View style={styles.techDetailCard}>
      <View style={styles.techDetailHeaderRow}>
        <Text style={styles.techDetailTitle}>{technique}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close technique details"
          hitSlop={12}
          style={({ pressed }) => [
            styles.techDetailCloseButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="close" size={24} color="#ff0000ff" />
        </Pressable>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.techCompletionOverlay,
          {
            opacity: completionAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.9],
            }),
            transform: [
              {
                scale: completionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.techCompletionCheck}>✓</Text>
      </Animated.View>

      {isEmergencyService && (
        <>
          <Text style={styles.techDetailBody}>Emergency number: 1926</Text>
          <Pressable
            style={styles.callNowButton}
            onPress={() => handleCall("1926")}
          >
            <Text style={styles.callNowButtonText}>Call now</Text>
          </Pressable>
        </>
      )}

      {isContactTrusted && (
        <>
          <Text style={styles.techDetailBody}>
            Your emergency contact: {emergencyName ? `${emergencyName} ` : ""}
            {emergencyContact || "Not set"}
          </Text>
          <Pressable
            style={[
              styles.callNowButton,
              !emergencyContact && styles.callNowButtonDisabled,
            ]}
            onPress={() => handleCall(emergencyContact)}
            disabled={!emergencyContact}
          >
            <Text style={styles.callNowButtonText}>Call now</Text>
          </Pressable>
        </>
      )}

      {!isEmergencyService && !isContactTrusted && (
        <>
          <Text style={styles.techDetailBody}>
            {TECHNIQUE_DETAILS[technique] ||
              "This is a grounding or coping technique. You can try it gently and notice how your body responds."}
          </Text>

          {onStart && (
            <Pressable
              onPress={handleStartPress}
              accessibilityRole="button"
              accessibilityLabel="Start this technique now"
              style={({ pressed }) => [
                styles.startNowButton,
                pressed && styles.startNowButtonPressed,
              ]}
            >
              <Text style={styles.startNowButtonText}>Start now</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
