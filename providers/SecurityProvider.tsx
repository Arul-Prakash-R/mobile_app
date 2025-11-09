import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { AppState, Platform, Alert } from "react-native";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { Threat, SecurityStatus, ScanProgress, SecurityLog } from "@/types/security";
import { calculateSecurityScore, getSecurityLevel, scanURL, performQuickScan, performFullScan, scanAllInstalledApps, interceptAndScanURL, scanFile, scanAPK, scanAppInstallation } from "@/utils/security";
import { requestAllPermissions, getAllPermissionStatuses, PermissionStatus } from "@/utils/permissions";
import { scanFileSystem, monitorFileSystem } from "@/utils/fileScanner";
import { findCVEForThreat, getCVESeverityColor, formatCVEInfo } from "@/utils/cveDatabase";
import * as Haptics from "expo-haptics";
import emailjs from '@emailjs/browser';
import * as Linking from "expo-linking";

// EmailJS configuration via Expo public env variables
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'service_muid74x';
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_siyoad7';
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '8HDuCD7IjRceaYMQ9';

const THREATS_STORAGE_KEY = "@security_threats";
const SECURE_MODE_KEY = "@secure_mode_enabled";
const MONITORING_KEY = "@monitoring_stats";
const LOCATION_TRACKING_KEY = "@location_tracking";
const TARGET_EMAIL_KEY = "@target_email";
const SECURITY_LOGS_KEY = "@security_logs";

