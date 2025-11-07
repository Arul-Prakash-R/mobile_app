import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useSecurity } from "@/providers/SecurityProvider";
import Colors from "@/constants/colors";
import { MapPin, Mail, Clock, Shield, Send } from "lucide-react-native";
import { Stack } from "expo-router";

export default function LocationTrackingScreen() {
  const {
    locationTrackingEnabled,
    targetEmail,
    lastLocationSent,
    locationPermissionStatus,
    toggleLocationTracking,
    updateTargetEmail,
    sendLocationNow,
  } = useSecurity();

  const [emailInput, setEmailInput] = useState(targetEmail);
  const [isSending, setIsSending] = useState(false);

  const handleToggleTracking = async () => {
    if (!emailInput.trim() && !locationTrackingEnabled) {
      Alert.alert("Error", "Please enter a target email address");
      return;
    }

    const result = await toggleLocationTracking(emailInput);
    
    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to toggle location tracking");
    } else if (locationTrackingEnabled) {
      Alert.alert("Success", "Location tracking has been disabled");
    } else {
      Alert.alert(
        "Success",
        `Location tracking enabled!\nYour location will be sent to ${emailInput} every 6 hours.`
      );
    }
  };

  const handleSendNow = async () => {
    setIsSending(true);
    const result = await sendLocationNow();
    setIsSending(false);

    if (result.success) {
      Alert.alert("Success", "Location sent successfully!");
    } else {
      Alert.alert("Error", result.error || "Failed to send location");
    }
  };

  const handleUpdateEmail = () => {
    if (!emailInput.trim()) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    updateTargetEmail(emailInput);
    Alert.alert("Success", "Target email updated");
  };

  const getPermissionStatusColor = () => {
    if (locationPermissionStatus === "granted") return Colors.light.success;
    if (locationPermissionStatus === "denied") return Colors.light.danger;
    return Colors.light.warning;
  };

  const getPermissionStatusText = () => {
    if (locationPermissionStatus === "granted") return "Granted";
    if (locationPermissionStatus === "denied") return "Denied";
    return "Not Requested";
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Find My Device" }} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MapPin size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>Find My Device</Text>
          <Text style={styles.subtitle}>
            Track your device location and send updates to a trusted contact
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Shield size={20} color={getPermissionStatusColor()} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Location Permission</Text>
              <Text style={[styles.statusValue, { color: getPermissionStatusColor() }]}>
                {getPermissionStatusText()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Target Email Address</Text>
          <Text style={styles.cardDescription}>
            Location updates will be sent to this email every 6 hours
          </Text>
          
          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          {targetEmail && emailInput !== targetEmail && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleUpdateEmail}
            >
              <Text style={styles.secondaryButtonText}>Update Email</Text>
            </TouchableOpacity>
          )}
        </View>

        {lastLocationSent && (
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Clock size={20} color={Colors.light.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Last Location Sent</Text>
                <Text style={styles.infoValue}>
                  {lastLocationSent.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How It Works</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Automatically sends your device location every 6 hours
              </Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Includes Google Maps and Apple Maps links for easy navigation
              </Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Works even when the app is in the background
              </Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Sends immediate location when first enabled
              </Text>
            </View>
          </View>
        </View>

        {locationTrackingEnabled && (
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSendNow}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Location Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.toggleButton,
            locationTrackingEnabled && styles.toggleButtonActive,
          ]}
          onPress={handleToggleTracking}
        >
          <Text style={styles.toggleButtonText}>
            {locationTrackingEnabled
              ? "Disable Location Tracking"
              : "Enable Location Tracking"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.light.text,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 7,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  toggleButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.danger,
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  sendButton: {
    backgroundColor: Colors.light.success,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  secondaryButton: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
