import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import CalendarDay from "../../components/CalanderDay";
import DayDetailModal from "../../components/DayDetailModal";
import { getDaysInMonth } from "../../utils/heatmapUtils";
import { auth, db } from "../../firebase/firebaseConfig";
import { collection, addDoc, query, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

const saveEvent = async (event) => {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(
    collection(db, "users", user.uid, "calendarEvents"),
    {
      ...event,
      createdAt: Date.now(),
    }
  );
};

export default function HeatmapScreen({ navigation }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventsByDate, setEventsByDate] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const openDay = (day) => {
    const dateString = `${year}-${month + 1}-${day}`;
    setSelectedDate(dateString);
    setModalVisible(true);
  };

  const handleAddEvent = (event) => {
    setEventsByDate((prev) => {
      const existing = prev[event.date] || [];
      return {
        ...prev,
        [event.date]: [...existing, event],
      };
    });

    saveEvent(event);
  };

  const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const formatDateKey = (y, m, d) => `${y}-${m + 1}-${d}`;

  const fetchEventsForMonth = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoadingEvents(true);

    try {
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "calendarEvents")
      );

      const grouped = {};

      snapshot.forEach((doc) => {
        const event = doc.data();
        const [y, m, d] = event.date.split("-").map(Number);

        if (y === year && m === month + 1) {
          const key = `${y}-${m}-${d}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: doc.id, ...event });
        }
      });

      setEventsByDate(grouped);
    } catch (err) {
      console.error("Error fetching events:", err);
    }

    setLoadingEvents(false);
  };

  useEffect(() => {
    fetchEventsForMonth();
  }, [month, year]);

  const updateEvent = async (eventId, updatedData) => {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(
      doc(db, "users", user.uid, "calendarEvents", eventId),
      updatedData
    );
  };

  const deleteEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(
      doc(db, "users", user.uid, "calendarEvents", eventId)
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Header with Title and Today Button */}
          <View style={styles.header}>
            <Text style={styles.title}>Calendar</Text>
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>◀</Text>
            </TouchableOpacity>

            <Text style={styles.monthYear}>
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </Text>

            <TouchableOpacity
              onPress={goToNextMonth}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loadingEvents && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          )}

          {/* Week Days Header */}
          <View style={styles.weekDaysContainer}>
            {WEEK_DAYS.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Empty cells */}
            {[...Array(startOffset)].map((_, i) => (
              <View key={`empty-${i}`} style={styles.emptyCell} />
            ))}

            {/* Actual days */}
            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              const dateKey = `${year}-${month + 1}-${day}`;
              const hasEvents = (eventsByDate[dateKey] || []).length > 0;
              const eventCount = (eventsByDate[dateKey] || []).length;

              return (
                <CalendarDay
                  key={day}
                  day={day}
                  hasEvents={hasEvents}
                  eventCount={eventCount}
                  isToday={isToday(day)}
                  onPress={() => openDay(day)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>

      <DayDetailModal
        visible={modalVisible}
        date={selectedDate}
        events={eventsByDate[selectedDate] || []}
        onAddEvent={async (event) => {
          await saveEvent(event);
          fetchEventsForMonth();
        }}
        onUpdateEvent={async (id, data) => {
          await updateEvent(id, data);
          fetchEventsForMonth();
        }}
        onDeleteEvent={async (id) => {
          await deleteEvent(id);
          fetchEventsForMonth();
        }}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    marginTop : 48,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  todayButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  todayButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 20,
    color: "#374151",
    fontWeight: "600",
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "500",
  },
  weekDaysContainer: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCell: {
    width: "14.28%",
    height: 50,
  },
  summaryContainer: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  summaryText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    fontWeight: "600",
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
});