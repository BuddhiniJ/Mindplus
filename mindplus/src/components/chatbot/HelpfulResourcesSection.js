import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import styles from "./chatbotStyles";

const normalizeEmotion = (value) => {
  if (!value) return "neutral";
  const e = String(value).toLowerCase();
  if (e.includes("sad")) return "sad";
  if (e.includes("depress")) return "sad";
  if (e.includes("anx")) return "anxious";
  if (e.includes("worr")) return "anxious";
  if (e.includes("fear")) return "anxious";
  if (e.includes("ang")) return "angry";
  if (e.includes("frustrat")) return "angry";
  if (e.includes("stress")) return "stressed";
  if (e.includes("overwhelm")) return "stressed";
  return e;
};

const PDF_RESOURCES = [
  {
    id: "who_doing_what_matters",
    title: "Doing What Matters in Times of Stress (WHO)",
    description:
      "A WHO self‑help guide with practical exercises to manage stress in difficult times.",
    url: "https://www.who.int/docs/default-source/mental-health/doing-what-matters-in-times-of-stress.pdf",
    emotions: ["stressed", "anxious", "sad"],
  },
  {
    id: "who_stress_management_manual",
    title: "Stress Management Guide (WHO)",
    description:
      "An evidence‑based manual from WHO on coping with stress and protecting your mental health.",
    url: "https://www.who.int/publications/i/item/9789240003927",
    emotions: ["stressed", "anxious"],
  },
  {
    id: "mhf_manage_stress",
    title: "How to Manage and Reduce Stress",
    description:
      "A practical guide with simple steps to understand and reduce everyday stress.",
    url: "https://www.mentalhealth.org.uk/sites/default/files/2022-08/how-to-manage-stress-guide.pdf",
    emotions: ["stressed", "anxious"],
  },
  {
    id: "cci_health_anxiety",
    title: "What Is Health Anxiety?",
    description:
      "A clear explanation of health anxiety and why worries about health can become overwhelming.",
    url: "https://www.cci.health.wa.gov.au/~/media/CCI/Mental-Health-Professionals/Health-Anxiety/Health-Anxiety-Information-Sheet-01-What-is-Health-Anxiety.pdf",
    emotions: ["anxious"],
  },
  {
    id: "cci_anxiety_info",
    title: "What Is Anxiety?",
    description:
      "An overview of anxiety, common symptoms, and how it can affect your life.",
    url: "https://www.cci.health.wa.gov.au/~/media/CCI/Mental-Health-Professionals/Anxiety/Anxiety-Information-Sheet-01-What-is-Anxiety.pdf",
    emotions: ["anxious", "stressed"],
  },
  {
    id: "cci_depression_info",
    title: "What Is Depression?",
    description:
      "An introductory guide to understanding depression, its signs, and how it can be treated.",
    url: "https://www.cci.health.wa.gov.au/~/media/CCI/Mental-Health-Professionals/Depression/Depression-Information-Sheet-01-What-is-Depression.pdf",
    emotions: ["sad"],
  },
  {
    id: "ac_panic_attacks",
    title: "Help for Panic Attacks",
    description:
      "Strategies from Anxiety Canada to understand and manage sudden waves of panic.",
    url: "https://www.anxietycanada.com/sites/default/files/adult_hmpanic.pdf",
    emotions: ["anxious"],
  },
  {
    id: "ac_worry_time",
    title: "Worry Time Worksheet",
    description:
      'A structured worksheet to contain worries by scheduling a specific daily "worry time".',
    url: "https://www.anxietycanada.com/sites/default/files/WorryTime.pdf",
    emotions: ["anxious", "stressed"],
  },
  {
    id: "ac_calm_breathing",
    title: "Calm Breathing Guide",
    description:
      "Step‑by‑step instructions from Anxiety Canada for calm breathing to ease anxiety.",
    url: "https://www.anxietycanada.com/sites/default/files/CalmBreathing.pdf",
    emotions: ["anxious", "stressed"],
  },
  {
    id: "mind_manage_stress",
    title: "How to Manage Stress (Mind)",
    description:
      "A guide from Mind with ideas for recognising, understanding, and managing stress.",
    url: "https://www.mind.org.uk/media-a/2892/how-to-manage-stress-2019.pdf",
    emotions: ["stressed"],
  },
  {
    id: "mind_manage_anger",
    title: "How to Manage Anger",
    description:
      "Support from Mind on understanding anger and finding safer ways to express it.",
    url: "https://www.mind.org.uk/media-a/2940/how-to-manage-anger-2018.pdf",
    emotions: ["angry", "stressed"],
  },
  {
    id: "mind_manage_anxiety",
    title: "How to Manage Anxiety",
    description:
      "Information and tips from Mind to help you manage anxiety and worry.",
    url: "https://www.mind.org.uk/media-a/2902/how-to-manage-anxiety-2018.pdf",
    emotions: ["anxious", "stressed"],
  },
  {
    id: "mind_low_mood_depression",
    title: "Managing Low Mood and Depression",
    description:
      "A Mind guide offering ideas for coping with low mood and depression.",
    url: "https://www.mind.org.uk/media-a/2941/how-to-manage-low-mood-and-depression-2018.pdf",
    emotions: ["sad"],
  },
  {
    id: "apa_stress_tips",
    title: "Stress Management Tips (APA)",
    description:
      "Practical tips from the American Psychological Association on handling stress.",
    url: "https://www.apa.org/topics/stress/tips.pdf",
    emotions: ["stressed"],
  },
  {
    id: "nimh_stress_booklet",
    title: "Stress: Coping With Everyday Problems (NIMH)",
    description:
      "An NIMH booklet explaining stress, its effects, and healthy coping strategies.",
    url: "https://www.nimh.nih.gov/sites/default/files/documents/health/publications/stress/stress.pdf",
    emotions: ["stressed", "anxious"],
  },
  {
    id: "nimh_anxiety_disorders",
    title: "Anxiety Disorders (NIMH)",
    description:
      "Information from NIMH about different anxiety disorders and treatment options.",
    url: "https://www.nimh.nih.gov/sites/default/files/documents/health/publications/anxiety-disorders/anxiety-disorders.pdf",
    emotions: ["anxious"],
  },
  {
    id: "nimh_depression_booklet",
    title: "Depression: What You Need to Know (NIMH)",
    description:
      "A booklet from NIMH that explains symptoms, causes, and treatments for depression.",
    url: "https://www.nimh.nih.gov/sites/default/files/documents/health/publications/depression/depression.pdf",
    emotions: ["sad"],
  },
  {
    id: "mha_stress_worksheet",
    title: "Stress Management Worksheet",
    description:
      "A printable worksheet from Mental Health America to help you map out stressors and coping steps.",
    url: "https://www.mhanational.org/sites/default/files/Stress%20Management%20Worksheet.pdf",
    emotions: ["stressed"],
  },
  {
    id: "mha_toolkit",
    title: "Mental Health Toolkit (MHA)",
    description:
      "A toolkit of resources from Mental Health America to support your overall mental health.",
    url: "https://www.mhanational.org/sites/default/files/Mental%20Health%20Toolkit.pdf",
    emotions: ["stressed", "sad", "anxious"],
  },
  {
    id: "unicef_support_child_covid",
    title: "Supporting Your Child During Difficult Times (UNICEF)",
    description:
      "Guidance from UNICEF on supporting children emotionally during stressful events.",
    url: "https://www.unicef.org/media/68711/file/Supporting%20your%20child%20during%20COVID-19%20guide.pdf",
    emotions: ["stressed", "anxious", "sad"],
  },
];

