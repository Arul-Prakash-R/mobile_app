import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Stack } from "expo-router";
import { History, Trash2, ShieldOff, AlertCircle, CheckCircle, FileText, Shield } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSecurity } from "@/providers/SecurityProvider";
import Colors from "@/constants/colors";
import { getThreatColor, getThreatLabel } from "@/utils/security";
import { Threat, SecurityLog } from "@/types/security";

export default function HistoryScreen() {
  const { threats, removeThreat, blockThreat, clearAllThreats, securityLogs } = useSecurity();
  const [showLogs, setShowLogs] = React.useState(false);

  const handleRemoveThreat = (threatId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeThreat(threatId);
  };

  const handleBlockThreat = (threatId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    blockThreat(threatId);
  };

  const handleClearAll = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    clearAllThreats();
  };

  const getThreatIcon = (threat: Threat) => {
    switch (threat.type) {
      case "phishing":
        return <AlertCircle size={20} color={getThreatColor(threat.level)} />;
      case "malicious_url":
        return <ShieldOff size={20} color={getThreatColor(threat.level)} />;
      default:
        return <AlertCircle size={20} color={getThreatColor(threat.level)} />;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Threat History",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.textWhite,
          headerTitleStyle: {
            color: Colors.light.textWhite,
            fontWeight: "800" as const,
          },
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 12 }}>
              {threats.length > 0 && (
                <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
                  <Trash2 size={20} color={Colors.light.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowLogs(!showLogs)} style={styles.headerButton}>
                <FileText size={20} color={showLogs ? Colors.light.primary : Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {showLogs ? (
          <>
            <View style={styles.statsHeader}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{securityLogs.length}</Text>
                <Text style={styles.statLabel}>Total Logs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.light.danger }]}>
                  {securityLogs.filter(l => l.action === "blocked").length}
                </Text>
                <Text style={styles.statLabel}>Blocked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.light.warning }]}>
                  {securityLogs.filter(l => l.action === "allowed").length}
                </Text>
                <Text style={styles.statLabel}>Allowed</Text>
              </View>
            </View>

            {securityLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={64} color={Colors.light.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>No Security Logs</Text>
                <Text style={styles.emptyStateText}>
                  Security activity logs will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.logList}>
                {securityLogs.map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={[styles.logBorder, { backgroundColor: getThreatColor(log.threatLevel) }]} />
                    <View style={styles.logContent}>
                      <View style={styles.logHeader}>
                        <View style={styles.logHeaderLeft}>
                          <Shield size={18} color={getThreatColor(log.threatLevel)} />
                          <View style={styles.logHeaderText}>
                            <Text style={styles.logTitle}>{log.description}</Text>
                            <View style={[
                              styles.logBadge,
                              { backgroundColor: log.action === "blocked" ? Colors.light.danger + "20" : log.action === "allowed" ? Colors.light.warning + "20" : Colors.light.primary + "20" }
                            ]}>
                              <Text style={[
                                styles.logBadgeText,
                                { color: log.action === "blocked" ? Colors.light.danger : log.action === "allowed" ? Colors.light.warning : Colors.light.primary }
                              ]}>
                                {log.action.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.logMeta}>
                        <Text style={styles.logSource}>Source: {log.source}</Text>
                        {log.url && (
                          <Text style={styles.logUrl} numberOfLines={1}>
                            URL: {log.url}
                          </Text>
                        )}
                        {log.appName && (
                          <Text style={styles.logApp}>App: {log.appName}</Text>
                        )}
                        {log.fileName && (
                          <Text style={styles.logUrl} numberOfLines={1}>
                            File: {log.fileName}
                          </Text>
                        )}
                        {log.filePath && (
                          <Text style={styles.logUrl} numberOfLines={1}>
                            Path: {log.filePath}
                          </Text>
                        )}
                        <Text style={styles.logTime}>
                          {new Date(log.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : threats.length === 0 ? (
          <View style={styles.emptyState}>
            <History size={64} color={Colors.light.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>No Threat History</Text>
            <Text style={styles.emptyStateText}>
              All detected threats will appear here
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsHeader}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{threats.length}</Text>
                <Text style={styles.statLabel}>Total Threats</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.light.danger }]}>
                  {threats.filter(t => !t.blocked).length}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.light.success }]}>
                  {threats.filter(t => t.blocked).length}
                </Text>
                <Text style={styles.statLabel}>Blocked</Text>
              </View>
            </View>

            <View style={styles.threatList}>
              {threats.map((threat) => (
                <View key={threat.id} style={styles.threatCard}>
                  <View
                    style={[
                      styles.threatBorder,
                      { backgroundColor: getThreatColor(threat.level) },
                    ]}
                  />
                  <View style={styles.threatContent}>
                    <View style={styles.threatHeader}>
                      <View style={styles.threatHeaderLeft}>
                        {getThreatIcon(threat)}
                        <View style={styles.threatHeaderText}>
                          <Text style={styles.threatTitle}>{threat.title}</Text>
                          <View style={[
                            styles.levelBadge,
                            { backgroundColor: getThreatColor(threat.level) + "20" }
                          ]}>
                            <Text style={[
                              styles.levelText,
                              { color: getThreatColor(threat.level) }
                            ]}>
                              {getThreatLabel(threat.level)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {threat.blocked && (
                        <View style={styles.statusBadge}>
                          <CheckCircle size={16} color={Colors.light.success} />
                        </View>
                      )}
                    </View>

                    <Text style={styles.threatDescription} numberOfLines={2}>
                      {threat.description}
                    </Text>

                    <View style={styles.threatMeta}>
                      <Text style={styles.threatSource} numberOfLines={1}>
                        Source: {threat.source}
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

                    <View style={styles.threatActions}>
                      {!threat.blocked && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.blockButton]}
                          onPress={() => handleBlockThreat(threat.id)}
                          activeOpacity={0.7}
                        >
                          <ShieldOff size={16} color="#fff" />
                          <Text style={styles.blockButtonText}>Block</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={() => handleRemoveThreat(threat.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={16} color={Colors.light.danger} />
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
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
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.light.textLight,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
    fontWeight: "500" as const,
    lineHeight: 22,
  },
  statsHeader: {
    flexDirection: "row",
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    gap: 20,
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.textLight,
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  threatList: {
    gap: 12,
  },
  threatCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  threatBorder: {
    width: 5,
  },
  threatContent: {
    flex: 1,
    padding: 16,
  },
  threatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  threatHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  threatHeaderText: {
    flex: 1,
  },
  threatTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.light.textLight,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  statusBadge: {
    backgroundColor: Colors.light.successLight,
    padding: 6,
    borderRadius: 20,
  },
  threatDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  threatMeta: {
    marginBottom: 12,
  },
  threatSource: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 4,
  },
  threatTime: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  threatActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  blockButton: {
    backgroundColor: Colors.light.primary,
    flex: 1,
  },
  blockButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
  },
  removeButton: {
    backgroundColor: Colors.light.dangerLight,
    flex: 1,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.danger,
  },
  logList: {
    gap: 12,
  },
  logCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: Colors.light.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  logBorder: {
    width: 5,
  },
  logContent: {
    flex: 1,
    padding: 16,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  logHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  logHeaderText: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.textLight,
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  logBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  logMeta: {
    marginTop: 8,
    gap: 4,
  },
  logSource: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  logUrl: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  logApp: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  logTime: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 4,
    fontWeight: "500" as const,
  },
});
