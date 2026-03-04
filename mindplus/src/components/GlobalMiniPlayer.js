import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useGlobalAudioPlayer } from "../context/GlobalAudioPlayerContext";

export default function GlobalMiniPlayer() {
  const navigation = useNavigation();
  const {
    showMiniPlayer,
    selectedTrack,
    isPlaying,
    progress,
    togglePlay,
    stopAndReset,
    closeMiniPlayer,
  } = useGlobalAudioPlayer();

  if (!showMiniPlayer || !selectedTrack) {
    return null;
  }

  const topOffset =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 52;

  return (
    <View pointerEvents="box-none" style={styles.overlayWrap}>
      <View style={[styles.container, { top: topOffset }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.mainTapArea}
          onPress={() => navigation.navigate("SoundscapeScreen")}
        >
          <View
            style={[
              styles.emojiBadge,
              { backgroundColor: selectedTrack.accent },
            ]}
          >
            <Text style={styles.emoji}>{selectedTrack.emoji}</Text>
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {selectedTrack.title}
            </Text>
            <Text style={styles.trackSubtitle} numberOfLines={1}>
              {isPlaying ? "Playing in background" : "Paused"}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={togglePlay}
            activeOpacity={0.85}
            style={styles.controlButton}
          >
            <Text style={styles.controlText}>{isPlaying ? "⏸" : "▶"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={stopAndReset}
            activeOpacity={0.85}
            style={styles.controlButton}
          >
            <Text style={styles.controlText}>⏹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={closeMiniPlayer}
            activeOpacity={0.85}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
  },
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: "#111827",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  mainTapArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  emojiBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  emoji: {
    fontSize: 18,
  },
  trackInfo: {
    flex: 1,
    paddingRight: 8,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 1,
  },
  trackSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#3B82F6",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: {
    fontSize: 14,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4338CA",
  },
});
