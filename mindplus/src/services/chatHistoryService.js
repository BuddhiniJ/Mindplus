import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAT_HISTORY_KEY = "chat_history";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function buildStorageKey(userId) {
  return `${CHAT_HISTORY_KEY}_${userId}`;
}

function normalizeMessages(userId, messages) {
  if (!Array.isArray(messages)) return [];
  const now = Date.now();

  return messages.map((m) => {
    const senderType =
      m.sender_type || (m.from === "user" ? "user" : "chatbot");
    const text = m.message_text != null ? m.message_text : m.text || "";
    const timestamp = typeof m.timestamp === "number" ? m.timestamp : now;

    return {
      ...m,
      user_id: m.user_id || userId,
      message_text: text,
      sender_type: senderType,
      timestamp,
    };
  });
}

export async function loadChatConversation(userId) {
  if (!userId) return null;

  try {
    const key = buildStorageKey(userId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const data = JSON.parse(raw);
    const messages = Array.isArray(data?.messages) ? data.messages : [];

    let startedAt = data?.started_at;
    if (typeof startedAt !== "number") {
      const firstTs = messages[0]?.timestamp;
      startedAt = typeof firstTs === "number" ? firstTs : Date.now();
    }

    const now = Date.now();
    if (startedAt && now - startedAt > EXPIRY_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      userId: data?.user_id || userId,
      sessionId: data?.session_id || null,
      startedAt,
      messages,
    };
  } catch (err) {
    console.error("Failed to load chat history:", err);
    return null;
  }
}

export async function saveChatConversation(
  userId,
  { sessionId = null, startedAt, messages }
) {
  if (!userId) return;

  try {
    const key = buildStorageKey(userId);
    const normalized = normalizeMessages(userId, messages || []);
    const effectiveStartedAt =
      typeof startedAt === "number"
        ? startedAt
        : normalized[0]?.timestamp || Date.now();

    // Keep only the most recent 100 messages to avoid performance issues
    const trimmed = normalized.slice(-100);

    const payload = {
      user_id: userId,
      session_id: sessionId,
      started_at: effectiveStartedAt,
      messages: trimmed,
    };

    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save chat history:", err);
  }
}

export async function appendChatMessages(
  userId,
  newMessages,
  sessionId = null
) {
  if (!userId || !Array.isArray(newMessages) || newMessages.length === 0)
    return;

  try {
    const existing = await loadChatConversation(userId);
    const baseMessages = existing?.messages || [];
    const startedAt =
      existing?.startedAt || newMessages[0]?.timestamp || Date.now();

    const combined = [...baseMessages, ...newMessages];

    await saveChatConversation(userId, {
      sessionId: sessionId != null ? sessionId : existing?.sessionId || null,
      startedAt,
      messages: combined,
    });
  } catch (err) {
    console.error("Failed to append chat messages:", err);
  }
}

export async function clearChatHistory(userId) {
  if (!userId) return;
  try {
    const key = buildStorageKey(userId);
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error("Failed to clear chat history:", err);
  }
}
