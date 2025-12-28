import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

export default function MenuScreen({ navigation }) {
  const menuItems = [
    { title: "🏠 Home", screen: "Home" },
    { title: "📊 Dashboard", screen: "HomeDashboardScreen" },
    { title: "🧠 Stress Heatmap", screen: "HeatmapScreen" },
    { title: "🎤 Voice Journal", screen: "VoiceRecorderScreen" },
    { title: "👤 Profile", screen: "UserProfileScreen" },
    { title: "⚙️ Settings", screen: "SettingsScreen" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <Text style={styles.headerSubtitle}>Navigate your app</Text>
      </View>

      {/* Menu Items */}
      <ScrollView contentContainerStyle={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuText}>{item.title}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#EEF2FF",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  menuList: {
    padding: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  arrow: {
    fontSize: 22,
    color: "#9CA3AF",
  },
};
