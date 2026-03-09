import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";

export default function ScreenHeaderCard({
  topPadding = 0,
  kicker,
  title,
  containerStyle,
}) {
  return (
    <SafeAreaView style={[styles.safe, { paddingTop: topPadding }, containerStyle]}>
      <View style={styles.headerShell}>
        <View style={styles.headerAuraOne} />
        <View style={styles.headerAuraTwo} />

        <View style={styles.headerCenter}>
          {!!kicker && <Text style={styles.headerKicker}>{kicker}</Text>}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  headerShell: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    backgroundColor: "#4f8df746",
    top: -44,
    right: -22,
    opacity: 0.7,
  },
  headerAuraTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#4f8df746",
    bottom: -36,
    left: -18,
    opacity: 0.65,
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerKicker: {
    fontSize: 10,
    letterSpacing: 1,
    color: "#2563EB",
    fontWeight: "900",
    marginBottom: 2,
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
});
