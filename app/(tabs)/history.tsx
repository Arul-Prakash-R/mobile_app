import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Stack } from "expo-router";
import { History, Trash2, ShieldOff, AlertCircle, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSecurity } from "@/providers/SecurityProvider";
import Colors from "@/constants/colors";
import { getThreatColor, getThreatLabel } from "@/utils/security";
import { Threat } from "@/types/security";

export default function HistoryScreen() {
  const { threats, removeThreat, blockThreat, clearAllThreats } = useSecurity();

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
          headerRight: threats.length > 0 ? () => (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
              <Trash2 size={20} color={Colors.light.danger} />
            </TouchableOpacity>
          ) : undefined,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {threats.length === 0 ? (
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
    padding: 16,
    paddingBottom: 32,
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
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
  },
  statsHeader: {
    flexDirection: "row",
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  threatList: {
    gap: 12,
  },
  threatCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 6,
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
});
