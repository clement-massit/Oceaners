import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays, Clock } from "lucide-react-native";

import { COLORS } from "@/constants/theme";

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode: "date" | "time";
};

export default function DateTimeField({ label, value, onChange, mode }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  const displayValue =
    mode === "date"
      ? value.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : value.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });

  function handleChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setIsVisible(false);
    }

    if (selectedDate) {
      onChange(selectedDate);
    }
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>

        <TextInput
          style={styles.input}
          value={
            mode === "date"
              ? value.toISOString().slice(0, 10)
              : value.toTimeString().slice(0, 5)
          }
          onChangeText={(text) => {
            if (mode === "date") {
              const [year, month, day] = text.split("-").map(Number);

              if (year && month && day) {
                const next = new Date(value);
                next.setFullYear(year, month - 1, day);
                onChange(next);
              }

              return;
            }

            const [hours, minutes] = text.split(":").map(Number);

            if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
              const next = new Date(value);
              next.setHours(hours, minutes, 0, 0);
              onChange(next);
            }
          }}
          placeholder={mode === "date" ? "AAAA-MM-JJ" : "HH:mm"}
          placeholderTextColor={COLORS.muted}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.field} onPress={() => setIsVisible(true)}>
        {mode === "date" ? (
          <CalendarDays size={18} color={COLORS.header} />
        ) : (
          <Clock size={18} color={COLORS.header} />
        )}

        <Text style={styles.value}>{displayValue}</Text>
      </Pressable>

      {isVisible && (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          display={Platform.OS === "ios" ? "default" : "default"}
          onValueChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  value: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: COLORS.text,
  },
});
