import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

const formatDateKey = (date) => date.toISOString().slice(0, 10);

export default function AuthCheckScreen({ navigation }) {
  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigation.replace("LoginScreen");
        return;
      }

      const uid = user.uid;

      // 1️⃣ Check baseline
      const baselineRef = doc(db, "users", uid, "baseline", "dass21");
      const baselineDoc = await getDoc(baselineRef);

      if (!baselineDoc.exists()) {
        navigation.replace("Dass21Screen1");
        return;
      }

      // Check last check-in date
      const checkInsRef = collection(db, "users", uid, "dailyCheckIns");
      const q = query(checkInsRef, orderBy("date", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let missedDays = 0;
      if (!querySnapshot.empty) {
        const lastCheckIn = querySnapshot.docs[0].data();
        const lastDateStr = lastCheckIn.date;
        if (lastDateStr) {
          const lastDate = new Date(lastDateStr);
          const todayDate = new Date(formatDateKey(new Date()));
          const diffTime = Math.abs(todayDate - lastDate);
          missedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } else {
          missedDays = -1;
        }
      } else {
        missedDays = -1; // No previous check-in found
      }

      if (missedDays >= 2 || missedDays === -1) {
        navigation.replace("DailyCheckInScreen", {
          showWarning: true,
          missedDays,
        });
      } else {
        // Checked in recently -> allow check-in or show dashboard
        navigation.replace("DailyCheckInScreen");
      }
    } catch (error) {
      console.log("AuthCheck error:", error);
      navigation.replace("DailyCheckInScreen");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={{ marginTop: 20 }}>Loading...</Text>
    </View>
  );
}
