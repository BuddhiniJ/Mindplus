import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

export default function CalendarDay({ day, onPress, hasEvents, isToday, eventCount }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={[
        styles.dayCircle,
        isToday && styles.todayCircle,
        hasEvents && !isToday && styles.hasEventsCircle,
      ]}>
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
        ]}>
          {day}
        </Text>
      </View>

      {/* Event indicator */}
      {hasEvents && (
        <View style={styles.eventIndicatorContainer}>
          {eventCount > 0 && eventCount <= 3 ? (
            // Show dots for 1-3 events
            <View style={styles.dotsContainer}>
              {[...Array(Math.min(eventCount, 3))].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.eventDot,
                    isToday && styles.todayEventDot,
                  ]}
                />
              ))}
            </View>
          ) : eventCount > 3 ? (
            // Show count badge for 4+ events
            <View style={[
              styles.countBadge,
              isToday && styles.todayCountBadge,
            ]}>
              <Text style={[
                styles.countText,
                isToday && styles.todayCountText,
              ]}>
                {eventCount}
              </Text>
            </View>
          ) : (
            // Fallback single dot
            <View style={[
              styles.eventDot,
              isToday && styles.todayEventDot,
            ]} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  todayCircle: {
    backgroundColor: "#EEF2FF",
    shadowColor: "#f1f1f1ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
//   hasEventsCircle: {
//     backgroundColor: "#EEF2FF",
//   },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  todayText: {
    color: "#374151",
    fontWeight: "700",
  },
  eventIndicatorContainer: {
    position: "absolute",
    bottom: 4,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6366F1",
  },
  todayEventDot: {
    backgroundColor: "#6366F1",
  },
  countBadge: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCountBadge: {
    backgroundColor: "#6366F1",
  },
  countText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  todayCountText: {
    color: "#10B981",
  },
});