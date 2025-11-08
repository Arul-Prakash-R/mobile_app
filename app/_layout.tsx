import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ShieldOff } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found" }} />
      <View style={styles.container}>
        <ShieldOff size={64} color={Colors.light.textMuted} />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.description}>
          This page doesn&apos;t exist or has been removed.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Dashboard</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.light.background,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  link: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#fff",
  },
});
