export const USER_TYPES = [
  {
    id: "school_student",
    label: "School Student",
    subtitle: "Age 16-18",
  },
  {
    id: "university_student",
    label: "University / Undergraduate Student",
    subtitle: "Age 18-24",
  },
  {
    id: "early_career",
    label: "Early Career Professional",
    subtitle: "Age 22-30",
  },
  {
    id: "competitive_exam",
    label: "Competitive Exam Candidate",
    subtitle: "Focused preparation track",
  },
  {
    id: "freelancer_remote",
    label: "Freelancers / Remote Workers",
    subtitle: "Flexible schedule support",
  },
  {
    id: "unemployed_youth",
    label: "Unemployed Youth",
    subtitle: "Growth and resilience path",
  },
];

export const DEFAULT_USER_TYPE = "university_student";

export const formatUserType = (typeId) => {
  const resolvedType = typeId || DEFAULT_USER_TYPE;
  const match = USER_TYPES.find((item) => item.id === resolvedType);
  if (!match) {
    return "University / Undergraduate Student (Age 18-24)";
  }
  return `${match.label} (${match.subtitle})`;
};
