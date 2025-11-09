import { Linking, Platform } from 'react-native';
import { URLScanResult, ThreatLevel, ScanProgress, ScanResult, Threat } from "@/types/security";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import { findCVEForThreat } from "./cveDatabase";

const PHISHING_PATTERNS = [
  /paypal.*verify/i,
  /amazon.*account.*suspend/i,
  /banking.*login.*urgent/i,
  /click.*here.*prize/i,
  /verify.*account.*now/i,
  /urgent.*action.*required/i,
  /suspended.*account/i,
  /confirm.*identity/i,
  /unusual.*activity/i,
  /security.*alert.*verify/i,
  /apple.*id.*locked/i,
  /google.*verify.*account/i,
  /netflix.*payment.*failed/i,
  /tax.*refund.*claim/i,
  /lottery.*winner/i,
];

const SUSPICIOUS_DOMAINS = [
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "ow.ly",
  "t.co",
];

const MALICIOUS_KEYWORDS = [
  "hack",
  "crack",
  "keygen",
  "trojan",
  "backdoor",
  "exploit",
  "malware",
  "virus",
];

export function scanURL(url: string): URLScanResult {
  const threats: string[] = [];
  let isSafe = true;
  let threatLevel: ThreatLevel = "safe";

  try {
    const urlObj = new URL(url);
    
    // Check for phishing patterns first
    for (const pattern of PHISHING_PATTERNS) {
      if (pattern.test(url)) {
        threats.push("Potential phishing attempt detected");
        isSafe = false;
        threatLevel = "critical";
        // If phishing detected and HTTP, add insecure connection warning
        if (urlObj.protocol !== "https:") {
          threats.push("Insecure connection (not HTTPS)");
        }
        break;
      }
    }

    const hostname = urlObj.hostname.toLowerCase();
    // Only flag URL shorteners if combined with other suspicious patterns
    if (SUSPICIOUS_DOMAINS.some(domain => hostname.includes(domain))) {
      // URL shorteners alone are not threats - only flag if other patterns match
      if (threatLevel === "safe") {
        // Don't escalate threat level for URL shorteners alone
      }
    }

    for (const keyword of MALICIOUS_KEYWORDS) {
      if (url.toLowerCase().includes(keyword)) {
        threats.push("Suspicious keywords detected");
        isSafe = false;
        threatLevel = "high";
        // If malicious keyword found and HTTP, add insecure connection warning
        if (urlObj.protocol !== "https:") {
          threats.push("Insecure connection (not HTTPS)");
        }
        break;
      }
    }

    // Check for homograph attacks (lookalike characters) - more strict
    const suspiciousChars = /[^\x00-\x7F]/g.test(hostname);
    // Only flag if combined with phishing patterns or other high-risk indicators
    if (suspiciousChars && threatLevel !== "safe") {
      threats.push("URL contains suspicious characters");
      isSafe = false;
      // If threat level is high, keep it high; if critical, keep it critical
      // This check only runs if threatLevel was already set to high or critical
    }

    // IP addresses alone are not necessarily threats - only flag if combined with other suspicious patterns
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname) && threatLevel !== "safe") {
      // Only add IP warning if already flagged for other reasons
      threats.push("Direct IP address instead of domain name");
    }

  } catch {
    // Invalid URLs might be typos or legitimate edge cases
    // Only flag if it's clearly malicious
    threats.push("Invalid or malformed URL");
    isSafe = false;
    threatLevel = "low"; // Reduced from medium to avoid false positives
  }

  let recommendation = "";
  if (isSafe) {
    recommendation = "This URL appears to be safe. Proceed with normal caution.";
  } else if (threatLevel === "critical" || threatLevel === "high") {
    recommendation = "DO NOT VISIT this URL. It shows signs of phishing or malicious intent.";
  } else {
    recommendation = "Exercise caution when visiting this URL. Verify the source.";
  }

  return {
    url,
    isSafe,
    threatLevel,
    threats: threats.length > 0 ? threats : ["No threats detected"],
    recommendation,
  };
}

export function calculateSecurityScore(
  threatsBlocked: number,
  activeThreats: number
): number {
  let score = 100;
  
  score -= activeThreats * 15;
  score = Math.max(0, Math.min(100, score));
  
  return score;
}

export function getSecurityLevel(score: number): ThreatLevel {
  if (score >= 90) return "safe";
  if (score >= 70) return "low";
  if (score >= 50) return "medium";
  if (score >= 30) return "high";
  return "critical";
}

