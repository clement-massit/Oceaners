import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, X, Clock, CircleHelp, ClockFading } from "lucide-react-native";

import { COLORS, Spacing } from "@/constants/theme";
import type { TrainingAttendanceRow, TrainingAttendanceStatus } from "./type";

type Props = {
  attendance: TrainingAttendanceRow[];
  currentSectionMemberId: string | null;
  canManage: boolean;
  onSave: (
    attendance: TrainingAttendanceRow,
    status: TrainingAttendanceStatus,
  ) => void;
};

const STATUS_OPTIONS = [
  { value: "present", label: "Présent", color: COLORS.lime, Icon: Check },
  {
    value: "late",
    label: "En retard",
    color: COLORS.warning,
    Icon: ClockFading,
  },
  { value: "absent", label: "Absent", color: COLORS.error, Icon: X },
] as const;

export default function TrainingAttendance({
  attendance,
  currentSectionMemberId,
  canManage,
  onSave,
}: Props) {
  const presentCount = attendance.filter(
    (row) =>
      row.attendance_status === "present" || row.attendance_status === "late",
  ).length;

  const answeredCount = attendance.filter(
    (row) => row.attendance_status !== "pending",
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Présences</Text>
        <Text style={styles.counter}>
          {presentCount}/{attendance.length} présents
        </Text>
      </View>

      <Text style={styles.subtitle}>
        {answeredCount}/{attendance.length} réponses
      </Text>

      {attendance.map((row) => {
        const isSelf = row.id_section_member === currentSectionMemberId;
        const canEdit = isSelf || canManage;

        const selectedOption = STATUS_OPTIONS.find(
          (option) => option.value === row.attendance_status,
        );

        const StatusIcon = selectedOption?.Icon ?? CircleHelp;
        const statusColor = selectedOption?.color ?? COLORS.muted;
        const statusLabel = selectedOption?.label ?? "Pas encore répondu";

        return (
          <View key={row.id_section_member} style={styles.row}>
            <View style={styles.player}>
              <Text style={styles.playerName}>
                {row.first_name} {row.last_name}
                {isSelf ? " · toi" : ""}
              </Text>

              {row.team_role === "coach" && (
                <Text style={styles.role}>Coach</Text>
              )}
            </View>

            {canEdit ? (
              <View style={styles.statuses}>
                {STATUS_OPTIONS.map(({ value, label, color, Icon }) => {
                  const isSelected = row.attendance_status === value;

                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => onSave(row, value)}
                      style={[
                        styles.statusButton,
                        isSelected && { backgroundColor: color },
                      ]}
                    >
                      <Icon
                        size={18}
                        color={isSelected ? COLORS.text : COLORS.muted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View
                accessible
                accessibilityLabel={`Réponse : ${statusLabel}`}
                style={[styles.statusIndicator, { borderColor: statusColor }]}
              >
                <StatusIcon size={20} color={statusColor} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: Spacing.two,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  counter: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  player: {
    flex: 1,
  },
  playerName: {
    color: COLORS.text,
    fontWeight: "600",
  },
  role: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
  },
  statuses: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  disabled: {
    opacity: 0.1,
  },
  statusIndicator: {
    width: 38,
    height: 38,
    borderRadius: 12,
    // borderWidth: 1,
    // backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    // opacity: 0.8,
  },
});
