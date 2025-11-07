import React, { useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform } from "react-native";
import { AlertTriangle, X, ShieldAlert, Shield } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSecurity } from "@/providers/SecurityProvider";
import Colors from "@/constants/colors";
import { getThreatColor, getThreatLabel } from "@/utils/security";

export function EmergencyAlertModal() {
  const { emergencyAlert, dismissEmergencyAlert } = useSecurity();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (emergencyAlert) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [emergencyAlert, scaleAnim, pulseAnim]);

  const handleDismiss = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dismissEmergencyAlert();
    });
  };

  if (!emergencyAlert) return null;

  const isCritical = emergencyAlert.level === "critical";

  return (
    <Modal transparent visible={!!emergencyAlert} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: getThreatColor(emergencyAlert.level),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <X size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: getThreatColor(emergencyAlert.level) + "20",
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {isCritical ? (
              <AlertTriangle
                size={56}
                color={getThreatColor(emergencyAlert.level)}
                strokeWidth={2.5}
              />
            ) : (
              <ShieldAlert
                size={56}
                color={getThreatColor(emergencyAlert.level)}
                strokeWidth={2.5}
              />
            )}
          </Animated.View>

          <View
            style={[
              styles.badge,
              { backgroundColor: getThreatColor(emergencyAlert.level) },
            ]}
          >
            <Text style={styles.badgeText}>
              {getThreatLabel(emergencyAlert.level).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.title}>Security Alert</Text>
          <Text style={styles.subtitle}>{emergencyAlert.title}</Text>
          <Text style={styles.description}>{emergencyAlert.description}</Text>

          <View style={styles.infoBox}>
            <Shield size={18} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              {emergencyAlert.blocked
                ? "This threat has been automatically blocked"
                : "Take immediate action to protect your device"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: getThreatColor(emergencyAlert.level) },
            ]}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>I Understand</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: "center" as const,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
    lineHeight: 22,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.primary + "10",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
