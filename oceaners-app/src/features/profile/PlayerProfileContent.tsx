import { StyleSheet, Text, View } from "react-native";

import { PROFILE_COLORS as C } from "./theme";
import { fetchPlayerAttendanceRate } from "./api";
import { useQuery } from "@tanstack/react-query";

type PlayerProfileContentProps = {
  attendedCount?: number | null;
  totalCount?: number | null;
};

export function PlayerProfileContent({
  attendedCount,
  totalCount,
}: PlayerProfileContentProps) {
  // const rate =
  //   attendanceRate !== null && Number.isFinite(attendanceRate)
  //     ? Math.round(Math.min(100, Math.max(0, attendanceRate)))
  //     : null;

  const hasCounts = attendedCount != null && totalCount != null;

  const { data: attendanceRate, isLoading } = useQuery({
    queryKey: ["player-attendance-rate"],
    queryFn: fetchPlayerAttendanceRate,
  });

  console.log(attendanceRate);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Stats entraînement</Text>

      <Text style={styles.value}>
        {attendanceRate !== undefined ? `${attendanceRate} %` : "-"}
      </Text>

      <Text style={styles.caption}>Taux de présence</Text>

      {hasCounts ? (
        <Text style={styles.detail}>
          {attendedCount} entraînement(s) suivi(s) sur {totalCount}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: {
    color: C.purple,
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: C.purple,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },
  caption: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  detail: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