const VIDEO_RESOURCES = [
  {
    id: "guided_meditation",
    title: "10‑Minute Guided Meditation for Stress Relief",
    description:
      "A short, beginner‑friendly meditation to help your mind and body unwind.",
    url: "https://www.youtube.com/results?search_query=10+minute+guided+meditation+for+stress+relief",
    emotions: ["stressed", "anxious"],
  },
  {
    id: "breathing_video",
    title: "Breathing Exercises for Anxiety",
    description:
      "Follow‑along breathing to slow your heart rate and ease tension.",
    url: "https://www.youtube.com/results?search_query=breathing+exercises+for+anxiety",
    emotions: ["anxious", "stressed"],
  },
  {
    id: "anger_calm",
    title: "Techniques to Cool Down When You Feel Angry",
    description:
      "Simple practices to release anger safely and soften intense emotions.",
    url: "https://www.youtube.com/results?search_query=calming+techniques+for+anger",
    emotions: ["angry"],
  },
  {
    id: "uplifting_talk",
    title: "Short Motivational Talk for Low Mood",
    description:
      "A gentle reminder that you are not alone and that change is possible.",
    url: "https://www.youtube.com/results?search_query=motivational+talk+when+you+feel+sad",
    emotions: ["sad", "neutral"],
  },
];

