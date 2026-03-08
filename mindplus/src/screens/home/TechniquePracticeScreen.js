import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Alert,
  Image,
} from "react-native";
import { TECHNIQUE_DETAILS } from "../../components/chatbot/TechniqueDetailCard";

// Helper to normalize technique names
function normalizeTechnique(name) {
  if (!name) return "";
  return String(name).trim().toLowerCase();
}

// 1. 5-4-3-2-1 Grounding
function GroundingTechnique({ onDone }) {
  const steps = [
    {
      title: "5 things you can see",
      prompt: "Gently look around and name 5 things you can see.",
      color: "#3B82F6",
    },
    {
      title: "4 things you can feel",
      prompt:
        "Notice how your body feels. Name 4 things you can physically feel.",
      color: "#10B981",
    },
    {
      title: "3 things you can hear",
      prompt: "Pause and listen. Name 3 sounds you can hear.",
      color: "#8B5CF6",
    },
    {
      title: "2 things you can smell",
      prompt: "Notice 2 different smells around you, even if they are subtle.",
      color: "#EC4899",
    },
    {
      title: "1 thing you can taste",
      prompt:
        "Gently notice 1 thing you can taste right now, or imagine a calming taste.",
      color: "#F59E0B",
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(["", "", "", "", ""]);

  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setStepIndex((idx) => idx + 1);
    } else {
      onDone?.();
    }
  };

  return (
    <View style={styles.cardGrounding}>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          Step {stepIndex + 1} of {steps.length}
        </Text>
        <View style={styles.progressDotsRow}>
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressDot,
                idx <= stepIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.groundingBadge,
          { backgroundColor: current.color + "22" },
        ]}
      >
        <Text style={[styles.groundingBadgeText, { color: current.color }]}>
          5-4-3-2-1 Grounding
        </Text>
      </View>

      <Text style={styles.groundingTitle}>{current.title}</Text>
      <Text style={styles.groundingPrompt}>{current.prompt}</Text>

      <TextInput
        style={styles.groundingInput}
        placeholder="You can type what you notice here (optional)."
        value={answers[stepIndex]}
        multiline
        onChangeText={(text) => {
          const next = [...answers];
          next[stepIndex] = text;
          setAnswers(next);
        }}
      />

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {isLast ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>

      {isLast && (
        <Text style={styles.completionHint}>
          Great job grounding yourself in the present moment.
        </Text>
      )}
    </View>
  );
}

// 2. Box Breathing (4-4-4-4)
function BoxBreathingTechnique({ onDone }) {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycles, setCycles] = useState(0);
  const [completed, setCompleted] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  const phases = ["Inhale", "Hold", "Exhale", "Hold"];
  const durations = [4, 4, 4, 4];

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setSecondsLeft(durations[phaseIndex]);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setPhaseIndex((idx) => {
            const next = (idx + 1) % phases.length;
            if (next === 0) {
              setCycles((c) => {
                const updated = c + 1;
                if (updated >= 4) {
                  // finish after 4 cycles
                  setCompleted(true);
                  setIsRunning(false);
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                }
                return updated;
              });
            }
            return next;
          });
          return durations[(phaseIndex + 1) % phases.length];
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, phaseIndex]);

  useEffect(() => {
    if (!isRunning) return;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.15,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [phaseIndex, isRunning]);

  const handleStart = () => {
    setCompleted(false);
    setCycles(0);
    setPhaseIndex(0);
    setIsRunning(true);
  };

  return (
    <View style={styles.cardBoxBreathing}>
      <Text style={styles.boxTitle}>Box Breathing (4-4-4-4)</Text>
      <Text style={styles.boxSubtitle}>
        Follow the circle and the phases. Breathe gently.
      </Text>

      <Animated.View style={[styles.breathCircle, { transform: [{ scale }] }]}>
        <Text style={styles.breathPhaseLabel}>{phases[phaseIndex]}</Text>
        <Text style={styles.breathTimer}>{secondsLeft}s</Text>
      </Animated.View>

      <View style={styles.boxInfoRow}>
        <View style={styles.boxChip}>
          <Text style={styles.boxChipLabel}>Cycles</Text>
          <Text style={styles.boxChipValue}>{cycles}/4</Text>
        </View>
        <View style={styles.boxChip}>
          <Text style={styles.boxChipLabel}>Phase</Text>
          <Text style={styles.boxChipValue}>{phases[phaseIndex]}</Text>
        </View>
      </View>

      {!completed ? (
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleStart}
          disabled={isRunning}
        >
          <Text style={styles.primaryButtonText}>
            {isRunning ? "In progress" : "Start cycle"}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.completionHint}>
            Your breathing has slowed. Notice the calm in your body.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={onDone}
          >
            <Text style={styles.secondaryButtonText}>I'm done</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// 3. Safe Place Visualization
function SafePlaceVisualization({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    "Gently close your eyes if that feels okay.",
    "Imagine a peaceful place where you feel safe.",
    "Notice the colors, shapes, and details around you.",
    "Breathe slowly and let your body soften into this place.",
  ];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onDone?.();
    }
  };

  return (
    <View style={styles.cardSafePlace}>
      <View style={styles.safePlaceBackgroundGlow} />
      <Text style={styles.safeTitle}>Safe Place Visualization</Text>
      <Text style={styles.safeSubtitle}>
        Imagine a place that feels calm, safe, and supportive.
      </Text>

      <View style={styles.safeStepPill}>
        <Text style={styles.safeStepPillText}>
          Step {stepIndex + 1} of {steps.length}
        </Text>
      </View>

      <Text style={styles.safePrompt}>{steps[stepIndex]}</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>

      {stepIndex === steps.length - 1 && (
        <Text style={styles.completionHint}>
          You created a moment of calm for your mind.
        </Text>
      )}
    </View>
  );
}

