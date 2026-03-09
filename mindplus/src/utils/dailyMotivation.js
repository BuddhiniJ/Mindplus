import AsyncStorage from "@react-native-async-storage/async-storage";

// Local list of motivational quotes.
// Extend this list any time; persisted state only stores the index.
const QUOTES = [
  {
    text: "Every small step you take is still a step forward.",
    author: "MindPlus",
  },
  {
    text: "You’ve already survived 100% of your hardest days.",
    author: "MindPlus",
  },
  {
    text: "Rest is not a reward. It’s a part of the journey.",
    author: "MindPlus",
  },
  {
    text: "You don’t have to do it all today. Just do the next right thing.",
    author: "MindPlus",
  },
  {
    text: "Your feelings are valid, and they won’t last forever.",
    author: "MindPlus",
  },
  {
    text: "Progress is progress, no matter how small.",
    author: "MindPlus",
  },
  {
    text: "It’s okay to ask for help. You’re not alone in this.",
    author: "MindPlus",
  },
];

const STORAGE_KEY = "daily_motivation_quote_v1";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Returns the motivational quote for today.
 * - Picks a random quote index once per calendar day and stores it in AsyncStorage.
 * - Reuses the same quote if the user opens the chatbot multiple times in a day.
 */
export async function getTodayQuote() {
  if (!QUOTES.length) return null;

  const todayKey = getTodayKey();

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.date === todayKey && typeof parsed.index === "number") {
        const existing = QUOTES[parsed.index];
        if (existing) return existing;
      }
    }
  } catch (error) {
    console.log("Failed to read stored daily quote", error);
  }

  // Pick a new random quote for today.
  const index = Math.floor(Math.random() * QUOTES.length);
  const selected = QUOTES[index];

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey, index }),
    );
  } catch (error) {
    console.log("Failed to store daily quote", error);
  }

  return selected;
}
