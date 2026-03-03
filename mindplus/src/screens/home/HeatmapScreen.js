import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import CalendarDay from "../../components/CalanderDay";
import DayDetailModal from "../../components/DayDetailModal";
import { getDaysInMonth } from "../../utils/heatmapUtils";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  orderBy,
  limit,
  query
} from "firebase/firestore";
import {
  STRESS_COLORS,
  calculateStressLevel,
  getTodayMessage,
} from "../../utils/heatmapUtils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from "../../config/api.js";

export default function HeatmapScreen({ navigation }) {
  // Month names for display
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventsByDate, setEventsByDate] = useState({});
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  // Calculate the weekday index of the first day (0=Sunday, 1=Monday, ...)
  // Adjust for week starting on Sunday (0) or Monday (1)
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon, ...

  const formatDate = (y, m, d) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchEvents = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    const snapshot = await getDocs(
      collection(db, "users", user.uid, "calendarEvents")
    );

    const grouped = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const key = data.date; // already YYYY-MM-DD

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ id: docSnap.id, ...data });
    });

    setEventsByDate(grouped);
    // console.log("Grouped events:", grouped);
    setLoading(false);
  };


  const fetchPredictions = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "stressData", monthKey);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      setPredictions(snapshot.data().dailyPredictions || {});
    } else {
      setPredictions({});
    }
  };

  const fetchPastLogs = async () => {
    // console.log("function called");
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await getDocs(
      collection(db, "users", user.uid, "daily_logs")
    );

    const historical = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const key = docSnap.id; // assuming doc id = YYYY-MM-DD
      // console.log("Daily log doc:", docSnap.id, data);
      historical[key] = data.stress_today;
    });

    setPredictions((prev) => ({
      ...historical,
      ...prev, // keep future predictions too
    }));
  };


  useEffect(() => {
    const init = async () => {
      await fetchEvents();
      await fetchPredictions();
      await fetchPastLogs();

      // Recalculate for today on initial load
      const today = new Date();
      const todayKey = formatDate(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      await recalculateStress(todayKey);
    };

    init();
  }, [month, year]);


  const saveEvent = async (event) => {
    const user = auth.currentUser;
    if (!user) return;

    const eventWithImportance = {
      ...event,
      importance: event.importance ?? 5, // default to medium if missing
      createdAt: Date.now(),
    };

    await addDoc(
      collection(db, "users", user.uid, "calendarEvents"),
      eventWithImportance
    );

    // console.log("Saved event:", eventWithImportance);

    await recalculateStress(event.date);
    fetchEvents();
  };


  const updateEvent = async (id, updatedData) => {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(
      doc(db, "users", user.uid, "calendarEvents", id),
      updatedData
    );

    await recalculateStress(updatedData.date);
    fetchEvents();
  };

  const deleteEvent = async (id, date) => {
    const user = auth.currentUser;
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "calendarEvents", id));

    await recalculateStress(date);
    fetchEvents();
  };

  const recalculateStress = async (dateString) => {
    // console.log("function called");
    const user = auth.currentUser;
    if (!user) return;

    try {

      // const data = await response.json();
      // console.log("Backend response:", data);

      const baselineSnap = await getDoc(
        doc(db, "users", user.uid, "baseline", "dass21")
      );

      const baselineData = baselineSnap.exists()
        ? baselineSnap.data()
        : null;


      const logsQuery = query(
        collection(db, "users", user.uid, "daily_logs"),
        orderBy("timestamp", "desc"),
        limit(7)
      );

      const logsSnapshot = await getDocs(logsQuery);
      const recentLogs = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          stress_today: data.stress_today,
          energy_level: data.energy_level,
          sleep_hours: data.sleep_hours,
          workload_intensity: data.workload_intensity
        };
      });


      const fingerprintSnap = await getDoc(
        doc(db, "users", user.uid, "fingerprint", "current")
      );

      let previousFingerprint = null;

      if (fingerprintSnap.exists()) {
        const fpData = fingerprintSnap.data();

        // Remove updatedAt before sending to backend
        const { updatedAt, ...cleanFingerprint } = fpData;
        previousFingerprint = cleanFingerprint;
      }

      const upcomingEventsArray = [];

      for (let i = 1; i <= 5; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);

        const key = formatDate(
          futureDate.getFullYear(),
          futureDate.getMonth(),
          futureDate.getDate()
        );

        const events = eventsByDate[key] || [];

        events.forEach((event) => {
          upcomingEventsArray.push({
            days_ahead: i,
            importance: event.importance || 1,
          });
        });
      }


      const payload = {
        baseline: baselineData,
        recent_logs: recentLogs,
        previous_fingerprint: previousFingerprint,
        upcoming_events: upcomingEventsArray
      };

      const response = await fetch(`${API_BASE_URL}/api/fingerprint/evolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(payload);

      const data = await response.json();

      if (data.status === "success" && data.data.future_5_days) {

        const newPredictions = {};

        const today = new Date();

        data.data.future_5_days.forEach((value, index) => {
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + index + 1);

          const key = formatDate(
            futureDate.getFullYear(),
            futureDate.getMonth(),
            futureDate.getDate()
          );

          newPredictions[key] = value;
        });

        setPredictions((prev) => ({
          ...prev,
          ...newPredictions,
        }));
      }
    } catch (err) {
      console.log("Recalculation failed:", err);
    }
  };


  // Calculate today's stress and level exactly as used for calendar color
  const today = new Date();
  const todayKey = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayEvents = eventsByDate[todayKey] || [];
  const todayWeight = todayEvents.reduce(
    (sum, e) => sum + (e.importance || 1),
    0
  );
  const hasPrediction = predictions[todayKey] !== undefined;
  let todayStress = 0;
  if (hasPrediction) {
    // For today, calendar color uses only predictions[todayKey] (no event weight)
    todayStress = predictions[todayKey] || 0;
  }
  const todayLevel = calculateStressLevel(todayStress, 0);
  const todayMessage = getTodayMessage(todayLevel, todayWeight);

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));

  const goToNextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const openDay = (day) => {
    setSelectedDate(formatDate(year, month, day));
    setModalVisible(true);
  };



  return (
    <>
      <LinearGradient
        colors={['#E9EAEB', '#D4E4F7', '#FFFFFF', '#E1F5FE']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView style={styles.container}>
          <View style={styles.content}>

            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.header}>

              <TouchableOpacity onPress={goToPreviousMonth}>
                <Text style={styles.monthNav}>{"<"}</Text>
              </TouchableOpacity>

              <Text style={styles.title}>
                {MONTH_NAMES[month]} {year}
              </Text>

              <TouchableOpacity onPress={goToNextMonth}>
                <Text style={styles.monthNav}>{">"}</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday names row */}
            <View style={styles.weekdaysRow}>
              {WEEKDAY_NAMES.map((wd) => (
                <Text key={wd} style={{
                  width: "14.28%",
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#6366F1',
                  fontSize: 15,
                }}>{wd}</Text>
              ))}
            </View>

            {loading && (
              <ActivityIndicator size="small" color="#6366F1" />
            )}

            <View style={styles.calendarGrid}>
              {/* Add empty cells for alignment so the 1st lands on the correct weekday */}
              {Array(firstDayOfWeek).fill(null).map((_, idx) => (
                <View
                  key={`empty-${idx}`}
                  style={{
                    width: "14.28%",
                    aspectRatio: 1,
                  }}
                />
              ))}
              {[...Array(daysInMonth)].map((_, index) => {
                const day = index + 1;
                const dateKey = formatDate(year, month, day);

                const isToday =
                  dateKey ===
                  formatDate(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                  );

                const events = eventsByDate[dateKey] || [];
                const totalWeight = events.reduce(
                  (sum, e) => sum + (e.importance || 1),
                  0
                );

                let stressColor = null;

                const hasPrediction = predictions[dateKey] !== undefined;
                const hasEvent = totalWeight > 0;

                // const today = new Date();
                const currentDateObj = new Date(year, month, day);

                const diffDays = Math.ceil(
                  (currentDateObj - today) / (1000 * 60 * 60 * 24)
                );

                // Allow:
                // 1. Past days
                // 2. Today
                // 3. Next 5 days
                const isPastOrToday = diffDays <= 0;
                const isWithinForecastWindow = diffDays > 0 && diffDays <= 5;

                if ((hasPrediction && (isPastOrToday || isWithinForecastWindow))) {
                  // const stressValue =
                  //   (predictions[dateKey] || 0) + (isWithinForecastWindow ? totalWeight * 0.6 : 0);
                  const stressValue = predictions[dateKey] || 0;

                  const level = calculateStressLevel(stressValue, 0);
                  stressColor = STRESS_COLORS[level];
                }

                // return (
                //   <View
                //     key={day}
                //     style={{
                //       width: "14.28%",
                //       aspectRatio: 1,
                //       justifyContent: "center",
                //       alignItems: "center",
                //     }}
                //   >
                //     <CalendarDay
                //       key={day}
                //       day={day}
                //       stressColor={stressColor}
                //       hasEvents={events.length > 0}
                //       onPress={() => openDay(day)}
                //     />
                //   </View>

                // );

                return (
                  <View
                    key={day}
                    style={{
                      width: "14.28%",
                      aspectRatio: 1,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={[
                        styles.dayWrapper,
                        isToday && styles.todayBorder
                      ]}
                    >
                      <CalendarDay
                        day={day}
                        stressColor={stressColor}
                        hasEvents={events.length > 0}
                        onPress={() => openDay(day)}
                      />
                    </View>
                  </View>
                );

              })}
            </View>

            <View style={styles.todayMessageContainer}>
              <View
                style={[
                  styles.todayStressIndicator,
                  { backgroundColor: STRESS_COLORS[todayLevel] },
                ]}
              />
              <Text style={styles.todayMessageText}>
                {todayMessage}
              </Text>
            </View>
          </View>
        </ScrollView>

        <DayDetailModal
          visible={modalVisible}
          date={selectedDate}
          events={eventsByDate[selectedDate] || []}
          onAddEvent={saveEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={(id) =>
            deleteEvent(id, selectedDate)
          }
          onClose={() => setModalVisible(false)}
        />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
    marginLeft: 2,
  },
  weekdayText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#6366F1',
    fontSize: 15,
    marginRight: 2,
  },
  monthNav: {
    fontSize: 22,
    color: '#6366F1',
    fontWeight: 'bold',
    marginHorizontal: 8,
    marginTop: 20,
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#22223B',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#A3CEF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  todayButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 8,
  },
  todayButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
    justifyContent: 'flex-start',
  },
  todayMessageContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayStressIndicator: {
    width: 12,
    height: 48,
    borderRadius: 6,
    marginRight: 16,
  },
  todayMessageText: {
    flex: 1,
    fontSize: 16,
    color: '#22223B',
    marginTop: 0,
    fontWeight: '500',
  },
  dayWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },

  todayBorder: {
    borderWidth: 3,
    borderColor: "#6366F1", // matches your theme
    borderRadius: 50,
    // padding: 2,
  },
});
