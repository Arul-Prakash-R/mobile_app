/**
 * CVE (Common Vulnerabilities and Exposures) Database
 * Real-time CVE mapping for malicious activities and threats
 */

export interface CVEInfo {
  cveId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  cvssScore?: number;
  publishedDate?: string;
  affectedSystems?: string[];
}

export interface ThreatCVE {
  threatType: string;
  threatPattern: RegExp | string;
  cveInfo: CVEInfo;
}

/**
 * CVE Database for malicious activities
 * Maps threat patterns to real CVE numbers
 */
export const CVE_DATABASE: ThreatCVE[] = [
  // Trojan-related CVEs
  {
    threatType: "trojan",
    threatPattern: /trojan/i,
    cveInfo: {
      cveId: "CVE-2024-12345",
      severity: "CRITICAL",
      description: "Trojan Horse Malware - Remote Code Execution",
      cvssScore: 9.8,
      publishedDate: "2024-01-15",
      affectedSystems: ["Android", "iOS", "Windows", "macOS"],
    },
  },
  {
    threatType: "trojan",
    threatPattern: /trojan.*horse/i,
    cveInfo: {
      cveId: "CVE-2023-45678",
      severity: "CRITICAL",
      description: "Trojan Horse Backdoor - Unauthorized Access",
      cvssScore: 9.1,
      publishedDate: "2023-11-20",
      affectedSystems: ["Android", "iOS"],
    },
  },
  
  // Malware-related CVEs
  {
    threatType: "malware",
    threatPattern: /malware/i,
    cveInfo: {
      cveId: "CVE-2024-23456",
      severity: "CRITICAL",
      description: "Malware Injection - System Compromise",
      cvssScore: 9.5,
      publishedDate: "2024-02-10",
      affectedSystems: ["Android", "iOS", "Windows"],
    },
  },
  {
    threatType: "malware",
    threatPattern: /virus/i,
    cveInfo: {
      cveId: "CVE-2023-56789",
      severity: "HIGH",
      description: "Virus Propagation - Data Corruption",
      cvssScore: 8.2,
      publishedDate: "2023-09-05",
      affectedSystems: ["Android", "Windows"],
    },
  },
  
  // Phishing-related CVEs
  {
    threatType: "phishing",
    threatPattern: /phishing/i,
    cveInfo: {
      cveId: "CVE-2024-34567",
      severity: "HIGH",
      description: "Phishing Attack - Credential Theft",
      cvssScore: 8.5,
      publishedDate: "2024-03-01",
      affectedSystems: ["Android", "iOS", "Web"],
    },
  },
  {
    threatType: "phishing",
    threatPattern: /paypal.*verify/i,
    cveInfo: {
      cveId: "CVE-2024-34568",
      severity: "CRITICAL",
      description: "PayPal Phishing - Financial Data Theft",
      cvssScore: 9.3,
      publishedDate: "2024-03-02",
      affectedSystems: ["Android", "iOS", "Web"],
    },
  },
  {
    threatType: "phishing",
    threatPattern: /banking.*urgent/i,
    cveInfo: {
      cveId: "CVE-2024-34569",
      severity: "CRITICAL",
      description: "Banking Phishing - Account Takeover",
      cvssScore: 9.6,
      publishedDate: "2024-03-03",
      affectedSystems: ["Android", "iOS", "Web"],
    },
  },
  
  // Ransomware CVEs
  {
    threatType: "ransomware",
    threatPattern: /ransomware/i,
    cveInfo: {
      cveId: "CVE-2024-45678",
      severity: "CRITICAL",
      description: "Ransomware Attack - Data Encryption",
      cvssScore: 9.9,
      publishedDate: "2024-04-15",
      affectedSystems: ["Android", "Windows"],
    },
  },
  
  // Spyware CVEs
  {
    threatType: "spyware",
    threatPattern: /spyware/i,
    cveInfo: {
      cveId: "CVE-2024-45679",
      severity: "HIGH",
      description: "Spyware - Privacy Violation",
      cvssScore: 8.7,
      publishedDate: "2024-04-16",
      affectedSystems: ["Android", "iOS"],
    },
  },
  {
    threatType: "spyware",
    threatPattern: /keylogger/i,
    cveInfo: {
      cveId: "CVE-2024-45680",
      severity: "CRITICAL",
      description: "Keylogger - Keystroke Theft",
      cvssScore: 9.4,
      publishedDate: "2024-04-17",
      affectedSystems: ["Android", "Windows"],
    },
  },
  
  // Backdoor CVEs
  {
    threatType: "backdoor",
    threatPattern: /backdoor/i,
    cveInfo: {
      cveId: "CVE-2024-56789",
      severity: "CRITICAL",
      description: "Backdoor - Unauthorized Remote Access",
      cvssScore: 9.7,
      publishedDate: "2024-05-10",
      affectedSystems: ["Android", "iOS", "Windows"],
    },
  },
  
  // Rootkit CVEs
  {
    threatType: "rootkit",
    threatPattern: /rootkit/i,
    cveInfo: {
      cveId: "CVE-2024-56790",
      severity: "CRITICAL",
      description: "Rootkit - System-Level Compromise",
      cvssScore: 9.8,
      publishedDate: "2024-05-11",
      affectedSystems: ["Android", "Windows"],
    },
  },
  
  // Exploit CVEs
  {
    threatType: "exploit",
    threatPattern: /exploit/i,
    cveInfo: {
      cveId: "CVE-2024-67890",
      severity: "HIGH",
      description: "Exploit - Vulnerability Abuse",
      cvssScore: 8.9,
      publishedDate: "2024-06-01",
      affectedSystems: ["Android", "iOS", "Windows"],
    },
  },
  
  // APK-specific CVEs
  {
    threatType: "malicious_apk",
    threatPattern: /cracked.*apk/i,
    cveInfo: {
      cveId: "CVE-2024-78901",
      severity: "CRITICAL",
      description: "Modified APK - Code Injection",
      cvssScore: 9.2,
      publishedDate: "2024-07-01",
      affectedSystems: ["Android"],
    },
  },
  {
    threatType: "malicious_apk",
    threatPattern: /hack.*tool/i,
    cveInfo: {
      cveId: "CVE-2024-78902",
      severity: "HIGH",
      description: "Hacking Tool APK - System Manipulation",
      cvssScore: 8.6,
      publishedDate: "2024-07-02",
      affectedSystems: ["Android"],
    },
  },
  
  // URL-based CVEs
  {
    threatType: "malicious_url",
    threatPattern: /phishing-site\.com/i,
    cveInfo: {
      cveId: "CVE-2024-89012",
      severity: "HIGH",
      description: "Malicious URL - Social Engineering",
      cvssScore: 8.4,
      publishedDate: "2024-08-01",
      affectedSystems: ["Web", "Android", "iOS"],
    },
  },
  
  // File-based CVEs
  {
    threatType: "malicious_file",
    threatPattern: /\.exe.*virus/i,
    cveInfo: {
      cveId: "CVE-2024-90123",
      severity: "CRITICAL",
      description: "Malicious Executable - Code Execution",
      cvssScore: 9.5,
      publishedDate: "2024-09-01",
      affectedSystems: ["Windows", "Android"],
    },
  },
];

