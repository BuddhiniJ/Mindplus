import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function AddEventModal({ visible, date, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("exam");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      date,
      title,
      type,
      description,
    });

    setTitle("");
    setDescription("");
    setType("exam");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
          
          <Text style={{ fontSize: 20, fontWeight: "700" }}>
            Add Event ({date})
          </Text>

          <TextInput
            placeholder="Event title (e.g. Midterm Exam)"
            value={title}
            onChangeText={setTitle}
            style={inputStyle}
          />

          <TextInput
            placeholder="Type (exam / assignment / deadline)"
            value={type}
            onChangeText={setType}
            style={inputStyle}
          />

          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            style={[inputStyle, { height: 80 }]}
            multiline
          />

          <TouchableOpacity onPress={handleSave} style={primaryBtn}>
            <Text style={btnText}>Save Event</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={secondaryBtn}>
            <Text style={{ color: "#374151" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  padding: 14,
  marginTop: 12,
};

const primaryBtn = {
  backgroundColor: "#3B82F6",
  padding: 14,
  borderRadius: 12,
  marginTop: 16,
  alignItems: "center",
};

const secondaryBtn = {
  marginTop: 10,
  alignItems: "center",
};

const btnText = {
  color: "#fff",
  fontWeight: "600",
};
