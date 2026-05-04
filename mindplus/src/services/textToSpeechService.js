// Text-to-Speech helpers for chatbot voice responses
// Uses Expo's Speech module so it works in managed Expo apps.

import * as Speech from "expo-speech";

// Default voice configuration
const DEFAULT_LANGUAGE = "en-US"; // Ensure English voice by default
let defaultRate = 0.9; // 0.0 – 1.0 (Expo's range), 0.9 feels close to natural speed
let defaultPitch = 1.0;

function clampRate(rate) {
  if (typeof rate !== "number" || Number.isNaN(rate)) return defaultRate;
  return Math.max(0.6, Math.min(1.2, rate));
}

/**
 * Speaks a chatbot message out loud.
 *
 * @param {string} text - The full bot message to read.
 * @param {{ onFinish?: () => void, rate?: number }} [options]
 */
export async function playBotMessageVoice(text, options = {}) {
  if (!text || typeof text !== "string") return;

  const { onFinish, rate } = options;

  try {
    // Ensure we don't overlap multiple TTS sessions
    Speech.stop();

    const effectiveRate = clampRate(
      typeof rate === "number" ? rate : defaultRate,
    );

    Speech.speak(text, {
      language: DEFAULT_LANGUAGE,
      rate: effectiveRate,
      pitch: defaultPitch,
      onDone: () => {
        if (typeof onFinish === "function") {
          onFinish();
        }
      },
      onStopped: () => {
        if (typeof onFinish === "function") {
          onFinish();
        }
      },
    });
  } catch (e) {
    console.log("TTS speak error", e);
    if (typeof onFinish === "function") {
      onFinish();
    }
  }
}

/**
 * Stops any ongoing chatbot voice playback.
 */
export async function stopBotMessageVoice() {
  try {
    Speech.stop();
  } catch (e) {
    console.log("TTS stop error", e);
  }
}

/**
 * Optional: update the global speech rate used for future playback.
 *
 * @param {number} rate - Typically between 0.3 and 0.8 for comfortable speed.
 */
export function setBotVoiceRate(rate) {
  if (typeof rate !== "number" || Number.isNaN(rate)) return;
  // Store for future calls; applied in playBotMessageVoice
  defaultRate = Math.max(0.6, Math.min(1.2, rate));
}

/**
 * Optional: call this when unmounting screens that use TTS
 * to ensure listeners are cleared.
 */
export function cleanupTTS() {
  // No listener cleanup required for expo-speech; just stop any ongoing speech.
  try {
    Speech.stop();
  } catch (e) {
    console.log("TTS cleanup error", e);
  }
}
