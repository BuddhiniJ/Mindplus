import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { avatars } from "../../utils/avatars";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { clearChatHistory } from "../../services/chatHistoryService";
import BottomNavigation from "../../components/BottomNavigation";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const profileRef = doc(db, "users", user.uid, "profile", "basic");
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      }
      setLoading(false);
    } catch (error) {
      console.error("Profile load error:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser?.uid) {
        await clearChatHistory(currentUser.uid);
      }
      await auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5FA1D5" />
      </View>
    );
  }

  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E9EAEB", "#D4E4F7", "#FFFFFF", "#E1F5FE"]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.container1}>
          <LinearGradient
            colors={['#b3c6ddff', '#4895D0']}
            style={styles.hheader}
          >
            <View style={styles.headerContent}>
              <Text style={styles.title}>My Proflie</Text>
              <Text style={styles.subtitle}></Text>

            </View>
          </LinearGradient>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={avatars[profile?.avatar || "avatar1"]}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.nickname}>{profile?.nickname || "User"}</Text>
            <Text style={styles.email}>{user?.email ?? "N/A"}</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("EditProfileScreen")}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color="#5FA1D5"
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Dass21Screen1")}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#5FA1D5"
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Retake Assessment</Text>
            </TouchableOpacity>


            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons
                name="exit-outline"
                size={24}
                color="#A52A2A"
                style={styles.menuIcon}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNavigation navigation={navigation} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#5FA1D5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#5FA1D5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#E3F2FD",
  },
  nickname: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
  },
  email: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
  },
  menuSection: {
    width: "90%",
    marginBottom: 100,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFDADA",
  },
  logoutText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
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
  container1: {
    flex: 1,
    paddingTop: 20,
  },
});
