import "dotenv/config";

export default {
  expo: {
    name: "MindPlus",
    slug: "mindplus",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/Logo.jpeg",
    userInterfaceStyle: "light",
    newArchEnabled: true,

    splash: {
      image: "./assets/Logo.jpeg",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: true,
    },

    android: {
      // package: "com.mindplus.app",
      adaptiveIcon: {
        foregroundImage: "./assets/Logo.jpeg",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },

    web: {
      favicon: "./assets/Logo.jpeg",
    },
    plugins: [
      "expo-font",
      [
        "@react-native-voice/voice",
        {
          microphonePermission:
            "Allow Mindplus to access the microphone for voice messages",
          speechRecognitionPermission:
            "Allow Mindplus to convert your speech to text for the chatbot",
        },
      ],
    ],
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
          // eas: {
          //   projectId: "9cd644d1-b5e2-4d82-ac00-11956fdd1ba9",
          // },
    },
  },
};
