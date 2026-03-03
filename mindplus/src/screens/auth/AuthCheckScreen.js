import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

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

      // 2️⃣ Check if today's log exists
      const today = new Date().toLocaleDateString("en-CA");

      const todayLogRef = doc(db, "users", uid, "daily_logs", today);
      const todayLogDoc = await getDoc(todayLogRef);

      if (todayLogDoc.exists()) {
        // Already submitted today → go to dashboard
        navigation.replace("DailyCheckInScreen");
      } else {
        // Not submitted yet → allow check-in
        navigation.replace("DailyLogsScreen");
      }

    } catch (error) {
      console.log("AuthCheck error:", error);
    }
  };

  return (
    <View style={{
      flex: 1, justifyContent: "center", alignItems: "center"
    }}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={{ marginTop: 20 }}>Loading...</Text>
    </View>
  );
}