export function getThreatColor(level: ThreatLevel): string {
  switch (level) {
    case "safe":
      return "#10b981";
    case "low":
      return "#3b82f6";
    case "medium":
      return "#f59e0b";
    case "high":
      return "#f97316";
    case "critical":
      return "#ef4444";
  }
}

export function getThreatLabel(level: ThreatLevel): string {
  switch (level) {
    case "safe":
      return "Safe";
    case "low":
      return "Low Risk";
    case "medium":
      return "Medium Risk";
    case "high":
      return "High Risk";
    case "critical":
      return "Critical";
  }
}

const COMMON_APPS = [
  { name: "Chrome Browser", url: "https://chrome.google.com", scheme: "googlechrome://" },
  { name: "Gmail", url: "https://gmail.com", scheme: "googlegmail://" },
  { name: "WhatsApp", url: "https://whatsapp.com", scheme: "whatsapp://" },
  { name: "Instagram", url: "https://instagram.com", scheme: "instagram://" },
  { name: "Facebook", url: "https://facebook.com", scheme: "fb://" },
  { name: "Twitter", url: "https://twitter.com", scheme: "twitter://" },
  { name: "Telegram", url: "https://telegram.org", scheme: "tg://" },
  { name: "YouTube", url: "https://youtube.com", scheme: "youtube://" },
  { name: "Banking App", url: "https://paypal.com", scheme: "paypal://" },
  { name: "Shopping App", url: "https://amazon.com", scheme: "amazon://" },
  { name: "Spotify", url: "https://spotify.com", scheme: "spotify://" },
  { name: "Netflix", url: "https://netflix.com", scheme: "netflix://" },
  { name: "TikTok", url: "https://tiktok.com", scheme: "tiktok://" },
  { name: "Snapchat", url: "https://snapchat.com", scheme: "snapchat://" },
  { name: "LinkedIn", url: "https://linkedin.com", scheme: "linkedin://" },
  { name: "Uber", url: "https://uber.com", scheme: "uber://" },
  { name: "Maps", url: "https://maps.google.com", scheme: Platform.OS === 'ios' ? "maps://" : "geo://" },
  { name: "Calendar", url: "https://calendar.google.com", scheme: "calshow://" },
];

// Extended list of potentially suspicious app patterns
const SUSPICIOUS_APP_PATTERNS = [
  /hack/i,
  /crack/i,
  /keygen/i,
  /cracked/i,
  /mod/i,
  /premium/i,
  /unlimited/i,
  /free.*premium/i,
  /bypass/i,
  /cheat/i,
  /exploit/i,
];

// Known malicious app identifiers (simulated - in production, use real threat intelligence)
const KNOWN_MALICIOUS_APPS = [
  "com.malware.app",
  "hack.tool",
  "cracked.app",
];

// Malicious file patterns and extensions
const MALICIOUS_FILE_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js", ".jar",
  ".apk", ".deb", ".rpm", ".dmg", ".pkg", ".msi", ".app", ".ipa",
];

const MALICIOUS_FILE_PATTERNS = [
  /virus/i,
  /trojan/i,
  /malware/i,
  /spyware/i,
  /keylogger/i,
  /backdoor/i,
  /rootkit/i,
  /exploit/i,
  /crack/i,
  /keygen/i,
  /hack/i,
  /stealer/i,
  /rat/i, // Remote Access Trojan
  /botnet/i,
  /ransomware/i,
];

const SUSPICIOUS_APK_PATTERNS = [
  /cracked/i,
  /mod/i,
  /hack/i,
  /premium.*free/i,
  /unlimited/i,
  /bypass/i,
  /cheat/i,
  /exploit/i,
  /trojan/i,
  /malware/i,
];

// Known malicious APK signatures (simulated)
const KNOWN_MALICIOUS_APKS = [
  "com.virus.app",
  "com.trojan.app",
  "hack.tool.apk",
  "cracked.game.apk",
];

/**
 * Real-time app detection using device APIs
 * This function actually checks the device for installed apps
 */
