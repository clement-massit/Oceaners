// import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Link } from "expo-router";

// import { AnimatedIcon } from "@/components/animated-icon";
// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { WebBadge } from "@/components/web-badge";
// import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
// import { useRouter } from "expo-router";

// export default function HomeScreen() {
//   const router = useRouter();

//   return (
//     <ThemedView style={styles.container}>
//       <SafeAreaView style={styles.safeArea}>
//         <ThemedView style={styles.heroSection}>
//           <AnimatedIcon />

//           <ThemedText type="title" style={styles.title}>
//             Welcome to Expo
//           </ThemedText>
//         </ThemedView>

//         <ThemedView type="backgroundElement" style={styles.stepContainer}>
//           <View style={styles.teamSection}>
//             <ThemedText>Oceaners</ThemedText>

//             <Link href="/team" asChild>
//               <Pressable style={styles.button}>
//                 <Text style={styles.buttonText}>Aller à mon équipe</Text>
//               </Pressable>
//             </Link>
//           </View>
//         </ThemedView>

//         {Platform.OS === "web" && <WebBadge />}
//       </SafeAreaView>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   safeArea: {
//     flex: 1,
//     alignItems: "center",
//     gap: Spacing.three,
//     paddingHorizontal: Spacing.four,
//     paddingBottom: BottomTabInset + Spacing.three,
//     maxWidth: MaxContentWidth,
//   },
//   heroSection: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: Spacing.four,
//     paddingHorizontal: Spacing.four,
//   },
//   title: {
//     textAlign: "center",
//   },
//   stepContainer: {
//     alignSelf: "stretch",
//     gap: Spacing.three,
//     paddingHorizontal: Spacing.three,
//     paddingVertical: Spacing.four,
//     borderRadius: Spacing.four,
//   },
//   teamSection: {
//     alignItems: "center",
//     justifyContent: "center",
//     gap: Spacing.three,
//   },
//   button: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });
import { Redirect } from "expo-router";
import { useAuth } from "@/providers/auth-providers";

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
