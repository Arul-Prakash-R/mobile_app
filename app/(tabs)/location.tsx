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
      Alert.alert("Error", "Please enter a Gmail address (e.g., yourname@gmail.com)");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!locationTrackingEnabled && emailInput.trim() && !emailRegex.test(emailInput.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid Gmail address (e.g., yourname@gmail.com)");
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
        `Location tracking enabled!\nYour location will be sent to ${emailInput || targetEmail} every 6 hours.\n\nAn initial location has been sent immediately.`
      );
    }
  };

  const handleSendNow = async () => {
    setIsSending(true);
    console.log("📧 User clicked 'Send Location Now'");
    const result = await sendLocationNow();
    setIsSending(false);

    if (result.success) {
      Alert.alert(
        "Success", 
        "Location email sent successfully!\n\n" +
        "⚠️ If you don't receive the email:\n" +
        "• Check your Spam/Junk folder\n" +
        "• Verify EmailJS template configuration\n" +
        "• Check EmailJS service status\n" +
        "• Verify template variables match"
      );
    } else {
      let errorMessage = result.error || "Failed to send location email.";
      
      // Check for 403 error (EmailJS non-browser restriction)
      if (result.error?.includes('403') || result.error?.includes('non-browser') || result.error?.includes('non browser')) {
        errorMessage = "EmailJS Error 403: Mobile apps not supported.\n\n" +
        "EmailJS doesn't allow direct API calls from mobile apps.\n\n" +
        "Solutions:\n" +
        "• Use a backend proxy/server\n" +
        "• Use different email service\n" +
        "• Use EmailJS with server-side proxy";
      }
      
      Alert.alert(
        "Error", 
        errorMessage + "\n\n" +
        "Please check:\n" +
        "• EmailJS service configuration\n" +
        "• Template ID and Service ID\n" +
        "• Network connection"
      );
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
      <Stack.Screen 
        options={{ 
          title: "Find My Device",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.textWhite,
          headerTitleStyle: {
            color: Colors.light.textWhite,
            fontWeight: "800" as const,
          },
        }} 
      />
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
          <Text style={styles.cardTitle}>Target Gmail Address</Text>
          <Text style={styles.cardDescription}>
            Location updates will be sent to this Gmail address every 6 hours automatically. Enter your Gmail address (e.g., yourname@gmail.com)
          </Text>
          
          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="yourname@gmail.com"
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
                <Text style={styles.infoLabel}>Last Location Sent to Gmail</Text>
                <Text style={styles.infoValue}>
                  {lastLocationSent.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {locationTrackingEnabled && lastLocationSent && (
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Clock size={20} color={Colors.light.success} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Next Location Will Be Sent</Text>
                <Text style={[styles.infoValue, { color: Colors.light.success }]}>
                  {new Date(lastLocationSent.getTime() + 6 * 60 * 60 * 1000).toLocaleString()}
                </Text>
                <Text style={styles.infoSubtext}>
                  (Every 6 hours automatically)
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
                Automatically sends your device location to Gmail every 6 hours
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary + "40",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: Colors.light.textLight,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "500" as const,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700" as const,
    color: Colors.light.textLight,
    marginBottom: 10,
    letterSpacing: 0.2,
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
    backgroundColor: Colors.light.cardBackgroundDark,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
  infoSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontStyle: "italic" as const,
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
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.light.primaryDark,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.danger,
    borderColor: Colors.light.dangerDark,
    shadowColor: Colors.light.danger,
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  sendButton: {
    backgroundColor: Colors.light.success,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.light.successDark,
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