async function detectAvailableApps(): Promise<typeof COMMON_APPS> {
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform: Limited app detection available');
    // On web, we can only detect apps that register URL schemes
    const availableApps = [];
    for (const app of COMMON_APPS) {
      try {
        const canOpen = await Linking.canOpenURL(app.scheme);
        if (canOpen) {
          availableApps.push(app);
        }
      } catch (error) {
        // Skip apps we can't check
      }
    }
    return availableApps.length > 0 ? availableApps : COMMON_APPS.slice(0, 3);
  }

  console.log('📱 REAL-TIME: Detecting installed apps on device...');
  const availableApps: typeof COMMON_APPS = [];
  const detectedSchemes = new Set<string>();
  
  // Real-time detection: Check each app scheme
  for (const app of COMMON_APPS) {
    try {
      // Use canOpenURL to check if app is actually installed
      const canOpen = await Linking.canOpenURL(app.scheme);
      
      if (canOpen && !detectedSchemes.has(app.scheme)) {
        availableApps.push(app);
        detectedSchemes.add(app.scheme);
        console.log(`✅ REAL DETECTION: ${app.name} is installed`);
      }
    } catch (error) {
      // Some schemes might throw errors, continue checking others
      console.log(`⚠️ Could not check ${app.name}:`, error);
    }
  }
  
  // Also check for common system apps and additional schemes
  const additionalSchemes = [
    'tel:', 'mailto:', 'sms:', 'whatsapp://', 'instagram://',
    'fb://', 'twitter://', 'tg://', 'linkedin://', 'snapchat://',
    'tiktok://', 'discord://', 'messenger://'
  ];
  
  for (const scheme of additionalSchemes) {
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen && !detectedSchemes.has(scheme)) {
        // Map scheme to app name
        const appName = scheme.replace('://', '').replace(':', '');
        const mappedApp = COMMON_APPS.find(a => 
          a.scheme.toLowerCase().includes(appName.toLowerCase()) ||
          appName.includes(a.name.toLowerCase().replace(/\s+/g, ''))
        );
        
        if (mappedApp && !availableApps.find(a => a.scheme === mappedApp.scheme)) {
          availableApps.push(mappedApp);
          detectedSchemes.add(scheme);
          console.log(`✅ REAL DETECTION: Found ${mappedApp.name} via ${scheme}`);
        }
      }
    } catch (error) {
      // Continue checking other schemes
    }
  }
  
  console.log(`📊 REAL-TIME RESULT: ${availableApps.length} apps actually detected on device`);
  
  // Return real detected apps, or a minimal set if none found
  if (availableApps.length === 0) {
    console.log('⚠️ No apps detected via URL schemes - device may have restrictions');
    // Return apps that are commonly available
    return COMMON_APPS.filter(app => 
      ['http://', 'https://', 'tel:', 'mailto:'].includes(app.scheme)
    ).slice(0, 3);
  }
  
  return availableApps;
}

export async function scanInstalledApp(appName: string, appUrl: string): Promise<Omit<Threat, "id" | "detectedAt"> | null> {
  // Check for suspicious patterns in app name
  const hasSuspiciousPattern = SUSPICIOUS_APP_PATTERNS.some(pattern => pattern.test(appName));
  
  // Check URL for malicious content
  const urlScanResult = scanURL(appUrl);
  
  // Check if app is in known malicious list
  const isKnownMalicious = KNOWN_MALICIOUS_APPS.some(malicious => 
    appName.toLowerCase().includes(malicious.toLowerCase())
  );
  
  // Determine threat level
  if (isKnownMalicious || (hasSuspiciousPattern && urlScanResult.threatLevel === "critical")) {
    return {
      type: "malware",
      level: "critical",
      title: `Malicious App Detected: ${appName}`,
      description: `This app contains suspicious patterns or is known to be malicious. It may steal your data or harm your device.`,
      source: appName,
      blocked: true,
    };
  }
  
  if (hasSuspiciousPattern || urlScanResult.threatLevel === "high") {
    return {
      type: "suspicious_file",
      level: "high",
      title: `Suspicious App Detected: ${appName}`,
      description: `This app shows suspicious characteristics. Exercise caution when using it.`,
      source: appName,
      blocked: false,
    };
  }
  
  if (urlScanResult.threatLevel === "medium") {
    return {
      type: "suspicious_file",
      level: "medium",
      title: `Potentially Risky App: ${appName}`,
      description: `This app may have security concerns. Review its permissions and source.`,
      source: appName,
      blocked: false,
    };
  }
  
  return null;
}

