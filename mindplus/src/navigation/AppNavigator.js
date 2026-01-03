import { createStackNavigator } from "@react-navigation/stack";
import Dass21Screen1 from "../screens/onboarding/Dass21Screen1";
import Dass21Screen2 from "../screens/onboarding/Dass21Screen2";
import Dass21Screen3 from "../screens/onboarding/Dass21Screen3";
import Dass21Summary from "../screens/onboarding/Dass21Summary";
import RegisterScreen from "../screens/auth/RegisterScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import AuthCheckScreen from "../screens/auth/AuthCheckScreen.js";
import FinalProcessingScreen from "../screens/onboarding/FinalProcessingScreen";
import HomeDashboardScreen from "../screens/home/HomeDashboardScreen";
import UserProfileScreen from "../screens/profile/UserProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import HeatmapScreen from "../screens/home/HeatmapScreen.js";
import DailyCheckInScreen from "../screens/home/DailyCheckInScreen.js";
import MenuScreen from "../screens/home/menu.js";
import VoiceRecorderScreen from "../components/VoiceRecorder.js";
import ChatbotScreen from "../screens/home/ChatbotScreen";

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="AuthCheckScreen" component={AuthCheckScreen} />
      <Stack.Screen name="Dass21Screen1" component={Dass21Screen1} />
      <Stack.Screen name="Dass21Screen2" component={Dass21Screen2} />
      <Stack.Screen name="Dass21Screen3" component={Dass21Screen3} />
      <Stack.Screen name="Dass21Summary" component={Dass21Summary} />
      <Stack.Screen
        name="FinalProcessingScreen"
        component={FinalProcessingScreen}
      />
      <Stack.Screen
        name="HomeDashboardScreen"
        component={HomeDashboardScreen}
      />
      <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
      <Stack.Screen name="HeatmapScreen" component={HeatmapScreen} />
      <Stack.Screen name="DailyCheckInScreen" component={DailyCheckInScreen} />
      <Stack.Screen name="MenuScreen" component={MenuScreen} />
      <Stack.Screen
        name="VoiceRecorderScreen"
        component={VoiceRecorderScreen}
      />
      <Stack.Screen name="ChatbotScreen" component={ChatbotScreen} />
    </Stack.Navigator>
  );
}
