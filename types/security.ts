export type ThreatLevel = "safe" | "low" | "medium" | "high" | "critical";

export type ThreatType = 
  | "phishing" 
  | "malware" 
  | "suspicious_file" 
  | "malicious_url"
  | "data_breach"
  | "unsafe_network";

export interface Threat {
  id: string;
  type: ThreatType;
  level: ThreatLevel;
  title: string;
  description: string;
  detectedAt: Date;
  source: string;
  blocked: boolean;
  cveInfo?: {
    cveId: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    description: string;
    cvssScore?: number;
    publishedDate?: string;
  };
}

export interface SecurityStatus {
  overall: ThreatLevel;
  score: number;
  lastScanAt: Date | null;
  threatsBlocked: number;
  activeThreats: number;
}

export interface URLScanResult {
  url: string;
  isSafe: boolean;
  threatLevel: ThreatLevel;
  threats: string[];
  recommendation: string;
}

export interface FileScanResult {
  fileName: string;
  fileSize: number;
  isSafe: boolean;
  threatLevel: ThreatLevel;
  threats: string[];
  scannedAt: Date;
}

export interface ScanProgress {
  status: string;
  progress: number;
  currentItem: string;
  itemsScanned: number;
  totalItems: number;
}

export interface ScanResult {
  threatsFound: Omit<Threat, "id" | "detectedAt">[];
  itemsScanned: number;
  scanDuration: number;
}

export interface SecurityLog {
  id: string;
  type: "malicious_url_clicked" | "malicious_app_clicked" | "malicious_file_detected" | "malicious_apk_detected" | "url_blocked" | "url_allowed" | "app_blocked" | "app_allowed" | "file_blocked" | "file_allowed" | "apk_blocked" | "apk_allowed";
  url?: string;
  appName?: string;
  fileName?: string;
  filePath?: string;
  threatLevel: ThreatLevel;
  action: "blocked" | "allowed" | "detected";
  source: string; // e.g., "WhatsApp", "Instagram", "Browser", "Clipboard", "Downloads", "File Share"
  timestamp: Date;
  description: string;
}
