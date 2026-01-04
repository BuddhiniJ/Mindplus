import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import styles from "./chatbotStyles";
import { Ionicons } from "@expo/vector-icons";

export default function ChatHeader({ onBack }) {
  return (
    <View style={styles.header}>
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