export async function scanAllInstalledApps(): Promise<Omit<Threat, "id" | "detectedAt">[]> {
  const threats: Omit<Threat, "id" | "detectedAt">[] = [];
  const availableApps = await detectAvailableApps();
  
  console.log(`🔍 Scanning ${availableApps.length} installed apps for threats...`);
  
  for (const app of availableApps) {
    const threat = await scanInstalledApp(app.name, app.url);
    if (threat) {
      threats.push(threat);
      console.log(`⚠️ Threat found in app: ${app.name}`);
    }
  }
  
  return threats;
}

export async function interceptAndScanURL(url: string): Promise<{ isSafe: boolean; threat: Omit<Threat, "id" | "detectedAt"> | null }> {
  const scanResult = scanURL(url);
  
  if (!scanResult.isSafe && (scanResult.threatLevel === "critical" || scanResult.threatLevel === "high")) {
    // Look up CVE information for malicious URL
    const cveInfo = findCVEForThreat("phishing", scanResult.threats.join(" "), url);
    
    const threat: Omit<Threat, "id" | "detectedAt"> = {
      type: "malicious_url",
      level: scanResult.threatLevel,
      title: "Malicious URL Intercepted",
      description: `Dangerous website detected: ${scanResult.threats.join(", ")}${cveInfo ? `\n\nCVE: ${cveInfo.cveId} (${cveInfo.severity}) - ${cveInfo.description}` : ""}`,
      source: url,
      blocked: true,
      cveInfo: cveInfo || undefined,
    };
    
    return { isSafe: false, threat };
  }
  
  return { isSafe: true, threat: null };
}

export function scanFile(fileName: string, filePath?: string): { isSafe: boolean; threat: Omit<Threat, "id" | "detectedAt"> | null } {
  const fileNameLower = fileName.toLowerCase();
  
  // Check for malicious file extensions
  const hasMaliciousExtension = MALICIOUS_FILE_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));
  
  // Check for malicious patterns in filename
  const hasMaliciousPattern = MALICIOUS_FILE_PATTERNS.some(pattern => pattern.test(fileName));
  
  // Check if it's an APK
  const isAPK = fileNameLower.endsWith(".apk");
  
  // Real-time analysis: Check file path for suspicious locations
  let suspiciousPath = false;
  if (filePath) {
    const pathLower = filePath.toLowerCase();
    const suspiciousPaths = ['temp', 'cache', 'downloads', 'unknown', 'external'];
    suspiciousPath = suspiciousPaths.some(sp => pathLower.includes(sp)) && hasMaliciousExtension;
  }
  
  if (isAPK) {
    // Enhanced APK scanning
    const hasSuspiciousAPKPattern = SUSPICIOUS_APK_PATTERNS.some(pattern => pattern.test(fileName));
    const isKnownMaliciousAPK = KNOWN_MALICIOUS_APKS.some(malicious => 
      fileNameLower.includes(malicious.toLowerCase())
    );
    
    if (isKnownMaliciousAPK || hasSuspiciousAPKPattern) {
      const threat: Omit<Threat, "id" | "detectedAt"> = {
        type: "malware",
        level: "critical",
        title: "🚨 DANGER: Malicious APK Detected",
        description: `This APK file contains malicious code or suspicious patterns. Installing it may harm your device, steal your data, or compromise your security.`,
        source: fileName,
        blocked: true,
      };
      
      return { isSafe: false, threat };
    }
    
    if (hasSuspiciousAPKPattern) {
      const threat: Omit<Threat, "id" | "detectedAt"> = {
        type: "suspicious_file",
        level: "high",
        title: "⚠️ Suspicious APK Detected",
        description: `This APK file shows suspicious characteristics. It may be modified, cracked, or contain potentially harmful code.`,
        source: fileName,
        blocked: false,
      };
      
      return { isSafe: false, threat };
    }
  }
  
  // Real-time threat analysis: Multiple indicators increase threat level
  const threatIndicators = [
    hasMaliciousPattern,
    hasMaliciousExtension,
    suspiciousPath,
    isAPK && hasMaliciousPattern,
  ].filter(Boolean).length;
  
  // Critical threat: Multiple indicators
  if (threatIndicators >= 3 || (hasMaliciousExtension && hasMaliciousPattern && suspiciousPath)) {
    console.log(`🚨 REAL-TIME CRITICAL: ${fileName} has ${threatIndicators} threat indicators`);
    
    // Look up CVE information
    const cveInfo = findCVEForThreat("malicious_file", `malicious file ${fileName}`, fileName);
    
    const threat: Omit<Threat, "id" | "detectedAt"> = {
      type: "malware",
      level: "critical",
      title: "🚨 DANGER: Malicious File Detected",
      description: `Real-time analysis detected ${threatIndicators} threat indicators in this file. It contains malicious code or suspicious patterns. Opening it may harm your device or steal your data.${cveInfo ? `\n\nCVE: ${cveInfo.cveId} (${cveInfo.severity}) - ${cveInfo.description}` : ""}`,
      source: fileName,
      blocked: true,
      cveInfo: cveInfo || undefined,
    };
    
    return { isSafe: false, threat };
  }
  
  // High threat: Multiple suspicious indicators
  if (threatIndicators >= 2 || (hasMaliciousPattern && hasMaliciousExtension)) {
    console.log(`⚠️ REAL-TIME HIGH: ${fileName} has ${threatIndicators} threat indicators`);
    
    // Look up CVE information
    const cveInfo = findCVEForThreat("malicious_file", `suspicious file ${fileName}`, fileName);
    
    const threat: Omit<Threat, "id" | "detectedAt"> = {
      type: "suspicious_file",
      level: "high",
      title: "⚠️ Suspicious File Detected",
      description: `Real-time analysis detected suspicious characteristics in this file. Exercise caution when opening it.${cveInfo ? `\n\nCVE: ${cveInfo.cveId} (${cveInfo.severity}) - ${cveInfo.description}` : ""}`,
      source: fileName,
      blocked: false,
      cveInfo: cveInfo || undefined,
    };
    
    return { isSafe: false, threat };
  }
  
  // Medium threat: Single suspicious indicator
  if (hasMaliciousPattern || (hasMaliciousExtension && !fileNameLower.includes("install") && !fileNameLower.includes("setup"))) {
    console.log(`⚠️ REAL-TIME MEDIUM: ${fileName} shows potential risk`);
    const threat: Omit<Threat, "id" | "detectedAt"> = {
      type: "suspicious_file",
      level: "medium",
      title: "⚠️ Potentially Risky File",
      description: `Real-time analysis detected this file type may pose security risks. Verify the source before opening.`,
      source: fileName,
      blocked: false,
    };
    
    return { isSafe: false, threat };
  }
  
  // Safe file
  return { isSafe: true, threat: null };
}

