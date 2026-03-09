import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import styles from "./chatbotStyles";
import { Ionicons } from "@expo/vector-icons";

export default function ChatHeader({ onBack, onSettings, theme = "calm" }) {
  const headerThemeStyle =
    theme === "dark"
      ? styles.headerDark
      : theme === "forest"
        ? styles.headerForest
        : null;

  return (
    <View style={[styles.header, headerThemeStyle]}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 20, left: 0, right: 10 }}
        >
          <View style={styles.backContent}>
            <Ionicons
              name="chevron-back"
              size={14}
              style={{ marginLeft: -4 }}
              color="#000000ff"
            />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>

        {onSettings && (
          <TouchableOpacity
            onPress={onSettings}
            activeOpacity={0.7}
            style={styles.settingsButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={18} color="#1E3A8A" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>MindPlus Assistant</Text>
          <Text style={styles.headerSubtitle}>You’re safe to talk here</Text>
        </View>
        <Image
          source={require("../../../assets/bot3.jpg")}
          style={styles.botIcon}
        />
      </View>
    </View>
  );
}
