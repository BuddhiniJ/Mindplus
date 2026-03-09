import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BottomNavigation({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Back */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={26} color="#4F8EF7" />
      </TouchableOpacity>

      {/* Home */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("HomeDashboardScreen")}
      >
        <Ionicons name="home" size={28} color="#4F8EF7" />
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("UserProfileScreen")}
      >
        <Ionicons name="person" size={26} color="#4F8EF7" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    height: 70,
    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderColor: "#E6EEFF",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,

    paddingBottom: 8
  },

  button: {
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F6FF"
  }

});