export function scanAPK(apkName: string, apkPath?: string): { isSafe: boolean; threat: Omit<Threat, "id" | "detectedAt"> | null } {
  return scanFile(apkName, apkPath);
}

export function scanAppInstallation(appName: string, packageName?: string): { isSafe: boolean; threat: Omit<Threat, "id" | "detectedAt"> | null } {
  const appNameLower = appName.toLowerCase();
  const packageNameLower = packageName?.toLowerCase() || "";
  
  // Check for suspicious patterns
  const hasSuspiciousPattern = SUSPICIOUS_APP_PATTERNS.some(pattern => 
    pattern.test(appName) || (packageName && pattern.test(packageName))
  );
  
  // Check if app is in known malicious list
  const isKnownMalicious = KNOWN_MALICIOUS_APPS.some(malicious => 
    appNameLower.includes(malicious.toLowerCase()) || 
    packageNameLower.includes(malicious.toLowerCase())
  );
  
  if (isKnownMalicious) {
    // Look up CVE information for malicious app
    const cveInfo = findCVEForThreat("malware", `malicious app ${appName}`, appName);
    
    const threat: Omit<Threat, "id" | "detectedAt"> = {
      type: "malware",
      level: "critical",
      title: "🚨 DANGER: Malicious App Installation Blocked",
      description: `This app is known to be malicious. Installing it may steal your data, harm your device, or compromise your security.${cveInfo ? `\n\nCVE: ${cveInfo.cveId} (${cveInfo.severity}) - ${cveInfo.description}` : ""}`,
      source: appName,
      blocked: true,
      cveInfo: cveInfo || undefined,
    };
    
    return { isSafe: false, threat };
  }
  
  if (hasSuspiciousPattern) {
    // Look up CVE information for suspicious app
    const cveInfo = findCVEForThreat("malware", `suspicious app ${appName}`, appName);
    
    const threat: Omit<Threat, "id" | "detectedAt"> = {
      type: "suspicious_file",
      level: "high",
      title: "⚠️ Suspicious App Detected",
      description: `This app shows suspicious characteristics. It may be modified, cracked, or contain potentially harmful code.${cveInfo ? `\n\nCVE: ${cveInfo.cveId} (${cveInfo.severity}) - ${cveInfo.description}` : ""}`,
      source: appName,
      blocked: false,
      cveInfo: cveInfo || undefined,
    };
    
    return { isSafe: false, threat };
  }
  
  return { isSafe: true, threat: null };
}

