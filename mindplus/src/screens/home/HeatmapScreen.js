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
import BottomNavigation from "../../components/BottomNavigation.js";

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

    // console.log("function called");

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
      collection(db, "users", user.uid, "dailyCheckIns")
    );

    const historical = {};

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const key = docSnap.id; // assuming doc id = YYYY-MM-DD
      // Try to extract stress value from answers array
      let stressValue = 5; // Default
      if (data.answers && Array.isArray(data.answers)) {
        const stressAnswer = data.answers.find(
          a => a.questionId === "Today-Feeling" || a.question?.toLowerCase().includes("stress")
        );
        if (stressAnswer && stressAnswer.response) {
          const resp = stressAnswer.response.toLowerCase();
          if (resp.match(/very\s*stressed|extremely\s*stressed|overwhelmed|anxious|panic|tense|worried/)) {
            stressValue = 9;
          } else if (resp.match(/stressed|pressure|nervous|uneasy/)) {
            stressValue = 8;
          } else if (resp.match(/not\s*stressed|fine|okay|neutral/)) {
            stressValue = 5;
          } else if (resp.match(/calm|relaxed|happy|peaceful|good|content/)) {
            stressValue = 2;
          } else if (resp.match(/tired|exhausted/)) {
            stressValue = 4;
          }
        }
      }
      historical[key] = stressValue;
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

  const convertToScore = (questionId, response) => {
    if (!response) return null;

    const text = response.toLowerCase();

    if (questionId === "Mood-Check") {
      if (text.includes("very")) return 8;
      if (text.includes("stressed")) return 7;
      if (text.includes("okay")) return 5;
      return 4;
    }

    if (questionId === "Academic-Stress") {
      if (text.includes("very")) return 8;
      if (text.includes("high")) return 7;
      if (text.includes("moderate")) return 5;
      return 3;
    }

    if (questionId === "Motivation") {
      if (text.includes("high")) return 8;
      if (text.includes("medium")) return 5;
      if (text.includes("low")) return 3;
      return 4;
    }

    if (questionId === "Sleep") {
      const match = text.match(/\d+/);
      return match ? parseInt(match[0]) : 6;
    }

    return null;
  };

  const recalculateStress = async (dateString) => {
    // console.log("function called");
    const user = auth.currentUser;
    if (!user) return;

    try {
      const baselineSnap = await getDoc(
        doc(db, "users", user.uid, "baseline", "dass21")
      );

      const baselineData = baselineSnap.exists()
        ? baselineSnap.data()
        : null;


      const logsQuery = query(
        collection(db, "users", user.uid, "dailyCheckIns"),
        orderBy("timestamp", "desc"),
        limit(7)
      );

      const logsSnapshot = await getDocs(logsQuery);

      const recentLogs = logsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const answers = data.answers || [];

        const log = {
          stress_today: null,
          energy_level: null,
          sleep_hours: null,
          workload_intensity: null
        };

        answers.forEach((a) => {
          const score = convertToScore(a.questionId, a.response);

          if (a.questionId === "Mood-Check") log.stress_today = score;
          if (a.questionId === "Motivation") log.energy_level = score;
          if (a.questionId === "Sleep") log.sleep_hours = score;
          if (a.questionId === "Academic-Stress") log.workload_intensity = score;
        });

        return log;
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
        baseline: baselineData || null,
        recent_logs: recentLogs,
        previous_fingerprint: previousFingerprint || null,
        upcoming_events: upcomingEventsArray || []
      };

      // console.log(payload);

      const response = await fetch(`${API_BASE_URL}/api/fingerprint/evolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // console.log("Backend response:", data);

      if (
        data.status === "success" &&
        data.data.future_5_days &&
        data.data.future_5_days.future_5_days
      ) {

        const newPredictions = {};
        const today = new Date();

        data.data.future_5_days.future_5_days.forEach((value, index) => {
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
      console.log("Full error:", JSON.stringify(err));
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

          <LinearGradient
            colors={['#b3c6ddff', '#4895D0']}
            style={styles.hheader}
          >
            <View style={styles.headerContent}>
              <Text style={styles.title}>Stress Heatmap</Text>
              <Text style={styles.subtitle}>Track your stress patterns</Text>
            </View>
          </LinearGradient>
          
          <View style={styles.content}>
            <View style={styles.monthSelector}>

              <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthArrow}>
                <Ionicons name="chevron-back" size={22} color="#4F8EF7" />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {MONTH_NAMES[month]} {year}
              </Text>

              <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
                <Ionicons name="chevron-forward" size={22} color="#4F8EF7" />
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
              <ActivityIndicator
                size="small"
                color="#4F8EF7"
                style={{ marginVertical: 10 }}
              />
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

                // if ((hasPrediction && (isPastOrToday || isWithinForecastWindow))) {
                //   // const stressValue =
                //   //   (predictions[dateKey] || 0) + (isWithinForecastWindow ? totalWeight * 0.6 : 0);
                //   const stressValue = predictions[dateKey] || 0;

                //   const level = calculateStressLevel(stressValue, 0);
                //   stressColor = STRESS_COLORS[level];
                // }

                let isFuturePrediction = false;

                if (hasPrediction && (isPastOrToday || isWithinForecastWindow)) {

                  const stressValue = predictions[dateKey] || 0;
                  const level = calculateStressLevel(stressValue, 0);

                  stressColor = STRESS_COLORS[level];

                  if (isWithinForecastWindow) {
                    isFuturePrediction = true;
                  }
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
                        isToday && styles.todayBorder,
                        isFuturePrediction && styles.futurePrediction
                      ]}
                    >
                      <CalendarDay
                        day={day}
                        stressColor={stressColor}
                        hasEvents={events.length > 0}
                        onPress={() => openDay(day)}
                        activeOpacity={0.7}
                      />
                    </View>
                  </View>
                );

              })}
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#4CAF50" }]} />
                <Text style={styles.legendText}>Low Stress</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#FFC107" }]} />
                <Text style={styles.legendText}>Moderate Stress</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#F44336" }]} />
                <Text style={styles.legendText}>High Stress</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.futureLegend]} />
                <Text style={styles.legendText}>Predicted</Text>
              </View>
            </View>

            <View style={styles.todayMessageContainer}>
              <View
                style={[
                  styles.todayStressIndicator,
                  { backgroundColor: STRESS_COLORS[todayLevel] },
                ]}
              />
              <View style={{ flex: 1 }}>

                <Text style={styles.insightTitle}>
                  Today's Insight
                </Text>

                <Text style={styles.todayMessageText}>
                  {todayMessage}
                </Text>

              </View>
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
        <BottomNavigation navigation={navigation} />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 6
  },

  weekdayText: {
    width: "14.28%",
    textAlign: "center",
    fontWeight: "600",
    color: "#6B7A99",
    fontSize: 13
  },
  monthNav: {
    fontSize: 20,
    color: "#4F8EF7",
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#EAF2FF"
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  content: {
    padding: 22
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#4F8EF7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F8EF7",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2A44",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.4
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
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  todayMessageContainer: {
    marginTop: 22,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 6,
    borderLeftColor: "#b9d1fb"
  },

  todayStressIndicator: {
    width: 10,
    height: 46,
    borderRadius: 6,
    marginRight: 14
  },

  todayMessageText: {
    flex: 1,
    fontSize: 15,
    color: "#1F2A44",
    fontWeight: "500",
    lineHeight: 20
  },
  dayWrapper: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    padding: 3,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: "#4F8EF7",
    backgroundColor: "#EDF4FF",
    borderRadius: 15,
  },
  futurePrediction: {
    opacity: 0.6,
    borderWidth: 2,
    borderColor: "#7FB3FF",
    borderRadius: 15,
    padding: 2,
    borderStyle: "dashed",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 4
  },

  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 4,
    marginRight: 6
  },

  legendText: {
    fontSize: 12,
    color: "#6B7A99",
    fontWeight: "500"
  },

  futureLegend: {
    borderWidth: 2,
    borderColor: "#9d9eee",
    backgroundColor: "transparent",
    borderStyle: "dotted",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2A44",
    letterSpacing: 0.3
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#6B7A99",
    marginTop: 2
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },

  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2A44"
  },

  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F2F6FF",
    justifyContent: "center",
    alignItems: "center"
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F8EF7",
    marginBottom: 4
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffffff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffffff",
    fontWeight: "500",
  },
  hheader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginTop:10,
  },
});
