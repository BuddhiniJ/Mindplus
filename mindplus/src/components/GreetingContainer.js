// components/UserGreeting.js
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { avatars } from "../utils/avatars";

const UserGreeting = ({ prefix = "Hi" }) => {
  const [nickname, setNickname] = useState("User");
  const [avatarKey, setAvatarKey] = useState("avatar1");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const profileRef = doc(db, "users", user.uid, "profile", "basic");
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setNickname(data.nickname || "User");
          setAvatarKey(data.avatar || "avatar1");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image source={avatars[avatarKey]} style={styles.avatar} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>{`${prefix} ${nickname}!`}</Text>
        <Text style={styles.subtitle}>Welcome back</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#F3F4F6",
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    marginTop: 2,
  },
});

export default UserGreeting;