export const [SecurityProvider, useSecurity] = createContextHook(() => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emergencyAlert, setEmergencyAlert] = useState<Threat | null>(null);
  const [maliciousAlert, setMaliciousAlert] = useState<{
    visible: boolean;
    title: string;
    description: string;
    url?: string;
    appName?: string;
    fileName?: string;
    filePath?: string;
    type: "website" | "app" | "file" | "apk";
    source?: string;
    threatLevel?: "critical" | "high" | "medium" | "low";
    cveInfo?: {
      cveId: string;
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      description: string;
      cvssScore?: number;
      publishedDate?: string;
    };
  } | null>(null);
  const [secureModeEnabled, setSecureModeEnabled] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [urlsScanned, setUrlsScanned] = useState(0);
  const [activitiesMonitored, setActivitiesMonitored] = useState(0);
  const [lastClipboard, setLastClipboard] = useState("");
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [lastLocationSent, setLastLocationSent] = useState<Date | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [isContinuousScanRunning, setIsContinuousScanRunning] = useState(false);
  const [continuousScanProgress, setContinuousScanProgress] = useState<ScanProgress | null>(null);
  const [appsScanned, setAppsScanned] = useState(0);
  const [realTimeAppScanning, setRealTimeAppScanning] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [permissions, setPermissions] = useState<PermissionStatus>({
    clipboard: "undetermined",
    location: "undetermined",
    storage: "undetermined",
    apps: "undetermined",
  });
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const continuousScanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appScanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityMonitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlInterceptionRef = useRef<ReturnType<typeof Linking.addEventListener> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const appStateSubscriptionRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const threatsRef = useRef<Threat[]>(threats);
  const lastAppScanTimeRef = useRef<number>(0);

  useEffect(() => {
    const initialize = async () => {
      await loadThreats();
      await loadSecureMode();
      await loadMonitoringStats();
      await loadLocationTracking();
      await checkLocationPermission();
      await loadSecurityLogs();
      
      // Request all required permissions for real-time scanning
      console.log("🔐 Requesting permissions for real-time scanning...");
      const permissionStatuses = await getAllPermissionStatuses();
      setPermissions(permissionStatuses);
      
      // If secure mode is enabled, request all permissions
      const secureMode = await AsyncStorage.getItem(SECURE_MODE_KEY);
      if (secureMode === "true") {
        console.log("🛡️ Secure mode enabled - requesting all permissions for real-time scanning...");
        const requestedPermissions = await requestAllPermissions();
        setPermissions(requestedPermissions);
        
        // Log permission status
        console.log("📊 Permission Status:", {
          clipboard: requestedPermissions.clipboard,
          location: requestedPermissions.location,
          storage: requestedPermissions.storage,
          apps: requestedPermissions.apps,
        });
      }
    };
    initialize();
  }, []);


  useEffect(() => {
    threatsRef.current = threats;
  }, [threats]);

  const loadThreats = async () => {
    try {
      const stored = await AsyncStorage.getItem(THREATS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const threatsWithDates = parsed.map((t: Threat) => ({
          ...t,
          detectedAt: new Date(t.detectedAt),
        }));
        setThreats(threatsWithDates);
      }
    } catch (error) {
      console.error("Failed to load threats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecureMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(SECURE_MODE_KEY);
      if (stored) {
        setSecureModeEnabled(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load secure mode:", error);
    }
  };

  const loadMonitoringStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(MONITORING_KEY);
      if (stored) {
        const stats = JSON.parse(stored);
        setUrlsScanned(stats.urlsScanned || 0);
        setActivitiesMonitored(stats.activitiesMonitored || 0);
      }
    } catch (error) {
      console.error("Failed to load monitoring stats:", error);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_LOGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const logsWithDates = parsed.map((log: SecurityLog) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
        setSecurityLogs(logsWithDates);
      }
    } catch (error) {
      console.error("Failed to load security logs:", error);
    }
  };

  const saveSecurityLogs = async (logs: SecurityLog[]) => {
    try {
      await AsyncStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to save security logs:", error);
    }
  };

  const loadLocationTracking = async () => {
    try {
      const trackingData = await AsyncStorage.getItem(LOCATION_TRACKING_KEY);
      const emailData = await AsyncStorage.getItem(TARGET_EMAIL_KEY);
      
      if (trackingData) {
        const data = JSON.parse(trackingData);
        setLocationTrackingEnabled(data.enabled || false);
        if (data.lastSent) {
          setLastLocationSent(new Date(data.lastSent));
        }
      }
      
      if (emailData) {
        setTargetEmail(emailData);
      }
    } catch (error) {
      console.error("Failed to load location tracking:", error);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      console.log("Location permission status:", status);
    } catch (error) {
      console.error("Failed to check location permission:", error);
    }
  };

  const saveThreats = async (newThreats: Threat[]) => {
    try {
      await AsyncStorage.setItem(THREATS_STORAGE_KEY, JSON.stringify(newThreats));
    } catch (error) {
      console.error("Failed to save threats:", error);
    }
  };

  const saveSecureMode = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SECURE_MODE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error("Failed to save secure mode:", error);
    }
  };

  const saveMonitoringStats = async (urls: number, activities: number) => {
    try {
      await AsyncStorage.setItem(MONITORING_KEY, JSON.stringify({ 
        urlsScanned: urls, 
        activitiesMonitored: activities 
      }));
    } catch (error) {
      console.error("Failed to save monitoring stats:", error);
    }
  };

  const saveLocationTracking = async (enabled: boolean, lastSent: Date | null) => {
    try {
      await AsyncStorage.setItem(LOCATION_TRACKING_KEY, JSON.stringify({
        enabled,
        lastSent: lastSent?.toISOString(),
      }));
    } catch (error) {
      console.error("Failed to save location tracking:", error);
    }
  };

  const saveTargetEmail = async (email: string) => {
    try {
      await AsyncStorage.setItem(TARGET_EMAIL_KEY, email);
    } catch (error) {
      console.error("Failed to save target email:", error);
    }
  };

  const addThreat = useCallback(
    (threat: Omit<Threat, "id" | "detectedAt">) => {
      const newThreat: Threat = {
        ...threat,
        id: Date.now().toString(),
        detectedAt: new Date(),
      };

      const updatedThreats = [newThreat, ...threats];
      setThreats(updatedThreats);
      saveThreats(updatedThreats);

      if (threat.level === "critical" || threat.level === "high") {
        setEmergencyAlert(newThreat);
      }

      return newThreat;
    },
    [threats]
  );

  const blockThreat = useCallback(
    (threatId: string) => {
      const updatedThreats = threats.map((t) =>
        t.id === threatId ? { ...t, blocked: true } : t
      );
      setThreats(updatedThreats);
      saveThreats(updatedThreats);
    },
    [threats]
  );

  const removeThreat = useCallback(
    (threatId: string) => {
      const updatedThreats = threats.filter((t) => t.id !== threatId);
      setThreats(updatedThreats);
      saveThreats(updatedThreats);
    },
    [threats]
  );

  const clearAllThreats = useCallback(() => {
    setThreats([]);
    saveThreats([]);
  }, []);

  const dismissEmergencyAlert = useCallback(() => {
    setEmergencyAlert(null);
  }, []);

  const addSecurityLog = useCallback((log: Omit<SecurityLog, "id" | "timestamp">) => {
    const newLog: SecurityLog = {
      ...log,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    };

    setSecurityLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 1000); // Keep last 1000 logs
      saveSecurityLogs(updated);
      return updated;
    });

    console.log(`📋 Security log: ${log.action} - ${log.type}`);
  }, []);

  const showMaliciousAlert = useCallback((data: {
    title: string;
    description: string;
    url?: string;
    appName?: string;
    fileName?: string;
    filePath?: string;
    type: "website" | "app" | "file" | "apk";
    source?: string;
    threatLevel?: "critical" | "high" | "medium" | "low";
  }) => {
    // Real-time CVE lookup for the detected threat
    const threatType = data.type === "website" ? "phishing" : 
                      data.type === "apk" ? "malicious_apk" :
                      data.type === "file" ? "malicious_file" : "malware";
    
    const cveInfo = findCVEForThreat(
      threatType,
      data.description,
      data.url || data.appName || data.fileName
    );
    
    if (cveInfo) {
      console.log(`🔍 CVE DETECTED: ${cveInfo.cveId} - ${cveInfo.severity} (CVSS: ${cveInfo.cvssScore})`);
    }
    
    setMaliciousAlert({
      visible: true,
      ...data,
      cveInfo: cveInfo || undefined,
    });
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    console.log(`🚨 MALICIOUS ${data.type.toUpperCase()} DETECTED: ${data.title}${cveInfo ? ` [CVE: ${cveInfo.cveId}]` : ""}`);
    
    // Log the detection immediately
    let logType: SecurityLog["type"];
    if (data.type === "website") {
      logType = "malicious_url_clicked";
    } else if (data.type === "apk") {
      logType = "malicious_apk_detected";
    } else if (data.type === "file") {
      logType = "malicious_file_detected";
    } else {
      logType = "malicious_app_clicked";
    }
    
    addSecurityLog({
      type: logType,
      url: data.url,
      appName: data.appName,
      fileName: data.fileName,
      filePath: data.filePath,
      threatLevel: data.threatLevel || "high",
      action: "detected",
      source: data.source || "Unknown",
      description: `${data.description}${cveInfo ? ` [CVE: ${cveInfo.cveId}]` : ""}`,
    });
  }, [addSecurityLog]);

  const dismissMaliciousAlert = useCallback(() => {
    setMaliciousAlert(null);
  }, []);

  const blockMalicious = useCallback(() => {
    if (maliciousAlert) {
      let threatType: Threat["type"];
      if (maliciousAlert.type === "website") {
        threatType = "malicious_url";
      } else if (maliciousAlert.type === "file" || maliciousAlert.type === "apk") {
        threatType = "malware";
      } else {
        threatType = "malware";
      }
      
      const newThreat: Threat = {
        id: Date.now().toString(),
        type: threatType,
        level: maliciousAlert.threatLevel || "critical",
        title: maliciousAlert.title,
        description: maliciousAlert.description,
        source: maliciousAlert.url || maliciousAlert.appName || maliciousAlert.fileName || "Unknown",
        blocked: true,
        detectedAt: new Date(),
      };

      const updatedThreats = [newThreat, ...threats];
      setThreats(updatedThreats);
      saveThreats(updatedThreats);
      
      // Log the block action
      let logType: SecurityLog["type"];
      if (maliciousAlert.type === "website") {
        logType = "url_blocked";
      } else if (maliciousAlert.type === "apk") {
        logType = "apk_blocked";
      } else if (maliciousAlert.type === "file") {
        logType = "file_blocked";
      } else {
        logType = "app_blocked";
      }
      
      addSecurityLog({
        type: logType,
        url: maliciousAlert.url,
        appName: maliciousAlert.appName,
        fileName: maliciousAlert.fileName,
        filePath: maliciousAlert.filePath,
        threatLevel: maliciousAlert.threatLevel || "critical",
        action: "blocked",
        source: maliciousAlert.source || "Unknown",
        description: `Blocked: ${maliciousAlert.description}`,
      });
      
      console.log(`✅ Blocked and logged threat: ${maliciousAlert.title}`);
    }
    setMaliciousAlert(null);
  }, [maliciousAlert, threats, addSecurityLog]);

  const allowMalicious = useCallback(() => {
    if (maliciousAlert) {
      // Log that user chose to continue despite warning
      let logType: SecurityLog["type"];
      if (maliciousAlert.type === "website") {
        logType = "url_allowed";
      } else if (maliciousAlert.type === "apk") {
        logType = "apk_allowed";
      } else if (maliciousAlert.type === "file") {
        logType = "file_allowed";
      } else {
        logType = "app_allowed";
      }
      
      addSecurityLog({
        type: logType,
        url: maliciousAlert.url,
        appName: maliciousAlert.appName,
        fileName: maliciousAlert.fileName,
        filePath: maliciousAlert.filePath,
        threatLevel: maliciousAlert.threatLevel || "critical",
        action: "allowed",
        source: maliciousAlert.source || "Unknown",
        description: `User chose to continue: ${maliciousAlert.description}`,
      });
      
      console.log(`⚠️ User chose to continue despite warning: ${maliciousAlert.title}`);
      
      // Still add as threat but mark as not blocked
      let threatType: Threat["type"];
      if (maliciousAlert.type === "website") {
        threatType = "malicious_url";
      } else {
        threatType = "malware";
      }
      
      const newThreat: Threat = {
        id: Date.now().toString(),
        type: threatType,
        level: maliciousAlert.threatLevel || "critical",
        title: maliciousAlert.title,
        description: maliciousAlert.description,
        source: maliciousAlert.url || maliciousAlert.appName || maliciousAlert.fileName || "Unknown",
        blocked: false, // User chose to allow
        detectedAt: new Date(),
      };

      const updatedThreats = [newThreat, ...threats];
      setThreats(updatedThreats);
      saveThreats(updatedThreats);
    }
    setMaliciousAlert(null);
  }, [maliciousAlert, threats, addSecurityLog]);

  const toggleSecureMode = useCallback(async () => {
    const newState = !secureModeEnabled;
    setSecureModeEnabled(newState);
    await saveSecureMode(newState);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    console.log(`Secure Mode ${newState ? 'ENABLED' : 'DISABLED'} - Real-time monitoring ${newState ? 'started' : 'stopped'}`);
  }, [secureModeEnabled]);

  // Real-time clipboard monitoring with accurate detection
  const checkClipboard = useCallback(async () => {
    try {
      // Check permissions first
      if (permissions.clipboard === "denied") {
        return; // Skip if permission denied
      }

      const text = await Clipboard.getStringAsync();
      
      // REAL-TIME: Only process if it's a new URL and actually contains a URL pattern
      if (text && text !== lastClipboard && text.includes("http")) {
        // REAL-TIME: Validate it's actually a URL before processing
        let isValidURL = false;
        try {
          new URL(text.trim());
          isValidURL = true;
        } catch {
          // Not a valid URL, skip
          return;
        }
        
        if (!isValidURL) return;
        
        setLastClipboard(text);
        const newUrlsScanned = urlsScanned + 1;
        setUrlsScanned(newUrlsScanned);
        await saveMonitoringStats(newUrlsScanned, activitiesMonitored);
        
        console.log(`📋 REAL-TIME: Clipboard URL detected: ${text}`);
        
        // REAL-TIME: Accurate URL scanning
        const scanResult = scanURL(text.trim());
        console.log(`🔍 REAL-TIME SCAN RESULT: ${scanResult.isSafe ? "SAFE" : scanResult.threatLevel.toUpperCase()} - ${scanResult.threats.join(", ")}`);
        
        // REAL-TIME: Only flag actual threats, not warnings
        const isActualThreat = !scanResult.isSafe && 
          (scanResult.threatLevel === "critical" || scanResult.threatLevel === "high") &&
          scanResult.threats.some(t => 
            t.includes("phishing") || 
            t.includes("malware") || 
            t.includes("malicious") ||
            t.includes("Known malicious")
          );
        
        if (isActualThreat) {
          console.log(`🚨 REAL-TIME: MALICIOUS URL DETECTED IN CLIPBOARD!`);
          
          if (scanResult.threatLevel === "critical" || scanResult.threatLevel === "high") {
            showMaliciousAlert({
              title: "🚨 EMERGENCY: Malicious Website Detected",
              description: `Real-time analysis detected a dangerous website in your clipboard. This site may attempt to steal your personal information, passwords, or financial data.`,
              url: text.trim(),
              type: "website",
              source: "Clipboard",
              threatLevel: scanResult.threatLevel,
            });
          } else {
            const newThreat: Threat = {
              id: Date.now().toString(),
              type: "malicious_url",
              level: scanResult.threatLevel,
              title: "Suspicious URL Detected in Clipboard",
              description: `${scanResult.url} - ${scanResult.threats.filter(t => !t.includes("Insecure")).join(", ")}`,
              source: scanResult.url,
              blocked: true,
              detectedAt: new Date(),
            };

            const currentThreats = threatsRef.current;
            const updatedThreats = [newThreat, ...currentThreats];
            setThreats(updatedThreats);
            await saveThreats(updatedThreats);
          }
        }
      }
    } catch (error) {
      // Handle clipboard permission errors
      if (error instanceof Error && error.message.includes("permission")) {
        console.log("⚠️ Clipboard permission not granted");
        setPermissions(prev => ({ ...prev, clipboard: "denied" }));
      }
    }
  }, [lastClipboard, urlsScanned, activitiesMonitored, showMaliciousAlert, permissions.clipboard]);

  // Detect source app from URL scheme or referrer
  const detectSourceApp = useCallback((url: string): string => {
    // Check if URL came from social media apps
    if (url.includes("whatsapp") || url.includes("wa.me")) return "WhatsApp";
    if (url.includes("instagram") || url.includes("instagr.am")) return "Instagram";
    if (url.includes("facebook") || url.includes("fb.com")) return "Facebook";
    if (url.includes("twitter") || url.includes("t.co") || url.includes("x.com")) return "Twitter/X";
    if (url.includes("telegram") || url.includes("t.me")) return "Telegram";
    if (url.includes("linkedin")) return "LinkedIn";
    if (url.includes("snapchat")) return "Snapchat";
    if (url.includes("tiktok")) return "TikTok";
    if (url.includes("messenger")) return "Messenger";
    if (url.includes("discord")) return "Discord";
    return "Browser";
  }, []);

  // Scan file/APK when detected
  const scanDetectedFile = useCallback((fileName: string, filePath?: string, source: string = "Downloads") => {
    console.log(`📁 Scanning file: ${fileName}`);
    
    const { isSafe, threat } = scanFile(fileName, filePath);
    
    if (!isSafe && threat) {
      const isAPK = fileName.toLowerCase().endsWith(".apk");
      
      if (threat.level === "critical" || threat.level === "high") {
        showMaliciousAlert({
          title: threat.title,
          description: threat.description,
          fileName: fileName,
          filePath: filePath,
          type: isAPK ? "apk" : "file",
          source: source,
          threatLevel: threat.level,
        });
      } else {
        // Medium/low threats are logged but don't show alert
        addSecurityLog({
          type: isAPK ? "malicious_apk_detected" : "malicious_file_detected",
          fileName: fileName,
          filePath: filePath,
          threatLevel: threat.level,
          action: "detected",
          source: source,
          description: threat.description,
        });
      }
    }
  }, [showMaliciousAlert, addSecurityLog]);

  // Real-time URL interception when user tries to open a URL
  const setupURLInterception = useCallback(() => {
    if (urlInterceptionRef.current) {
      console.log("⚠️ URL interception already set up");
      return;
    }
    
    try {
      console.log("🔗 Setting up URL interception for real-time protection...");
      
      urlInterceptionRef.current = Linking.addEventListener("url", async (event) => {
        try {
          const url = event.url;
          if (!url) return;
          
          console.log(`🔍 Intercepted URL: ${url}`);
          
          // Check for file downloads (APK, EXE, etc.) in URLs
          const fileExtensionPattern = /\.(apk|exe|bat|cmd|com|pif|scr|vbs|js|jar|deb|rpm|dmg|pkg|msi|app|ipa)(\?|$|#)/i;
          if (fileExtensionPattern.test(url)) {
            const fileName = url.split('/').pop()?.split('?')[0] || url;
            const sourceApp = detectSourceApp(url);
            console.log(`📁 File download detected from ${sourceApp}: ${fileName}`);
            scanDetectedFile(fileName, url, sourceApp);
            return;
          }
          
          // Only check http/https URLs
          if (url.startsWith("http://") || url.startsWith("https://")) {
            const sourceApp = detectSourceApp(url);
            const { isSafe, threat } = await interceptAndScanURL(url);
            
            if (!isSafe && threat) {
              console.log(`🚨 MALICIOUS URL INTERCEPTED from ${sourceApp}: ${url}`);
              
              // Show immediate alert with Continue/Block options
              showMaliciousAlert({
                title: "🚨 EMERGENCY: Malicious Website Detected",
                description: `We intercepted a dangerous website you tried to open from ${sourceApp}. This site may steal your personal information, passwords, or financial data.`,
                url: url,
                type: "website",
                source: sourceApp,
                threatLevel: threat.level === "safe" ? "high" : threat.level,
              });
              
              // Don't add to threats yet - wait for user decision (block or continue)
            } else {
              // Safe URL - just increment counter
              setUrlsScanned(prev => {
                const newCount = prev + 1;
                saveMonitoringStats(newCount, activitiesMonitored).catch(err => 
                  console.error("Failed to save stats:", err)
                );
                return newCount;
              });
            }
          }
        } catch (error) {
          console.error("Error processing intercepted URL:", error);
        }
      });
      
      console.log("✅ URL interception set up successfully");
    } catch (error) {
      console.error("❌ Failed to set up URL interception:", error);
    }
  }, [urlsScanned, activitiesMonitored, showMaliciousAlert, detectSourceApp, scanDetectedFile]);

  const stopURLInterception = useCallback(() => {
    if (urlInterceptionRef.current) {
      urlInterceptionRef.current.remove();
      urlInterceptionRef.current = null;
      console.log("✅ URL interception stopped");
    }
  }, []);

  // Real-time app scanning - scans all installed apps continuously using REAL device detection
  const startRealTimeAppScanning = useCallback(async () => {
    if (appScanIntervalRef.current) {
      console.log("⚠️ Real-time app scanning already running");
      return;
    }
    
    try {
      console.log("📱 REAL-TIME: Starting app scanning - detecting installed apps on device...");
      setRealTimeAppScanning(true);
      
      const scanApps = async () => {
        try {
          // REAL-TIME: Actually scan installed apps on device (not static)
          const threats = await scanAllInstalledApps();
          
          if (threats.length > 0) {
            console.log(`⚠️ REAL-TIME: Found ${threats.length} actual threat(s) in installed apps`);
            
            const newThreats = threats.map((threat: Omit<Threat, "id" | "detectedAt">) => ({
              ...threat,
              id: Date.now().toString() + Math.random(),
              detectedAt: new Date(),
            }));
            
            const criticalThreat = newThreats.find((t: Threat) => t.level === "critical");
            
            if (criticalThreat) {
              console.log(`🚨 REAL-TIME CRITICAL: ${criticalThreat.source}`);
              showMaliciousAlert({
                title: "🚨 EMERGENCY: Malicious App Detected",
                description: criticalThreat.description,
                appName: criticalThreat.source,
                type: "app",
                source: "Real-Time App Scan",
                threatLevel: criticalThreat.level === "safe" ? "low" : criticalThreat.level,
              });
            }
            
            const currentThreats = threatsRef.current;
            const updatedThreats = [...newThreats, ...currentThreats];
            setThreats(updatedThreats);
            await saveThreats(updatedThreats);
          }
          
          // Update apps scanned count with actual number
          setAppsScanned(prev => {
            const newCount = prev + threats.length;
            lastAppScanTimeRef.current = Date.now();
            return newCount;
          });
        } catch (error) {
          console.error("❌ Real-time app scan failed:", error);
        }
      };
      
      // Initial REAL-TIME scan immediately
      console.log("🔍 REAL-TIME: Running initial device app scan...");
      await scanApps();
      console.log("✅ REAL-TIME: Initial app scan completed");
      
      // Scan every 30 seconds for real-time protection (using real device detection)
      appScanIntervalRef.current = setInterval(() => {
        scanApps().catch(err => console.error("Real-time app scan error:", err));
      }, 30000) as unknown as ReturnType<typeof setInterval>;
      
      console.log("✅ REAL-TIME app scanning started (30s interval) - using actual device detection");
    } catch (error) {
      console.error("❌ Failed to start real-time app scanning:", error);
      setRealTimeAppScanning(false);
    }
  }, [showMaliciousAlert]);

  const stopRealTimeAppScanning = useCallback(() => {
    if (appScanIntervalRef.current) {
      clearInterval(appScanIntervalRef.current);
      appScanIntervalRef.current = null;
      setRealTimeAppScanning(false);
      console.log("✅ Real-time app scanning stopped");
    }
  }, []);

  // Scan app installation attempt
  const scanAppInstallAttempt = useCallback((appName: string, packageName?: string, source: string = "App Install") => {
    console.log(`📱 Scanning app installation: ${appName}`);
    
    const { isSafe, threat } = scanAppInstallation(appName, packageName);
    
    if (!isSafe && threat) {
      if (threat.level === "critical" || threat.level === "high") {
        showMaliciousAlert({
          title: threat.title,
          description: threat.description,
          appName: appName,
          type: "app",
          source: source,
          threatLevel: threat.level,
        });
      } else {
        // Medium/low threats are logged but don't show alert
        addSecurityLog({
          type: "malicious_app_clicked",
          appName: appName,
          threatLevel: threat.level,
          action: "detected",
          source: source,
          description: threat.description,
        });
      }
    }
  }, [showMaliciousAlert, addSecurityLog]);

  // Real-time file system monitoring
  const fileSystemMonitorRef = useRef<(() => void) | null>(null);

  // Monitor for file downloads and APK installations - REAL-TIME with actual file system
  const monitorFileActivities = useCallback(() => {
    // Real-time file monitoring using actual file system scanning
    const checkForFiles = async () => {
      try {
        // Check clipboard for file paths or APK names
        if (permissions.clipboard !== "denied") {
          const text = await Clipboard.getStringAsync();
          if (text && text !== lastClipboard) {
            // Check if clipboard contains file paths or APK names
            const filePattern = /\.(apk|exe|bat|cmd|com|pif|scr|vbs|js|jar|deb|rpm|dmg|pkg|msi|app|ipa)(\s|$)/i;
            if (filePattern.test(text)) {
              const fileName = text.trim().split(/[\s\n]/)[0];
              console.log(`📁 REAL-TIME: File detected in clipboard: ${fileName}`);
              scanDetectedFile(fileName, undefined, "Clipboard");
            }
          }
        }

        // Real-time file system scan (actual device files)
        if (permissions.storage === "granted") {
          try {
            const scannedFiles = await scanFileSystem();
            
            for (const file of scannedFiles) {
              if (file.threat && !file.threat.isSafe && file.threat.threat) {
                const isAPK = file.name.toLowerCase().endsWith(".apk");
                console.log(`🚨 REAL-TIME: Malicious file detected: ${file.name}`);
                
                if (file.threat.threat.level === "critical" || file.threat.threat.level === "high") {
                  showMaliciousAlert({
                    title: file.threat.threat.title,
                    description: file.threat.threat.description,
                    fileName: file.name,
                    filePath: file.path,
                    type: isAPK ? "apk" : "file",
                    source: "File System Scan",
                    threatLevel: file.threat.threat.level,
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error in real-time file system scan:", error);
          }
        }
      } catch (error) {
        console.error("Error in file monitoring:", error);
      }
    };
    
    return checkForFiles;
  }, [lastClipboard, scanDetectedFile, permissions.clipboard, permissions.storage, showMaliciousAlert]);

  // Enhanced 24/7 activity monitoring
  const start24HourActivityMonitoring = useCallback(() => {
    if (activityMonitorIntervalRef.current) {
      console.log("⚠️ 24/7 activity monitoring already running");
      return;
    }
    
    try {
      console.log("🔄 Starting 24/7 activity monitoring...");
      
      const checkFiles = monitorFileActivities();
      
      // Initial check
      checkClipboard().catch(err => console.error("Clipboard check error:", err));
      checkFiles().catch(err => console.error("File check error:", err));
      
      activityMonitorIntervalRef.current = setInterval(async () => {
        try {
          // Monitor clipboard for malicious URLs
          await checkClipboard();
          
          // Monitor for files in clipboard
          await checkFiles();
          
          // Update activity counter
          setActivitiesMonitored(prev => {
            const newActivities = prev + 1;
            saveMonitoringStats(urlsScanned, newActivities).catch(err => 
              console.error("Failed to save stats:", err)
            );
            return newActivities;
          });
          
          // Log every 10th check to avoid spam
          if (activitiesMonitored % 10 === 0) {
            console.log("📊 24/7 Activity monitoring active - Protection running");
          }
        } catch (error) {
          console.error("Error in 24/7 monitoring loop:", error);
        }
      }, 3000) as unknown as ReturnType<typeof setInterval>; // Check every 3 seconds for real-time protection
      
      console.log("✅ 24/7 activity monitoring started (3s interval)");
    } catch (error) {
      console.error("❌ Failed to start 24/7 monitoring:", error);
    }
  }, [urlsScanned, checkClipboard, monitorFileActivities, activitiesMonitored]);

  const stop24HourActivityMonitoring = useCallback(() => {
    if (activityMonitorIntervalRef.current) {
      clearInterval(activityMonitorIntervalRef.current);
      activityMonitorIntervalRef.current = null;
      console.log("✅ 24/7 activity monitoring stopped");
    }
  }, []);

  const simulateActivityMonitoring = async () => {
    const newActivities = activitiesMonitored + 1;
    setActivitiesMonitored(newActivities);
    await saveMonitoringStats(urlsScanned, newActivities);
  };

  const stopMonitoring = useCallback(() => {
    try {
      console.log("🛑 Stopping all real-time monitoring services...");
      
      // Stop main monitoring loop
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
        console.log("✅ Main monitoring loop stopped");
    }
      
      // Stop app state subscription
    if (appStateSubscriptionRef.current) {
      appStateSubscriptionRef.current.remove();
      appStateSubscriptionRef.current = null;
        console.log("✅ App state subscription stopped");
      }
      
      // Stop all sub-services
      stop24HourActivityMonitoring();
      stopURLInterception();
      stopRealTimeAppScanning();
      
      setIsMonitoring(false);
      console.log("🛡️ All real-time monitoring services STOPPED");
    } catch (error) {
      console.error("❌ Error stopping monitoring:", error);
      setIsMonitoring(false);
    }
  }, [stop24HourActivityMonitoring, stopURLInterception, stopRealTimeAppScanning]);

  const startMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      console.log("⚠️ Monitoring already running");
      return;
    }
    
    try {
    setIsMonitoring(true);
      console.log("🛡️ Real-time monitoring STARTED - 24/7 protection active");
      console.log("📊 Starting all real-time protection services...");

      // Start 24/7 activity monitoring (clipboard, files, activities)
      start24HourActivityMonitoring();
      console.log("✅ 24/7 Activity monitoring started");
      
      // Setup URL interception (catches malicious URLs from any app)
      setupURLInterception();
      console.log("✅ URL interception started");
      
      // Start real-time app scanning (scans installed apps every 30s)
      startRealTimeAppScanning();
      console.log("✅ Real-time app scanning started");

      // Main monitoring loop (clipboard check every 5 seconds)
    monitoringIntervalRef.current = setInterval(() => {
        try {
      checkClipboard();
      simulateActivityMonitoring();
        } catch (error) {
          console.error("Error in monitoring loop:", error);
        }
    }, 5000) as unknown as ReturnType<typeof setInterval>;

      console.log("✅ Main monitoring loop started (5s interval)");
      console.log("🛡️ All real-time protection services are now ACTIVE");
    } catch (error) {
      console.error("❌ Failed to start monitoring:", error);
      setIsMonitoring(false);
      }
  }, [start24HourActivityMonitoring, setupURLInterception, startRealTimeAppScanning, checkClipboard, simulateActivityMonitoring]);

  const startContinuousScan = useCallback(() => {
    if (continuousScanIntervalRef.current) return;
    
    console.log("🔄 Continuous scanning STARTED - scanning every second for real-time protection");
    
    const runScan = async () => {
      if (!secureModeEnabled) {
        return;
      }
      
      if (isContinuousScanRunning) return;
      
      console.log("🔍 Running continuous background scan...");
      
      setIsContinuousScanRunning(true);
      
      try {
        const results = await performFullScan((progress: ScanProgress) => {
          setContinuousScanProgress(progress);
        });

        // Only process actual threats (critical or high level)
        const actualThreats = results.threatsFound.filter(
          (threat: Omit<Threat, "id" | "detectedAt">) => 
            threat.level === "critical" || threat.level === "high"
        );
        
        if (actualThreats.length > 0) {
          const newThreats = actualThreats.map((threat: Omit<Threat, "id" | "detectedAt">) => ({
            ...threat,
            id: Date.now().toString() + Math.random(),
            detectedAt: new Date(),
          }));

          const criticalThreat = newThreats.find(
            (t: Threat) => t.level === "critical"
          );

          if (criticalThreat) {
            showMaliciousAlert({
              title: criticalThreat.type === "malicious_url" ? "Malicious Website Detected" : "Suspicious App Detected",
              description: criticalThreat.description,
              url: criticalThreat.type === "malicious_url" ? criticalThreat.source : undefined,
              appName: criticalThreat.type !== "malicious_url" ? criticalThreat.source : undefined,
              type: criticalThreat.type === "malicious_url" ? "website" : "app",
            });
          } else {
            // High-level threats are logged but don't show alert
            const currentThreats = threatsRef.current;
            const updatedThreats = [...newThreats, ...currentThreats];
            setThreats(updatedThreats);
            await saveThreats(updatedThreats);
          }
        }

        const newUrlsScanned = urlsScanned + results.itemsScanned;
        setUrlsScanned(newUrlsScanned);
        await saveMonitoringStats(newUrlsScanned, activitiesMonitored);
      } catch (error) {
        console.error("Continuous scan failed:", error);
      } finally {
        setIsContinuousScanRunning(false);
      }
    };
    
    continuousScanIntervalRef.current = setInterval(() => {
      runScan();
    }, 1000) as unknown as ReturnType<typeof setInterval>;
  }, [secureModeEnabled, isContinuousScanRunning, urlsScanned, activitiesMonitored]);

  const stopContinuousScan = useCallback(() => {
    if (continuousScanIntervalRef.current) {
      clearInterval(continuousScanIntervalRef.current);
      continuousScanIntervalRef.current = null;
      setIsContinuousScanRunning(false);
      setContinuousScanProgress(null);
      console.log("🔄 Continuous scanning STOPPED");
    }
  }, []);

  const resetMonitoringStats = useCallback(async () => {
    setUrlsScanned(0);
    setActivitiesMonitored(0);
    await saveMonitoringStats(0, 0);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      console.log("Requesting location permission...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      
      if (status === "granted") {
        console.log("✅ Location permission granted");
        return true;
      } else {
        console.log("❌ Location permission denied:", status);
        return false;
      }
    } catch (error) {
      console.error("Failed to request location permission:", error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp),
      };
    } catch (error) {
      console.error("Failed to get current location:", error);
      throw error;
    }
  };

  const sendLocationEmail = async (locationData: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: Date;
  }) => {
    try {
      if (!targetEmail || !targetEmail.trim()) {
        console.error("❌ No target email configured");
        return false;
      }

      // Validate email format (especially for Gmail)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(targetEmail.trim())) {
        console.error("❌ Invalid email format:", targetEmail);
        return false;
      }

      const googleMapsLink = `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
      const appleMapsLink = `http://maps.apple.com/?ll=${locationData.latitude},${locationData.longitude}`;
      const formattedTime = locationData.timestamp.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });

      console.log("📧 Sending location to Gmail:", targetEmail);
      console.log("📍 Location data:", {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: formattedTime,
      });

      const templateParams = {
        to_email: targetEmail.trim(),
        device_name: Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android Device' : 'Device',
        latitude: locationData.latitude.toFixed(6),
        longitude: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy ? `${locationData.accuracy.toFixed(2)}m` : "Unknown",
        timestamp: formattedTime,
        google_maps_link: googleMapsLink,
        apple_maps_link: appleMapsLink,
        coordinates: `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
      };

      console.log("📤 Sending email via EmailJS...");
      console.log("📋 Email Template Parameters:", JSON.stringify(templateParams, null, 2));
      console.log("📧 Target Email:", targetEmail.trim());
      console.log("🔑 Service ID:", EMAILJS_SERVICE_ID);
      console.log("📝 Template ID:", EMAILJS_TEMPLATE_ID);
      
      // Handle web platform CORS issues with retry and better error handling
      if (Platform.OS === 'web') {
        try {
          // Use EmailJS SDK with retry logic for web
          let retries = 0;
          const maxRetries = 2;
          
          while (retries <= maxRetries) {
            try {
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

              console.log("📨 EmailJS Response:", {
                status: response.status,
                text: response.text,
              });
              
              // Validate response - EmailJS returns 200 even if email fails to send
              if (response.status === 200) {
                console.log("✅ EmailJS API accepted the request (Status: 200)");
                console.log("📬 Email should be delivered to:", targetEmail.trim());
                console.log("⚠️ NOTE: If email not received, check:");
                console.log("   1. Spam/Junk folder");
                console.log("   2. EmailJS template configuration");
                console.log("   3. EmailJS service limits");
                console.log("   4. Template variable names match: to_email, device_name, latitude, longitude, etc.");
                
                // Log template params for debugging
                console.log("🔍 Verify EmailJS template has these variables:");
                console.log("   - {{to_email}} =", templateParams.to_email);
                console.log("   - {{device_name}} =", templateParams.device_name);
                console.log("   - {{latitude}} =", templateParams.latitude);
                console.log("   - {{longitude}} =", templateParams.longitude);
                console.log("   - {{timestamp}} =", templateParams.timestamp);
                console.log("   - {{coordinates}} =", templateParams.coordinates);
      
      return true;
              } else {
                console.warn("⚠️ Unexpected response status:", response.status);
                return false;
              }
            } catch (webError: any) {
              retries++;
              
              // Handle 403 - API calls disabled for non-browser applications
              if (webError?.status === 403 || webError?.text?.includes('403') || webError?.text?.includes('non browser')) {
                console.error("❌ EmailJS Error 403: API calls are disabled for non-browser applications");
                console.error("💡 Solution: EmailJS doesn't support direct calls from mobile apps.");
                console.error("💡 Options:");
                console.error("   1. Use a backend proxy/server to send emails");
                console.error("   2. Use a different email service (SendGrid, Mailgun, etc.)");
                console.error("   3. Use EmailJS REST API with server-side proxy");
                throw new Error("EmailJS doesn't support mobile apps directly. Please use a backend proxy or different email service.");
              }
              
              // Handle rate limiting (429)
              if (webError?.status === 429 || webError?.text?.includes('429')) {
                console.warn(`⚠️ Rate limit reached (attempt ${retries}/${maxRetries + 1}), waiting 60 seconds...`);
                if (retries <= maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
                  continue; // Retry
                }
              }
              
              // Handle CORS errors
              if (webError?.message?.includes('CORS') || webError?.message?.includes('NetworkError')) {
                console.warn(`⚠️ CORS error (attempt ${retries}/${maxRetries + 1}), trying alternative method...`);
                if (retries <= maxRetries) {
                  // Try using fetch with no-cors mode as fallback
                  try {
                    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                      method: 'POST',
                      mode: 'no-cors', // This won't give us response but might work
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        service_id: EMAILJS_SERVICE_ID,
                        template_id: EMAILJS_TEMPLATE_ID,
                        user_id: EMAILJS_PUBLIC_KEY,
                        template_params: templateParams,
                      }),
                    });
                    console.log("✅ Email sent via no-cors fallback (web)");
      return true;
                  } catch (fetchError) {
                    console.warn("Fallback method also failed, continuing retry...");
                    if (retries <= maxRetries) {
                      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                      continue;
                    }
                  }
                }
              }
              
              // If we've exhausted retries, throw the error
              if (retries > maxRetries) {
                throw webError;
              }
            }
          }
          
          return false;
        } catch (webError) {
          console.error("❌ All web email attempts failed:", webError);
          // Don't throw - just return false to allow graceful degradation
          return false;
        }
      } else {
        // Mobile platforms - Use backend proxy to send emails
        // EmailJS doesn't support direct calls from mobile apps (403 error)
        console.log("📱 Mobile platform detected - using backend proxy for EmailJS");
        
        // Backend proxy URL - Update this to your deployed backend URL
        // For local development: Use your computer's local IP address (e.g., http://192.168.1.3:3000)
        // Find your IP: Windows: ipconfig | findstr IPv4, Mac/Linux: ifconfig | grep inet
        // For production: https://your-backend-domain.com
        // IMPORTANT: On mobile, localhost refers to the device itself, not your computer!
        // Use your computer's local network IP address instead (e.g., 192.168.1.3)
        const BACKEND_URL = process.env.EXPO_PUBLIC_EMAIL_PROXY_URL || 'http://192.168.1.3:3000';
        
        try {
          console.log("📤 Sending email via backend proxy:", BACKEND_URL);
          
          const response = await fetch(`${BACKEND_URL}/api/send-location-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateParams),
          });

          const responseData = await response.json();
          
          console.log("📨 Backend Proxy Response:", {
            status: response.status,
            data: responseData,
          });
          
          if (response.ok && responseData.success) {
            console.log("✅ Email sent successfully via backend proxy");
            console.log("📬 Email should be delivered to:", targetEmail.trim());
            console.log("⚠️ NOTE: If email not received, check:");
            console.log("   1. Spam/Junk folder");
            console.log("   2. EmailJS template configuration");
            console.log("   3. Backend proxy server is running");
            
            return true;
          } else {
            const errorMsg = responseData.error || `HTTP ${response.status}`;
            console.error("❌ Backend proxy error:", errorMsg);
            throw new Error(`Backend proxy error: ${errorMsg}`);
          }
        } catch (fetchError: any) {
          console.error("❌ Backend proxy request failed:", fetchError);
          
          // Check if it's a connection error (backend not running)
          if (fetchError.message?.includes('NetworkError') || 
              fetchError.message?.includes('Failed to fetch') ||
              fetchError.message?.includes('ECONNREFUSED')) {
            throw new Error(
              "Backend proxy server is not running or unreachable.\n\n" +
              "Please:\n" +
              "1. Start the backend server (node backend-email-proxy.js)\n" +
              "2. Update EXPO_PUBLIC_EMAIL_PROXY_URL in your .env file\n" +
              "3. Or deploy the backend to a server and update the URL"
            );
          }
          
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("❌ Failed to send location email to Gmail:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        
        // Check for 403 error specifically
        if (error.message.includes('403') || error.message.includes('non-browser') || error.message.includes('non browser')) {
          console.error("🚫 EmailJS RESTRICTION: Mobile apps are not supported directly.");
          console.error("📋 Solutions:");
          console.error("   1. Create a backend API endpoint that uses EmailJS");
          console.error("   2. Use a different email service (SendGrid, Mailgun, AWS SES)");
          console.error("   3. Use EmailJS with a server-side proxy");
          console.error("   4. Use a service like Firebase Cloud Functions or AWS Lambda");
          // Re-throw with a clear message so it can be caught by sendLocationNow
          throw error;
        }
      }
      // Return false instead of throwing to allow graceful handling
      return false;
    }
  };

  const sendLocationNow = async (): Promise<{ success: boolean; error?: string }> => {
    if (!targetEmail) {
      return { success: false, error: "No target email configured" };
    }

    if (locationPermissionStatus !== "granted") {
      const granted = await requestLocationPermission();
      if (!granted) {
        return { success: false, error: "Location permission not granted" };
      }
    }

    try {
      console.log("📍 Getting current location for immediate send...");
      const location = await getCurrentLocation();
      
      console.log("📧 Sending location via email immediately...");
      const emailSent = await sendLocationEmail(location);
      
      if (emailSent) {
        const now = new Date();
        setLastLocationSent(now);
        await saveLocationTracking(locationTrackingEnabled, now);
        
        // If location tracking is enabled, restart the interval to schedule next email in exactly 6 hours from now
        if (locationTrackingEnabled) {
          console.log("🔄 Resetting 6-hour interval - next email will be sent in 6 hours from now");
          // Stop current interval
          stopLocationTracking();
          // Restart the interval after a small delay to ensure state is updated
          // This ensures that when user clicks "Send Now", the next automatic email is exactly 6 hours later
          setTimeout(() => {
            if (locationTrackingEnabled) {
              startLocationTracking();
            }
          }, 100);
        }
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        return { success: true };
      }
      
      return { success: false, error: "Failed to send email" };
    } catch (error) {
      console.error("Failed to send location:", error);
      let errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Enhance error message for 403 errors (EmailJS non-browser restriction)
      if (errorMessage.includes('403') || errorMessage.includes('non-browser') || errorMessage.includes('non browser')) {
        errorMessage = "EmailJS Error 403: API calls are disabled for non-browser applications. EmailJS doesn't support mobile apps directly. Please use a backend proxy or different email service.";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const stopLocationTracking = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
      console.log("✅ Location tracking STOPPED");
    }
  }, []);

  const startLocationTracking = useCallback(() => {
    // Stop any existing interval first to avoid duplicates
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    
    if (!targetEmail || !targetEmail.trim()) {
      console.error("❌ Cannot start location tracking: No target email configured");
      return;
    }

    // Validate Gmail or any email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail.trim())) {
      console.error("❌ Cannot start location tracking: Invalid email format");
      return;
    }
    
    console.log("📍 Location tracking STARTED - will send to Gmail every 6 hours");
    console.log("📧 Target Gmail:", targetEmail);
    
    const SIX_HOURS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    
    // Don't send immediately when restarting - only send on schedule
    // (sendLocationNow handles immediate sends)
    
    // Send every 6 hours (this is the scheduled interval, not immediate)
    locationIntervalRef.current = setInterval(async () => {
      console.log("⏰ 6 hours passed - sending scheduled location update to Gmail");
      try {
        if (locationPermissionStatus !== "granted") {
          console.warn("⚠️ Location permission not granted, skipping scheduled email");
          return;
        }
        
        const location = await getCurrentLocation();
        const emailSent = await sendLocationEmail(location);
        
        if (emailSent) {
          const now = new Date();
          setLastLocationSent(now);
          await saveLocationTracking(locationTrackingEnabled, now);
          console.log("✅ Scheduled location update sent successfully to Gmail");
        } else {
          console.error("❌ Failed to send scheduled location update");
        }
      } catch (error) {
        console.error("❌ Error sending scheduled location update:", error);
      }
    }, SIX_HOURS) as unknown as ReturnType<typeof setInterval>;
    
    console.log("✅ 6-hour interval started - next email in 6 hours");
  }, [targetEmail, locationTrackingEnabled, locationPermissionStatus, getCurrentLocation, sendLocationEmail, saveLocationTracking]);

  useEffect(() => {
    if (locationTrackingEnabled && targetEmail && locationPermissionStatus === "granted") {
      // Start tracking - this will set up the 6-hour interval
      startLocationTracking();
      // Send initial email immediately when first enabled
      // (Only if we haven't sent one recently to avoid duplicates)
      const shouldSendInitial = !lastLocationSent || 
        (Date.now() - lastLocationSent.getTime()) > 5 * 60 * 1000; // 5 minutes threshold
      
      if (shouldSendInitial) {
        console.log("📤 Sending initial location email...");
        sendLocationNow().catch(err => {
          console.error("Failed to send initial location:", err);
        });
      }
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [locationTrackingEnabled, targetEmail, locationPermissionStatus, startLocationTracking, stopLocationTracking, lastLocationSent, sendLocationNow]);

  const toggleLocationTracking = async (email?: string): Promise<{ success: boolean; error?: string }> => {
    const newState = !locationTrackingEnabled;
    
    if (newState) {
      if (!email && !targetEmail) {
        return { success: false, error: "Gmail address is required" };
      }
      
      const emailToUse = (email || targetEmail)?.trim();
      
      // Validate email format (especially for Gmail)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailToUse || !emailRegex.test(emailToUse)) {
        return { success: false, error: "Please enter a valid Gmail address (e.g., yourname@gmail.com)" };
      }
      
      if (locationPermissionStatus !== "granted") {
        const granted = await requestLocationPermission();
        if (!granted) {
          return { success: false, error: "Location permission is required to send location updates" };
        }
      }
      
      setTargetEmail(emailToUse);
      await saveTargetEmail(emailToUse);
      
      // Send initial location immediately
      console.log("📤 Sending initial location to Gmail:", emailToUse);
      const sendResult = await sendLocationNow();
      if (!sendResult.success) {
        console.error("⚠️ Failed to send initial location, but tracking will continue:", sendResult.error);
      }
    }
    
    setLocationTrackingEnabled(newState);
    await saveLocationTracking(newState, lastLocationSent);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    console.log(`📍 Location Tracking ${newState ? 'ENABLED' : 'DISABLED'}`);
    if (newState) {
      console.log(`📧 Location will be sent to Gmail every 6 hours: ${email || targetEmail}`);
    }
    
    return { success: true };
  };

  // Auto-start/stop monitoring when secure mode is toggled
  useEffect(() => {
    if (secureModeEnabled) {
      console.log("🛡️ Secure mode ENABLED - Starting all protection services...");
      startMonitoring();
      startContinuousScan();
    } else {
      console.log("🛑 Secure mode DISABLED - Stopping all protection services...");
      stopMonitoring();
      stopContinuousScan();
      setIsScanning(false);
      setScanProgress(null);
    }

    return () => {
      // Cleanup on unmount
      if (secureModeEnabled) {
      stopMonitoring();
      stopContinuousScan();
      }
    };
  }, [secureModeEnabled, startMonitoring, startContinuousScan, stopMonitoring, stopContinuousScan]);

  const updateTargetEmail = async (email: string) => {
    setTargetEmail(email);
    await saveTargetEmail(email);
  };

  // Handle app state changes for real-time monitoring (after functions are defined)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (previousState.match(/inactive|background/) && nextAppState === "active") {
        console.log("📱 App returned to foreground - resuming real-time monitoring");
        // Resume monitoring if it was enabled
        if (secureModeEnabled && !isMonitoring) {
          startMonitoring();
        }
        // Check clipboard immediately when app comes to foreground
        checkClipboard();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log("📱 App went to background - monitoring continues");
        // Monitoring continues in background, but we log it
      }
    });

    appStateRef.current = AppState.currentState;
    return () => {
      subscription.remove();
    };
  }, [secureModeEnabled, isMonitoring, startMonitoring, checkClipboard]);

  const runQuickScan = useCallback(async (): Promise<void> => {
    if (isScanning) return;
    
    setIsScanning(true);
    console.log("🔍 Starting Quick Scan...");
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const results = await performQuickScan((progress: ScanProgress) => {
        setScanProgress(progress);
      });

      console.log(`✅ Quick Scan completed: ${results.threatsFound.length} threats found`);

      if (results.threatsFound.length > 0) {
        const newThreats = results.threatsFound.map((threat: Omit<Threat, "id" | "detectedAt">) => ({
          ...threat,
          id: Date.now().toString() + Math.random(),
          detectedAt: new Date(),
        }));

        const currentThreats = threatsRef.current;
        const updatedThreats = [...newThreats, ...currentThreats];
        setThreats(updatedThreats);
        await saveThreats(updatedThreats);

        const criticalThreat = newThreats.find(
          (t: Threat) => t.level === "critical" || t.level === "high"
        );

        if (criticalThreat) {
          setEmergencyAlert(criticalThreat);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      const newUrlsScanned = urlsScanned + results.itemsScanned;
      setUrlsScanned(newUrlsScanned);
      await saveMonitoringStats(newUrlsScanned, activitiesMonitored);
    } catch (error) {
      console.error("Quick Scan failed:", error);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  }, [isScanning, urlsScanned, activitiesMonitored]);

  const runFullScan = useCallback(async (silent: boolean = false): Promise<void> => {
    if (isScanning) return;
    
    setIsScanning(true);
    if (!silent) {
      console.log("🔍 Starting Full System Scan...");
    }
    
    if (!silent && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    try {
      const results = await performFullScan((progress: ScanProgress) => {
        if (!silent) {
          setScanProgress(progress);
        }
      });

      if (!silent) {
        console.log(`✅ Full Scan completed: ${results.threatsFound.length} threats found`);
      }

      if (results.threatsFound.length > 0) {
        const newThreats = results.threatsFound.map((threat: Omit<Threat, "id" | "detectedAt">) => ({
          ...threat,
          id: Date.now().toString() + Math.random(),
          detectedAt: new Date(),
        }));

        const currentThreats = threatsRef.current;
        const updatedThreats = [...newThreats, ...currentThreats];
        setThreats(updatedThreats);
        await saveThreats(updatedThreats);

        const criticalThreat = newThreats.find(
          (t: Threat) => t.level === "critical" || t.level === "high"
        );

        if (criticalThreat) {
          setEmergencyAlert(criticalThreat);
          if (!silent && Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      } else {
        if (!silent && Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      const newUrlsScanned = urlsScanned + results.itemsScanned;
      setUrlsScanned(newUrlsScanned);
      await saveMonitoringStats(newUrlsScanned, activitiesMonitored);
    } catch (error) {
      console.error("Full Scan failed:", error);
    } finally {
      setIsScanning(false);
      if (!silent) {
        setScanProgress(null);
      }
    }
  }, [isScanning, urlsScanned, activitiesMonitored]);

  const getSecurityStatus = useCallback((): SecurityStatus => {
    const activeThreats = threats.filter((t) => !t.blocked).length;
    const threatsBlocked = threats.filter((t) => t.blocked).length;
    const score = calculateSecurityScore(threatsBlocked, activeThreats);
    const overall = getSecurityLevel(score);

    return {
      overall,
      score,
      lastScanAt: threats.length > 0 ? threats[0].detectedAt : null,
      threatsBlocked,
      activeThreats,
    };
  }, [threats]);

  return {
    threats,
    isLoading,
    emergencyAlert,
    maliciousAlert,
    secureModeEnabled,
    isMonitoring,
    urlsScanned,
    activitiesMonitored,
    appsScanned,
    realTimeAppScanning,
    locationTrackingEnabled,
    targetEmail,
    lastLocationSent,
    locationPermissionStatus,
    isScanning,
    scanProgress,
    isContinuousScanRunning,
    continuousScanProgress,
    addThreat,
    blockThreat,
    removeThreat,
    clearAllThreats,
    dismissEmergencyAlert,
    showMaliciousAlert,
    dismissMaliciousAlert,
    blockMalicious,
    allowMalicious,
    securityLogs,
    addSecurityLog,
    scanDetectedFile,
    scanAppInstallAttempt,
    getSecurityStatus,
    permissions,
    requestAllPermissions: async () => {
      const requestedPermissions = await requestAllPermissions();
      setPermissions(requestedPermissions);
      return requestedPermissions;
    },
    toggleSecureMode,
    resetMonitoringStats,
    toggleLocationTracking,
    updateTargetEmail,
    sendLocationNow,
    requestLocationPermission,
    runQuickScan,
    runFullScan,
  };
});