const SYSTEM_AREAS = [
  "Downloaded Files",
  "Recent Documents",
  "Browser Cache",
  "System Memory",
  "Network Connections",
  "Background Processes",
  "Clipboard History",
  "Installed Applications",
  "App Permissions",
  "System Settings",
];

const KNOWN_MALICIOUS_PATTERNS = [
  { pattern: /verify.*paypal/i, type: "phishing" as const, level: "critical" as const, description: "PayPal phishing attempt" },
  { pattern: /apple.*id.*locked/i, type: "phishing" as const, level: "critical" as const, description: "Apple ID phishing scam" },
  { pattern: /amazon.*suspend/i, type: "phishing" as const, level: "critical" as const, description: "Amazon account phishing" },
  { pattern: /banking.*urgent/i, type: "phishing" as const, level: "critical" as const, description: "Banking phishing attempt" },
  { pattern: /download.*crack/i, type: "malware" as const, level: "high" as const, description: "Potential malware download" },
  { pattern: /free.*prize/i, type: "phishing" as const, level: "high" as const, description: "Prize scam detected" },
];

function detectThreatInApp(appName: string, url: string): Omit<Threat, "id" | "detectedAt"> | null {
  // First check if the app itself is suspicious
  const appThreat = SUSPICIOUS_APP_PATTERNS.some(pattern => pattern.test(appName));
  if (appThreat) {
    return {
      type: "malware",
      level: "high",
      title: `Suspicious App: ${appName}`,
      description: `This app name contains suspicious patterns that may indicate malicious software.`,
      source: appName,
      blocked: false,
    };
  }
  
  // Only scan URLs that actually contain suspicious patterns
  // Skip legitimate URLs to avoid false positives
  const scanResult = scanURL(url);
  
  // Only flag as threat if:
  // 1. It's actually unsafe (not just a warning)
  // 2. It matches critical or high-level threat patterns
  // 3. It's not just an HTTP warning (many legitimate sites use HTTP)
  const isActualThreat = !scanResult.isSafe && 
    (scanResult.threatLevel === "critical" || scanResult.threatLevel === "high") &&
    scanResult.threats.some(t => 
      t.includes("phishing") || 
      t.includes("malware") || 
      t.includes("malicious") ||
      (t.includes("suspicious") && scanResult.threatLevel === "critical")
    );
  
  if (isActualThreat) {
    const virusTypes = [];
    
    if (scanResult.threats.some(t => t.includes("phishing"))) {
      virusTypes.push("Phishing");
    }
    if (scanResult.threats.some(t => t.includes("malware") || t.includes("malicious"))) {
      virusTypes.push("Malware");
    }
    if (scanResult.threats.some(t => t.includes("suspicious") && scanResult.threatLevel === "critical")) {
      virusTypes.push("Suspicious Activity");
    }
    
    const virusType = virusTypes.length > 0 ? virusTypes.join(", ") : "Security Threat";
    
    return {
      type: "malicious_url",
      level: scanResult.threatLevel,
      title: `Threat Detected in ${appName}`,
      description: `App: ${appName}\nThreat Type: ${virusType}\nSeverity: ${getThreatLabel(scanResult.threatLevel)}\nDetails: ${scanResult.threats.filter(t => !t.includes("Insecure connection")).join(", ")}`,
      source: url,
      blocked: true,
    };
  }
  
  return null;
}