// 4. Self-Compassion Check-In
function SelfCompassionTechnique({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [journal, setJournal] = useState("");

  const steps = [
    "Notice what you are feeling right now.",
    "Remind yourself that these feelings are valid and human.",
    "Take one slow, gentle breath.",
    "Write or say something kind to yourself.",
  ];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onDone?.();
    }
  };

  return (
    <View style={styles.cardSelfCompassion}>
      <Text style={styles.selfTitle}>Self-Compassion Check-In</Text>
      <Text style={styles.selfSubtitle}>
        Treat yourself with the same kindness you would offer a friend.
      </Text>

      <View style={styles.selfStepBadge}>
        <Text style={styles.selfStepBadgeText}>
          Step {stepIndex + 1} of {steps.length}
        </Text>
      </View>

      <Text style={styles.selfPrompt}>{steps[stepIndex]}</Text>

      {stepIndex === 3 && (
        <TextInput
          multiline
          style={styles.selfInput}
          placeholder="Type a kind message to yourself here."
          value={journal}
          onChangeText={setJournal}
        />
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>

      {stepIndex === steps.length - 1 && (
        <Text style={styles.completionHint}>
          Self-kindness can help you heal and recharge.
        </Text>
      )}
    </View>
  );
}

// 5. Small Activation Task
function SmallActivationTechnique({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [task, setTask] = useState("");
  const [completed, setCompleted] = useState(false);

  const steps = [
    "Choose one tiny task you could start (e.g., open your document).",
    "Write the tiny task in your own words.",
    "Commit to doing just this one step.",
    "When finished, check it off and acknowledge your effort.",
  ];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setCompleted(true);
      onDone?.();
    }
  };

  return (
    <View style={styles.cardActivation}>
      <Text style={styles.activationTitle}>Small Activation Task</Text>
      <Text style={styles.activationSubtitle}>
        Move forward with one tiny, doable action.
      </Text>

      <Text style={styles.activationStepLabel}>
        Step {stepIndex + 1} of {steps.length}
      </Text>
      <Text style={styles.activationPrompt}>{steps[stepIndex]}</Text>

      {stepIndex === 1 && (
        <TextInput
          style={styles.activationInput}
          placeholder="Write your tiny task here"
          value={task}
          onChangeText={setTask}
        />
      )}

      {stepIndex === 3 && (
        <TouchableOpacity
          style={[styles.checkboxRow, completed && styles.checkboxRowDone]}
          activeOpacity={0.8}
          onPress={() => setCompleted((c) => !c)}
        >
          <View
            style={[
              styles.checkboxOuter,
              completed && styles.checkboxOuterDone,
            ]}
          >
            {completed && <View style={styles.checkboxInner} />}
          </View>
          <Text style={styles.checkboxLabel}>I completed my tiny task.</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>

      {completed && (
        <Text style={styles.completionHint}>
          Small progress is still progress.
        </Text>
      )}
    </View>
  );
}

// 6. Gratitude List (3 Things)
function GratitudeTechnique({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [items, setItems] = useState(["", "", ""]);

  const handleNext = () => {
    if (stepIndex < 2) {
      setStepIndex((i) => i + 1);
    } else {
      onDone?.();
    }
  };

  const placeholders = [
    "Something small you're grateful for today",
    "Someone who supported you recently",
    "A tiny comfort or moment of peace",
  ];

  return (
    <View style={styles.cardGratitude}>
      <Text style={styles.gratitudeTitle}>Gratitude (3 things)</Text>
      <Text style={styles.gratitudeSubtitle}>
        Write three things you feel grateful for right now.
      </Text>

      <Text style={styles.gratitudeStepLabel}>Item {stepIndex + 1} of 3</Text>

      <TextInput
        style={styles.gratitudeInput}
        placeholder={placeholders[stepIndex]}
        value={items[stepIndex]}
        onChangeText={(text) => {
          const next = [...items];
          next[stepIndex] = text;
          setItems(next);
        }}
      />

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex === 2 ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>

      {stepIndex === 2 && (
        <Text style={styles.completionHint}>
          Gratitude can gently shift your mindset.
        </Text>
      )}
    </View>
  );
}

// 7. 4-7-8 Breathing
function Breathing478Technique({ onDone }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const timerRef = useRef(null);
  const phases = ["Inhale", "Hold", "Exhale"];
  const durations = [4, 7, 8];

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setSecondsLeft(durations[phaseIndex]);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhaseIndex((idx) => {
            const next = (idx + 1) % phases.length;
            if (next === 0) {
              setRounds((r) => {
                const updated = r + 1;
                if (updated >= 4) {
                  setIsRunning(false);
                  onDone?.();
                }
                return updated;
              });
            }
            return next;
          });
          return durations[(phaseIndex + 1) % phases.length];
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, phaseIndex]);

  const handleStart = () => {
    setIsRunning(true);
    setRounds(0);
    setPhaseIndex(0);
  };

  return (
    <View style={styles.card478}>
      <Text style={styles.breath478Title}>4-7-8 Breathing</Text>
      <Text style={styles.breath478Subtitle}>
        Breathe in for 4, hold for 7, exhale for 8.
      </Text>

      <View style={styles.breath478PhaseBox}>
        <Text style={styles.breath478Phase}>{phases[phaseIndex]}</Text>
        <Text style={styles.breath478Timer}>{secondsLeft}s</Text>
        <Text style={styles.breath478Rounds}>Rounds: {rounds}/4</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleStart}
        disabled={isRunning}
      >
        <Text style={styles.primaryButtonText}>
          {isRunning ? "In progress" : "Start"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 8. Cognitive Defusion
function CognitiveDefusionTechnique({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [thought, setThought] = useState("");

  const steps = [
    "Type a difficult thought you're noticing.",
    "Add the phrase: 'I am having the thought that…' before it.",
    "Notice how it feels to see it as a thought, not a fact.",
  ];

  const reframed = thought ? `I am having the thought that "${thought}"` : "";

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onDone?.();
    }
  };

  return (
    <View style={styles.cardDefusion}>
      <Text style={styles.defusionTitle}>Cognitive Defusion</Text>
      <Text style={styles.defusionSubtitle}>
        See thoughts as passing mental events rather than facts.
      </Text>

      <Text style={styles.defusionStepLabel}>
        Step {stepIndex + 1} of {steps.length}
      </Text>
      <Text style={styles.defusionPrompt}>{steps[stepIndex]}</Text>

      <TextInput
        style={styles.defusionInput}
        placeholder="Type your thought here"
        value={thought}
        onChangeText={setThought}
        multiline
      />

      {thought.length > 0 && (
        <View style={styles.defusionReframeBox}>
          <Text style={styles.defusionReframeLabel}>Reframed thought</Text>
          <Text style={styles.defusionReframeText}>{reframed}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 9. Take a Short Walk
function ShortWalkTechnique({ onDone }) {
  const [secondsLeft, setSecondsLeft] = useState(60 * 3);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          onDone?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <View style={styles.cardWalk}>
      <Text style={styles.walkTitle}>Take a Short Walk</Text>
      <Text style={styles.walkSubtitle}>
        Walk at a gentle pace and notice your surroundings.
      </Text>

      <Text style={styles.walkTimer}>
        {minutes}:{seconds}
      </Text>

      <Text style={styles.walkPrompt}>
        As you walk, notice what you see, hear, and feel with each step.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => setRunning(true)}
        disabled={running}
      >
        <Text style={styles.primaryButtonText}>
          {running ? "Timer running" : "Start 3-minute walk"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 10. 5-Minute Micro Break
function MicroBreakTechnique({ onDone }) {
  const [secondsLeft, setSecondsLeft] = useState(60 * 5);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          onDone?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <View style={styles.cardMicroBreak}>
      <Text style={styles.microTitle}>5-Minute Micro Break</Text>
      <Text style={styles.microSubtitle}>
        Step away briefly to reset your body and mind.
      </Text>

      <Text style={styles.microTimer}>
        {minutes}:{seconds}
      </Text>

      <Text style={styles.microPrompt}>
        During this break, you might stretch, drink water, or look outside.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => setRunning(true)}
        disabled={running}
      >
        <Text style={styles.primaryButtonText}>
          {running ? "Break in progress" : "Start 5-minute break"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 11. Energy Audit
function EnergyAuditTechnique({ onDone }) {
  const [boost, setBoost] = useState(["Talking to a friend", "Short walk"]);
  const [drain, setDrain] = useState(["Scrolling too long", "Overworking"]);

  const moveItem = (item, fromBoostToDrain) => {
    if (fromBoostToDrain) {
      setBoost((b) => b.filter((x) => x !== item));
      setDrain((d) => [...d, item]);
    } else {
      setDrain((d) => d.filter((x) => x !== item));
      setBoost((b) => [...b, item]);
    }
  };

  return (
    <View style={styles.cardEnergy}>
      <Text style={styles.energyTitle}>Energy Audit</Text>
      <Text style={styles.energySubtitle}>
        Gently sort activities into what boosts and what drains you.
      </Text>

      <View style={styles.energyColumnsRow}>
        <View style={styles.energyColumn}>
          <Text style={styles.energyColumnTitle}>Boosts</Text>
          {boost.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.energyItemBoost}
              onPress={() => moveItem(item, true)}
              activeOpacity={0.8}
            >
              <Text style={styles.energyItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.energyColumn}>
          <Text style={styles.energyColumnTitle}>Drains</Text>
          {drain.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.energyItemDrain}
              onPress={() => moveItem(item, false)}
              activeOpacity={0.8}
            >
              <Text style={styles.energyItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={onDone}
      >
        <Text style={styles.primaryButtonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}

// 12. Mini Self-Care Break (checklist)
function SelfCareBreakTechnique({ onDone }) {
  const [items, setItems] = useState([
    { label: "Drink a glass of water", done: false },
    { label: "Stretch your shoulders gently", done: false },
    { label: "Look away from screens for 30 seconds", done: false },
  ]);

  const toggleItem = (index) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], done: !next[index].done };
      return next;
    });
  };

  const completedCount = items.filter((i) => i.done).length;

  return (
    <View style={styles.cardSelfCare}>
      <Text style={styles.selfCareTitle}>Mini Self-Care Break</Text>
      <Text style={styles.selfCareSubtitle}>
        Choose one or more small self-care actions.
      </Text>

      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.selfCareRow, item.done && styles.selfCareRowDone]}
          onPress={() => toggleItem(idx)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxOuter,
              item.done && styles.checkboxOuterDone,
            ]}
          >
            {item.done && <View style={styles.checkboxInner} />}
          </View>
          <Text style={styles.selfCareLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.selfCareProgressText}>
        Completed {completedCount} of {items.length}
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={onDone}
      >
        <Text style={styles.primaryButtonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}

// 13. Task Chunking (Pomodoro-style)
function TaskChunkingTechnique({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [task, setTask] = useState("");

  const steps = [
    "Write the task you want to focus on.",
    "Start a 25-minute focus block.",
    "Take a 5-minute break after your focus block.",
  ];

  return (
    <View style={styles.cardPomodoro}>
      <Text style={styles.pomodoroTitle}>Task Chunking (Pomodoro)</Text>
      <Text style={styles.pomodoroSubtitle}>
        Work in focused blocks with gentle breaks.
      </Text>

      <Text style={styles.pomodoroStepLabel}>
        Step {stepIndex + 1} of {steps.length}
      </Text>
      <Text style={styles.pomodoroPrompt}>{steps[stepIndex]}</Text>

      {stepIndex === 0 && (
        <TextInput
          style={styles.pomodoroInput}
          placeholder="Your focus task"
          value={task}
          onChangeText={setTask}
        />
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => {
          if (stepIndex < steps.length - 1) {
            setStepIndex((i) => i + 1);
          } else {
            onDone?.();
          }
        }}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 14. Two-Minute Small Start
function TwoMinuteStartTechnique({ onDone }) {
  const [task, setTask] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          onDone?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <View style={styles.cardTwoMinute}>
      <Text style={styles.twoMinuteTitle}>Two-Minute Small Start</Text>
      <Text style={styles.twoMinuteSubtitle}>
        Commit to just two minutes of a task.
      </Text>

      <TextInput
        style={styles.twoMinuteInput}
        placeholder="What will you start for 2 minutes?"
        value={task}
        onChangeText={setTask}
      />

      <Text style={styles.twoMinuteTimer}>
        {minutes}:{seconds}
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => setRunning(true)}
        disabled={running}
      >
        <Text style={styles.primaryButtonText}>
          {running ? "Timer running" : "Start 2-minute timer"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 15. Prioritize Top 3 Tasks
function PrioritizeTop3Technique({ onDone }) {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Task 1", order: 1 },
    { id: 2, text: "Task 2", order: 2 },
    { id: 3, text: "Task 3", order: 3 },
  ]);

  const updateTaskText = (id, text) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const moveTask = (id, direction) => {
    setTasks((prev) => {
      const next = [...prev];
      const index = next.findIndex((t) => t.id === id);
      const swapIndex = index + direction;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[swapIndex];
      next[swapIndex] = temp;
      return next;
    });
  };

  return (
    <View style={styles.cardTop3}>
      <Text style={styles.top3Title}>Prioritize Top 3 Tasks</Text>
      <Text style={styles.top3Subtitle}>
        Enter your tasks and adjust their order.
      </Text>

      {tasks.map((task, index) => (
        <View key={task.id} style={styles.top3Row}>
          <Text style={styles.top3Rank}>{index + 1}</Text>
          <TextInput
            style={styles.top3Input}
            value={task.text}
            onChangeText={(text) => updateTaskText(task.id, text)}
            placeholder="Task"
          />
          <View style={styles.top3ButtonsColumn}>
            <TouchableOpacity
              style={styles.top3ArrowButton}
              onPress={() => moveTask(task.id, -1)}
              activeOpacity={0.8}
            >
              <Text style={styles.top3ArrowText}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.top3ArrowButton}
              onPress={() => moveTask(task.id, 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.top3ArrowText}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={onDone}
      >
        <Text style={styles.primaryButtonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}

// 16. 5-Minute Reset Break (simplified breathing + timer)
function ResetBreakTechnique({ onDone }) {
  const [secondsLeft, setSecondsLeft] = useState(60 * 5);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          onDone?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <View style={styles.cardResetBreak}>
      <Text style={styles.resetTitle}>5-Minute Reset Break</Text>
      <Text style={styles.resetSubtitle}>
        Follow your breath while the timer gently runs.
      </Text>

      <Text style={styles.resetTimer}>
        {minutes}:{seconds}
      </Text>
      <Text style={styles.resetPrompt}>
        Inhale for 4, exhale for 6 at your own pace.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => setRunning(true)}
        disabled={running}
      >
        <Text style={styles.primaryButtonText}>
          {running ? "Reset in progress" : "Start 5-minute reset"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 17. Pomodoro Study Technique (visual progress)
function PomodoroStudyTechnique({ onDone }) {
  const [sessions, setSessions] = useState(0);

  return (
    <View style={styles.cardPomodoroStudy}>
      <Text style={styles.studyTitle}>Pomodoro Study Technique</Text>
      <Text style={styles.studySubtitle}>
        Track your focused study sessions.
      </Text>

      <View style={styles.studySessionsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.studySessionDot,
              i < sessions && styles.studySessionDotActive,
            ]}
          />
        ))}
      </View>

      <Text style={styles.studySessionsLabel}>
        Sessions completed: {sessions} / 4
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => {
          setSessions((s) => {
            const next = Math.min(4, s + 1);
            if (next === 4) onDone?.();
            return next;
          });
        }}
      >
        <Text style={styles.primaryButtonText}>Mark session complete</Text>
      </TouchableOpacity>
    </View>
  );
}

// 18. Short Stretch Break
function StretchBreakTechnique({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const stretches = [
    "Gently roll your shoulders backwards.",
    "Tilt your head side to side slowly.",
    "Stretch your arms overhead and breathe out.",
  ];

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          onDone?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <View style={styles.cardStretch}>
      <Text style={styles.stretchTitle}>Short Stretch Break</Text>
      <Text style={styles.stretchSubtitle}>
        Follow one simple stretch at a time.
      </Text>

      <Text style={styles.stretchStepLabel}>
        Step {stepIndex + 1} of {stretches.length}
      </Text>
      <Text style={styles.stretchPrompt}>{stretches[stepIndex]}</Text>

      <Text style={styles.stretchTimer}>
        {minutes}:{seconds}
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => {
          if (stepIndex < stretches.length - 1) {
            setStepIndex((i) => i + 1);
          } else {
            setRunning(true);
          }
        }}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex < stretches.length - 1
            ? "Next stretch"
            : "Start 60s timer"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 19. Mindful Breathing
function MindfulBreathingTechnique({ onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    "Notice where you feel your breath the most (nose, chest, or belly).",
    "Follow one full in-breath and out-breath.",
    "When your mind wanders, gently bring it back to the breath.",
  ];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      onDone?.();
    }
  };

  return (
    <View style={styles.cardMindfulBreathing}>
      <Text style={styles.mindfulTitle}>Mindful Breathing</Text>
      <Text style={styles.mindfulSubtitle}>
        Stay close to your breath, one moment at a time.
      </Text>

      <Text style={styles.mindfulStepLabel}>
        Step {stepIndex + 1} of {steps.length}
      </Text>
      <Text style={styles.mindfulPrompt}>{steps[stepIndex]}</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handleNext}
      >
        <Text style={styles.primaryButtonText}>
          {stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// 20. Light Check-In Journaling
function LightJournalingTechnique({ onDone }) {
  const [mood, setMood] = useState("");
  const [entry, setEntry] = useState("");

  return (
    <View style={styles.cardJournal}>
      <Text style={styles.journalTitle}>Light Check-In Journaling</Text>
      <Text style={styles.journalSubtitle}>
        Jot down how you are doing right now.
      </Text>

      <Text style={styles.journalLabel}>Mood (one word)</Text>
      <TextInput
        style={styles.journalMoodInput}
        placeholder="e.g., tired, hopeful, flat"
        value={mood}
        onChangeText={setMood}
      />

      <Text style={styles.journalLabel}>Notes</Text>
      <TextInput
        style={styles.journalInput}
        placeholder="Write a few sentences about what's on your mind."
        value={entry}
        onChangeText={setEntry}
        multiline
      />

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={onDone}
      >
        <Text style={styles.primaryButtonText}>Save check-in</Text>
      </TouchableOpacity>
    </View>
  );
}

// 21. Plan a Small Reward
function PlanRewardTechnique({ onDone }) {
  const [task, setTask] = useState("");
  const [reward, setReward] = useState("");

  return (
    <View style={styles.cardReward}>
      <Text style={styles.rewardTitle}>Plan a Small Reward</Text>
      <Text style={styles.rewardSubtitle}>
        Link a task to a gentle, realistic reward.
      </Text>

      <Text style={styles.rewardLabel}>Task</Text>
      <TextInput
        style={styles.rewardInput}
        placeholder="What will you work on?"
        value={task}
        onChangeText={setTask}
      />

      <Text style={styles.rewardLabel}>Reward</Text>
      <TextInput
        style={styles.rewardInput}
        placeholder="What small reward will you give yourself?"
        value={reward}
        onChangeText={setReward}
      />

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={onDone}
      >
        <Text style={styles.primaryButtonText}>Plan it</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TechniquePracticeScreen({ route, navigation }) {
  const technique = route?.params?.technique || "Technique";
  const description =
    TECHNIQUE_DETAILS[technique] ||
    "This is a grounding or coping technique. Follow the steps slowly and gently, and notice how your body responds.";

  const normalized = normalizeTechnique(technique);

  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);

  const handleDone = () => {
    completedRef.current = true;
    setCompleted(true);
    navigation.goBack();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (completedRef.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "Leave this exercise?",
        "You didn't finish this task. This will be tracked as not engaged.",
        [
          {
            text: "Stay here",
            style: "cancel",
          },
          {
            text: "Leave anyway",
            style: "destructive",
            onPress: () => {
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation]);

  const renderBody = () => {
    const commonProps = { onDone: handleDone };

    if (normalized.includes("5-4-3-2-1"))
      return <GroundingTechnique {...commonProps} />;
    if (normalized.includes("box breathing"))
      return <BoxBreathingTechnique {...commonProps} />;
    if (normalized.includes("safe place"))
      return <SafePlaceVisualization {...commonProps} />;
    if (normalized.includes("self-compassion"))
      return <SelfCompassionTechnique {...commonProps} />;
    if (normalized.includes("activation"))
      return <SmallActivationTechnique {...commonProps} />;
    if (normalized.includes("gratitude"))
      return <GratitudeTechnique {...commonProps} />;
    if (normalized.includes("4-7-8"))
      return <Breathing478Technique {...commonProps} />;
    if (normalized.includes("cognitive defusion"))
      return <CognitiveDefusionTechnique {...commonProps} />;
    if (normalized.includes("walk"))
      return <ShortWalkTechnique {...commonProps} />;
    if (normalized.includes("micro") || normalized.includes("micro-break"))
      return <MicroBreakTechnique {...commonProps} />;
    if (normalized.includes("energy audit"))
      return <EnergyAuditTechnique {...commonProps} />;
    if (normalized.includes("self-care"))
      return <SelfCareBreakTechnique {...commonProps} />;
    if (normalized.includes("chunking") || normalized.includes("pomodoro"))
      return <TaskChunkingTechnique {...commonProps} />;
    if (normalized.includes("two-minute"))
      return <TwoMinuteStartTechnique {...commonProps} />;
    if (normalized.includes("top 3"))
      return <PrioritizeTop3Technique {...commonProps} />;
    if (normalized.includes("reset break"))
      return <ResetBreakTechnique {...commonProps} />;
    if (normalized.includes("study technique"))
      return <PomodoroStudyTechnique {...commonProps} />;
    if (normalized.includes("stretch"))
      return <StretchBreakTechnique {...commonProps} />;
    if (normalized.includes("mindful breathing"))
      return <MindfulBreathingTechnique {...commonProps} />;
    if (normalized.includes("journaling"))
      return <LightJournalingTechnique {...commonProps} />;
    if (normalized.includes("reward"))
      return <PlanRewardTechnique {...commonProps} />;

    // Fallback generic layout
    return (
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Quick overview</Text>
        <Text style={styles.body}>{description}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>{"\u2190"} Back to Chat</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{technique}</Text>
        <Text style={styles.subtitle}>
          Let's practice this together step by step.
        </Text>

        <Image
          source={require("../../../assets/stress.gif")}
          style={styles.stressGif}
          resizeMode="contain"
        />

        {renderBody()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>I'm done for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "#3B82F6",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  content: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    marginBottom: 18,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 20,
  },
  stressGif: {
    width: "80%",
    height: 200,
    alignSelf: "center",
    marginBottom: 10,
    marginTop: 30,
    borderRadius: 30,
  },
  card: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 4,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
    marginBottom: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#10B981",
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Shared primary / secondary buttons
  primaryButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "#6366F1",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  completionHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#4B5563",
  },

  // Grounding
  cardGrounding: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    marginTop: 4,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  progressDotsRow: {
    flexDirection: "row",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
    backgroundColor: "#E5E7EB",
  },
  progressDotActive: {
    backgroundColor: "#6366F1",
  },
  groundingBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  groundingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  groundingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  groundingPrompt: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 10,
  },
  groundingInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 60,
    fontSize: 14,
    color: "#111827",
  },

  // Box breathing
  cardBoxBreathing: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#EFF6FF",
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 4,
  },
  boxSubtitle: {
    fontSize: 13,
    color: "#3B82F6",
    marginBottom: 16,
  },
  breathCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#DBEAFE",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  breathPhaseLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  breathTimer: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1D4ED8",
    marginTop: 4,
  },
  boxInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  boxChip: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  boxChipLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  boxChipValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  // Safe place
  cardSafePlace: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#F5F3FF",
    overflow: "hidden",
  },
  safePlaceBackgroundGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#C4B5FD",
    opacity: 0.35,
  },
  safeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4C1D95",
    marginBottom: 4,
  },
  safeSubtitle: {
    fontSize: 13,
    color: "#6D28D9",
    marginBottom: 10,
  },
  safeStepPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EDE9FE",
    marginBottom: 8,
  },
  safeStepPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4C1D95",
  },
  safePrompt: {
    fontSize: 14,
    color: "#4B5563",
  },

  // Self-compassion
  cardSelfCompassion: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FEF2F2",
  },
  selfTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 4,
  },
  selfSubtitle: {
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 10,
  },
  selfStepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    marginBottom: 8,
  },
  selfStepBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#991B1B",
  },
  selfPrompt: {
    fontSize: 14,
    color: "#7F1D1D",
    marginBottom: 10,
  },
  selfInput: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 70,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },

  // Small activation task
  cardActivation: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#ECFEFF",
  },
  activationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E7490",
    marginBottom: 4,
  },
  activationSubtitle: {
    fontSize: 13,
    color: "#0891B2",
    marginBottom: 8,
  },
  activationStepLabel: {
    fontSize: 12,
    color: "#155E75",
    marginBottom: 4,
  },
  activationPrompt: {
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 8,
  },
  activationInput: {
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkboxRowDone: {
    opacity: 0.9,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxOuterDone: {
    borderColor: "#10B981",
    backgroundColor: "#D1FAE5",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#0F172A",
  },

  // Gratitude
  cardGratitude: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FEFCE8",
  },
  gratitudeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#854D0E",
    marginBottom: 4,
  },
  gratitudeSubtitle: {
    fontSize: 13,
    color: "#A16207",
    marginBottom: 10,
  },
  gratitudeStepLabel: {
    fontSize: 12,
    color: "#92400E",
    marginBottom: 6,
  },
  gratitudeInput: {
    borderWidth: 1,
    borderColor: "#FACC15",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },

  // 4-7-8
  card478: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#E0F2FE",
  },
  breath478Title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0C4A6E",
    marginBottom: 4,
  },
  breath478Subtitle: {
    fontSize: 13,
    color: "#0369A1",
    marginBottom: 10,
  },
  breath478PhaseBox: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  breath478Phase: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0C4A6E",
  },
  breath478Timer: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0369A1",
    marginTop: 2,
  },
  breath478Rounds: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  // Cognitive defusion
  cardDefusion: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#F9FAFB",
  },
  defusionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  defusionSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 8,
  },
  defusionStepLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  defusionPrompt: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 8,
  },
  defusionInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 60,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  defusionReframeBox: {
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#EEF2FF",
  },
  defusionReframeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3730A3",
    marginBottom: 4,
  },
  defusionReframeText: {
    fontSize: 14,
    color: "#111827",
  },

  // Short walk
  cardWalk: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#ECFDF3",
  },
  walkTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  walkSubtitle: {
    fontSize: 13,
    color: "#16A34A",
    marginBottom: 8,
  },
  walkTimer: {
    fontSize: 28,
    fontWeight: "800",
    color: "#166534",
    marginBottom: 4,
  },
  walkPrompt: {
    fontSize: 14,
    color: "#14532D",
    marginBottom: 8,
  },

  // Micro break
  cardMicroBreak: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#F9FAFB",
  },
  microTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  microSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 8,
  },
  microTimer: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  microPrompt: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },

  // Energy audit
  cardEnergy: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#F9FAFB",
  },
  energyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  energySubtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 10,
  },
  energyColumnsRow: {
    flexDirection: "row",
  },
  energyColumn: {
    flex: 1,
    marginRight: 6,
  },
  energyColumnTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  energyItemBoost: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    marginBottom: 6,
  },
  energyItemDrain: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    marginBottom: 6,
  },
  energyItemText: {
    fontSize: 13,
    color: "#111827",
  },

  // Self-care break
  cardSelfCare: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#EFF6FF",
  },
  selfCareTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 4,
  },
  selfCareSubtitle: {
    fontSize: 13,
    color: "#3B82F6",
    marginBottom: 8,
  },
  selfCareRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  selfCareRowDone: {
    opacity: 0.85,
  },
  selfCareLabel: {
    fontSize: 14,
    color: "#111827",
  },
  selfCareProgressText: {
    marginTop: 6,
    fontSize: 12,
    color: "#4B5563",
  },

  // Task chunking (Pomodoro)
  cardPomodoro: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FEF2F2",
  },
  pomodoroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 4,
  },
  pomodoroSubtitle: {
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 8,
  },
  pomodoroStepLabel: {
    fontSize: 12,
    color: "#7F1D1D",
    marginBottom: 4,
  },
  pomodoroPrompt: {
    fontSize: 14,
    color: "#7F1D1D",
    marginBottom: 8,
  },
  pomodoroInput: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },

  // Two-minute start
  cardTwoMinute: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#ECFEFF",
  },
  twoMinuteTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#155E75",
    marginBottom: 4,
  },
  twoMinuteSubtitle: {
    fontSize: 13,
    color: "#0E7490",
    marginBottom: 8,
  },
  twoMinuteInput: {
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    marginBottom: 10,
  },
  twoMinuteTimer: {
    fontSize: 26,
    fontWeight: "800",
    color: "#155E75",
    marginBottom: 4,
  },

  // Top 3 tasks
  cardTop3: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#EEF2FF",
  },
  top3Title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#312E81",
    marginBottom: 4,
  },
  top3Subtitle: {
    fontSize: 13,
    color: "#4338CA",
    marginBottom: 8,
  },
  top3Row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  top3Rank: {
    width: 20,
    fontSize: 14,
    fontWeight: "700",
    color: "#312E81",
  },
  top3Input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C4B5FD",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    marginHorizontal: 6,
  },
  top3ButtonsColumn: {
    justifyContent: "center",
  },
  top3ArrowButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  top3ArrowText: {
    fontSize: 14,
    color: "#312E81",
  },

  // Reset break
  cardResetBreak: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#F0F9FF",
  },
  resetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0C4A6E",
    marginBottom: 4,
  },
  resetSubtitle: {
    fontSize: 13,
    color: "#0369A1",
    marginBottom: 8,
  },
  resetTimer: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0C4A6E",
    marginBottom: 4,
  },
  resetPrompt: {
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 8,
  },

  // Pomodoro study
  cardPomodoroStudy: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#EEF2FF",
  },
  studyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 4,
  },
  studySubtitle: {
    fontSize: 13,
    color: "#4338CA",
    marginBottom: 8,
  },
  studySessionsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  studySessionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
    backgroundColor: "#E5E7EB",
  },
  studySessionDotActive: {
    backgroundColor: "#6366F1",
  },
  studySessionsLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
  },

  // Stretch break
  cardStretch: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#ECFDF5",
  },
  stretchTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#15803D",
    marginBottom: 4,
  },
  stretchSubtitle: {
    fontSize: 13,
    color: "#16A34A",
    marginBottom: 8,
  },
  stretchStepLabel: {
    fontSize: 12,
    color: "#14532D",
    marginBottom: 4,
  },
  stretchPrompt: {
    fontSize: 14,
    color: "#14532D",
    marginBottom: 8,
  },
  stretchTimer: {
    fontSize: 24,
    fontWeight: "800",
    color: "#15803D",
    marginBottom: 8,
  },

  // Mindful breathing
  cardMindfulBreathing: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#E0F2FE",
  },
  mindfulTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0EA5E9",
    marginBottom: 4,
  },
  mindfulSubtitle: {
    fontSize: 13,
    color: "#0369A1",
    marginBottom: 8,
  },
  mindfulStepLabel: {
    fontSize: 12,
    color: "#0F172A",
    marginBottom: 4,
  },
  mindfulPrompt: {
    fontSize: 14,
    color: "#0F172A",
  },

  // Light journaling
  cardJournal: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#F9FAFB",
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  journalSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 8,
  },
  journalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 6,
    marginBottom: 4,
  },
  journalMoodInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  journalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    minHeight: 80,
  },

  // Plan reward
  cardReward: {
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FEF2F2",
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 4,
  },
  rewardSubtitle: {
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 8,
  },
  rewardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7F1D1D",
    marginTop: 4,
    marginBottom: 4,
  },
  rewardInput: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
});
