import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Audio } from "expo-av";
import { SOUNDSCAPE_TRACKS } from "../config/soundscapeTracks";

export const SOUNDSCAPE_LIBRARY = [
  {
    id: "rain",
    emoji: "🌧️",
    title: "Soft Rain",
    subtitle: "Steady and cozy",
    accent: "#EEF2FF",
  },
  {
    id: "forest",
    emoji: "🌲",
    title: "Forest Breeze",
    subtitle: "Light wind + leaves",
    accent: "#D1FAE5",
  },
  {
    id: "ocean",
    emoji: "🌊",
    title: "Ocean Waves",
    subtitle: "Slow rhythmic tide",
    accent: "#E0F2FE",
  },
  {
    id: "fire",
    emoji: "🔥",
    title: "Fireplace",
    subtitle: "Warm crackle",
    accent: "#FEF3C7",
  },
  {
    id: "white",
    emoji: "🎧",
    title: "White Noise",
    subtitle: "Smooth blanket sound",
    accent: "#DDD6FE",
  },
];

const GlobalAudioPlayerContext = createContext(null);

export function GlobalAudioPlayerProvider({ children }) {
  const [selectedId, setSelectedId] = useState(SOUNDSCAPE_LIBRARY[0]?.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [elapsedMs, setElapsedMs] = useState(0);

  const soundRef = useRef(null);
  const intervalRef = useRef(null);
  const loadedTrackIdRef = useRef(null);
  const playStartedAtRef = useRef(null);
  const elapsedBeforeStartRef = useRef(0);

  const selectedTrack = useMemo(
    () => SOUNDSCAPE_LIBRARY.find((item) => item.id === selectedId) || SOUNDSCAPE_LIBRARY[0],
    [selectedId]
  );

  const sessionMs = minutes * 60 * 1000;
  const progress = sessionMs > 0 ? Math.min(1, elapsedMs / sessionMs) : 0;
  const showMiniPlayer = isPlaying || elapsedMs > 0;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pauseTimer = () => {
    if (playStartedAtRef.current) {
      elapsedBeforeStartRef.current += Date.now() - playStartedAtRef.current;
      setElapsedMs(elapsedBeforeStartRef.current);
      playStartedAtRef.current = null;
    }
    clearTimer();
  };

  const resetTimer = () => {
    playStartedAtRef.current = null;
    elapsedBeforeStartRef.current = 0;
    setElapsedMs(0);
    clearTimer();
  };

  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.warn("Failed to unload sound:", error);
      }
      soundRef.current = null;
      loadedTrackIdRef.current = null;
    }
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
    } catch (error) {
      console.warn("Pause failed:", error);
    } finally {
      pauseTimer();
      setIsPlaying(false);
    }
  };

  const stopAndReset = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }
    } catch (error) {
      console.warn("Stop failed:", error);
    } finally {
      resetTimer();
      setIsPlaying(false);
    }
  };

  const resetPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
      }
    } catch (error) {
      console.warn("Reset position failed:", error);
    } finally {
      resetTimer();
      setIsPlaying(false);
    }
  };

  const ensureSoundLoaded = async () => {
    if (soundRef.current && loadedTrackIdRef.current === selectedId) {
      return soundRef.current;
    }

    await unloadSound();

    const source = SOUNDSCAPE_TRACKS[selectedId];
    if (!source) {
      throw new Error(`Track source not found for '${selectedId}'`);
    }

    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: false,
      isLooping: true,
      volume: 1.0,
    });

    soundRef.current = sound;
    loadedTrackIdRef.current = selectedId;
    return sound;
  };

  const startTimer = () => {
    clearTimer();
    playStartedAtRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const startedAt = playStartedAtRef.current;
      if (!startedAt) return;

      const nextElapsed = elapsedBeforeStartRef.current + (Date.now() - startedAt);
      if (nextElapsed >= sessionMs) {
        setElapsedMs(sessionMs);
        stopPlayback();
        return;
      }

      setElapsedMs(nextElapsed);
    }, 300);
  };

  const togglePlay = async () => {
    if (isPlaying) {
      await stopPlayback();
      return;
    }

    if (elapsedBeforeStartRef.current >= sessionMs) {
      resetTimer();
    }

    const sound = await ensureSoundLoaded();
    await sound.playAsync();
    setIsPlaying(true);
    startTimer();
  };

  const selectTrack = async (id) => {
    if (id === selectedId) return;
    await stopPlayback();
    await unloadSound();
    setSelectedId(id);
    resetTimer();
  };

  const setSessionMinutes = async (value) => {
    await stopPlayback();
    setMinutes(value);
    resetTimer();
  };

  const closeMiniPlayer = async () => {
    await stopAndReset();
    await unloadSound();
  };

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch((error) => {
      console.warn("Audio mode setup failed:", error);
    });

    return () => {
      clearTimer();
      unloadSound();
    };
  }, []);

  const value = {
    tracks: SOUNDSCAPE_LIBRARY,
    selectedTrack,
    selectedId,
    isPlaying,
    minutes,
    elapsedMs,
    sessionMs,
    progress,
    showMiniPlayer,
    togglePlay,
    stopAndReset,
    resetPlayback,
    selectTrack,
    setSessionMinutes,
    closeMiniPlayer,
  };

  return (
    <GlobalAudioPlayerContext.Provider value={value}>
      {children}
    </GlobalAudioPlayerContext.Provider>
  );
}

export function useGlobalAudioPlayer() {
  const context = useContext(GlobalAudioPlayerContext);
  if (!context) {
    throw new Error("useGlobalAudioPlayer must be used inside GlobalAudioPlayerProvider");
  }
  return context;
}
