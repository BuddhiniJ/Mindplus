import { DEFAULT_USER_TYPE } from "../utils/userTypes";

export const QUESTION_BLUEPRINTS_BY_USER_TYPE = {
  school_student: [
    {
      id: "Today-Feeling",
      text: (name) =>
        `Hi ${name}, how did you feel emotionally during school today?`,
      placeholder:
        "E.g., confident in class, anxious before a test, relaxed with friends...",
    },
    {
      id: "Focus-Class",
      text: () => "How was your focus and attention in lessons today?",
      placeholder:
        "E.g., focused in most periods, distracted after lunch, struggled in math...",
    },
    {
      id: "School-Pressure",
      text: () =>
        "What felt most stressful about school today (studies, peers, or expectations)?",
      placeholder:
        "E.g., exam pressure, group work conflict, homework pile-up...",
    },
    {
      id: "Sleep-Recovery",
      text: () => "How well did sleep and rest help you recover today?",
      placeholder:
        "E.g., slept late and felt tired, good sleep helped mood and energy...",
    },
  ],
  university_student: [
    {
      id: "Today-Feeling",
      text: (name) =>
        `Hi ${name}, how are you feeling right now about university life?`,
      placeholder:
        "E.g., motivated, overwhelmed by deadlines, balanced, uncertain...",
    },
    {
      id: "Energy",
      text: () =>
        "How was your energy level across lectures and study sessions today?",
      placeholder:
        "E.g., strong in morning lectures, drained by evening study...",
    },
    {
      id: "Academic-Load",
      text: () =>
        "How manageable did your academic workload feel today (assignments, labs, revision)?",
      placeholder:
        "E.g., manageable plan, assignment pressure, last-minute catch-up...",
    },
    {
      id: "Sleep-Duration",
      text: () => "How rested did you feel today, and how was your sleep?",
      placeholder:
        "E.g., woke up tired, felt refreshed after enough sleep, nap helped...",
    },
  ],
  early_career: [
    {
      id: "Today-Feeling",
      text: (name) =>
        `Hi ${name}, how did work affect your mood and stress today?`,
      placeholder:
        "E.g., productive and positive, tense from meetings, mentally tired...",
    },
    {
      id: "Work-Energy",
      text: () => "How steady was your energy throughout your workday?",
      placeholder:
        "E.g., energized in the morning, afternoon dip, exhausted after tasks...",
    },
    {
      id: "Work-Pressure",
      text: () =>
        "What was the biggest pressure point at work today (deadlines, communication, workload)?",
      placeholder:
        "E.g., urgent deadline, unclear expectations, too many parallel tasks...",
    },
    {
      id: "Work-Life-Recovery",
      text: () => "How well did you disconnect and recover after work?",
      placeholder:
        "E.g., switched off well, kept thinking about work, evening routine helped...",
    },
  ],
  competitive_exam: [
    {
      id: "Today-Feeling",
      text: (name) =>
        `Hi ${name}, how did your exam preparation make you feel today?`,
      placeholder:
        "E.g., focused and confident, anxious about score, mentally overloaded...",
    },
    {
      id: "Study-Consistency",
      text: () => "How consistent was your study routine today?",
      placeholder:
        "E.g., followed schedule, missed sessions, recovered with extra revision...",
    },
    {
      id: "Exam-Stress",
      text: () =>
        "What caused the most exam-related stress today (mock tests, topics, time pressure)?",
      placeholder:
        "E.g., low mock score, difficult topic, fear of falling behind...",
    },
    {
      id: "Confidence-Progress",
      text: () => "How confident do you feel about your progress right now?",
      placeholder:
        "E.g., improving steadily, confidence dropped today, need strategy change...",
    },
  ],
  freelancer_remote: [
    {
      id: "Today-Feeling",
      text: (name) =>
        `Hi ${name}, how did your remote/freelance work day feel emotionally?`,
      placeholder:
        "E.g., calm and focused, isolated, stressed by client requests...",
    },
    {
      id: "Focus-Discipline",
      text: () =>
        "How well did you maintain focus and structure while working independently?",
      placeholder:
        "E.g., deep work blocks helped, distracted at home, routine was solid...",
    },
    {
      id: "Client-Workload",
      text: () =>
        "What was your main workload challenge today (client communication, revisions, deadlines)?",
      placeholder:
        "E.g., urgent client revisions, unclear brief, juggling multiple projects...",
    },
    {
      id: "Boundaries-Rest",
      text: () =>
        "How well did you set work-life boundaries and take breaks today?",
      placeholder:
        "E.g., kept clear stop time, overworked into night, regular breaks helped...",
    },
  ],
  unemployed_youth: [
    {
      id: "Today-Feeling",
      text: (name) =>
        `Hi ${name}, how are you feeling today about your current life situation?`,
      placeholder:
        "E.g., hopeful, discouraged, calm, stressed about the future...",
    },
    {
      id: "Motivation",
      text: () =>
        "How was your motivation and energy for personal goals today?",
      placeholder:
        "E.g., felt motivated to apply/learn, low energy, small progress made...",
    },
    {
      id: "Main-Stressor",
      text: () =>
        "What was the biggest stressor today (job search, finances, family expectations, self-doubt)?",
      placeholder:
        "E.g., no callback from applications, financial worry, confidence dip...",
    },
    {
      id: "Support-Action",
      text: () =>
        "What supportive action did you take for yourself today, even if small?",
      placeholder:
        "E.g., updated CV, practiced a skill, took a mindful walk, reached out...",
    },
  ],
};

export const getQuestionBlueprintsForUserType = (userTypeId) => {
  return (
    QUESTION_BLUEPRINTS_BY_USER_TYPE[userTypeId] ||
    QUESTION_BLUEPRINTS_BY_USER_TYPE[DEFAULT_USER_TYPE]
  );
};

export const getDailyQuestionsForUserType = (userTypeId, friendlyName) => {
  return getQuestionBlueprintsForUserType(userTypeId).map((item) => ({
    id: item.id,
    prompt: item.text(friendlyName),
    placeholder: item.placeholder,
  }));
};
