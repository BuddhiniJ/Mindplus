import { View, Text, TouchableOpacity } from "react-native";

export default function DailyQuestions({ navigation }) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Daily Questions Coming Soon...</Text>

            <TouchableOpacity
                onPress={() => navigation.navigate("HomeDashboardScreen")}
                activeOpacity={0.8}
            >
                
                <Text>→</Text>
            </TouchableOpacity>
        </View>
    );
}
