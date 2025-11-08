import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { AppState, Platform } from "react-native";
import * as Location from "expo-location";
import { Threat, SecurityStatus, ScanProgress } from "@/types/security";
import { calculateSecurityScore, getSecurityLevel, scanURL, performQuickScan, performFullScan } from "@/utils/security";
import * as Haptics from "expo-haptics";
import emailjs from '@emailjs/browser';

const THREATS_STORAGE_KEY = "@security_threats";
const SECURE_MODE_KEY = "@secure_mode_enabled";
const MONITORING_KEY = "@monitoring_stats";
const LOCATION_TRACKING_KEY = "@location_tracking";
const TARGET_EMAIL_KEY = "@target_email";

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
    type: "website" | "app";
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
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const continuousScanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const appStateSubscriptionRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const threatsRef = useRef<Threat[]>(threats);

  useEffect(() => {
    loadThreats();
    loadSecureMode();
    loadMonitoringStats();
    loadLocationTracking();
    checkLocationPermission();
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

  const showMaliciousAlert = useCallback((data: {
    title: string;
    description: string;
    url?: string;
    appName?: string;
    type: "website" | "app";
  }) => {
    setMaliciousAlert({
      visible: true,
      ...data,
    });
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    console.log(`🚨 MALICIOUS ${data.type.toUpperCase()} DETECTED: ${data.title}`);
  }, []);

  const dismissMaliciousAlert = useCallback(() => {
    setMaliciousAlert(null);
  }, []);

  const blockMalicious = useCallback(() => {
    if (maliciousAlert) {
      const newThreat: Threat = {
        id: Date.now().toString(),
        type: maliciousAlert.type === "website" ? "malicious_url" : "malware",
        level: "critical",
        title: maliciousAlert.title,
        description: maliciousAlert.description,
        source: maliciousAlert.url || maliciousAlert.appName || "Unknown",
        blocked: true,
        detectedAt: new Date(),
      };

      const updatedThreats = [newThreat, ...threats];
      setThreats(updatedThreats);
      saveThreats(updatedThreats);
      
      console.log(`✅ Blocked and logged threat: ${maliciousAlert.title}`);
    }
    setMaliciousAlert(null);
  }, [maliciousAlert, threats]);

  const toggleSecureMode = useCallback(async () => {
    const newState = !secureModeEnabled;
    setSecureModeEnabled(newState);
    await saveSecureMode(newState);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    console.log(`Secure Mode ${newState ? 'ENABLED' : 'DISABLED'} - Real-time monitoring ${newState ? 'started' : 'stopped'}`);
  }, [secureModeEnabled]);

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text !== lastClipboard && text.includes("http")) {
        setLastClipboard(text);
        const newUrlsScanned = urlsScanned + 1;
        setUrlsScanned(newUrlsScanned);
        await saveMonitoringStats(newUrlsScanned, activitiesMonitored);
        
        console.log(`Clipboard URL detected: ${text}`);
        
        const scanResult = scanURL(text);
        if (!scanResult.isSafe) {
          console.log(`⚠️ MALICIOUS URL DETECTED IN CLIPBOARD!`);
          
          if (scanResult.threatLevel === "critical" || scanResult.threatLevel === "high") {
            showMaliciousAlert({
              title: "Malicious Website Blocked",
              description: `We detected a dangerous website in your clipboard. This site may attempt to steal your personal information.`,
              url: text,
              type: "website",
            });
          } else {
            const newThreat: Threat = {
              id: Date.now().toString(),
              type: "malicious_url",
              level: scanResult.threatLevel,
              title: "Suspicious URL Detected in Clipboard",
              description: `${scanResult.url} - ${scanResult.threats[0]}`,
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
      // Silently handle clipboard permission errors
      // This is expected when user denies clipboard access
    }
  };

  const simulateActivityMonitoring = async () => {
    const newActivities = activitiesMonitored + 1;
    setActivitiesMonitored(newActivities);
    await saveMonitoringStats(urlsScanned, newActivities);
  };

  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
      setIsMonitoring(false);
      console.log("🛡️ Real-time monitoring STOPPED");
    }
    if (appStateSubscriptionRef.current) {
      appStateSubscriptionRef.current.remove();
      appStateSubscriptionRef.current = null;
    }
  }, []);

  const startMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) return;
    
    setIsMonitoring(true);
    console.log("🛡️ Real-time monitoring STARTED");

    monitoringIntervalRef.current = setInterval(() => {
      checkClipboard();
      simulateActivityMonitoring();
    }, 5000) as unknown as ReturnType<typeof setInterval>;

    appStateSubscriptionRef.current = AppState.addEventListener("change", (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("App returned to foreground - checking for threats");
        checkClipboard();
      }
      appStateRef.current = nextAppState;
    });
  }, []);

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

        if (results.threatsFound.length > 0) {
          const newThreats = results.threatsFound.map((threat: Omit<Threat, "id" | "detectedAt">) => ({
            ...threat,
            id: Date.now().toString() + Math.random(),
            detectedAt: new Date(),
          }));

          const criticalThreat = newThreats.find(
            (t: Threat) => t.level === "critical" || t.level === "high"
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
      const googleMapsLink = `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`;
      const appleMapsLink = `http://maps.apple.com/?ll=${locationData.latitude},${locationData.longitude}`;

      console.log("📧 Sending location to:", targetEmail);
      console.log("Location data:", {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp.toLocaleString(),
      });

      const templateParams = {
        to_email: targetEmail,
        device_name: "My Device",
        latitude: locationData.latitude.toFixed(6),
        longitude: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy ? `${locationData.accuracy.toFixed(2)}m` : "Unknown",
        timestamp: locationData.timestamp.toLocaleString(),
        google_maps_link: googleMapsLink,
        apple_maps_link: appleMapsLink,
      };

      const response = await emailjs.send(
        'service_muid74x',
        'template_6u3mi8b',
        templateParams,
        '8HDuCD7IjRceaYMQ9'
      );

      console.log("✉️ Email sent successfully:", response.status, response.text);
      
      return true;
    } catch (error) {
      console.error("Failed to send location email:", error);
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
      console.log("📍 Getting current location...");
      const location = await getCurrentLocation();
      
      console.log("📧 Sending location via email...");
      const emailSent = await sendLocationEmail(location);
      
      if (emailSent) {
        const now = new Date();
        setLastLocationSent(now);
        await saveLocationTracking(locationTrackingEnabled, now);
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        return { success: true };
      }
      
      return { success: false, error: "Failed to send email" };
    } catch (error) {
      console.error("Failed to send location:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const stopLocationTracking = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
      console.log("📍 Location tracking STOPPED");
    }
  }, []);

  const startLocationTracking = useCallback(() => {
    if (locationIntervalRef.current) return;
    
    console.log("📍 Location tracking STARTED - will send every 6 hours");
    
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    
    locationIntervalRef.current = setInterval(async () => {
      console.log("⏰ 6 hours passed - sending location update");
      await sendLocationNow();
    }, SIX_HOURS) as unknown as ReturnType<typeof setInterval>;
  }, [sendLocationNow]);

  useEffect(() => {
    if (locationTrackingEnabled && targetEmail && locationPermissionStatus === "granted") {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [locationTrackingEnabled, targetEmail, locationPermissionStatus, startLocationTracking, stopLocationTracking]);

  const toggleLocationTracking = async (email?: string): Promise<{ success: boolean; error?: string }> => {
    const newState = !locationTrackingEnabled;
    
    if (newState) {
      if (!email && !targetEmail) {
        return { success: false, error: "Email address is required" };
      }
      
      const emailToUse = email || targetEmail;
      
      if (locationPermissionStatus !== "granted") {
        const granted = await requestLocationPermission();
        if (!granted) {
          return { success: false, error: "Location permission is required" };
        }
      }
      
      setTargetEmail(emailToUse);
      await saveTargetEmail(emailToUse);
      
      await sendLocationNow();
    }
    
    setLocationTrackingEnabled(newState);
    await saveLocationTracking(newState, lastLocationSent);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    console.log(`Location Tracking ${newState ? 'ENABLED' : 'DISABLED'}`);
    return { success: true };
  };

  useEffect(() => {
    if (secureModeEnabled) {
      startMonitoring();
      startContinuousScan();
    } else {
      stopMonitoring();
      stopContinuousScan();
      setIsScanning(false);
      setScanProgress(null);
      console.log("🛑 Scanning stopped - Protection disabled");
    }

    return () => {
      stopMonitoring();
      stopContinuousScan();
    };
  }, [secureModeEnabled, startMonitoring, startContinuousScan, stopMonitoring, stopContinuousScan]);

  const updateTargetEmail = async (email: string) => {
    setTargetEmail(email);
    await saveTargetEmail(email);
  };

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
    getSecurityStatus,
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
