import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from "react-native";
import { Shield, AlertTriangle, CheckCircle, Activity, Clock, Eye, ShieldCheck } from "lucide-react-native";
import { useSecurity } from "@/providers/SecurityProvider";
import Colors from "@/constants/colors";
import { getThreatColor, getThreatLabel } from "@/utils/security";
import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";

export default function DashboardScreen() {
  const { 
    getSecurityStatus, 
    threats, 
    secureModeEnabled, 
    isMonitoring,
    urlsScanned,
    activitiesMonitored 
  } = useSecurity();
  const status = getSecurityStatus();
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isMonitoring) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isMonitoring, pulseAnim]);

  const handleScan = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const recentThreats = threats.slice(0, 3);

  return (
    <>
      <Stack.Screen options={{ title: "Security Dashboard" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {isMonitoring && (
          <View style={styles.monitoringBanner}>
            <Animated.View style={[styles.monitoringIcon, { transform: [{ scale: pulseAnim }] }]}>
              <ShieldCheck size={20} color="#fff" />
            </Animated.View>
            <View style={styles.monitoringInfo}>
              <Text style={styles.monitoringTitle}>Secure Mode Active</Text>
              <Text style={styles.monitoringSubtitle}>Real-time protection enabled</Text>
            </View>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDotSmall, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveTextSmall}>LIVE</Text>
            </View>
          </View>
        )}

        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Animated.View style={{ transform: [{ scale: isMonitoring ? pulseAnim : 1 }] }}>
              <Shield
                size={48}
                color={getThreatColor(status.overall)}
                strokeWidth={2}
              />
            </Animated.View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreValue}>{status.score}</Text>
              <Text style={styles.scoreLabel}>Security Score</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getThreatColor(status.overall) + "20" }]}>
            <Text style={[styles.statusText, { color: getThreatColor(status.overall) }]}>
              {getThreatLabel(status.overall)}
            </Text>
          </View>

          <Text style={styles.scoreDescription}>
            {status.overall === "safe" 
              ? "Your device is well protected"
              : status.activeThreats > 0
              ? `${status.activeThreats} active threat${status.activeThreats > 1 ? "s" : ""} detected`
              : "Stay vigilant for potential threats"}
          </Text>

          {status.lastScanAt && (
            <View style={styles.lastScanContainer}>
              <Clock size={14} color={Colors.light.textMuted} />
              <Text style={styles.lastScanText}>
                Last scan: {new Date(status.lastScanAt).toLocaleDateString()} at{" "}
                {new Date(status.lastScanAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.light.dangerLight }]}>
            <AlertTriangle size={24} color={Colors.light.danger} />
            <Text style={styles.statValue}>{status.activeThreats}</Text>
            <Text style={styles.statLabel}>Active Threats</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.light.successLight }]}>
            <CheckCircle size={24} color={Colors.light.success} />
            <Text style={styles.statValue}>{status.threatsBlocked}</Text>
            <Text style={styles.statLabel}>Blocked</Text>
          </View>
        </View>

        {secureModeEnabled && (
          <View style={styles.realtimeStatsCard}>
            <Text style={styles.realtimeTitle}>Real-Time Monitoring</Text>
            <View style={styles.realtimeGrid}>
              <View style={styles.realtimeItem}>
                <Eye size={20} color={Colors.light.primary} />
                <Text style={styles.realtimeValue}>{activitiesMonitored}</Text>
                <Text style={styles.realtimeLabel}>Activities</Text>
              </View>
              <View style={styles.realtimeDivider} />
              <View style={styles.realtimeItem}>
                <Activity size={20} color={Colors.light.primary} />
                <Text style={styles.realtimeValue}>{urlsScanned}</Text>
                <Text style={styles.realtimeLabel}>URLs Scanned</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleScan}
          activeOpacity={0.8}
        >
          <Activity size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Run Quick Scan</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Threats</Text>
          {recentThreats.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyStateText}>No threats detected</Text>
              <Text style={styles.emptyStateSubtext}>Your device is secure</Text>
            </View>
          ) : (
            recentThreats.map((threat) => (
              <View key={threat.id} style={styles.threatCard}>
                <View style={[styles.threatIndicator, { backgroundColor: getThreatColor(threat.level) }]} />
                <View style={styles.threatContent}>
                  <View style={styles.threatHeader}>
                    <Text style={styles.threatTitle}>{threat.title}</Text>
                    {threat.blocked && (
                      <View style={styles.blockedBadge}>
                        <Text style={styles.blockedText}>Blocked</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.threatDescription} numberOfLines={2}>
                    {threat.description}
                  </Text>
                  <Text style={styles.threatTime}>
                    {new Date(threat.detectedAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.protectionSection}>
          <Text style={styles.sectionTitle}>Protection Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={secureModeEnabled ? Colors.light.success : Colors.light.textMuted} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureText}>Real-time URL scanning</Text>
                {secureModeEnabled && <Text style={styles.featureStatus}>Active</Text>}
              </View>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={secureModeEnabled ? Colors.light.success : Colors.light.textMuted} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureText}>Phishing detection</Text>
                {secureModeEnabled && <Text style={styles.featureStatus}>Active</Text>}
              </View>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={secureModeEnabled ? Colors.light.success : Colors.light.textMuted} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureText}>Clipboard monitoring</Text>
                {secureModeEnabled && <Text style={styles.featureStatus}>Active</Text>}
              </View>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={Colors.light.success} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureText}>Threat history tracking</Text>
                <Text style={styles.featureStatus}>Always On</Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  scoreCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreInfo: {
    marginLeft: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: Colors.light.text,
    lineHeight: 52,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scoreDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  lastScanContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  lastScanText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  scanButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  threatCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    flexDirection: "row",
  },
  threatIndicator: {
    width: 4,
  },
  threatContent: {
    flex: 1,
    padding: 12,
  },
  threatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  threatTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
  },
  blockedBadge: {
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  blockedText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.success,
  },
  threatDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  threatTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  protectionSection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featureText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  featureStatus: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.light.success,
    backgroundColor: Colors.light.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  monitoringBanner: {
    backgroundColor: Colors.light.success,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    shadowColor: Colors.light.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  monitoringIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  monitoringInfo: {
    flex: 1,
  },
  monitoringTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 2,
  },
  monitoringSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  liveTextSmall: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.5,
  },
  realtimeStatsCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary + "30",
  },
  realtimeTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  realtimeGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  realtimeItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  realtimeDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.light.border,
  },
  realtimeValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  realtimeLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
  },
});
