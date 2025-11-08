import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from "react-native";
import { ShieldCheck, Activity, CheckCircle, AlertTriangle, ScanSearch, Zap, Lock, Eye, Cpu, Globe } from "lucide-react-native";
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
      title: "Malicious App Installation Blocked",
      description: "This app contains trojan malware that could steal sensitive data from your device. Installation has been blocked for your protection.",
      appName: "Free Games Hack.apk",
      type: "app",
    });
  };

  const rotateInterpolate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const recentThreats = threats.slice(0, 3);

  return (
    <>
      <Stack.Screen options={{ title: "Arul Scan & Find", headerLargeTitle: true }} />
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
                  <Text style={styles.heroTitle}>Real-Time</Text>
                  <Text style={styles.heroTitle}>Security Scan</Text>
                  <Text style={styles.heroSubtitle}>
                    {isMonitoring ? "Active Protection" : "Protection Disabled"}
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
          <View style={[styles.statBox, { backgroundColor: Colors.light.dangerLight }]}>
            <View style={styles.statIconContainer}>
              <AlertTriangle size={24} color={Colors.light.danger} strokeWidth={2.5} />
            </View>
            <Text style={[styles.statValue, { color: Colors.light.danger }]}>{status.activeThreats}</Text>
            <Text style={styles.statLabel}>Threats</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: Colors.light.successLight }]}>
            <View style={styles.statIconContainer}>
              <CheckCircle size={24} color={Colors.light.success} strokeWidth={2.5} />
            </View>
            <Text style={[styles.statValue, { color: Colors.light.success }]}>{status.threatsBlocked}</Text>
            <Text style={styles.statLabel}>Blocked</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: Colors.light.primaryLight }]}>
            <View style={styles.statIconContainer}>
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
          <Text style={styles.sectionTitle}>Real-Time Monitoring</Text>
          <View style={styles.monitoringGrid}>
            <View style={styles.monitoringCard}>
              <View style={styles.monitoringIconWrapper}>
                <Globe size={22} color={Colors.light.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.monitoringValue}>{urlsScanned}</Text>
              <Text style={styles.monitoringLabel}>URLs Scanned</Text>
              <View style={[styles.monitoringStatus, { backgroundColor: isMonitoring ? Colors.light.success : Colors.light.textMuted }]}>
                <Text style={styles.monitoringStatusText}>
                  {isMonitoring ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            <View style={styles.monitoringCard}>
              <View style={styles.monitoringIconWrapper}>
                <Zap size={22} color={Colors.light.warning} strokeWidth={2.5} />
              </View>
              <Text style={styles.monitoringValue}>{activitiesMonitored}</Text>
              <Text style={styles.monitoringLabel}>Activities</Text>
              <View style={[styles.monitoringStatus, { backgroundColor: isMonitoring ? Colors.light.success : Colors.light.textMuted }]}>
                <Text style={styles.monitoringStatusText}>
                  {isMonitoring ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>
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
            <View style={[
              styles.scoreValueContainer,
              { backgroundColor: getThreatColor(status.overall) + "15" }
            ]}>
              <Text style={[
                styles.scoreValue,
                { color: getThreatColor(status.overall) }
              ]}>
                {status.score}
              </Text>
            </View>
          </View>
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
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 28,
    padding: 28,
    marginBottom: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.light.border + "20",
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
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.light.text,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: "600" as const,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.danger + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.danger + "30",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.danger,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.light.danger,
    letterSpacing: 0.8,
  },
  protectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  protectionButtonActive: {
    backgroundColor: Colors.light.danger,
    shadowColor: Colors.light.danger,
  },
  protectionButtonInactive: {
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
  },
  protectionButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800" as const,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
  },
  scanButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
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
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  scanButtonSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500" as const,
  },
  scanProgressCard: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.light.primary + "30",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
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
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
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
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  monitoringGrid: {
    flexDirection: "row",
    gap: 12,
  },
  monitoringCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    gap: 10,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.light.border + "20",
  },
  monitoringIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.light.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  monitoringValue: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.text,
    letterSpacing: -1,
  },
  monitoringLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
    textAlign: "center" as const,
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
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  threatCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.border + "20",
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
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
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
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
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
    padding: 26,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.light.border + "20",
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  scoreValueContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "800" as const,
  },
  scoreDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
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
