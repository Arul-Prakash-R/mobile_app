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
