import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Dimensions } from "react-native";
import { ShieldCheck, Activity, CheckCircle, AlertTriangle, ScanSearch, Zap, Lock, Eye, Cpu, Globe, Smartphone, Clock, Shield } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useSecurity } from "@/providers/SecurityProvider";
import Colors from "@/constants/colors";
import { getThreatColor, getThreatLabel } from "@/utils/security";
import { Stack } from "expo-router";

export default function DashboardScreen() {
  const { 
    getSecurityStatus, 
    threats, 
    isMonitoring,
    urlsScanned,
    activitiesMonitored,
    appsScanned,
    realTimeAppScanning,
    isScanning,
    scanProgress,
    runQuickScan,
    toggleSecureMode,
    showMaliciousAlert
  } = useSecurity();
  const status = getSecurityStatus();
  const insets = useSafeAreaInsets();
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const scanAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isMonitoring) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isMonitoring, pulseAnim]);

  React.useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scanAnim.stopAnimation();
      scanAnim.setValue(0);
    }
  }, [isScanning, scanAnim]);

  const handleQuickScan = async () => {
    if (isScanning) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await runQuickScan();
  };

  const handleToggleProtection = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    toggleSecureMode();
  };

  const simulateMaliciousSite = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    showMaliciousAlert({
      title: "Malicious Website Blocked",
      description: "We detected a phishing website attempting to steal your PayPal credentials. Your security is our priority.",
      url: "http://verify-paypal-secure.phishing-site.com/login",
      type: "website",
    });
  };

  const simulateMaliciousApp = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    showMaliciousAlert({
      title: "🚨 EMERGENCY: Malicious App Installation Blocked",
      description: "This app contains trojan malware that could steal sensitive data from your device. Installation has been blocked for your protection.",
      appName: "Free Games Hack.apk",
      type: "app",
      source: "App Install",
      threatLevel: "critical",
    });
  };

  const simulateMaliciousFile = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    showMaliciousAlert({
      title: "🚨 EMERGENCY: Malicious File Detected",
      description: "This file contains malicious code that could harm your device or steal your data. Opening it may compromise your security.",
      fileName: "virus_trojan.exe",
      filePath: "Downloads/virus_trojan.exe",
      type: "file",
      source: "Downloads",
      threatLevel: "critical",
    });
  };

  const simulateMaliciousAPK = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    showMaliciousAlert({
      title: "🚨 EMERGENCY: Malicious APK Detected",
      description: "This APK file contains malicious code or suspicious patterns. Installing it may harm your device, steal your data, or compromise your security.",
      fileName: "cracked_premium_game.apk",
      filePath: "Downloads/cracked_premium_game.apk",
      type: "apk",
      source: "Downloads",
      threatLevel: "critical",
    });
  };

  const rotateInterpolate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const recentThreats = threats.slice(0, 3);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Arul Scan & Find", 
          headerLargeTitle: true,
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
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View style={styles.heroLeft}>
                <Animated.View style={{ transform: [{ scale: isMonitoring ? pulseAnim : 1 }] }}>
                  <View style={[
                    styles.shieldContainer,
                    { 
                      backgroundColor: isMonitoring ? Colors.light.success : Colors.light.textMuted,
                      shadowColor: isMonitoring ? Colors.light.success : Colors.light.textMuted,
                    }
                  ]}>
                    <ShieldCheck size={40} color="#fff" strokeWidth={2.5} />
                  </View>
                </Animated.View>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {isMonitoring ? "Real-Time Security Scan - Active Protection" : "Real-Time Security Scan - Protection Disabled"}
                  </Text>
                </View>
              </View>
              {isMonitoring && (
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={[
                styles.protectionButton,
                isMonitoring ? styles.protectionButtonActive : styles.protectionButtonInactive
              ]}
              onPress={handleToggleProtection}
              activeOpacity={0.8}
            >
              <Lock size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.protectionButtonText}>
                {isMonitoring ? "DISABLE PROTECTION" : "ENABLE PROTECTION"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderLeftColor: Colors.light.danger, borderLeftWidth: 3 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.light.danger + "20" }]}>
              <AlertTriangle size={24} color={Colors.light.danger} strokeWidth={2.5} />
            </View>
            <Text style={[styles.statValue, { color: Colors.light.danger }]}>{status.activeThreats}</Text>
            <Text style={styles.statLabel}>Threats</Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: Colors.light.success, borderLeftWidth: 3 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.light.success + "20" }]}>
              <CheckCircle size={24} color={Colors.light.success} strokeWidth={2.5} />
            </View>
            <Text style={[styles.statValue, { color: Colors.light.success }]}>{status.threatsBlocked}</Text>
            <Text style={styles.statLabel}>Blocked</Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: Colors.light.primary, borderLeftWidth: 3 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.light.primary + "20" }]}>
              <Eye size={24} color={Colors.light.primary} strokeWidth={2.5} />
            </View>
            <Text style={[styles.statValue, { color: Colors.light.primary }]}>{activitiesMonitored}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={handleQuickScan}
          activeOpacity={0.8}
          disabled={isScanning}
        >
          <View style={styles.scanButtonContent}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <ScanSearch size={24} color="#fff" strokeWidth={2.5} />
            </Animated.View>
            <View style={styles.scanButtonTextContainer}>
              <Text style={styles.scanButtonTitle}>
                {isScanning ? "Scanning System..." : "Run Security Scan"}
              </Text>
              <Text style={styles.scanButtonSubtitle}>
                {isScanning ? `${Math.round(scanProgress?.progress || 0)}% Complete` : "Deep system analysis"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isScanning && scanProgress && (
          <View style={styles.scanProgressCard}>
            <View style={styles.scanProgressHeader}>
              <View style={styles.scanProgressInfo}>
                <Activity size={18} color={Colors.light.primary} strokeWidth={2.5} />
                <Text style={styles.scanProgressTitle}>{scanProgress.status}</Text>
              </View>
              <Text style={styles.scanProgressPercent}>{Math.round(scanProgress.progress)}%</Text>
            </View>
            
            <View style={styles.progressBarOuter}>
              <Animated.View 
                style={[
                  styles.progressBarInner, 
                  { width: `${scanProgress.progress}%` }
                ]} 
              />
            </View>
            
            <View style={styles.scanProgressDetails}>
              <Cpu size={14} color={Colors.light.textSecondary} />
              <Text style={styles.scanProgressItem} numberOfLines={1}>
                {scanProgress.currentItem}
              </Text>
              <Text style={styles.scanProgressCount}>
                {scanProgress.itemsScanned}/{scanProgress.totalItems}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.monitoringSection}>
          <Text style={styles.sectionTitle}>24/7 Real-Time Protection</Text>
          <View style={styles.monitoringGrid}>
            <View style={styles.monitoringCard}>
              <View style={styles.monitoringIconWrapper}>
                <Globe size={22} color={Colors.light.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.valueBox}>
                <Text style={styles.monitoringValue}>
                  {urlsScanned}
                </Text>
              </View>
              <Text style={styles.monitoringLabel}>URLs Scanned</Text>
              <View style={[styles.monitoringStatus, { backgroundColor: isMonitoring ? Colors.light.success : Colors.light.textMuted }]}>
                <Text style={styles.monitoringStatusText}>
                  {isMonitoring ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            <View style={styles.monitoringCard}>
              <View style={styles.monitoringIconWrapper}>
                <Smartphone size={22} color={Colors.light.warning} strokeWidth={2.5} />
              </View>
              <View style={styles.valueBox}>
                <Text style={styles.monitoringValue}>
                  {appsScanned}
                </Text>
              </View>
              <Text style={styles.monitoringLabel}>Apps Scanned</Text>
              <View style={[styles.monitoringStatus, { backgroundColor: realTimeAppScanning ? Colors.light.success : Colors.light.textMuted }]}>
                <Text style={styles.monitoringStatusText}>
                  {realTimeAppScanning ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            <View style={styles.monitoringCard}>
              <View style={styles.monitoringIconWrapper}>
                <Zap size={22} color={Colors.light.danger} strokeWidth={2.5} />
              </View>
              <View style={styles.valueBox}>
                <Text style={styles.monitoringValue}>
                  {activitiesMonitored}
                </Text>
              </View>
              <Text style={styles.monitoringLabel}>Activities</Text>
              <View style={[styles.monitoringStatus, { backgroundColor: isMonitoring ? Colors.light.success : Colors.light.textMuted }]}>
                <Text style={styles.monitoringStatusText}>
                  {isMonitoring ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>
          
          {isMonitoring && (
            <View style={styles.protectionBadge}>
              <Clock size={16} color={Colors.light.success} strokeWidth={2.5} />
              <Text style={styles.protectionBadgeText}>24/7 Protection Active</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Threats</Text>
            {threats.length > 0 && (
              <View style={styles.threatBadge}>
                <Text style={styles.threatBadgeText}>{threats.length}</Text>
              </View>
            )}
          </View>
          {recentThreats.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <CheckCircle size={48} color={Colors.light.success} strokeWidth={2} />
              </View>
              <Text style={styles.emptyStateTitle}>System Secure</Text>
              <Text style={styles.emptyStateText}>No threats detected</Text>
            </View>
          ) : (
            recentThreats.map((threat) => (
              <View key={threat.id} style={styles.threatCard}>
                <View style={[styles.threatIndicator, { backgroundColor: getThreatColor(threat.level) }]} />
                <View style={styles.threatContent}>
                  <View style={styles.threatHeader}>
                    <Text style={styles.threatTitle} numberOfLines={1}>{threat.title}</Text>
                    <View style={[
                      styles.threatLevelBadge,
                      { backgroundColor: getThreatColor(threat.level) + "20" }
                    ]}>
                      <Text style={[
                        styles.threatLevelText,
                        { color: getThreatColor(threat.level) }
                      ]}>
                        {getThreatLabel(threat.level)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.threatDescription} numberOfLines={2}>
                    {threat.description}
                  </Text>
                  <View style={styles.threatFooter}>
                    <Text style={styles.threatTime}>
                      {new Date(threat.detectedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {threat.blocked && (
                      <View style={styles.blockedBadge}>
                        <Text style={styles.blockedText}>BLOCKED</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.securityScoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Security Score</Text>
          </View>
          
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChartWrapper}>
              {/* Circular Pie Chart */}
              <View style={styles.pieChartCircle}>
                <Svg width={120} height={120} style={styles.pieChartSvg}>
                  {/* Background Circle */}
                  <Circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke={Colors.light.border}
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress Circle */}
                  <Circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke={getThreatColor(status.overall)}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - status.score / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </Svg>
                <View style={styles.pieChartInner}>
                  <Text style={[
                    styles.pieChartScore,
                    { color: getThreatColor(status.overall) }
                  ]}>
                    {status.score}
                  </Text>
                  <Text style={styles.pieChartLabel}>Score</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.scoreInfoContainer}>
              <Text style={styles.scoreDescription}>
                {status.overall === "safe" 
                  ? "Your device is well protected with real-time monitoring"
                  : status.activeThreats > 0
                  ? `${status.activeThreats} active threat${status.activeThreats > 1 ? "s" : ""} require attention`
                  : "Stay vigilant for potential security threats"}
              </Text>
              <View style={[
                styles.scoreStatusBadge,
                { backgroundColor: getThreatColor(status.overall) + "20" }
              ]}>
                <Text style={[
                  styles.scoreStatusText,
                  { color: getThreatColor(status.overall) }
                ]}>
                  {getThreatLabel(status.overall).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    // Add subtle glow effect for security theme
    ...(Platform.OS === 'ios' ? {} : {
      borderLeftWidth: 3,
      borderLeftColor: Colors.light.primary,
    }),
  },
  heroContent: {
    gap: 20,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: {
    flexDirection: "row",
    gap: 16,
    flex: 1,
  },
  shieldContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    // Premium glow effect
    backgroundColor: Colors.light.success,
  },
  heroTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: Math.min(Dimensions.get('window').width * 0.06, 20),
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    lineHeight: Math.min(Dimensions.get('window').width * 0.07, 24),
    letterSpacing: -0.5,
    textShadowColor: "rgba(74, 158, 255, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    flex: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.success + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.success + "40",
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.light.success,
    letterSpacing: 1,
  },
  protectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  protectionButtonActive: {
    backgroundColor: Colors.light.danger,
    shadowColor: Colors.light.danger,
    borderColor: Colors.light.dangerDark,
  },
  protectionButtonInactive: {
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    borderColor: Colors.light.primaryDark,
  },
  protectionButtonText: {
    fontSize: Math.min(Dimensions.get('window').width * 0.035, 14),
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    // Premium card effect
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  statIconContainer: {
    marginBottom: 6,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: Math.min(Dimensions.get('window').width * 0.09, 28),
    fontWeight: "900" as const,
    letterSpacing: -1.0,
    color: Colors.light.textWhite,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: "center" as const,
  },
  statLabel: {
    fontSize: Math.min(Dimensions.get('window').width * 0.03, 11),
    color: Colors.light.textLight,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
    marginTop: 4,
    textAlign: "center" as const,
  },
  scanButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    padding: 26,
    marginBottom: 28,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: Colors.light.primaryDark,
    // Premium button glow
    borderTopColor: Colors.light.primaryLight,
    borderTopWidth: 1,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  scanButtonTextContainer: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: Math.min(Dimensions.get('window').width * 0.045, 16),
    fontWeight: "800" as const,
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scanButtonSubtitle: {
    fontSize: Math.min(Dimensions.get('window').width * 0.032, 12),
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "500" as const,
    lineHeight: Math.min(Dimensions.get('window').width * 0.04, 16),
    letterSpacing: 0.2,
  },
  scanProgressCard: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.primary + "30",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  scanProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scanProgressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  scanProgressTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    letterSpacing: 0.1,
  },
  scanProgressPercent: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.light.primary,
  },
  progressBarOuter: {
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  progressBarInner: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  scanProgressDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanProgressItem: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  scanProgressCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: "600" as const,
  },
  monitoringSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Math.min(Dimensions.get('window').width * 0.055, 20),
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    marginBottom: 16,
    letterSpacing: 0.3,
    textShadowColor: "rgba(74, 158, 255, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    backgroundColor: Colors.light.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  monitoringGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "nowrap",
    justifyContent: "space-between",
  },
  valueBox: {
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  monitoringCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackgroundLight,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    minHeight: 140,
    // Premium card styling
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  protectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.successLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.light.success + "30",
  },
  protectionBadgeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.light.success,
    letterSpacing: 0.5,
  },
  monitoringIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryLight + "25",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: Colors.light.primary + "40",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  monitoringValue: {
    fontSize: Math.min(Dimensions.get('window').width * 0.08, 28),
    fontWeight: "900" as const,
    color: Colors.light.textWhite,
    letterSpacing: -0.8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: "center" as const,
    minHeight: 32,
    // Keep numbers from shifting width when digits grow
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  monitoringLabel: {
    fontSize: Math.min(Dimensions.get('window').width * 0.03, 11),
    color: Colors.light.textLight,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
    marginTop: 2,
    lineHeight: 14,
  },
  monitoringStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  monitoringStatusText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  threatBadge: {
    backgroundColor: Colors.light.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  threatBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#fff",
  },
  emptyState: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 22,
    padding: 44,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border + "20",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyStateIcon: {
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    marginTop: 16,
    letterSpacing: 0.3,
    textShadowColor: "rgba(34, 197, 94, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.light.textLight,
    fontWeight: "500" as const,
    lineHeight: 22,
  },
  threatCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    // Premium card effect
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  threatIndicator: {
    width: 5,
  },
  threatContent: {
    flex: 1,
    padding: 16,
  },
  threatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  threatTitle: {
    flex: 1,
    fontSize: Math.min(Dimensions.get('window').width * 0.04, 15),
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    letterSpacing: 0.2,
    lineHeight: Math.min(Dimensions.get('window').width * 0.05, 20),
  },
  threatLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  threatLevelText: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  threatDescription: {
    fontSize: Math.min(Dimensions.get('window').width * 0.033, 12),
    color: Colors.light.textLight,
    lineHeight: Math.min(Dimensions.get('window').width * 0.042, 17),
    marginBottom: 10,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  threatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threatTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: "500" as const,
  },
  blockedBadge: {
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  blockedText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.light.success,
    letterSpacing: 0.5,
  },
  securityScoreCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    padding: 28,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderLeftWidth: 5,
    borderLeftColor: Colors.light.primary,
    // Premium security card
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  scoreHeader: {
    marginBottom: 0,
  },
  scoreTitle: {
    fontSize: Math.min(Dimensions.get('window').width * 0.055, 20),
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    letterSpacing: 0.5,
    textShadowColor: "rgba(74, 158, 255, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    backgroundColor: Colors.light.cardBackgroundLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    marginBottom: 16,
  },
  pieChartContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pieChartCircle: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pieChartSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  pieChartInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pieChartScore: {
    fontSize: Math.min(Dimensions.get('window').width * 0.08, 32),
    fontWeight: "900" as const,
    letterSpacing: -1.0,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pieChartLabel: {
    fontSize: Math.min(Dimensions.get('window').width * 0.025, 10),
    color: Colors.light.textMuted,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  scoreInfoContainer: {
    flex: 1,
    gap: 12,
  },
  scoreDescription: {
    fontSize: Math.min(Dimensions.get('window').width * 0.035, 13),
    color: Colors.light.textLight,
    lineHeight: Math.min(Dimensions.get('window').width * 0.045, 18),
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  scoreStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  scoreStatusText: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  },
});
