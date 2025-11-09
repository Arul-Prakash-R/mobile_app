import React, { useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Platform } from "react-native";
import { ShieldX, AlertOctagon, X, Ban, ExternalLink, Globe, AlertTriangle, CheckCircle, File, Package, Info } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getCVESeverityColor } from "@/utils/cveDatabase";

interface MaliciousAlertProps {
  visible: boolean;
  onDismiss: () => void;
  onBlock: () => void;
  onContinue?: () => void; // New: Allow user to proceed
  title: string;
  description: string;
  url?: string;
  appName?: string;
  fileName?: string;
  filePath?: string;
  type: "website" | "app" | "file" | "apk";
  source?: string; // Where the malicious item was detected (e.g., "WhatsApp", "Instagram", "Downloads")
  cveInfo?: {
    cveId: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    description: string;
    cvssScore?: number;
    publishedDate?: string;
  };
}

export function MaliciousAlertModal({
  visible,
  onDismiss,
  onBlock,
  onContinue,
  title,
  description,
  url,
  appName,
  fileName,
  filePath,
  type,
  source,
  cveInfo,
}: MaliciousAlertProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const interval = setInterval(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 1000);
        
        setTimeout(() => clearInterval(interval), 3000);
      }

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [visible, scaleAnim, shakeAnim, pulseAnim]);

  const handleBlock = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onBlock();
    });
  };

  const handleDismiss = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleContinue = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (onContinue) {
        onContinue();
      } else {
        onDismiss();
      }
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          <View style={styles.dangerStripe} />
          
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
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.iconBackground}>
              <ShieldX size={64} color="#fff" strokeWidth={2.5} />
            </View>
          </Animated.View>

          <View style={styles.dangerBadge}>
            <AlertOctagon size={16} color="#fff" strokeWidth={2.5} />
            <Text style={styles.badgeText}>DANGER DETECTED</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {/* CVE Information Display */}
          {cveInfo && (
            <View style={[styles.cveBox, { borderColor: getCVESeverityColor(cveInfo.severity) }]}>
              <View style={styles.cveHeader}>
                <Info size={18} color={getCVESeverityColor(cveInfo.severity)} />
                <Text style={styles.cveLabel}>CVE Vulnerability Detected</Text>
              </View>
              <View style={styles.cveContent}>
                <View style={styles.cveRow}>
                  <Text style={styles.cveIdLabel}>CVE ID:</Text>
                  <Text style={[styles.cveId, { color: getCVESeverityColor(cveInfo.severity) }]}>
                    {cveInfo.cveId}
                  </Text>
                </View>
                <View style={styles.cveRow}>
                  <Text style={styles.cveIdLabel}>Severity:</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getCVESeverityColor(cveInfo.severity) + "20" }]}>
                    <Text style={[styles.severityText, { color: getCVESeverityColor(cveInfo.severity) }]}>
                      {cveInfo.severity}
                    </Text>
                  </View>
                </View>
                {cveInfo.cvssScore && (
                  <View style={styles.cveRow}>
                    <Text style={styles.cveIdLabel}>CVSS Score:</Text>
                    <Text style={[styles.cvssScore, { color: getCVESeverityColor(cveInfo.severity) }]}>
                      {cveInfo.cvssScore}/10.0
                    </Text>
                  </View>
                )}
                <Text style={styles.cveDescription}>{cveInfo.description}</Text>
                {cveInfo.publishedDate && (
                  <Text style={styles.cveDate}>Published: {cveInfo.publishedDate}</Text>
                )}
              </View>
            </View>
          )}

          {type === "website" && url && (
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Globe size={18} color={Colors.light.danger} />
                <Text style={styles.detailLabel}>Malicious URL:</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>{url}</Text>
              {source && (
                <Text style={styles.sourceText}>Detected in: {source}</Text>
              )}
            </View>
          )}

          {type === "app" && appName && (
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <ExternalLink size={18} color={Colors.light.danger} />
                <Text style={styles.detailLabel}>Suspicious App:</Text>
              </View>
              <Text style={styles.detailValue}>{appName}</Text>
              {source && (
                <Text style={styles.sourceText}>Detected in: {source}</Text>
              )}
            </View>
          )}

          {type === "file" && fileName && (
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <File size={18} color={Colors.light.danger} />
                <Text style={styles.detailLabel}>Malicious File:</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>{fileName}</Text>
              {filePath && (
                <Text style={styles.sourceText}>Path: {filePath}</Text>
              )}
              {source && (
                <Text style={styles.sourceText}>Detected in: {source}</Text>
              )}
            </View>
          )}

          {type === "apk" && fileName && (
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Package size={18} color={Colors.light.danger} />
                <Text style={styles.detailLabel}>Malicious APK:</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>{fileName}</Text>
              {filePath && (
                <Text style={styles.sourceText}>Path: {filePath}</Text>
              )}
              {source && (
                <Text style={styles.sourceText}>Detected in: {source}</Text>
              )}
            </View>
          )}

          <View style={styles.warningBox}>
            <AlertOctagon size={20} color={Colors.light.danger} strokeWidth={2.5} />
            <Text style={styles.warningText}>
              {type === "website" 
                ? "This website may steal your personal information, passwords, or financial data. Do not proceed."
                : type === "apk"
                ? "This APK contains malicious code that could harm your device, steal sensitive data, or compromise your security. Do not install."
                : type === "file"
                ? "This file contains malicious code or suspicious patterns. Opening it may harm your device or steal your data. Do not open."
                : "This app contains malicious code that could harm your device or steal sensitive data. Do not install."}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.blockButton}
              onPress={handleBlock}
              activeOpacity={0.8}
            >
              <Ban size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.blockButtonText}>BLOCK & PROTECT</Text>
            </TouchableOpacity>
            
            {onContinue && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <AlertTriangle size={20} color={Colors.light.warning} strokeWidth={2.5} />
                <Text style={styles.continueButtonText}>CONTINUE ANYWAY</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.footerText}>
            Protected by Arul Scan & Find Real-Time Security
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 28,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.light.danger,
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
    overflow: "hidden",
  },
  dangerStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: Colors.light.danger,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  iconContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  dangerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "900" as const,
    color: Colors.light.textWhite,
    marginBottom: 16,
    textAlign: "center" as const,
    letterSpacing: 0.5,
    textShadowColor: "rgba(255, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: 38,
  },
  description: {
    fontSize: 17,
    color: Colors.light.textLight,
    textAlign: "center" as const,
    lineHeight: 26,
    marginBottom: 28,
    paddingHorizontal: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  detailsBox: {
    width: "100%",
    backgroundColor: Colors.light.dangerLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.danger + "30",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.danger,
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  sourceText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
    fontStyle: "italic" as const,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.light.danger + "10",
    padding: 18,
    borderRadius: 14,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.danger + "30",
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  blockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.light.danger,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  blockButtonText: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 0.8,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.light.warningLight,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.warning,
    marginTop: 12,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.light.warning,
    letterSpacing: 0.8,
  },
  footerText: {
    fontSize: 11,
    color: Colors.light.textMuted,
    textAlign: "center" as const,
    marginTop: 16,
    fontWeight: "600" as const,
  },
  cveBox: {
    backgroundColor: Colors.light.cardBackgroundDark,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderLeftWidth: 4,
  },
  cveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cveLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.textLight,
    letterSpacing: 0.3,
  },
  cveContent: {
    gap: 8,
  },
  cveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cveIdLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
  },
  cveId: {
    fontSize: 14,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
  },
  cvssScore: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  cveDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  cveDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 4,
    fontStyle: "italic" as const,
  },
});
