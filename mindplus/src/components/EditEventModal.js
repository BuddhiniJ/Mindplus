import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";

export default function EditEventModal({
  visible,
  event,
  onSave,
  onClose,
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState();

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setType(event.type || "");
      setDescription(event.description || "");
      setImportance(event.importance || 5);
    }
  }, [event]);

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title,
      type,
      description,
      importance
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700" }}>
            Edit Event
          </Text>

          <TextInput
            placeholder="Event title"
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
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={[inputStyle, { height: 80 }]}
            multiline
          />

          <View style={{ flexDirection: "row", marginVertical: 10 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <TouchableOpacity
                key={num}
                onPress={() => setImportance(num)}
                style={{
                  padding: 8,
                  margin: 4,
                  borderRadius: 6,
                  backgroundColor: importance === num ? "#4A90E2" : "#ccc"
                }}
              >
                <Text style={{ color: "white" }}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSave} style={primaryBtn}>
            <Text style={btnText}>Save Changes</Text>
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
