import { View, Text, TouchableOpacity } from "react-native";

export default function QuestionCard({ question, value, onChange }) {
  const options = [
    { label: "0 - Not at all", value: 0 },
    { label: "1 - Sometimes", value: 1 },
    { label: "2 - Often", value: 2 },
    { label: "3 - Most of the time", value: 3 }
  ];

  return (
    <View style={styles.container}>
      {/* Question Text */}
      <View style={styles.questionHeader}>
        <View style={styles.questionNumberBadge}>
          <Text style={styles.questionNumber}>{question.id}</Text>
        </View>
        <Text style={styles.questionText}>{question.text}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((opt, index) => {
          const isSelected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                index === 0 && styles.optionFirst,
                index === options.length - 1 && styles.optionLast
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                {/* Radio Button */}
                <View style={styles.radioOuter}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                
                {/* Label */}
                <Text style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected
                ]}>
                  {opt.label}
                </Text>
              </View>

              {/* Selected Indicator */}
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = {
  container: {
    marginVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  questionNumberBadge: {
    backgroundColor: "#3B82F6",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  questionNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 24,
    flex: 1,
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    minHeight: 56,
  },
  optionFirst: {
    // Optional: Add special styling for first option
  },
  optionLast: {
    // Optional: Add special styling for last option
  },
  optionSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#3B82F6",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
  },
  optionLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  optionLabelSelected: {
    color: "#1E40AF",
    fontWeight: "600",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
};