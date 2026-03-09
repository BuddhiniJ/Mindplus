import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },
  containerDark: {
    backgroundColor: "#020617",
  },
  containerForest: {
    backgroundColor: "#022c22",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 20,
    backgroundColor: "#3B82F6",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  headerDark: {
    backgroundColor: "#020617",
  },
  headerForest: {
    backgroundColor: "#064e3b",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 0,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#ffffffff",
    marginBottom: 0,
  },
  backContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    color: "#000000ff",
    fontWeight: "600",
    letterSpacing: 0.4,
    lineHeight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 0,
  },
  dailyQuoteCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: 14,
    backgroundColor: "#FCE7F3",
    borderWidth: 1,
    borderColor: "#F9A8D4",
  },
  dailyQuoteLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3B82F6",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 100,
    marginTop: 2,
  },
  dailyQuoteText: {
    fontSize: 14,
    color: "#9D174D",
    lineHeight: 20,
    marginLeft: 0,
    fontWeight: "600",
  },
  dailyQuoteAuthor: {
    marginTop: -2,
    fontSize: 12,
    color: "#6a6d72",
    fontStyle: "italic",
  },
  resourcesCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  resourcesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 4,
  },
  resourcesSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
    marginBottom: 10,
  },
  resourceSection: {
    marginTop: 6,
  },
  resourceSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  resourceCard: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  resourceTipCard: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
  },
  resourceButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  resourcePrimaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#3B82F6",
  },
  resourcePrimaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resourceSecondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#E0E7FF",
  },
  resourceSecondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  criticalAlertCard: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#F87171",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 20,
  },
  criticalAlertTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 6,
  },
  criticalAlertBody: {
    fontSize: 13,
    color: "#7F1D1D",
    marginBottom: 10,
  },
  criticalContactSection: {
    marginTop: 6,
  },
  criticalContactLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7F1D1D",
  },
  criticalContactValue: {
    fontSize: 13,
    color: "#7F1D1D",
    marginTop: 2,
    marginBottom: 6,
  },
  criticalButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  criticalButtonPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#DC2626",
  },
  criticalButtonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  criticalButtonSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FECDD3",
  },
  criticalButtonSecondaryText: {
    color: "#7F1D1D",
    fontSize: 13,
    fontWeight: "600",
  },
  criticalCopingRow: {
    marginTop: 10,
  },
  criticalCopingLabel: {
    fontSize: 12,
    color: "#7F1D1D",
    marginBottom: 4,
  },
  criticalCopingButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  criticalCopingChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFE4E6",
  },
  criticalCopingChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9F1239",
  },
  criticalAcknowledgeButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: "flex-start",
    backgroundColor: "#F97316",
  },
  criticalAcknowledgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  botIcon: {
    width: 50,
    height: 50,
    borderRadius: 40,
    marginRight: 20,
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 80,
  },
  messagesContainerCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 260,
  },
  instructionsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#7DD3FC",
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0369A1",
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: "#0F172A",
    lineHeight: 19,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    dailyQuoteCard: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: "#EFF6FF",
      borderWidth: 1,
      borderColor: "#BFDBFE",
    },
    dailyQuoteLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#3B82F6",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dailyQuoteText: {
      fontSize: 14,
      color: "#0F172A",
      lineHeight: 20,
    },
    dailyQuoteAuthor: {
      marginTop: 4,
      fontSize: 12,
      color: "#64748B",
      fontStyle: "italic",
    },
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#6366F1",
    borderTopRightRadius: 6,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderTopLeftRadius: 6,
  },
  criticalBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderTopLeftRadius: 6,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    color: "#6B7280",
  },
  messageText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  messageTextLarge: {
    fontSize: 17,
  },
  metaContainer: {
    marginTop: 14,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(229,231,235,0.8)",
  },

  metaText: {
    fontSize: 12,
    color: "#64748B",
    letterSpacing: 0.3,
    fontWeight: "500",
  },

  metaChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },

  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: "#128fe3ff",

    // Soft elevation
    shadowColor: "#0284C7",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,

    // Border for crisp look
    borderWidth: 1,
    borderColor: "rgba(2,132,199,0.25)",
  },

  metaChipLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#020202ff",
    marginRight: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  metaChipValue: {
    fontSize: 12,
    color: "#ffffffff",
    fontWeight: "600",
  },

  techniquesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  techChip: {
    backgroundColor: "#FBCFE8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  techChipText: {
    fontSize: 11,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  autoVoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  autoVoiceLabel: {
    fontSize: 12,
    color: "#4B5563",
    marginRight: 8,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  settingsThemeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  settingsThemePill: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  settingsThemePillActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  settingsThemePillLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  settingsThemePillLabelActive: {
    color: "#FFFFFF",
  },
  voiceRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E0ECFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  voiceButtonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    margin: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  statusCard: {
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12, // slightly bigger, modern rounded corners
    borderWidth: 0, // remove border for cleaner look
    backgroundColor: "#000000ff", // white card background
    shadowColor: "#000", // subtle shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, // Android shadow
  },

  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14, // slightly bigger
    fontWeight: "700", // bolder for emphasis
    marginBottom: 4,
    color: "#ffffffff", // darker text, modern gray-blue
    textAlign: "left",
  },
  statusPercentText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffffff",
  },
  statusSubLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  statusBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  statusBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  promptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promptChip: {
    width: "32%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 2,
  },
  promptChipText: {
    fontSize: 11,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },
  promptChipPressed: {
    transform: [{ scale: 0.97 }],
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  techDetailCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 22,

    // Soft calming background
    backgroundColor: "#F8FAFF",

    // Gentle border
    borderWidth: 1,
    borderColor: "#E2E8F0",

    // Premium floating shadow
    shadowColor: "#1E293B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  techCompletionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56,189,248,0.06)",
  },

  techCompletionCheck: {
    fontSize: 40,
    color: "#22C55E",
    fontWeight: "700",
  },

  /* =======================
     HEADER
  ======================= */
  techDetailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 12,

    // Soft divider
    borderBottomWidth: 1,
    borderBottomColor: "#E5EDFF",
  },

  techDetailTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,

    // Calm dark-blue (not harsh black)
    color: "#1E3A8A",

    fontFamily: "System",
  },

  /* =======================
     CLOSE BUTTON
  ======================= */
  techDetailCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",

    // Frosted light background
    backgroundColor: "#EEF2FF",

    borderWidth: 1,
    borderColor: "#C7D2FE",

    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },

  techDetailCloseIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4F46E5",
  },

  /* =======================
     BODY TEXT
  ======================= */
  techDetailBody: {
    fontSize: 14,
    lineHeight: 22,

    // Warm gray for stress-friendly reading
    color: "#475569",

    letterSpacing: -0.1,
    marginTop: 6,
    fontFamily: "System",
  },

  /* =======================
     CALL NOW BUTTON
  ======================= */
  callNowButton: {
    marginTop: 22,
    paddingVertical: 15,
    borderRadius: 18,

    // Primary calm blue
    backgroundColor: "#ff0000ff",

    alignItems: "center",

    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  callNowButtonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
  },

  callNowButtonDisabled: {
    backgroundColor: "#f50000ff",
    shadowOpacity: 0.05,
  },

  callNowButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontFamily: "System",
  },

  // Optional: Add a subtle icon to the button
  callNowButtonIcon: {
    marginRight: 8,
    fontSize: 16,
  },

  /* =======================
     START NOW BUTTON (TECHNIQUE)
  ======================= */
  startNowButton: {
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",

    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },

  startNowButtonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
  },

  startNowButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    fontFamily: "System",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  typingBubble: {
    opacity: 0.9,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6B7280",
  },
  typingDotsContainer: {
    flexDirection: "row",
    marginLeft: 6,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9CA3AF",
    marginHorizontal: 2,
  },
  emergencyContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(239,68,68,0.3)",
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B91C1C",
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 12,
    color: "#7F1D1D",
    marginBottom: 2,
  },
  emergencyCallButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: "flex-start",
    backgroundColor: "#DC2626",
  },
  emergencyCallButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  messageTimestamp: {
    marginTop: 4,
    fontSize: 10,
    color: "#9CA3AF",
    alignSelf: "flex-end",
  },
  commandsRow: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    alignItems: "flex-end",
  },
  commandsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E0E7FF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  commandsButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3730A3",
  },
  commandsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  commandsModalCard: {
    maxHeight: "70%",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  commandsModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  commandsModalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
  },
  commandsList: {
    marginBottom: 12,
  },
  commandItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    marginBottom: 8,
  },
  commandItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  commandItemDescription: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  commandsCloseButton: {
    marginTop: 6,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#6366F1",
  },
  commandsCloseButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  settingsScroll: {
    marginTop: 4,
    marginBottom: 4,
  },
  settingsScrollContent: {
    paddingBottom: 8,
  },
  settingsActionButton: {
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  settingsActionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  settingsDangerButton: {
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    marginHorizontal: 4,
  },
  settingsDangerButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B91C1C",
    textAlign: "center",
  },
});

export default styles;
