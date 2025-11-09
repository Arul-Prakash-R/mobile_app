import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { Stack } from "expo-router";
import { ShieldCheck, Activity, Eye, ScanSearch, CheckCircle2, Cpu, Zap, Lock, Unlock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSecurity } from "@/providers/SecurityProvider";
import Colors from "@/constants/colors";

export default function ScannerScreen() {
  const { 
    secureModeEnabled, 
    isMonitoring, 
    urlsScanned, 
    activitiesMonitored,
    isContinuousScanRunning,
    continuousScanProgress,
    toggleSecureMode,
    resetMonitoringStats,
  } = useSecurity();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMonitoring) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
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
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isMonitoring, pulseAnim]);

  useEffect(() => {
    if (isContinuousScanRunning) {
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
  }, [isContinuousScanRunning, scanAnim]);

  const handleToggleSecureMode = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    toggleSecureMode();
  };

  const handleResetStats = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetMonitoringStats();
  };

  const rotateInterpolate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Real-Time Protection",
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
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[
              styles.mainShield,
              {
                backgroundColor: secureModeEnabled ? Colors.light.success : Colors.light.textMuted,
                shadowColor: secureModeEnabled ? Colors.light.success : Colors.light.textMuted,
              }
            ]}>
              <ShieldCheck size={56} color="#fff" strokeWidth={2.5} />
            </View>
          </Animated.View>
          <Text style={styles.title}>Protection {secureModeEnabled ? "Active" : "Disabled"}</Text>
          <Text style={styles.subtitle}>
            {secureModeEnabled 
              ? "Your device is protected with real-time monitoring"
              : "Enable protection to secure your device"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            secureModeEnabled ? styles.toggleButtonActive : styles.toggleButtonInactive,
          ]}
          onPress={handleToggleSecureMode}
          activeOpacity={0.8}
        >
          <View style={styles.toggleContent}>
            <View style={styles.toggleIcon}>
              {secureModeEnabled ? (
                <Lock size={24} color="#fff" strokeWidth={2.5} />
              ) : (
                <Unlock size={24} color="#fff" strokeWidth={2.5} />
              )}
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>
                {secureModeEnabled ? "Protection Enabled" : "Protection Disabled"}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {secureModeEnabled 
                  ? "Tap to disable real-time monitoring"
                  : "Tap to enable real-time monitoring"}
              </Text>
            </View>
            {secureModeEnabled && (
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {isMonitoring && (
          <View style={styles.monitoringSection}>
            <View style={styles.monitoringHeader}>
              <Activity size={24} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={styles.monitoringTitle}>Real-Time Monitoring</Text>
            </View>

            {isContinuousScanRunning && continuousScanProgress ? (
              <View style={styles.scanningCard}>
                <View style={styles.scanningHeader}>
                  <View style={styles.scanningIconWrapper}>
                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                      <ScanSearch size={20} color={Colors.light.primary} strokeWidth={2.5} />
                    </Animated.View>
                  </View>
                  <View style={styles.scanningTextContainer}>
                    <Text style={styles.scanningTitle}>System Scanning</Text>
                    <Text style={styles.scanningSubtitle}>{continuousScanProgress.status}</Text>
                  </View>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{Math.round(continuousScanProgress.progress)}%</Text>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <Animated.View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${continuousScanProgress.progress}%` }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.scanningDetails}>
                  <View style={styles.scanningDetailItem}>
                    <Cpu size={16} color={Colors.light.textSecondary} strokeWidth={2.5} />
                    <Text style={styles.scanningDetailText} numberOfLines={1}>
                      {continuousScanProgress.currentItem}
                    </Text>
                  </View>
                  <Text style={styles.scanningCount}>
                    {continuousScanProgress.itemsScanned} / {continuousScanProgress.totalItems}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.scanningCard}>
                <View style={styles.initializingContainer}>
                  <Animated.View style={[styles.initializingIcon, { transform: [{ scale: pulseAnim }] }]}>
                    <Activity size={28} color={Colors.light.primary} strokeWidth={2.5} />
                  </Animated.View>
                  <Text style={styles.initializingTitle}>Initializing Monitor...</Text>
                  <Text style={styles.initializingSubtitle}>Starting real-time scan</Text>
                </View>
              </View>
            )}

            <View style={styles.activitySection}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              <View style={styles.activityList}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.light.successLight }]}>
                    <CheckCircle2 size={14} color={Colors.light.success} strokeWidth={2.5} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>System files verified</Text>
                    <Text style={styles.activityTime}>Just now</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.light.successLight }]}>
                    <CheckCircle2 size={14} color={Colors.light.success} strokeWidth={2.5} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>Network traffic analyzed</Text>
                    <Text style={styles.activityTime}>2 seconds ago</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: Colors.light.successLight }]}>
                    <CheckCircle2 size={14} color={Colors.light.success} strokeWidth={2.5} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>Clipboard monitored</Text>
                    <Text style={styles.activityTime}>5 seconds ago</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Protection Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.light.primaryLight }]}> 
                <Eye size={26} color={Colors.light.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.valueBox}>
                <Text style={styles.statValue}>{urlsScanned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
              </View>
              <Text style={styles.statLabel}>URLs Scanned</Text>
              <View style={[
                styles.statStatus,
                { backgroundColor: isMonitoring ? Colors.light.success : Colors.light.textMuted }
              ]}>
                <Text style={styles.statStatusText}>
                  {isMonitoring ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: Colors.light.warningLight }]}> 
                <Zap size={26} color={Colors.light.warning} strokeWidth={2.5} />
              </View>
              <View style={styles.valueBox}>
                <Text style={styles.statValue}>{activitiesMonitored.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
              </View>
              <Text style={styles.statLabel}>Activities</Text>
              <View style={[
                styles.statStatus,
                { backgroundColor: isMonitoring ? Colors.light.success : Colors.light.textMuted }
              ]}>
                <Text style={styles.statStatusText}>
                  {isMonitoring ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>

          {(urlsScanned > 0 || activitiesMonitored > 0) && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetStats}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset Statistics</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Protection Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureCard}>
              <View style={[
                styles.featureIcon,
                { backgroundColor: secureModeEnabled ? Colors.light.successLight : Colors.light.borderLight }
              ]}>
                <ShieldCheck 
                  size={22} 
                  color={secureModeEnabled ? Colors.light.success : Colors.light.textMuted} 
                  strokeWidth={2.5}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Real-Time Scanning</Text>
                <Text style={styles.featureDescription}>
                  Continuously monitors system for threats
                </Text>
              </View>
              {secureModeEnabled && (
                <View style={styles.featureActiveBadge}>
                  <Text style={styles.featureActiveText}>ON</Text>
                </View>
              )}
            </View>

            <View style={styles.featureCard}>
              <View style={[
                styles.featureIcon,
                { backgroundColor: secureModeEnabled ? Colors.light.successLight : Colors.light.borderLight }
              ]}>
                <Activity 
                  size={22} 
                  color={secureModeEnabled ? Colors.light.success : Colors.light.textMuted}
                  strokeWidth={2.5}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>URL Protection</Text>
                <Text style={styles.featureDescription}>
                  Scans clipboard for malicious links
                </Text>
              </View>
              {secureModeEnabled && (
                <View style={styles.featureActiveBadge}>
                  <Text style={styles.featureActiveText}>ON</Text>
                </View>
              )}
            </View>

            <View style={styles.featureCard}>
              <View style={[
                styles.featureIcon,
                { backgroundColor: secureModeEnabled ? Colors.light.successLight : Colors.light.borderLight }
              ]}>
                <Eye 
                  size={22} 
                  color={secureModeEnabled ? Colors.light.success : Colors.light.textMuted}
                  strokeWidth={2.5}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Activity Monitoring</Text>
                <Text style={styles.featureDescription}>
                  Tracks all device security events
                </Text>
              </View>
              {secureModeEnabled && (
                <View style={styles.featureActiveBadge}>
                  <Text style={styles.featureActiveText}>ON</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How Real-Time Protection Works</Text>
          <Text style={styles.infoText}>
            When enabled, Arul Scan & Find continuously monitors your device in real-time. 
            It scans URLs in your clipboard, monitors app activities, and detects potential 
            security threats instantly. All threats are automatically blocked and logged 
            for your review.
          </Text>
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
  header: {
    alignItems: "center",
    marginBottom: 28,
    paddingTop: 12,
  },
  mainShield: {
    width: 108,
    height: 108,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "900" as const,
    color: Colors.light.textWhite,
    marginBottom: 12,
    textAlign: "center" as const,
    letterSpacing: -0.8,
    textShadowColor: "rgba(74, 158, 255, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
    textAlign: "center" as const,
    paddingHorizontal: 32,
    lineHeight: 24,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  toggleButton: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.success,
    shadowColor: Colors.light.success,
    borderWidth: 2,
    borderColor: Colors.light.success,
  },
  toggleButtonInactive: {
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  toggleIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 19,
    fontWeight: "800" as const,
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 20,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 0.8,
  },
  monitoringSection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.light.border + "40",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  monitoringHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  monitoringTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    letterSpacing: 0.5,
    textShadowColor: "rgba(74, 158, 255, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanningCard: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.primary + "30",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  scanningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  scanningIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanningTextContainer: {
    flex: 1,
  },
  scanningTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    marginBottom: 4,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scanningSubtitle: {
    fontSize: 13,
    color: Colors.light.textLight,
    fontWeight: "500" as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  percentBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: "#fff",
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  scanningDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  scanningDetailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanningDetailText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  scanningCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: "600" as const,
  },
  initializingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  initializingIcon: {
    marginBottom: 12,
  },
  initializingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  initializingSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  activitySection: {
    marginTop: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    marginBottom: 14,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.textWhite,
    marginBottom: 4,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: "500" as const,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    marginBottom: 18,
    letterSpacing: 0.5,
    textShadowColor: "rgba(74, 158, 255, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  valueBox: {
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 10,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.border + "30",
  },
  statIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 36,
    fontWeight: "900" as const,
    color: Colors.light.textWhite,
    letterSpacing: -1.2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    // Keep width stable while numbers grow
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    marginTop: 4,
  },
  statStatus: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 4,
  },
  statStatusText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  resetButton: {
    backgroundColor: Colors.light.dangerLight,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.danger,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresList: {
    gap: 0,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.border + "30",
    marginBottom: 12,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    marginBottom: 4,
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.light.textLight,
    lineHeight: 19,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  featureActiveBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featureActiveText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.primary + "30",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.light.textWhite,
    marginBottom: 12,
    letterSpacing: 0.5,
    textShadowColor: "rgba(74, 158, 255, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  infoText: {
    fontSize: 15,
    color: Colors.light.textLight,
    lineHeight: 22,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
});
