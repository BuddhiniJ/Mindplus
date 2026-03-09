import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import {
  SOUNDSCAPE_LIBRARY,
  useGlobalAudioPlayer,
} from "../../context/GlobalAudioPlayerContext";

export default function SoundscapeScreen({ navigation }) {
  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 18 : 14;

  const {
    selectedTrack,
    selectedId,
    isPlaying,
    minutes,
    progress,
    togglePlay,
    stopAndReset,
    resetPlayback,
    selectTrack,
    setSessionMinutes,
  } = useGlobalAudioPlayer();

  const soundscapes = SOUNDSCAPE_LIBRARY;
  const selected = selectedTrack || soundscapes[0];
  const progressWidth = `${Math.round(progress * 100)}%`;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={[styles.safe, { paddingTop: topPadding }]}>
        <View style={styles.headerShell}>
          <View style={styles.headerAuraOne} />
          <View style={styles.headerAuraTwo} />

          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerKicker}>IMMERSIVE AUDIO</Text>
              <Text style={styles.headerTitle}>Soundscape</Text>
            </View>

            <View style={styles.headerSideSpacer} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Stress Release</Text>
          <Text style={styles.heroSubtitle}>
            Pick a soundscape and take a few minutes to reset.
          </Text>
        </View>

        <View style={styles.nowPlayingCard}>
          <View style={styles.nowPlayingTop}>
            <View
              style={[
                styles.nowPlayingBadge,
                { backgroundColor: selected?.accent || "#EEF2FF" },
              ]}
            >
              <Text style={styles.nowPlayingEmoji}>
                {selected?.emoji || "🎧"}
              </Text>
            </View>
            <View style={styles.nowPlayingText}>
              <Text style={styles.nowPlayingTitle}>
                {selected?.title || "Track"}
              </Text>
              <Text style={styles.nowPlayingSubtitle}>
                {selected?.subtitle || ""}
              </Text>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>
                  {selected?.category || "Stress Relief"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={togglePlay}
              activeOpacity={0.9}
              style={[styles.playButton, isPlaying && styles.playButtonActive]}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? "Pause" : "Play"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={stopAndReset}
              activeOpacity={0.9}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetPlayback}
              activeOpacity={0.9}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Session</Text>
            <View style={styles.chipsRow}>
              {[5, 10, 15].map((m) => {
                const active = minutes === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSessionMinutes(m)}
                    activeOpacity={0.9}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {m}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.noteText}>
            Music keeps playing while you move through other pages. Use the top
            mini player controls from anywhere.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Soundscape</Text>
          <View style={styles.grid}>
            {soundscapes.map((s) => {
              const active = s.id === selectedId;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => selectTrack(s.id)}
                  activeOpacity={0.9}
                  style={[styles.tile, active && styles.tileActive]}
                >
                  <View
                    style={[styles.tileBadge, { backgroundColor: s.accent }]}
                  >
                    <Text style={styles.tileEmoji}>{s.emoji}</Text>
                  </View>
                  <Text style={styles.tileTitle}>{s.title}</Text>
                  <Text style={styles.tileCategory}>
                    {s.category || "Stress Relief"}
                  </Text>
                  <Text style={styles.tileSubtitle}>{s.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Quick reset</Text>
          <Text style={styles.footerText}>
            Breathe in for 4 seconds, out for 6 seconds. Repeat 5 times.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  safe: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerShell: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerAuraOne: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DBEAFE",
    top: -44,
    right: -22,
    opacity: 0.7,
  },
  headerAuraTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E0E7FF",
    bottom: -36,
    left: -18,
    opacity: 0.65,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 70,
  },
  backArrow: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "900",
    marginRight: 4,
  },
  backText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "800",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSideSpacer: {
    minWidth: 70,
  },
  headerKicker: {
    fontSize: 10,
    letterSpacing: 1,
    color: "#2563EB",
    fontWeight: "900",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },
  headerMeta: {
    minWidth: 52,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  headerMetaText: {
    fontSize: 12,
    color: "#3730A3",
    fontWeight: "900",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  hero: {
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    fontWeight: "600",
  },
  nowPlayingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  nowPlayingTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  nowPlayingBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nowPlayingEmoji: {
    fontSize: 22,
  },
  nowPlayingText: {
    flex: 1,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 2,
  },
  nowPlayingSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  categoryChip: {
    marginTop: 7,
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: 10,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  playButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  playButtonActive: {
    backgroundColor: "#2563EB",
  },
  playButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  sessionLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#374151",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipActive: {
    backgroundColor: "#EEF2FF",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
  },
  chipTextActive: {
    color: "#1D4ED8",
  },
  noteText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    lineHeight: 18,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  tile: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  tileActive: {
    borderColor: "#BFDBFE",
  },
  tileBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tileEmoji: {
    fontSize: 22,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 2,
  },
  tileCategory: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    lineHeight: 16,
  },
  footerCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    padding: 16,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    lineHeight: 18,
  },
});
