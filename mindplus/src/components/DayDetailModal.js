import { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import { calculateStressLevel, getStressMessage } from "../utils/heatmapUtils";

export default function DayDetailModal({
    visible,
    date,
    events = [],
    onAddEvent,
    onUpdateEvent,
    onDeleteEvent,
    onClose
}) {
    const [addVisible, setAddVisible] = useState(false);

    const [editVisible, setEditVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const eventsCount = events.length;
    const stressLevel = eventsCount
        ? calculateStressLevel(2, eventsCount)
        : null;

    const stressMessage = stressLevel
        ? getStressMessage(stressLevel, eventsCount)
        : "No stress prediction available for this day.";


    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
                <View style={{ backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>

                    <Text style={{ fontSize: 20, fontWeight: "700" }}>
                        {date}
                    </Text>
                    <View style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "#F9FAFB" }}>
                        <Text style={{ fontWeight: "700" }}>Stress Insight</Text>
                        <Text style={{ color: "#374151", marginTop: 4 }}>
                            {stressMessage}
                        </Text>
                    </View>
                    <Text style={{ fontWeight: "600", marginTop: 16 }}>Events</Text>

                    {events.length === 0 ? (
                        <Text style={{ color: "#6B7280" }}>No events added</Text>
                    ) : (
                        events.map((e) => (
                            <View
                                key={e.id}
                                style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    backgroundColor: "#F3F4F6",
                                    marginTop: 8,
                                }}
                            >
                                <Text style={{ fontWeight: "600" }}>{e.title}</Text>
                                <Text style={{ color: "#6B7280" }}>{e.type}</Text>

                                <View style={{ flexDirection: "row", marginTop: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedEvent(e);
                                            setEditVisible(true);
                                        }}
                                        style={{ marginRight: 16 }}
                                    >
                                        <Text style={{ color: "#3B82F6" }}>Edit</Text>
                                    </TouchableOpacity>


                                    <TouchableOpacity onPress={() => onDeleteEvent(e.id)}>
                                        <Text style={{ color: "#EF4444" }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}


                    <TouchableOpacity
                        onPress={() => setAddVisible(true)}
                        style={{
                            marginTop: 16,
                            padding: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: "#3B82F6",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "#3B82F6", fontWeight: "600" }}>
                            Add Event
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
                        <Text style={{ textAlign: "center", color: "#6B7280" }}>Close</Text>
                    </TouchableOpacity>

                    <AddEventModal
                        visible={addVisible}
                        date={date}
                        onSave={(event) => {
                            onAddEvent(event);
                            setAddVisible(false);
                        }}
                        onClose={() => setAddVisible(false)}
                    />

                    <EditEventModal
                        visible={editVisible}
                        event={selectedEvent}
                        onSave={(updatedData) => {
                            onUpdateEvent(selectedEvent.id, updatedData);
                            setEditVisible(false);
                        }}
                        onClose={() => setEditVisible(false)}
                    />

                </View>
            </View>
        </Modal>
    );
}
