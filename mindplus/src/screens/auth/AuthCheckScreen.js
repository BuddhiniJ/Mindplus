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

      // Check if fingerprint exists
      const fingerprintRef = doc(db, "users", uid, "fingerprint", "current");
      const fingerprintDoc = await getDoc(fingerprintRef);

      if (fingerprintDoc.exists()) {
        console.log("Fingerprint found. Redirect → Dashboard");
        navigation.replace("DailyCheckInScreen");
      } else {
        console.log("No fingerprint. Redirect → Onboarding (DASS-21)");
        navigation.replace("Dass21Screen1");
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