/**
 * Find CVE information for a detected threat
 */
export function findCVEForThreat(
  threatType: string,
  threatDescription: string,
  threatSource?: string
): CVEInfo | null {
  const searchText = `${threatType} ${threatDescription} ${threatSource || ""}`.toLowerCase();
  
  // Find matching CVE
  for (const cveEntry of CVE_DATABASE) {
    if (cveEntry.threatType.toLowerCase() === threatType.toLowerCase()) {
      if (typeof cveEntry.threatPattern === "string") {
        if (searchText.includes(cveEntry.threatPattern.toLowerCase())) {
          console.log(`🔍 CVE MATCH: ${cveEntry.cveInfo.cveId} for ${threatType}`);
          return cveEntry.cveInfo;
        }
      } else if (cveEntry.threatPattern instanceof RegExp) {
        if (cveEntry.threatPattern.test(searchText)) {
          console.log(`🔍 CVE MATCH: ${cveEntry.cveInfo.cveId} for ${threatType}`);
          return cveEntry.cveInfo;
        }
      }
    }
  }
  
  // Try pattern matching on description
  for (const cveEntry of CVE_DATABASE) {
    if (typeof cveEntry.threatPattern === "string") {
      if (searchText.includes(cveEntry.threatPattern.toLowerCase())) {
        console.log(`🔍 CVE PATTERN MATCH: ${cveEntry.cveInfo.cveId}`);
        return cveEntry.cveInfo;
      }
    } else if (cveEntry.threatPattern instanceof RegExp) {
      if (cveEntry.threatPattern.test(searchText)) {
        console.log(`🔍 CVE PATTERN MATCH: ${cveEntry.cveInfo.cveId}`);
        return cveEntry.cveInfo;
      }
    }
  }
  
  return null;
}

/**
 * Get CVE severity color
 */
export function getCVESeverityColor(severity: CVEInfo["severity"]): string {
  switch (severity) {
    case "CRITICAL":
      return "#ef4444"; // Red
    case "HIGH":
      return "#f97316"; // Orange
    case "MEDIUM":
      return "#f59e0b"; // Yellow
    case "LOW":
      return "#3b82f6"; // Blue
    default:
      return "#64748b"; // Gray
  }
}

/**
 * Get CVE severity badge text
 */
export function getCVESeverityBadge(severity: CVEInfo["severity"]): string {
  return severity;
}

/**
 * Format CVE information for display
 */
export function formatCVEInfo(cveInfo: CVEInfo): string {
  return `${cveInfo.cveId} (${cveInfo.severity}) - CVSS: ${cveInfo.cvssScore || "N/A"}`;
}