const TIP_RESOURCES = [
  {
    id: "stress_exams",
    title: "Managing Stress During Exams or Deadlines",
    description:
      "Break big tasks into small, clear steps. Use short focus blocks (25 minutes) followed by brief breaks, and be kind to yourself if things take longer than planned.",
    emotions: ["stressed", "anxious"],
  },
  {
    id: "daily_habits",
    title: "Simple Daily Habits for Mental Wellness",
    description:
      "Try three basics each day: move your body a little, drink enough water, and connect with at least one supportive person or activity that feels grounding.",
    emotions: ["sad", "stressed", "neutral"],
  },
  {
    id: "calm_quickly",
    title: "Quick Techniques to Calm Your Mind",
    description:
      "Notice five things you can see, four you can touch, three you can hear, two you can smell, and one you can taste. This 5‑4‑3‑2‑1 exercise gently brings you back to the present.",
    emotions: ["anxious", "angry", "stressed"],
  },
  {
    id: "self_compassion_sad",
    title: "When You Feel Sad or Drained",
    description:
      "Speak to yourself as you would to a close friend: with gentleness, patience, and warmth. It is okay to move slowly and take up space with your feelings.",
    emotions: ["sad"],
  },
];

export default function HelpfulResourcesSection({
  emotion,
  stressLevel,
  overallStatus,
}) {
  const normalizedEmotion = useMemo(() => {
    const base = normalizeEmotion(emotion);

    // If emotion is unclear but stress is elevated, lean towards "stressed"
    const elevatedOverall = [
      "critical",
      "high_stress",
      "moderate_stress",
    ].includes(overallStatus);
    const elevatedStressLevel =
      typeof stressLevel === "string" && stressLevel.toLowerCase() === "high";

    if (
      (base === "neutral" || base === "normal") &&
      (elevatedOverall || elevatedStressLevel)
    ) {
      return "stressed";
    }

    return base;
  }, [emotion, stressLevel, overallStatus]);

  const { pdfs, videos, tips } = useMemo(() => {
    const e = normalizedEmotion;

    const pickForEmotion = (items) => {
      const primary = items.filter((x) => x.emotions.includes(e));
      const fallback = items.filter(
        (x) => !x.emotions || x.emotions.length === 0
      );
      return primary.length > 0 ? primary : fallback;
    };

    return {
      pdfs: pickForEmotion(PDF_RESOURCES),
      videos: pickForEmotion(VIDEO_RESOURCES),
      tips: pickForEmotion(TIP_RESOURCES),
    };
  }, [normalizedEmotion]);

  const handleOpenUrl = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.log("Failed to open resource URL", err);
    }
  };

  const emotionLabelMap = {
    sad: "you might be feeling low or sad",
    anxious: "you might be feeling worried or tense",
    angry: "you might be feeling frustrated or angry",
    stressed: "things might feel heavy or overwhelming",
  };

  const subtitleText =
    emotionLabelMap[normalizedEmotion] ||
    "you might be going through something challenging right now";

  return (
    <View style={styles.resourcesCard}>
      <Text style={styles.resourcesTitle}>Helpful Resources</Text>
      <Text style={styles.resourcesSubtitle}>
        Based on how you're feeling, {subtitleText}. These options are here to
        support you. You can explore them now or save them for later.
      </Text>

      {pdfs && pdfs.length > 0 && (
        <View style={styles.resourceSection}>
          <Text style={styles.resourceSectionTitle}>PDF Guides</Text>
          {pdfs.map((item) => (
            <View key={item.id} style={styles.resourceCard}>
              <Text style={styles.resourceTitle}>{item.title}</Text>
              <Text style={styles.resourceDescription}>{item.description}</Text>
              <View style={styles.resourceButtonRow}>
                <TouchableOpacity
                  style={styles.resourcePrimaryButton}
                  onPress={() => handleOpenUrl(item.url)}
                >
                  <Text style={styles.resourcePrimaryButtonText}>View PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resourceSecondaryButton}
                  onPress={() => handleOpenUrl(item.url)}
                >
                  <Text style={styles.resourceSecondaryButtonText}>
                    Download PDF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {videos && videos.length > 0 && (
        <View style={styles.resourceSection}>
          <Text style={styles.resourceSectionTitle}>Video Support</Text>
          {videos.map((item) => (
            <View key={item.id} style={styles.resourceCard}>
              <Text style={styles.resourceTitle}>{item.title}</Text>
              <Text style={styles.resourceDescription}>{item.description}</Text>
              <View style={styles.resourceButtonRow}>
                <TouchableOpacity
                  style={styles.resourcePrimaryButton}
                  onPress={() => handleOpenUrl(item.url)}
                >
                  <Text style={styles.resourcePrimaryButtonText}>
                    Watch Video
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {tips && tips.length > 0 && (
        <View style={styles.resourceSection}>
          <Text style={styles.resourceSectionTitle}>Quick Tips</Text>
          {tips.map((item) => (
            <View key={item.id} style={styles.resourceTipCard}>
              <Text style={styles.resourceTitle}>{item.title}</Text>
              <Text style={styles.resourceDescription}>{item.description}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
