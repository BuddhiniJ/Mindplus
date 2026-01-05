import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

export default function CalendarDay({
  day,
  onPress,
  hasEvents,
  isToday,
  eventCount,
  stressColor
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.dayCircle,
          { backgroundColor: stressColor || "transparent", opacity: stressColor === "transparent" ? 1 : 0.9 },
          isToday && styles.todayCircle,
        ]}
      >
        <Text style={styles.dayText}>{day}</Text>
      </View>

      {hasEvents && (
        <View style={styles.dot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 6,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  dayText: {
    fontWeight: "600",
    color: "#111827",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6366F1",
    marginTop: 4,
  },
});