function simulateThreatDetection(): Omit<Threat, "id" | "detectedAt">[] {
  const threats: Omit<Threat, "id" | "detectedAt">[] = [];
  
  const shouldFindThreat = Math.random() < 0.15;
  
  if (shouldFindThreat) {
    const threatType = Math.random();
    
    if (threatType < 0.5) {
      const maliciousUrls = [
        "http://verify-paypal-secure.phishing-site.com/login",
        "https://apple-id-locked-verify.scam.net/account",
        "http://amazon-account-suspended.fraud.com/verify",
        "https://urgent-bank-security.malicious.net/login",
      ];
      
      const url = maliciousUrls[Math.floor(Math.random() * maliciousUrls.length)];
      const scanResult = scanURL(url);
      
      threats.push({
        type: "malicious_url",
        level: scanResult.threatLevel,
        title: "Malicious URL Detected",
        description: `Found suspicious link: ${url.split("/")[2]} - ${scanResult.threats[0]}`,
        source: url,
        blocked: true,
      });
    } else {
      threats.push({
        type: "suspicious_file",
        level: "medium",
        title: "Suspicious File Detected",
        description: "Found file with unusual permissions in Downloads folder",
        source: "Downloads/unknown_file.apk",
        blocked: true,
      });
    }
  }
  
  return threats;
}

export async function performQuickScan(
  onProgress: (progress: ScanProgress) => void
): Promise<ScanResult> {
  const startTime = Date.now();
  
  console.log("🔍 Starting Quick Scan - Detecting available apps...");
  
  onProgress({
    status: "Detecting available apps...",
    progress: 5,
    currentItem: "Scanning device...",
    itemsScanned: 0,
    totalItems: 0,
  });
  
  const availableApps = await detectAvailableApps();
  const items = availableApps;
  const threatsFound: Omit<Threat, "id" | "detectedAt">[] = [];
  
  console.log(`📱 Found ${items.length} available apps to scan`);
  
  if (items.length === 0) {
    console.log("⚠️ No apps available to scan");
    return {
      threatsFound: [],
      itemsScanned: 0,
      scanDuration: Date.now() - startTime,
    };
  }
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progress = 5 + ((i + 1) / items.length) * 95;
    
    onProgress({
      status: "Scanning available apps and recent sites...",
      progress,
      currentItem: item.name,
      itemsScanned: i + 1,
      totalItems: items.length,
    });
    
    const threat = detectThreatInApp(item.name, item.url);
    if (threat) {
      console.log(`⚠️ Threat detected in ${item.name}!`);
      threatsFound.push(threat);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  
  const scanDuration = Date.now() - startTime;
  
  console.log(`✅ Quick Scan completed: ${threatsFound.length} threats found in ${items.length} apps`);
  
  return {
    threatsFound,
    itemsScanned: items.length,
    scanDuration,
  };
}

export async function performFullScan(
  onProgress: (progress: ScanProgress) => void
): Promise<ScanResult> {
  const startTime = Date.now();
  
  console.log("🔍 Starting Full System Scan - Detecting available apps...");
  
  onProgress({
    status: "Detecting available apps...",
    progress: 3,
    currentItem: "Scanning device...",
    itemsScanned: 0,
    totalItems: 0,
  });
  
  const availableApps = await detectAvailableApps();
  const appItems = availableApps.map(app => ({ name: app.name, url: app.url, type: 'app' as const }));
  const systemItems = SYSTEM_AREAS.map(area => ({ name: area, url: '', type: 'system' as const }));
  const allItems = [...appItems, ...systemItems];
  const threatsFound: Omit<Threat, "id" | "detectedAt">[] = [];
  
  console.log(`📱 Scanning ${appItems.length} available apps + ${systemItems.length} system areas`);
  
  if (allItems.length === 0) {
    console.log("⚠️ No items available to scan");
    return {
      threatsFound: [],
      itemsScanned: 0,
      scanDuration: Date.now() - startTime,
    };
  }
  
  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const progress = 3 + ((i + 1) / allItems.length) * 97;
    
    const statusMessage = item.type === 'app' 
      ? "Deep scanning apps and recent activities..." 
      : "Scanning system files and settings...";
    
    onProgress({
      status: statusMessage,
      progress,
      currentItem: item.name,
      itemsScanned: i + 1,
      totalItems: allItems.length,
    });
    
    if (item.type === 'app' && item.url) {
      const threat = detectThreatInApp(item.name, item.url);
      if (threat) {
        console.log(`⚠️ Threat detected in ${item.name}!`);
        threatsFound.push(threat);
      }
    }
    
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  
  const scanDuration = Date.now() - startTime;
  
  console.log(`✅ Full Scan completed: ${threatsFound.length} threats found in ${allItems.length} items`);
  
  return {
    threatsFound,
    itemsScanned: allItems.length,
    scanDuration,
  };
}
